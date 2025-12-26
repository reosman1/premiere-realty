/**
 * Listing Sync Service
 * Handles syncing REZEN listing data to the CRM database
 */

import { prisma } from "@/lib/prisma"
import { RezenListing } from "@/lib/rezen-api"
import { ListingStage } from "@prisma/client"

export interface ListingSyncResult {
  success: boolean
  listingId?: string
  action: "created" | "updated" | "skipped"
  error?: string
}

/**
 * Map REZEN listing lifecycle to CRM listing stage
 */
function mapListingStage(lifecycleGroup: string): ListingStage {
  const stageMap: Record<string, ListingStage> = {
    open: "ACTIVE_LISTING",
    closed: "CLOSED",
    terminated: "CANCELED",
  }

  return stageMap[lifecycleGroup?.toLowerCase()] || "ACTIVE_LISTING"
}

/**
 * Sync a single listing from REZEN
 */
export async function syncListingFromRezen(
  rezenListing: RezenListing,
  lifecycleGroup: "open" | "closed" | "terminated"
): Promise<ListingSyncResult> {
  try {
    if (!rezenListing.id) {
      return {
        success: false,
        action: "skipped",
        error: "Listing ID is missing",
      }
    }

    // Find associated agent if available
    let agentId: string | undefined = undefined
    if (rezenListing.agent?.id || rezenListing.agent?.email) {
      const agent = await prisma.agent.findFirst({
        where: {
          OR: [
            { rezenId: rezenListing.agent.id },
            { email: rezenListing.agent.email },
          ],
        },
      })
      agentId = agent?.id
    }

    // Check if listing already exists
    const existingListing = await prisma.listing.findFirst({
      where: {
        OR: [
          { rezenCode: rezenListing.id },
          { rezenListingId: rezenListing.id },
        ],
      },
    })

    const stage = mapListingStage(lifecycleGroup)

    // Prepare listing data
    const listingData = {
      rezenCode: rezenListing.id,
      rezenListingId: rezenListing.id,
      listingName: rezenListing.address?.oneLine || rezenListing.code,
      listingPrice: rezenListing.listingPrice?.amount
        ? parseFloat(rezenListing.listingPrice.amount.toString())
        : undefined,
      stage,
      // Address
      streetName: rezenListing.address?.street,
      city: rezenListing.address?.city,
      state: rezenListing.address?.state,
      zipCode: rezenListing.address?.zipCode,
      county: rezenListing.address?.county,
      // Links
      rezenListingLink: `https://bolt.therealbrokerage.com/listings/${rezenListing.id}/detail`,
      // Agent relationship
      agentId,
    }

    let listing
    if (existingListing) {
      listing = await prisma.listing.update({
        where: { id: existingListing.id },
        data: listingData as any,
      })

      return {
        success: true,
        listingId: listing.id,
        action: "updated",
      }
    } else {
      listing = await prisma.listing.create({
        data: listingData as any,
      })

      return {
        success: true,
        listingId: listing.id,
        action: "created",
      }
    }
  } catch (error) {
    console.error("Error syncing listing from REZEN:", error)
    return {
      success: false,
      action: "skipped",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sync multiple listings from REZEN
 */
export async function syncListingsFromRezen(
  rezenListings: RezenListing[],
  lifecycleGroup: "open" | "closed" | "terminated"
): Promise<{
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ listingId: string; error: string }>
}> {
  const results = {
    total: rezenListings.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ listingId: string; error: string }>,
  }

  for (const listing of rezenListings) {
    const result = await syncListingFromRezen(listing, lifecycleGroup)

    if (result.success) {
      if (result.action === "created") {
        results.created++
      } else if (result.action === "updated") {
        results.updated++
      } else {
        results.skipped++
      }
    } else {
      results.skipped++
      if (result.error) {
        results.errors.push({
          listingId: listing.id || "unknown",
          error: result.error,
        })
      }
    }
  }

  return results
}

