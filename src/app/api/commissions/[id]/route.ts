import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/commissions/[id]
 * Fetch a single commission payment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = typeof params.then === 'function' ? await params : params
    const commission = await prisma.commissionPayment.findUnique({
      where: { id: resolvedParams.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transaction: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
            itemType: true,
          },
        },
      },
    })

    if (!commission) {
      return NextResponse.json(
        { error: "Commission payment not found" },
        { status: 404 }
      )
    }

    // Convert Decimal values to numbers for JSON response
    const formatCommission = (c: any) => {
      const formatted: any = { ...c }
      
      // Convert Decimal fields to numbers
      if (formatted.amount !== null && formatted.amount !== undefined) {
        formatted.amount = Number(formatted.amount)
      }
      
      // Format items
      if (formatted.items) {
        formatted.items = formatted.items.map((item: any) => ({
          ...item,
          amount: item.amount !== null && item.amount !== undefined ? Number(item.amount) : null,
        }))
      }
      
      return formatted
    }

    return NextResponse.json(formatCommission(commission))
  } catch (error: any) {
    console.error("Error fetching commission payment:", error)
    return NextResponse.json(
      { error: "Failed to fetch commission payment", details: error.message },
      { status: 500 }
    )
  }
}

