import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/webhooks/rezen/transactions
// Webhook endpoint for REZEN/Make to sync transaction data
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

    const { action, transaction: txData } = body

    // Log the sync
    await prisma.syncLog.create({
      data: {
        source: "REZEN",
        entityType: "transaction",
        externalId: txData.brokerTransactionId || txData.id,
        action: action?.toUpperCase() || "UPDATE",
        payload: body,
        status: "PENDING",
      },
    })

    switch (action?.toLowerCase()) {
      case "create":
      case "update":
        await upsertTransaction(txData)
        break
      case "delete":
        await cancelTransaction(txData.brokerTransactionId)
        break
      default:
        await upsertTransaction(txData)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("REZEN Transaction Webhook Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function upsertTransaction(data: any) {
  // Find the associated agent
  let agentId = null
  if (data.agentEmail || data.agentRezenId) {
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [
          { email: data.agentEmail },
          { rezenId: data.agentRezenId },
        ],
      },
    })
    agentId = agent?.id
  }

  const transactionData = {
    brokerTransactionId: data.brokerTransactionId || data.id,
    brokerTransactionCode: data.brokerTransactionCode || data.code,
    
    name: data.name || data.transactionName || data.address,
    email: data.email,
    amount: data.amount || data.salePrice,
    
    type: mapTransactionType(data.type),
    stage: mapTransactionStage(data.stage || data.status),
    status: data.status,
    statusDetails: data.statusDetails,
    brokerDealType: data.brokerDealType === "Lease" ? "LEASE" : "SALE",
    
    // Commission
    commissionPct: data.commissionPct || data.commission,
    commissionFlatFee: data.commissionFlatFee,
    grossCommissionGCI: data.gci || data.grossCommissionGCI,
    firmAdminFee: data.firmAdminFee,
    
    // Dates
    contractAcceptanceDate: data.contractAcceptanceDate ? new Date(data.contractAcceptanceDate) : undefined,
    estimatedClosingDate: data.estimatedClosingDate ? new Date(data.estimatedClosingDate) : undefined,
    actualClosingDate: data.actualClosingDate ? new Date(data.actualClosingDate) : undefined,
    
    // Payer Info
    payerName: data.payerName,
    payerEmail: data.payerEmail,
    payerPhone: data.payerPhone,
    payerCompany: data.payerCompany,
    
    // Flags
    personalDeal: data.personalDeal || false,
    firmOwnedLead: data.firmOwnedLead || false,
    haltSyncWithBroker: data.haltSyncWithBroker || false,
    
    // Links
    brokerListingLink: data.brokerListingLink,
    brokerTransactionLink: data.brokerTransactionLink,
    
    // Source
    leadSource: data.leadSource,
    office: data.office,
    
    // Agent relationship
    agentId,
  }

  // Check if transaction exists
  const existingTx = await prisma.transaction.findFirst({
    where: {
      brokerTransactionId: transactionData.brokerTransactionId,
    },
  })

  let transaction
  if (existingTx) {
    transaction = await prisma.transaction.update({
      where: { id: existingTx.id },
      data: transactionData as any,
    })
  } else {
    transaction = await prisma.transaction.create({
      data: transactionData as any,
    })
  }

  // Handle participants if provided
  if (data.participants && Array.isArray(data.participants)) {
    // Remove existing participants
    await prisma.transactionParticipant.deleteMany({
      where: { transactionId: transaction.id },
    })
    
    // Add new participants
    for (const participant of data.participants) {
      await prisma.transactionParticipant.create({
        data: {
          transactionId: transaction.id,
          participantName: participant.name,
          participantEmail: participant.email,
          participantRole: participant.role,
          paymentAmount: participant.paymentAmount,
          paymentPct: participant.paymentPct,
        },
      })
    }
  }

  // Update sync log
  await prisma.syncLog.updateMany({
    where: {
      externalId: transactionData.brokerTransactionId,
      status: "PENDING",
    },
    data: {
      status: "SUCCESS",
    },
  })
}

async function cancelTransaction(brokerTransactionId: string) {
  await prisma.transaction.updateMany({
    where: { brokerTransactionId },
    data: { stage: "CANCELED_APP" },
  })
}

function mapTransactionType(type: string): "LISTING" | "PURCHASE" | "BOTH_PURCHASE_LISTING" | "LEASE_TENANT" | "LEASE_LANDLORD" | "BOTH_LEASE" | "REFERRAL" | "BPO" | "OTHER" {
  const typeMap: Record<string, any> = {
    listing: "LISTING",
    purchase: "PURCHASE",
    "both purchase & listing": "BOTH_PURCHASE_LISTING",
    "lease tenant": "LEASE_TENANT",
    "lease landlord": "LEASE_LANDLORD",
    "both lease tenant & landlord": "BOTH_LEASE",
    referral: "REFERRAL",
    bpo: "BPO",
  }
  return typeMap[type?.toLowerCase()] || "OTHER"
}

function mapTransactionStage(stage: string): "ACTIVE_LISTING" | "NEW_ENTRY" | "INCOMPLETE" | "PENDING" | "CLOSED" | "CLOSED_ARCHIVED" | "EXPIRED" | "CANCELED_PEND" | "CANCELED_APP" {
  const stageMap: Record<string, any> = {
    "active listing": "ACTIVE_LISTING",
    "new entry": "NEW_ENTRY",
    incomplete: "INCOMPLETE",
    pending: "PENDING",
    closed: "CLOSED",
    "closed (archived)": "CLOSED_ARCHIVED",
    expired: "EXPIRED",
    "canceled/pend": "CANCELED_PEND",
    "canceled/app": "CANCELED_APP",
  }
  return stageMap[stage?.toLowerCase()] || "NEW_ENTRY"
}

