/**
 * REZEN Pending Transactions Sync (Every 45 minutes)
 * Syncs updated pending transactions from REZEN
 */

import { NextRequest, NextResponse } from "next/server"
import { rezenApi } from "@/lib/rezen-api"
import { syncTransactionsFromRezen } from "@/lib/services/transaction-sync"
import { prisma } from "@/lib/prisma"
import { format, subMinutes } from "date-fns"

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await performPendingSync()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("REZEN Pending Sync Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

async function performPendingSync() {
  const startTime = Date.now()
  // Get transactions updated in the last 45 minutes
  const updatedAtFrom = format(subMinutes(new Date(), 45), "yyyy-MM-dd")

  await prisma.syncLog.create({
    data: {
      source: "REZEN",
      entityType: "transaction",
      action: "UPDATE",
      status: "PENDING",
      payload: { syncType: "pending", updatedAtFrom },
    },
  })

  try {
    const transactions = await rezenApi.getOpenTransactions({
      pageNumber: 0,
      pageSize: 100,
      sortDirection: "DESC",
      sortBy: "CREATED_AT",
      updatedAtFrom,
    })

    // Get detailed transaction data in batches (parallel processing)
    // Use conservative batch size and delays to respect rate limits
    const detailedTransactions = []
    const batchSize = parseInt(process.env.REZEN_BATCH_SIZE || "10", 10) // Default: 10 transactions per batch
    const batchDelay = parseInt(process.env.REZEN_BATCH_DELAY_MS || "500", 10) // Default: 500ms delay between batches
    const maxRetries = 3
    const baseRetryDelay = 2000 // 2 seconds base delay for exponential backoff
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      
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
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }

    const syncResults = await syncTransactionsFromRezen(detailedTransactions)
    const duration = Date.now() - startTime

    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "transaction",
        status: "PENDING",
        createdAt: { gte: new Date(startTime) },
      },
      data: {
        status: syncResults.errors.length > 0 ? "FAILED" : "SUCCESS",
        payload: { syncType: "pending", updatedAtFrom, ...syncResults, duration },
        errorMessage: syncResults.errors.length > 0 ? JSON.stringify(syncResults.errors) : null,
      },
    })

    return { ...syncResults, duration: `${duration}ms`, updatedAtFrom }
  } catch (error) {
    const duration = Date.now() - startTime
    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "transaction",
        status: "PENDING",
        createdAt: { gte: new Date(startTime) },
      },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        payload: { syncType: "pending", updatedAtFrom, duration },
      },
    })
    throw error
  }
}

