/**
 * QuickBooks Invoice Sync Cron Job
 * Syncs transactions to QuickBooks invoices
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncTransactionsToInvoices } from "@/lib/services/qb-invoice-sync"

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    // If no secret is set, allow all requests (for development)
    return true
  }

  return authHeader === `Bearer ${cronSecret}`
}

/**
 * GET /api/cron/quickbooks-sync-invoices
 * Manual trigger endpoint for syncing transactions to QuickBooks invoices
 */
export async function GET(request: NextRequest) {
  try {
    const isAuthorized = verifyCronSecret(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get("stage") || "CLOSED" // Default to closed transactions
    const limit = parseInt(searchParams.get("limit") || "100", 10)

    // Find transactions that need to be synced
    // Only sync transactions that:
    // 1. Have a closing date
    // 2. Have commission amount
    // 3. Are in CLOSED stage
    // 4. Either don't have a QB invoice ID or should be updated
    const transactions = await prisma.transaction.findMany({
      where: {
        stage: stage as any,
        actualClosingDate: { not: null },
        grossCommissionAmount: { not: null },
        OR: [
          { quickbooksId: null },
          { quickbooksId: { not: null } }, // Also update existing ones
        ],
      },
      take: limit,
      orderBy: { actualClosingDate: "desc" },
    })

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No transactions to sync",
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
      })
    }

    const transactionIds = transactions.map((t) => t.id)
    const result = await syncTransactionsToInvoices(transactionIds)

    return NextResponse.json({
      success: true,
      message: "QuickBooks invoice sync completed",
      ...result,
    })
  } catch (error) {
    console.error("QuickBooks Invoice Sync Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/quickbooks-sync-invoices
 * Cron job endpoint
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

