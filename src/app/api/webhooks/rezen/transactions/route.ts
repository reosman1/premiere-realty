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
    rezenId: data.rezenId || data.id,
    brokerTransactionId: data.brokerTransactionId || data.id,
    brokerTransactionCode: data.brokerTransactionCode || data.code,
    transactionCode: data.transactionCode || data.code,
    
    name: data.name || data.transactionName || data.address?.oneLine || data.address,
    email: data.email,
    amount: data.amount || data.salePrice || data.price?.amount,
    
    type: mapTransactionType(data.type || data.transactionType),
    stage: mapTransactionStage(data.stage || data.status || data.lifecycleState?.state),
    status: data.status || data.lifecycleState?.state,
    statusDetails: data.statusDetails,
    lifecycleState: data.lifecycleState?.state || data.lifecycleState,
    brokerDealType: data.brokerDealType === "Lease" ? "LEASE" : "SALE",
    
    // Commission
    commissionPct: data.commissionPct || data.commission,
    commissionFlatFee: data.commissionFlatFee,
    grossCommissionGCI: data.gci || data.grossCommissionGCI || data.grossCommission?.amount,
    grossCommissionAmount: data.grossCommission?.amount,
    grossCommissionPercentage: data.grossCommissionPercentage,
    agentSplitPercent: data.agentSplitPercent,
    brokerCompanyCommission: data.brokerCompanyCommission,
    firmAdminFee: data.firmAdminFee,
    
    // QuickBooks
    quickbooksId: data.quickbooksId || data.qbId,
    quickbooksTransactionName: data.quickbooksTransactionName || data.qbTransactionName,
    quickbooksInvoiceLink: data.quickbooksInvoiceLink || data.qbInvoiceLink,
    
    // Dates
    contractAcceptanceDate: data.contractAcceptanceDate ? new Date(data.contractAcceptanceDate) : undefined,
    estimatedClosingDate: data.estimatedClosingDate || data.closingDateEstimated ? new Date(data.estimatedClosingDate || data.closingDateEstimated) : undefined,
    actualClosingDate: data.actualClosingDate || data.closingDateActual ? new Date(data.actualClosingDate || data.closingDateActual) : undefined,
    
    // Address
    addressOneLine: data.address?.oneLine || data.addressOneLine,
    streetAddress: data.address?.street || data.streetAddress,
    city: data.address?.city || data.city,
    state: data.address?.state || data.state,
    zipCode: data.address?.zipCode || data.zipCode,
    county: data.address?.county || data.county,
    country: data.address?.country || data.country,
    
    // CD Payer Info (Title/Escrow)
    cdPayerName: data.cdPayerName || data.cdPayer?.fullName,
    cdPayerBusinessEntity: data.cdPayerBusinessEntity || data.cdPayerBusinessEntity?.name,
    payerName: data.payerName,
    payerEmail: data.payerEmail,
    payerPhone: data.payerPhone,
    payerCompany: data.payerCompany,
    
    // Flags
    personalDeal: data.personalDeal || false,
    firmOwnedLead: data.firmOwnedLead || false,
    haltSyncWithBroker: data.haltSyncWithBroker || false,
    disableSplitAutomation: data.disableSplitAutomation || false,
    
    // Links
    brokerListingLink: data.brokerListingLink,
    brokerTransactionLink: data.brokerTransactionLink || (data.id ? `https://bolt.therealbrokerage.com/transactions/${data.id}/detail` : undefined),
    
    // Source
    leadSource: data.leadSource,
    office: data.office || data.office?.name,
    
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

