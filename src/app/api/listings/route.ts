import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/listings
 * Fetch listings from database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const stage = searchParams.get("stage")
    const type = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10)
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { listingName: { contains: search, mode: "insensitive" } },
        { mlsNumber: { contains: search, mode: "insensitive" } },
        { streetName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ]
    }

    if (stage && stage !== "all") {
      where.stage = stage
    }

    if (type && type !== "all") {
      where.listingType = type
    }

    // Fetch listings
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ])

    // Transform data for frontend
    const transformedListings = listings.map((listing) => ({
      id: listing.id,
      mlsNumber: listing.mlsNumber,
      listingName: listing.listingName,
      address: [listing.streetNo, listing.streetName, listing.city, listing.state, listing.zipCode]
        .filter(Boolean)
        .join(" "),
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode,
      listingPrice: listing.listingPrice ? Number(listing.listingPrice) : null,
      stage: listing.stage,
      listingType: listing.listingType,
      listingDate: listing.listingDate,
      expirationDate: listing.expirationDate,
      agent: listing.agent?.name || "Unassigned",
      agentId: listing.agentId,
      listingCommissionPct: listing.listingCommissionPct ? Number(listing.listingCommissionPct) : null,
      saleCommissionPct: listing.saleCommissionPct ? Number(listing.saleCommissionPct) : null,
    }))

    return NextResponse.json({
      listings: transformedListings,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error("Error fetching listings:", error)
    return NextResponse.json(
      { error: "Failed to fetch listings", details: error.message },
      { status: 500 }
    )
  }
}

