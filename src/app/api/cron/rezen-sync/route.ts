/**
 * REZEN Daily Sync Cron Job
 * Scheduled job to sync transactions from REZEN API daily
 * 
 * Can be triggered by:
 * - Vercel Cron (configure in vercel.json)
 * - External cron service (cron-job.org, etc.)
 * - Manual API call for testing
 */

import { NextRequest, NextResponse } from "next/server"
import { rezenApi, RezenApiClient } from "@/lib/rezen-api"
import { syncTransactionsFromRezen } from "@/lib/services/transaction-sync"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

/**
 * Verify cron secret for security (optional but recommended)
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
 * GET /api/cron/rezen-sync
 * Manual trigger endpoint (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: require authentication for manual triggers
    const isAuthorized = verifyCronSecret(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters for custom date ranges
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom") || format(new Date(), "yyyy-MM-dd")
    const dateTo = searchParams.get("dateTo") || format(new Date(), "yyyy-MM-dd")

    const result = await performSync(dateFrom, dateTo)

    return NextResponse.json({
      success: true,
      message: "REZEN sync completed",
      ...result,
    })
  } catch (error) {
    console.error("REZEN Sync Error:", error)
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
 * POST /api/cron/rezen-sync
 * Cron job endpoint (called by Vercel Cron or external service)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const isAuthorized = verifyCronSecret(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Default to today's date for daily sync
    const today = format(new Date(), "yyyy-MM-dd")
    const result = await performSync(today, today)

    return NextResponse.json({
      success: true,
      message: "REZEN sync completed",
      ...result,
    })
  } catch (error) {
    console.error("REZEN Sync Error:", error)
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
 * Perform the actual sync operation
 */
async function performSync(dateFrom: string, dateTo: string) {
  const startTime = Date.now()

  // Log sync start
  await prisma.syncLog.create({
    data: {
      source: "REZEN",
      entityType: "transaction",
      action: "UPDATE",
      status: "PENDING",
      payload: {
        dateFrom,
        dateTo,
        syncType: "scheduled",
      },
    },
  })

  try {
    // Fetch transactions from REZEN
    const transactions = await rezenApi.getOpenTransactions({
      pageNumber: 0,
      pageSize: 100,
      sortDirection: "DESC",
      sortBy: "CREATED_AT",
      updatedAtFrom: dateFrom,
      updatedAtTo: dateTo,
    })

    // If we got a full page, fetch all pages
    let allTransactions = [...transactions]
    if (transactions.length === 100) {
      const allPages = await rezenApi.getAllOpenTransactions({
        pageNumber: 0,
        pageSize: 100,
        sortDirection: "DESC",
        sortBy: "CREATED_AT",
        updatedAtFrom: dateFrom,
        updatedAtTo: dateTo,
      })
      allTransactions = allPages
    }

    // Get detailed transaction data for each transaction in batches (parallel processing)
    // Use conservative batch size and delays to respect rate limits
    const detailedTransactions = []
    const batchSize = parseInt(process.env.REZEN_BATCH_SIZE || "10", 10) // Default: 10 transactions per batch
    const batchDelay = parseInt(process.env.REZEN_BATCH_DELAY_MS || "500", 10) // Default: 500ms delay between batches
    const maxRetries = 3
    const baseRetryDelay = 2000 // 2 seconds base delay for exponential backoff
    
    for (let i = 0; i < allTransactions.length; i += batchSize) {
      const batch = allTransactions.slice(i, i + batchSize)
      
      // Process batch in parallel with retry logic
      const batchPromises = batch.map(async (tx) => {
        let lastError: any = null
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const details = await rezenApi.getTransactionDetails(tx.id)
            return details
          } catch (error: any) {
            lastError = error
            
            // Check if it's a rate limit error (429) or server error (5xx)
            // RezenApiError has statusCode property
            const statusCode = (error as any)?.statusCode
            const isRateLimit = statusCode === 429
            const isServerError = statusCode >= 500 && statusCode < 600
            
            if ((isRateLimit || isServerError) && attempt < maxRetries) {
              // Exponential backoff: wait longer for each retry
              const retryDelay = baseRetryDelay * Math.pow(2, attempt)
              console.warn(
                `Rate limit/server error (${statusCode}) for transaction ${tx.id}, ` +
                `retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`
              )
              await new Promise(resolve => setTimeout(resolve, retryDelay))
              continue
            }
            
            // If not retryable or out of retries, log and use basic data
            console.error(`Error fetching details for transaction ${tx.id}:`, error?.message || error)
            return tx
          }
        }
        
        // Fallback to basic transaction data if all retries failed
        console.error(`Failed to fetch details for transaction ${tx.id} after ${maxRetries} retries`)
        return tx
      })
      
      const batchResults = await Promise.all(batchPromises)
      detailedTransactions.push(...batchResults)
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < allTransactions.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }

    // Sync transactions to database
    const syncResults = await syncTransactionsFromRezen(detailedTransactions)

    const duration = Date.now() - startTime

    // Update sync log
    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "transaction",
        status: "PENDING",
        createdAt: {
          gte: new Date(startTime),
        },
      },
      data: {
        status: syncResults.errors.length > 0 ? "FAILED" : "SUCCESS",
        payload: {
          dateFrom,
          dateTo,
          syncType: "scheduled",
          ...syncResults,
          duration,
        },
        errorMessage:
          syncResults.errors.length > 0
            ? JSON.stringify(syncResults.errors)
            : null,
      },
    })

    return {
      ...syncResults,
      duration: `${duration}ms`,
      dateFrom,
      dateTo,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    // Update sync log with error
    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "transaction",
        status: "PENDING",
        createdAt: {
          gte: new Date(startTime),
        },
      },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
        payload: {
          dateFrom,
          dateTo,
          syncType: "scheduled",
          duration,
        },
      },
    })

    throw error
  }
}

