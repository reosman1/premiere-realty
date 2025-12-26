/**
 * REZEN Agent Sync Cron Job
 * Syncs team members/agents from REZEN Yenta API
 */

import { NextRequest, NextResponse } from "next/server"
import { rezenApi } from "@/lib/rezen-api"
import { syncAgentsFromRezen } from "@/lib/services/agent-sync"
import { prisma } from "@/lib/prisma"

const REZEN_TEAM_ID = process.env.REZEN_TEAM_ID || "cbc59bd7-7085-41b9-9bd1-2f9e5a01dd0a"

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

    const result = await performAgentSync()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("REZEN Agent Sync Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

async function performAgentSync() {
  const startTime = Date.now()

  await prisma.syncLog.create({
    data: {
      source: "REZEN",
      entityType: "agent",
      action: "UPDATE",
      status: "PENDING",
      payload: { syncType: "scheduled", teamId: REZEN_TEAM_ID },
    },
  })

  try {
    // Get team members from Yenta
    const teamMembers = await rezenApi.getTeamMembers(REZEN_TEAM_ID)

    // Sync agents with cap info
    const syncResults = await syncAgentsFromRezen(teamMembers, async (agentId) => {
      try {
        return await rezenApi.getAgentCapInfo(agentId)
      } catch {
        return undefined
      }
    })

    const duration = Date.now() - startTime

    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "agent",
        status: "PENDING",
        createdAt: { gte: new Date(startTime) },
      },
      data: {
        status: syncResults.errors.length > 0 ? "FAILED" : "SUCCESS",
        payload: { syncType: "scheduled", teamId: REZEN_TEAM_ID, ...syncResults, duration },
        errorMessage: syncResults.errors.length > 0 ? JSON.stringify(syncResults.errors) : null,
      },
    })

    return { ...syncResults, duration: `${duration}ms` }
  } catch (error) {
    const duration = Date.now() - startTime
    await prisma.syncLog.updateMany({
      where: {
        source: "REZEN",
        entityType: "agent",
        status: "PENDING",
        createdAt: { gte: new Date(startTime) },
      },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        payload: { syncType: "scheduled", teamId: REZEN_TEAM_ID, duration },
      },
    })
    throw error
  }
}

