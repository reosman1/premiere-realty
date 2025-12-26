/**
 * Transaction Sync Service
 * Handles syncing REZEN transaction data to the CRM database
 */

import { prisma } from "@/lib/prisma"
import { RezenTransaction } from "@/lib/rezen-api"
import { mapRezenStateToTransactionStage } from "@/lib/utils/rezen-state-mapper"
import { TransactionType, BrokerDealType } from "@prisma/client"

export interface SyncResult {
  success: boolean
  transactionId?: string
  action: "created" | "updated" | "skipped"
  error?: string
}

/**
 * Map REZEN transaction type to CRM transaction type
 */
function mapTransactionType(rezenType: string): TransactionType {
  const typeMap: Record<string, TransactionType> = {
    listing: "LISTING",
    purchase: "PURCHASE",
    "both purchase & listing": "BOTH_PURCHASE_LISTING",
    "lease tenant": "LEASE_TENANT",
    "lease landlord": "LEASE_LANDLORD",
    "both lease tenant & landlord": "BOTH_LEASE",
    referral: "REFERRAL",
    bpo: "BPO",
  }

  return typeMap[rezenType?.toLowerCase()] || "OTHER"
}

/**
 * Find or create agent by REZEN participant data
 */
async function findOrCreateAgent(participant: {
  id?: string
  name?: string
  email?: string
}): Promise<string | null> {
  if (!participant.id && !participant.email) {
    return null
  }

  // Try to find by REZEN ID first
  if (participant.id) {
    const agent = await prisma.agent.findFirst({
      where: { rezenId: participant.id },
    })
    if (agent) return agent.id
  }

  // Try to find by email
  if (participant.email) {
    const agent = await prisma.agent.findFirst({
      where: { email: participant.email },
    })
    if (agent) return agent.id
  }

  // Could create agent here if needed, but for now return null
  return null
}

/**
 * Sync a single transaction from REZEN to the database
 */
export async function syncTransactionFromRezen(
  rezenData: RezenTransaction
): Promise<SyncResult> {
  try {
    // Skip if transaction doesn't have an ID
    if (!rezenData.id) {
      return {
        success: false,
        action: "skipped",
        error: "Transaction ID is missing",
      }
    }

    // Check if transaction already exists
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { brokerTransactionId: rezenData.id },
        ],
      },
      include: {
        agent: true,
      },
    })
    
    // Also check by rezenId if it exists in the schema
    if (!existingTransaction && rezenData.id) {
      const byRezenId = await prisma.transaction.findFirst({
        where: {
          brokerTransactionId: rezenData.id,
        },
      })
      if (byRezenId) {
        Object.assign(existingTransaction || {}, byRezenId)
      }
    }

    // Find the primary agent (first participant or use existing)
    let agentId: string | null = null
    if (rezenData.participants && rezenData.participants.length > 0) {
      agentId = await findOrCreateAgent(rezenData.participants[0])
    }

    // If no agent found from participants, try to use existing transaction's agent
    if (!agentId && existingTransaction?.agentId) {
      agentId = existingTransaction.agentId
    }

    // Map REZEN lifecycle state to CRM stage
    const lifecycleState = rezenData.lifecycleState?.state
    const stage = mapRezenStateToTransactionStage(lifecycleState)

    // Prepare transaction data
    const transactionData = {
      rezenId: rezenData.id,
      brokerTransactionId: rezenData.id,
      transactionCode: rezenData.code,
      brokerTransactionCode: rezenData.code,

      // Basic info
      name: rezenData.address?.oneLine || rezenData.code || "Unknown Transaction",
      amount: rezenData.price?.amount
        ? parseFloat(rezenData.price.amount.toString())
        : null,

      // Type & Stage
      type: mapTransactionType(rezenData.transactionType || ""),
      stage,
      lifecycleState,
      status: lifecycleState,
      brokerDealType: rezenData.transactionType?.toLowerCase().includes("lease")
        ? ("LEASE" as BrokerDealType)
        : ("SALE" as BrokerDealType),

      // Commission
      grossCommissionAmount: rezenData.grossCommission?.amount
        ? parseFloat(rezenData.grossCommission.amount.toString())
        : null,
      grossCommissionPercentage: rezenData.grossCommissionPercentage
        ? parseFloat(rezenData.grossCommissionPercentage.toString())
        : null,
      grossCommissionGCI: rezenData.grossCommission?.amount
        ? parseFloat(rezenData.grossCommission.amount.toString())
        : null,

      // Dates
      contractAcceptanceDate: rezenData.contractAcceptanceDate
        ? new Date(rezenData.contractAcceptanceDate)
        : null,
      estimatedClosingDate: rezenData.closingDateEstimated
        ? new Date(rezenData.closingDateEstimated)
        : null,
      actualClosingDate: rezenData.closingDateActual
        ? new Date(rezenData.closingDateActual)
        : null,

      // Address
      addressOneLine: rezenData.address?.oneLine,
      streetAddress: rezenData.address?.street,
      city: rezenData.address?.city,
      state: rezenData.address?.state,
      zipCode: rezenData.address?.zipCode,
      county: rezenData.address?.county,

      // CD Payer (Title/Escrow)
      cdPayerName: rezenData.cdPayer?.fullName,
      cdPayerBusinessEntity: rezenData.cdPayerBusinessEntity?.name,

      // Office
      office: rezenData.office?.name,

      // Links
      brokerTransactionLink: `https://bolt.therealbrokerage.com/transactions/${rezenData.id}/detail`,

      // Agent relationship
      agentId,
    }

    // Upsert transaction
    let transaction
    if (existingTransaction) {
      transaction = await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: transactionData as any,
      })

      // Update participants if provided
      if (rezenData.participants && rezenData.participants.length > 0) {
        // Remove existing participants
        await prisma.transactionParticipant.deleteMany({
          where: { transactionId: transaction.id },
        })

        // Add new participants
        for (const participant of rezenData.participants) {
          await prisma.transactionParticipant.create({
            data: {
              transactionId: transaction.id,
              participantName: participant.name || "Unknown",
              participantEmail: participant.email,
              participantRole: participant.role,
              agentId: await findOrCreateAgent(participant),
            },
          })
        }
      }

      return {
        success: true,
        transactionId: transaction.id,
        action: "updated",
      }
    } else {
      transaction = await prisma.transaction.create({
        data: transactionData as any,
      })

      // Add participants if provided
      if (rezenData.participants && rezenData.participants.length > 0) {
        for (const participant of rezenData.participants) {
          await prisma.transactionParticipant.create({
            data: {
              transactionId: transaction.id,
              participantName: participant.name || "Unknown",
              participantEmail: participant.email,
              participantRole: participant.role,
              agentId: await findOrCreateAgent(participant),
            },
          })
        }
      }

      return {
        success: true,
        transactionId: transaction.id,
        action: "created",
      }
    }
  } catch (error) {
    console.error("Error syncing transaction from REZEN:", error)
    return {
      success: false,
      action: "skipped",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Sync multiple transactions from REZEN
 */
export async function syncTransactionsFromRezen(
  rezenTransactions: RezenTransaction[]
): Promise<{
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ transactionId: string; error: string }>
}> {
  const results = {
    total: rezenTransactions.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ transactionId: string; error: string }>,
  }

  for (const rezenTx of rezenTransactions) {
    const result = await syncTransactionFromRezen(rezenTx)

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
        results.errors.push({
          transactionId: rezenTx.id || "unknown",
          error: result.error,
        })
      }
    }
  }

  return results
}

