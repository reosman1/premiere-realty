import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/webhooks/rezen/listings
// Webhook endpoint for REZEN/Make to sync listing data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook secret
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { action, listing: listingData } = body

    // Log the sync
    await prisma.syncLog.create({
      data: {
        source: "REZEN",
        entityType: "listing",
        externalId: listingData.rezenListingId || listingData.id,
        action: action?.toUpperCase() || "UPDATE",
        payload: body,
        status: "PENDING",
      },
    })

    switch (action?.toLowerCase()) {
      case "create":
      case "update":
        await upsertListing(listingData)
        break
      case "delete":
        await cancelListing(listingData.rezenListingId)
        break
      default:
        await upsertListing(listingData)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("REZEN Listing Webhook Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function upsertListing(data: any) {
  // Find the associated agent
  let agentId = null
  if (data.agentEmail || data.agentRezenId) {
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [
          { email: data.agentEmail },
          { rezenId: data.agentRezenId },
        ],
      },
    })
    agentId = agent?.id
  }

  const listingData = {
    rezenCode: data.rezenCode || data.ssListingGuid,
    rezenListingId: data.rezenListingId || data.ssListingId,
    mlsNumber: data.mlsNumber,
    fileId: data.fileId,
    
    // Address
    streetNo: data.streetNo,
    streetName: data.streetName,
    direction: mapDirection(data.direction),
    unitNo: data.unitNo,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    county: data.county,
    
    // Property Details
    listingName: data.listingName || `${data.streetNo || ""} ${data.streetName || ""}`.trim(),
    listingType: data.listingType === "Commercial" ? "COMMERCIAL" : "RESIDENTIAL",
    propertyType: data.type || data.propertyType,
    yearBuilt: data.yearBuilt,
    
    // Pricing
    listingPrice: data.listingPrice,
    
    // Commissions
    listingCommissionPct: data.listingCommissionPct || data.listingCommission,
    listingCommissionAmt: data.listingCommissionAmt || data.listingCommission1,
    saleCommissionPct: data.saleCommissionPct || data.saleCommission,
    saleCommissionAmt: data.saleCommissionAmt || data.saleCommission1,
    referringAgentName: data.referringAgent,
    referringAmountPct: data.referringAmount,
    
    // Dates
    listingDate: data.listingDate ? new Date(data.listingDate) : undefined,
    expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
    
    // Status
    stage: mapListingStage(data.stage),
    status: data.status,
    
    // Source & Office
    source: data.source,
    office: data.office,
    
    // Flags
    isPremiereListng: data.premiereListing === "Yes",
    rezenVerified: data.rezenVerified || false,
    
    // Links
    rezenListingLink: data.ssListingLink,
    rezenDealLink: data.associatedDealLink,
    rezenAssociatedDealId: data.rezenAssociatedDealId,
    
    // Agent relationship
    agentId,
  }

  // Check if listing exists
  const existingListing = await prisma.listing.findFirst({
    where: {
      OR: [
        { rezenListingId: listingData.rezenListingId },
        { rezenCode: listingData.rezenCode },
        { mlsNumber: listingData.mlsNumber },
      ].filter(Boolean),
    },
  })

  if (existingListing) {
    await prisma.listing.update({
      where: { id: existingListing.id },
      data: listingData,
    })
  } else {
    await prisma.listing.create({
      data: listingData,
    })
  }

  // Update sync log
  await prisma.syncLog.updateMany({
    where: {
      externalId: listingData.rezenListingId,
      status: "PENDING",
    },
    data: {
      status: "SUCCESS",
    },
  })
}

async function cancelListing(rezenListingId: string) {
  await prisma.listing.updateMany({
    where: { rezenListingId },
    data: { stage: "CANCELED" },
  })
}

function mapDirection(direction: string): "N" | "S" | "E" | "W" | "NW" | "NE" | "SE" | "SW" | undefined {
  const directionMap: Record<string, any> = {
    n: "N",
    s: "S",
    e: "E",
    w: "W",
    nw: "NW",
    ne: "NE",
    se: "SE",
    sw: "SW",
  }
  return directionMap[direction?.toLowerCase()]
}

function mapListingStage(stage: string): "ACTIVE_LISTING" | "PENDING" | "CLOSED" | "EXPIRED" | "CANCELED" {
  const stageMap: Record<string, any> = {
    "active listing": "ACTIVE_LISTING",
    active: "ACTIVE_LISTING",
    pending: "PENDING",
    closed: "CLOSED",
    expired: "EXPIRED",
    canceled: "CANCELED",
    "canceled/app": "CANCELED",
  }
  return stageMap[stage?.toLowerCase()] || "ACTIVE_LISTING"
}

