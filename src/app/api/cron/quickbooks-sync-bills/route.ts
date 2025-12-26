/**
 * QuickBooks Bill Sync Cron Job
 * Syncs commission payments to QuickBooks bills
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncCommissionPaymentsToBills } from "@/lib/services/qb-bill-sync"

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return true
  }

  return authHeader === `Bearer ${cronSecret}`
}

/**
 * GET /api/cron/quickbooks-sync-bills
 * Manual trigger endpoint for syncing commission payments to QuickBooks bills
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
    const status = searchParams.get("status") || "PENDING" // Default to pending payments
    const limit = parseInt(searchParams.get("limit") || "100", 10)

    // Find commission payments that need to be synced
    const payments = await prisma.commissionPayment.findMany({
      where: {
        status: status as any,
        amount: { gt: 0 },
        agent: { isNot: null }, // Must have an agent
        OR: [
          { qbInvoiceId: null },
          { qbInvoiceId: { not: null } }, // Also update existing ones
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        agent: true,
      },
    })

    if (payments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No commission payments to sync",
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
      })
    }

    const paymentIds = payments.map((p) => p.id)
    const result = await syncCommissionPaymentsToBills(paymentIds)

    return NextResponse.json({
      success: true,
      message: "QuickBooks bill sync completed",
      ...result,
    })
  } catch (error) {
    console.error("QuickBooks Bill Sync Error:", error)
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
 * POST /api/cron/quickbooks-sync-bills
 * Cron job endpoint
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

