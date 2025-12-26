/**
 * QuickBooks Invoice Sync Service
 * Syncs transactions from CRM to QuickBooks invoices
 */

import { prisma } from "@/lib/prisma"
import { quickbooksApi, QuickBooksInvoice } from "@/lib/quickbooks-api"

export interface InvoiceSyncResult {
  success: boolean
  invoiceId?: string
  qbInvoiceId?: string
  action: "created" | "updated" | "skipped"
  error?: string
}

/**
 * Sync a transaction to QuickBooks as an invoice
 */
export async function syncTransactionToInvoice(
  transactionId: string
): Promise<InvoiceSyncResult> {
  try {
    // Get transaction with agent
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        agent: true,
        primaryContact: true,
      },
    })

    if (!transaction) {
      return {
        success: false,
        action: "skipped",
        error: "Transaction not found",
      }
    }

    // Skip if transaction doesn't have required data for invoice
    if (!transaction.actualClosingDate || !transaction.grossCommissionAmount) {
      return {
        success: false,
        action: "skipped",
        error: "Transaction missing required data (closing date or commission amount)",
      }
    }

    // Get or create customer in QuickBooks (using transaction name or agent name)
    let customerId: string | undefined
    const customerDisplayName = transaction.primaryContact
      ? `${transaction.primaryContact.firstName} ${transaction.primaryContact.lastName}`
      : transaction.agent?.name || transaction.name

    if (customerDisplayName) {
      const customers = await quickbooksApi.queryCustomers(customerDisplayName)
      if (customers.length > 0) {
        customerId = customers[0].Id
      } else {
        // Create customer if doesn't exist
        const newCustomer = await quickbooksApi.upsertCustomer({
          DisplayName: customerDisplayName,
          GivenName: transaction.primaryContact?.firstName || transaction.name.split(" ")[0] || "",
          FamilyName: transaction.primaryContact?.lastName || transaction.name.split(" ").slice(1).join(" ") || "",
          PrimaryEmailAddr: transaction.primaryContact?.email
            ? { Address: transaction.primaryContact.email }
            : undefined,
        })
        customerId = newCustomer.Id
      }
    }

    if (!customerId) {
      return {
        success: false,
        action: "skipped",
        error: "Could not create or find customer in QuickBooks",
      }
    }

    // Prepare invoice data
    const invoiceDate = transaction.actualClosingDate.toISOString().split("T")[0]
    const invoiceAmount = transaction.grossCommissionAmount.toNumber()

    // Create invoice line items
    const lineItems: QuickBooksInvoice["Line"] = [
      {
        DetailType: "SalesItemLineDetail",
        Amount: invoiceAmount,
        SalesItemLineDetail: {
          ItemRef: {
            value: "1", // Default item - should be configured
            name: "Services",
          },
          UnitPrice: invoiceAmount,
          Qty: 1,
        },
        Description: `Commission for transaction: ${transaction.name}${transaction.addressOneLine ? ` - ${transaction.addressOneLine}` : ""}`,
      },
    ]

    // Create or update invoice
    let qbInvoice: QuickBooksInvoice
    if (transaction.quickbooksId) {
      // Update existing invoice
      const existingInvoice = await quickbooksApi.getInvoice(transaction.quickbooksId)
      qbInvoice = await quickbooksApi.upsertInvoice({
        Id: transaction.quickbooksId,
        SyncToken: existingInvoice.SyncToken,
        CustomerRef: { value: customerId },
        TxnDate: invoiceDate,
        Line: lineItems,
        PrivateNote: `Transaction ID: ${transaction.id}\nREZEN ID: ${transaction.rezenId || "N/A"}`,
      })
    } else {
      // Create new invoice
      qbInvoice = await quickbooksApi.upsertInvoice({
        CustomerRef: { value: customerId },
        TxnDate: invoiceDate,
        Line: lineItems,
        PrivateNote: `Transaction ID: ${transaction.id}\nREZEN ID: ${transaction.rezenId || "N/A"}`,
      })
    }

    // Update transaction with QuickBooks invoice info
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        quickbooksId: qbInvoice.Id,
        quickbooksTransactionName: qbInvoice.DocNumber,
        quickbooksInvoiceLink: qbInvoice.Id
          ? `https://app.qbo.intuit.com/app/invoice?txnId=${qbInvoice.Id}`
          : null,
      },
    })

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: "QUICKBOOKS",
        entityType: "transaction",
        entityId: transactionId,
        externalId: qbInvoice.Id,
        action: transaction.quickbooksId ? "UPDATE" : "CREATE",
        payload: {
          invoiceId: qbInvoice.Id,
          docNumber: qbInvoice.DocNumber,
          amount: invoiceAmount,
        },
        status: "SUCCESS",
      },
    })

    return {
      success: true,
      invoiceId: transactionId,
      qbInvoiceId: qbInvoice.Id,
      action: transaction.quickbooksId ? "updated" : "created",
    }
  } catch (error) {
    console.error("Error syncing transaction to QuickBooks invoice:", error)
    
    // Log error
    await prisma.syncLog.create({
      data: {
        source: "QUICKBOOKS",
        entityType: "transaction",
        entityId: transactionId,
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
 * Sync multiple transactions to QuickBooks invoices
 */
export async function syncTransactionsToInvoices(
  transactionIds: string[]
): Promise<{
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ transactionId: string; error: string }>
}> {
  const results = {
    total: transactionIds.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ transactionId: string; error: string }>,
  }

  for (const transactionId of transactionIds) {
    const result = await syncTransactionToInvoice(transactionId)
    
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
        results.errors.push({ transactionId, error: result.error })
      }
    }
  }

  return results
}

