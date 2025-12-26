import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/listings/[id]
 * Fetch a single listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = typeof params.then === 'function' ? await params : params
    const listing = await prisma.listing.findUnique({
      where: { id: resolvedParams.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    // Convert Decimal values to numbers for JSON response
    const formatListing = (l: any) => {
      const formatted: any = { ...l }
      
      // Convert Decimal fields to numbers
      const decimalFields = [
        'listingPrice',
        'listingCommissionPct', 'listingCommissionAmt',
        'saleCommissionPct', 'saleCommissionAmt',
        'referringAmountPct'
      ]
      
      decimalFields.forEach(field => {
        if (formatted[field] !== null && formatted[field] !== undefined) {
          formatted[field] = Number(formatted[field])
        }
      })
      
      return formatted
    }

    return NextResponse.json(formatListing(listing))
  } catch (error: any) {
    console.error("Error fetching listing:", error)
    return NextResponse.json(
      { error: "Failed to fetch listing", details: error.message },
      { status: 500 }
    )
  }
}

