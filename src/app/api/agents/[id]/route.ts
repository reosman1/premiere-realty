import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/agents/[id]
 * Fetch a single agent by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = typeof params.then === 'function' ? await params : params
    const agent = await prisma.agent.findUnique({
      where: { id: resolvedParams.id },
      include: {
        teamLeader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        regionalDirector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        businessDevDirector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    // Convert Decimal values to numbers for JSON response
    const formatAgent = (a: any) => {
      const formatted: any = { ...a }
      
      // Convert Decimal fields to numbers
      const decimalFields = [
        'preCapSplitToAgent', 'postCapSplitToAgent', 'perTransactionFee',
        'teamCapAmount', 'teamCapAmountPaid', 'brokerageCapAmount', 'brokerageCapAmountPaid',
        'monthlyMemberFee', 'balanceDue'
      ]
      
      decimalFields.forEach(field => {
        if (formatted[field] !== null && formatted[field] !== undefined) {
          formatted[field] = Number(formatted[field])
        }
      })
      
      return formatted
    }

    return NextResponse.json(formatAgent(agent))
  } catch (error: any) {
    console.error("Error fetching agent:", error)
    return NextResponse.json(
      { error: "Failed to fetch agent", details: error.message },
      { status: 500 }
    )
  }
}

