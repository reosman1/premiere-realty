/**
 * REZEN Listing Sync Cron Job
 * Syncs listings (OPEN, CLOSED, TERMINATED) from REZEN API
 */

import { NextRequest, NextResponse } from "next/server"
import { rezenApi } from "@/lib/rezen-api"
import { syncListingsFromRezen } from "@/lib/services/listing-sync"
import { prisma } from "@/lib/prisma"

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

    const { searchParams } = new URL(request.url)
    const lifecycleGroup = (searchParams.get("group") || "open") as "open" | "closed" | "terminated"

    const result = await performListingSync(lifecycleGroup)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("REZEN Listing Sync Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

async function performListingSync(lifecycleGroup: "open" | "closed" | "terminated") {
  const startTime = Date.now()

  await prisma.syncLog.create({
    data: {
      source: "REZEN",
      entityType: "listing",
      action: "UPDATE",
      status: "PENDING",
      payload: { syncType: "scheduled", lifecycleGroup },
    },
  })

  try {
    const listings = await rezenApi.getAllListings(lifecycleGroup)
    const syncResults = await syncListingsFromRezen(listings, lifecycleGroup)

    const duration = Date.now() - startTime

    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "listing",
        status: "PENDING",
        createdAt: { gte: new Date(startTime) },
      },
      data: {
        status: syncResults.errors.length > 0 ? "FAILED" : "SUCCESS",
        payload: { syncType: "scheduled", lifecycleGroup, ...syncResults, duration },
        errorMessage: syncResults.errors.length > 0 ? JSON.stringify(syncResults.errors) : null,
      },
    })

    return { ...syncResults, duration: `${duration}ms`, lifecycleGroup }
  } catch (error) {
    const duration = Date.now() - startTime
    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "listing",
        status: "PENDING",
        createdAt: { gte: new Date(startTime) },
      },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        payload: { syncType: "scheduled", lifecycleGroup, duration },
      },
    })
    throw error
  }
}

