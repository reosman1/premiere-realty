/**
 * QuickBooks Bill Sync Service
 * Syncs commission payments from CRM to QuickBooks bills
 */

import { prisma } from "@/lib/prisma"
import { quickbooksApi, QuickBooksBill } from "@/lib/quickbooks-api"

export interface BillSyncResult {
  success: boolean
  paymentId?: string
  qbBillId?: string
  action: "created" | "updated" | "skipped"
  error?: string
}

/**
 * Sync a commission payment to QuickBooks as a bill
 */
export async function syncCommissionPaymentToBill(
  paymentId: string
): Promise<BillSyncResult> {
  try {
    // Get commission payment with agent
    const payment = await prisma.commissionPayment.findUnique({
      where: { id: paymentId },
      include: {
        agent: true,
        transaction: true,
        items: true,
      },
    })

    if (!payment) {
      return {
        success: false,
        action: "skipped",
        error: "Commission payment not found",
      }
    }

    if (!payment.agent) {
      return {
        success: false,
        action: "skipped",
        error: "Commission payment has no associated agent",
      }
    }

    if (!payment.amount || payment.amount.toNumber() <= 0) {
      return {
        success: false,
        action: "skipped",
        error: "Commission payment amount is zero or missing",
      }
    }

    // Get or create vendor in QuickBooks (agent as vendor)
    let vendorId: string | undefined

    // Try to find vendor by QB vendor ID if agent has one
    if (payment.agent.qbVendorId) {
      try {
        const vendor = await quickbooksApi.getVendor(payment.agent.qbVendorId)
        vendorId = vendor.Id
      } catch {
        // Vendor ID might be invalid, continue to search by name
      }
    }

    // If not found by ID, search by name
    if (!vendorId) {
      const vendorDisplayName = payment.agent.qbVendorName || payment.agent.name
      const vendors = await quickbooksApi.queryVendors(vendorDisplayName)
      if (vendors.length > 0) {
        vendorId = vendors[0].Id
        // Update agent with vendor ID if we found one
        await prisma.agent.update({
          where: { id: payment.agent.id },
          data: {
            qbVendorId: vendorId,
            qbVendorName: vendors[0].DisplayName || vendorDisplayName,
          },
        })
      } else {
        // Create vendor if doesn't exist
        const newVendor = await quickbooksApi.upsertVendor({
          DisplayName: vendorDisplayName,
          CompanyName: payment.agent.name,
          GivenName: payment.agent.name.split(" ")[0] || "",
          FamilyName: payment.agent.name.split(" ").slice(1).join(" ") || "",
          PrimaryEmailAddr: payment.agent.email ? { Address: payment.agent.email } : undefined,
          PrimaryPhone: payment.agent.phone ? { FreeFormNumber: payment.agent.phone } : undefined,
          BillAddr: payment.agent.street
            ? {
                Line1: payment.agent.street,
                City: payment.agent.city || "",
                CountrySubDivisionCode: payment.agent.state || "",
                PostalCode: payment.agent.zipcode || "",
              }
            : undefined,
        })
        vendorId = newVendor.Id

        // Update agent with vendor info
        await prisma.agent.update({
          where: { id: payment.agent.id },
          data: {
            qbVendorId: newVendor.Id,
            qbVendorName: newVendor.DisplayName || vendorDisplayName,
          },
        })
      }
    }

    if (!vendorId) {
      return {
        success: false,
        action: "skipped",
        error: "Could not create or find vendor in QuickBooks",
      }
    }

    // Prepare bill data
    const billDate = payment.dateEarned?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]
    const billAmount = payment.amount.toNumber()

    // Create bill line items
    const lineItems: QuickBooksBill["Line"] = []

    if (payment.items.length > 0) {
      // Use commission items as line items
      for (const item of payment.items) {
        lineItems.push({
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: item.amount?.toNumber() || 0,
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: "1", // Default expense account - should be configured
              name: "Commission Expense",
            },
          },
          Description: item.description || item.itemType || "Commission payment",
        })
      }
    } else {
      // Single line item for the total amount
      lineItems.push({
        DetailType: "AccountBasedExpenseLineDetail",
        Amount: billAmount,
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: "1", // Default expense account - should be configured
            name: "Commission Expense",
          },
        },
        Description: `Commission payment${payment.transaction ? ` for transaction: ${payment.transaction.name}` : ""}`,
      })
    }

    // Create or update bill
    let qbBill: QuickBooksBill
    if (payment.qbInvoiceId) {
      // Update existing bill (QB uses "Invoice" term for bills in some contexts, but it's actually a Bill)
      try {
        const existingBill = await quickbooksApi.getBill(payment.qbInvoiceId)
        qbBill = await quickbooksApi.upsertBill({
          Id: payment.qbInvoiceId,
          SyncToken: existingBill.SyncToken,
          VendorRef: { value: vendorId },
          TxnDate: billDate,
          Line: lineItems,
          PrivateNote: `Commission Payment ID: ${payment.id}${payment.transaction ? `\nTransaction ID: ${payment.transaction.id}` : ""}`,
        })
      } catch (error) {
        // If bill lookup fails, create new one
        qbBill = await quickbooksApi.upsertBill({
          VendorRef: { value: vendorId },
          TxnDate: billDate,
          Line: lineItems,
          PrivateNote: `Commission Payment ID: ${payment.id}${payment.transaction ? `\nTransaction ID: ${payment.transaction.id}` : ""}`,
        })
      }
    } else {
      // Create new bill
      qbBill = await quickbooksApi.upsertBill({
        VendorRef: { value: vendorId },
        TxnDate: billDate,
        Line: lineItems,
        PrivateNote: `Commission Payment ID: ${payment.id}${payment.transaction ? `\nTransaction ID: ${payment.transaction.id}` : ""}`,
      })
    }

    // Update commission payment with QuickBooks bill info
    await prisma.commissionPayment.update({
      where: { id: paymentId },
      data: {
        qbInvoiceId: qbBill.Id, // Note: QB uses "Invoice" field name but it's actually a Bill ID
      },
    })

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: "QUICKBOOKS",
        entityType: "commissionPayment",
        entityId: paymentId,
        externalId: qbBill.Id,
        action: payment.qbInvoiceId ? "UPDATE" : "CREATE",
        payload: {
          billId: qbBill.Id,
          docNumber: qbBill.DocNumber,
          amount: billAmount,
          vendorId,
        },
        status: "SUCCESS",
      },
    })

    return {
      success: true,
      paymentId: paymentId,
      qbBillId: qbBill.Id,
      action: payment.qbInvoiceId ? "updated" : "created",
    }
  } catch (error) {
    console.error("Error syncing commission payment to QuickBooks bill:", error)
    
    // Log error
    await prisma.syncLog.create({
      data: {
        source: "QUICKBOOKS",
        entityType: "commissionPayment",
        entityId: paymentId,
        action: "CREATE",
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return {
      success: false,
      action: "skipped",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sync multiple commission payments to QuickBooks bills
 */
export async function syncCommissionPaymentsToBills(
  paymentIds: string[]
): Promise<{
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ paymentId: string; error: string }>
}> {
  const results = {
    total: paymentIds.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ paymentId: string; error: string }>,
  }

  for (const paymentId of paymentIds) {
    const result = await syncCommissionPaymentToBill(paymentId)
    
    if (result.success) {
      if (result.action === "created") {
        results.created++
      } else if (result.action === "updated") {
        results.updated++
      } else {
        results.skipped++
      }
    } else {
      results.skipped++
      if (result.error) {
        results.errors.push({ paymentId, error: result.error })
      }
    }
  }

  return results
}

/**
 * Update bill balance to zero when payment is voided
 */
export async function voidBillInQuickBooks(
  paymentId: string
): Promise<BillSyncResult> {
  try {
    const payment = await prisma.commissionPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment || !payment.qbInvoiceId) {
      return {
        success: false,
        action: "skipped",
        error: "Payment not found or has no QuickBooks bill ID",
      }
    }

    // Get current bill
    const currentBill = await quickbooksApi.getBill(payment.qbInvoiceId)
    
    // Update bill balance to zero
    // Note: QuickBooks doesn't directly allow setting balance to zero,
    // so we may need to apply a payment or delete the bill
    // For now, we'll update the bill with balance set to zero
    // In practice, you might want to apply a zero-amount payment instead
    
    const updatedBill = await quickbooksApi.upsertBill({
      Id: payment.qbInvoiceId,
      SyncToken: currentBill.SyncToken!,
      Balance: 0,
      sparse: true,
    })

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: "QUICKBOOKS",
        entityType: "commissionPayment",
        entityId: paymentId,
        externalId: payment.qbInvoiceId,
        action: "UPDATE",
        payload: {
          action: "voided",
          billId: payment.qbInvoiceId,
        },
        status: "SUCCESS",
      },
    })

    return {
      success: true,
      paymentId: paymentId,
      qbBillId: payment.qbInvoiceId,
      action: "updated",
    }
  } catch (error) {
    console.error("Error voiding bill in QuickBooks:", error)
    
    return {
      success: false,
      action: "skipped",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

