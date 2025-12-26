/**
 * QuickBooks Webhook Handler
 * Receives webhooks from QuickBooks when bills are paid
 * 
 * POST /api/webhooks/quickbooks
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { quickbooksApi } from "@/lib/quickbooks-api"

/**
 * Verify webhook signature (QuickBooks uses payload signature)
 */
function verifyWebhookSignature(request: NextRequest, payload: string): boolean {
  const webhookSecret = process.env.QB_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET
  if (!webhookSecret) {
    // If no secret is set, allow all requests (for development)
    return true
  }

  const signature = request.headers.get("intuit-signature")
  if (!signature) {
    return false
  }

  // QuickBooks webhook verification logic
  // This is a simplified version - you may need to implement proper signature verification
  // based on QuickBooks documentation
  return true
}

interface QuickBooksWebhookEvent {
  eventNotifications: Array<{
    realmId: string
    dataChangeEvent?: {
      entities: Array<{
        name: string
        id: string
        operation: "Create" | "Update" | "Delete" | "Void"
        lastUpdated: string
      }>
    }
  }>
}

/**
 * Handle bill payment webhook
 * When a bill is paid in QuickBooks, update the commission payment status
 */
async function handleBillPayment(billId: string) {
  try {
    // Get bill from QuickBooks
    const bill = await quickbooksApi.getBill(billId)

    // Find commission payment by QB bill ID
    const payment = await prisma.commissionPayment.findFirst({
      where: {
        qbInvoiceId: billId, // Note: qbInvoiceId stores the bill ID
      },
    })

    if (!payment) {
      console.warn(`No commission payment found for QuickBooks bill ${billId}`)
      return
    }

    // Check if bill is paid (balance is zero or less)
    const balance = bill.Balance || 0
    const isPaid = balance <= 0 && (bill.TxnStatus === "Paid" || bill.TxnStatus === "Closed")

    if (isPaid && payment.status !== "PAID") {
      // Update commission payment status to PAID
      await prisma.commissionPayment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          datePaid: bill.TxnDate ? new Date(bill.TxnDate) : new Date(),
        },
      })

      // Log sync
      await prisma.syncLog.create({
        data: {
          source: "QUICKBOOKS",
          entityType: "commissionPayment",
          entityId: payment.id,
          externalId: billId,
          action: "UPDATE",
          payload: {
            action: "bill_paid",
            billId,
            balance,
            status: bill.TxnStatus,
          },
          status: "SUCCESS",
        },
      })

      console.log(`Updated commission payment ${payment.id} to PAID (QB bill ${billId})`)
    }
  } catch (error) {
    console.error(`Error handling bill payment webhook for bill ${billId}:`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.text()
    
    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse webhook payload
    let webhookData: QuickBooksWebhookEvent
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error("Invalid JSON in webhook payload:", error)
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      )
    }

    // Process webhook events
    for (const notification of webhookData.eventNotifications || []) {
      const { realmId, dataChangeEvent } = notification

      if (!dataChangeEvent) {
        continue
      }

      // Process each entity change
      for (const entity of dataChangeEvent.entities || []) {
        const { name, id, operation } = entity

        // Handle Bill events
        if (name === "Bill") {
          if (operation === "Update" || operation === "Create") {
            // When a bill is updated/created, check if it's paid
            await handleBillPayment(id)
          } else if (operation === "Delete" || operation === "Void") {
            // Handle bill deletion/voiding
            const payment = await prisma.commissionPayment.findFirst({
              where: { qbInvoiceId: id },
            })

            if (payment && payment.status !== "CANCELLED") {
              await prisma.commissionPayment.update({
                where: { id: payment.id },
                data: {
                  status: "CANCELLED",
                },
              })

              await prisma.syncLog.create({
                data: {
                  source: "QUICKBOOKS",
                  entityType: "commissionPayment",
                  entityId: payment.id,
                  externalId: id,
                  action: "UPDATE",
                  payload: {
                    action: "bill_voided",
                    billId: id,
                  },
                  status: "SUCCESS",
                },
              })
            }
          }
        }
        // Add handling for other entity types (Invoice, Vendor, etc.) as needed
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (error) {
    console.error("QuickBooks Webhook Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// QuickBooks may use GET for webhook verification
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("challenge")
  
  // QuickBooks webhook verification
  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ message: "QuickBooks webhook endpoint" })
}

