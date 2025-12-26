import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/agents
 * Fetch agents from database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const level = searchParams.get("level")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10)
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (level && level !== "all") {
      where.memberLevel = level
    }

    // Fetch agents and counts
    const [agents, total, activeCount, inactiveCount] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.agent.count({ where }),
      prisma.agent.count({ where: { status: "ACTIVE" } }),
      prisma.agent.count({ where: { status: "INACTIVE" } }),
    ])

    // Transform data for frontend
    const transformedAgents = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      status: agent.status,
      memberLevel: agent.memberLevel,
      hireDate: agent.hireDate,
      city: agent.city,
      state: agent.state,
      zipcode: agent.zipcode,
      street: agent.street,
      preCapSplitToAgent: agent.preCapSplitToAgent ? Number(agent.preCapSplitToAgent) : null,
      postCapSplitToAgent: agent.postCapSplitToAgent ? Number(agent.postCapSplitToAgent) : null,
      cappedWithTeam: agent.cappedWithTeam,
      teamCapAmount: agent.teamCapAmount ? Number(agent.teamCapAmount) : null,
      teamCapAmountPaid: agent.teamCapAmountPaid ? Number(agent.teamCapAmountPaid) : null,
    }))

    return NextResponse.json({
      agents: transformedAgents,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        activeCount,
        inactiveCount,
      },
    })
  } catch (error: any) {
    console.error("Error fetching agents:", error)
    return NextResponse.json(
      { error: "Failed to fetch agents", details: error.message },
      { status: 500 }
    )
  }
}

