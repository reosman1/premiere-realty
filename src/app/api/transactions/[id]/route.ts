import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/transactions/[id]
 * Fetch a single transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = typeof params.then === 'function' ? await params : params
    const transaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            listingName: true,
            streetName: true,
            city: true,
            state: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Convert Decimal values to numbers for JSON response
    const formatTransaction = (tx: any) => {
      const formatted: any = { ...tx }
      
      // Convert Decimal fields to numbers
      const decimalFields = [
        'amount', 'commissionPct', 'commissionFlatFee', 'grossCommissionGCI',
        'grossCommissionAmount', 'grossCommissionPercentage', 'agentSplitPercent',
        'brokerCompanyCommission', 'firmAdminFee', 'totalPayments'
      ]
      
      decimalFields.forEach(field => {
        if (formatted[field] !== null && formatted[field] !== undefined) {
          formatted[field] = Number(formatted[field])
        }
      })
      
      return formatted
    }

    return NextResponse.json(formatTransaction(transaction))
  } catch (error: any) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json(
      { error: "Failed to fetch transaction", details: error.message },
      { status: 500 }
    )
  }
}

