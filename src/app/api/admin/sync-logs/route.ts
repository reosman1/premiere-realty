import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/sync-logs
 * Fetch sync logs for admin UI
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source")
    const entityType = searchParams.get("entityType")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")

    const where: any = {}
    if (source) {
      where.source = source
    }
    if (entityType) {
      where.entityType = entityType
    }
    if (status) {
      where.status = status
    }

    const logs = await prisma.syncLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        status: log.status,
        payload: log.payload,
        errorMessage: log.errorMessage,
      })),
    })
  } catch (error) {
    console.error("Error fetching sync logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

