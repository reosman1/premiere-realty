import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PaymentStatus } from "@prisma/client"

// POST /api/webhooks/make
// Generic webhook endpoint for Make (Integromat) automations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook secret
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { entityType, action, data } = body

    // Log the sync
    const syncLog = await prisma.syncLog.create({
      data: {
        source: "MAKE",
        entityType: entityType || "unknown",
        externalId: data?.id || data?.externalId,
        action: action?.toUpperCase() || "UPDATE",
        payload: body,
        status: "PENDING",
      },
    })

    try {
      // Route to appropriate handler
      switch (entityType?.toLowerCase()) {
        case "agent":
          await handleAgentSync(action, data)
          break
        case "listing":
          await handleListingSync(action, data)
          break
        case "transaction":
          await handleTransactionSync(action, data)
          break
        case "commission":
          await handleCommissionSync(action, data)
          break
        case "quickbooks":
          await handleQuickBooksSync(action, data)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      // Update sync log to success
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "SUCCESS" },
      })

      return NextResponse.json({ success: true, syncLogId: syncLog.id })
    } catch (error) {
      // Update sync log to failed
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      })
      throw error
    }
  } catch (error) {
    console.error("Make Webhook Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleAgentSync(action: string, data: any) {
  // Forward to agent webhook handler logic
  const agentData = {
    rezenId: data.rezenId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    status: data.status,
    // ... other fields
  }

  if (action === "delete") {
    await prisma.agent.updateMany({
      where: { rezenId: agentData.rezenId },
      data: { status: "INACTIVE" },
    })
  } else {
    const existing = await prisma.agent.findFirst({
      where: { rezenId: agentData.rezenId },
    })

    if (existing) {
      await prisma.agent.update({
        where: { id: existing.id },
        data: agentData,
      })
    } else {
      await prisma.agent.create({ data: agentData })
    }
  }
}

async function handleListingSync(action: string, data: any) {
  const listingData = {
    rezenListingId: data.rezenListingId,
    mlsNumber: data.mlsNumber,
    listingName: data.listingName,
    listingPrice: data.listingPrice,
    stage: data.stage,
    // ... other fields
  }

  if (action === "delete") {
    await prisma.listing.updateMany({
      where: { rezenListingId: listingData.rezenListingId },
      data: { stage: "CANCELED" },
    })
  } else {
    const existing = await prisma.listing.findFirst({
      where: { rezenListingId: listingData.rezenListingId },
    })

    if (existing) {
      await prisma.listing.update({
        where: { id: existing.id },
        data: listingData,
      })
    } else {
      await prisma.listing.create({ data: listingData })
    }
  }
}

async function handleTransactionSync(action: string, data: any) {
  const transactionData = {
    brokerTransactionId: data.brokerTransactionId,
    name: data.name,
    amount: data.amount,
    stage: data.stage,
    // ... other fields
  }

  if (action === "delete") {
    await prisma.transaction.updateMany({
      where: { brokerTransactionId: transactionData.brokerTransactionId },
      data: { stage: "CANCELED_APP" },
    })
  } else {
    const existing = await prisma.transaction.findFirst({
      where: { brokerTransactionId: transactionData.brokerTransactionId },
    })

    if (existing) {
      await prisma.transaction.update({
        where: { id: existing.id },
        data: transactionData,
      })
    } else {
      await prisma.transaction.create({ data: transactionData })
    }
  }
}

async function handleCommissionSync(action: string, data: any) {
  // Handle commission payment sync from QuickBooks via Make
  const paymentData = {
    qbInvoiceId: data.qbInvoiceId,
    amount: data.amount,
    status: data.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
    datePaid: data.datePaid ? new Date(data.datePaid) : undefined,
  }

  const existing = await prisma.commissionPayment.findFirst({
    where: { qbInvoiceId: paymentData.qbInvoiceId },
  })

  if (existing) {
    await prisma.commissionPayment.update({
      where: { id: existing.id },
      data: paymentData,
    })
  }
}

async function handleQuickBooksSync(action: string, data: any) {
  // Handle QuickBooks vendor sync
  if (data.vendorId && data.agentEmail) {
    await prisma.agent.updateMany({
      where: { email: data.agentEmail },
      data: {
        qbVendorId: data.vendorId,
        qbVendorName: data.vendorName,
      },
    })
  }
}

// GET endpoint for Make to verify webhook is working
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Make webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}

