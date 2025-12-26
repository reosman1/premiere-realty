/**
 * Fetch Listing Records from Zoho CRM
 * 
 * This script fetches all listing records from Zoho CRM CustomModule13
 * and stores them in the local database.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-listings.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = process.env.ZOHO_MODULE || 'Listings' // API name is "Listings" but module is CustomModule13

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoListings(accessToken, limit = null) {
  // Fetch fields from Zoho - Note: Zoho has a limit of 50 fields per request
  // We prioritize the most important fields that map to our schema
  // Exactly 49 fields + id = 50 total
  const fields = [
    'id', 'Name', 'Email', 'City', 'Street_Name', 'Zip_Code', 'State', 'County',
    'Sale_Commission', 'Listing_Commission', 'Sale_Commission1', 'Listing_Commission1',
    'Office', 'Type', 'File_ID', 'Referring_Amount', 'Referring_Agent',
    'Unit_No', 'Listing_Price', 'Street_No', 'Seller_Name', 'Listing_Date',
    'Expiration_Date', 'Year_Built', 'Direction', 'Source', 'SS_Listing_Guid',
    'SS_Listing_ID', 'Agent_Name', 'Stage', 'Status', 'Checklist', 'Listing_Name',
    'Listing_Type', 'PREMIERE_Listing', 'Team_Leader', 'Regional_Director',
    'SS_Listing_Link', 'Sponsor', 'Business_Development_Director', 'UPDATE_LIST',
    'SS_Listing_Stage', 'SS_Listing_Status', 'Associated_Deal_Link',
    'REZEN_Associated_Deal_ID', 'reZEN_Verified', 'OTC_Verified',
    'Title_and_Escrow_Provider', 'Created_Time', 'Modified_Time'
  ].join(',') // 49 fields + id = 50 total

  let allRecords = []
  let pageToken = null
  let pageCount = 0
  const maxPages = limit ? Math.ceil(limit / 200) : 1000 // Fetch all pages if no limit (cap at 1000 pages for safety)

  do {
    let url = `${ZOHO_API_BASE}/${MODULE_NAME}?fields=${fields}&per_page=200&sort_order=desc&sort_by=Created_Time`
    if (pageToken) {
      url += `&page_token=${pageToken}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Zoho API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    if (data.data && Array.isArray(data.data)) {
      allRecords = allRecords.concat(data.data)
      console.log(`Fetched page ${pageCount + 1}: ${data.data.length} records (Total: ${allRecords.length})`)
      
      pageToken = data.info?.next_page_token || null
      pageCount++
      
      // If we have a limit and reached it, stop
      if (limit && allRecords.length >= limit) {
        break
      }
      
      // If no more pages, stop
      if (!pageToken) {
        break
      }
    } else {
      console.error('Unexpected response format:', data)
      break
    }
  } while (pageToken && pageCount < maxPages)

  return limit ? allRecords.slice(0, limit) : allRecords
}

/**
 * Map Zoho listing stage to our ListingStage enum
 */
function mapListingStage(zohoStage) {
  if (!zohoStage) return 'ACTIVE_LISTING'
  
  const stageMap = {
    'Active Listing': 'ACTIVE_LISTING',
    'Pending': 'PENDING',
    'Closed': 'CLOSED',
    'Expired': 'EXPIRED',
    'Canceled': 'CANCELED',
    'Canceled/App': 'CANCELED',
  }
  
  return stageMap[zohoStage] || 'ACTIVE_LISTING'
}

/**
 * Map Zoho listing type to our ListingType enum
 */
function mapListingType(zohoType) {
  if (!zohoType) return null
  
  const typeMap = {
    'Residential': 'RESIDENTIAL',
    'Commercial': 'COMMERCIAL',
  }
  
  return typeMap[zohoType] || null
}

/**
 * Map Zoho direction to our Direction enum
 */
function mapDirection(zohoDirection) {
  if (!zohoDirection || zohoDirection === '-None-') return null
  
  const directionMap = {
    'N': 'N',
    'S': 'S',
    'E': 'E',
    'W': 'W',
    'NW': 'NW',
    'NE': 'NE',
    'SE': 'SE',
    'SW': 'SW',
  }
  
  return directionMap[zohoDirection] || null
}

/**
 * Parse date from Zoho format
 */
function parseDate(dateValue) {
  if (!dateValue) return null
  
  try {
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? null : date
  } catch (e) {
    return null
  }
}

/**
 * Parse decimal value
 */
function parseDecimal(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Parse commission percentage (might be "3%" or "3" or 3)
 * Schema has Decimal(5,2) which means max 999.99
 * If value > 100, it might be stored as a decimal (e.g., 0.03 for 3%) or needs to be divided by 100
 */
function parseCommissionPercent(value) {
  if (value === null || value === undefined) return null
  
  let num
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    // Remove % sign and parse
    const cleaned = value.replace('%', '').trim()
    num = parseFloat(cleaned)
    if (isNaN(num)) return null
  } else {
    return null
  }
  
  // If the number is > 100, it's likely a percentage that needs to be converted
  // Or if it's > 999.99, cap it at the schema limit
  if (num > 100) {
    // Likely a percentage like 300 for 3%, try dividing by 100 first
    num = num / 100
  }
  
  // Cap at schema limit (Decimal(5,2) = max 999.99)
  if (num > 999.99) {
    console.warn(`  Warning: Commission percentage ${num} exceeds schema limit, capping at 999.99`)
    num = 999.99
  }
  
  // Round to 2 decimal places to match schema
  return Math.round(num * 100) / 100
}

/**
 * Parse boolean value
 */
function parseBoolean(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    return lower === 'true' || lower === 'yes' || lower === '1'
  }
  return Boolean(value)
}

/**
 * Map Zoho listing record to Prisma schema
 */
function mapZohoListingToSchema(zohoRecord) {
  // Helper to get field value
  const getField = (apiName) => {
    const field = zohoRecord[apiName]
    return field !== undefined ? field : null
  }

  // Extract agent name if it's a lookup object
  const agentName = getField('Agent_Name')
  const agentId = agentName && typeof agentName === 'object' ? (agentName.id || agentName.Id) : null
  const agentNameStr = agentName && typeof agentName === 'object' ? (agentName.name || agentName.Name) : agentName

  // Extract seller name if it's a lookup object
  const sellerName = getField('Seller_Name')
  const sellerId = sellerName && typeof sellerName === 'object' ? (sellerName.id || sellerName.Id) : null
  const sellerNameStr = sellerName && typeof sellerName === 'object' ? (sellerName.name || sellerName.Name) : sellerName

  return {
    zohoId: getField('id'),
    rezenCode: getField('SS_Listing_Guid') || null,
    rezenListingId: getField('SS_Listing_ID') || null,
    mlsNumber: getField('MLS_Number') || null,
    fileId: getField('File_ID') || null,
    
    // Property Address
    streetNo: getField('Street_No') || null,
    streetName: getField('Street_Name') || null,
    direction: mapDirection(getField('Direction')),
    unitNo: getField('Unit_No') || null,
    city: getField('City') || null,
    state: getField('State') || null,
    zipCode: getField('Zip_Code') || null,
    county: getField('County') || null,
    
    // Property Details
    listingName: getField('Listing_Name') || getField('Name') || null,
    listingType: mapListingType(getField('Listing_Type')),
    propertyType: getField('Type') || null,
    yearBuilt: getField('Year_Built') || null,
    
    // Pricing
    listingPrice: parseDecimal(getField('Listing_Price')),
    
    // Commissions
    listingCommissionPct: parseCommissionPercent(getField('Listing_Commission')),
    listingCommissionAmt: parseDecimal(getField('Listing_Commission1')),
    saleCommissionPct: parseCommissionPercent(getField('Sale_Commission')),
    saleCommissionAmt: parseDecimal(getField('Sale_Commission1')),
    referringAgentName: getField('Referring_Agent') || null,
    referringAmountPct: parseCommissionPercent(getField('Referring_Amount')),
    
    // Dates
    listingDate: parseDate(getField('Listing_Date')),
    expirationDate: parseDate(getField('Expiration_Date')),
    
    // Status
    stage: mapListingStage(getField('Stage')),
    status: getField('Status') || null,
    checklist: getField('Checklist') || null,
    
    // Source & Office
    source: getField('Source') || null,
    office: getField('Office') || null,
    
    // Flags
    isPremiereListng: parseBoolean(getField('PREMIERE_Listing') === 'Yes'),
    rezenVerified: parseBoolean(getField('reZEN_Verified')),
    otcVerified: parseBoolean(getField('OTC_Verified')),
    
    // Title & Escrow
    titleEscrowProvider: getField('Title_and_Escrow_Provider') || null,
    
    // Links
    rezenListingLink: getField('SS_Listing_Link') || null,
    rezenDealLink: getField('Associated_Deal_Link') || null,
    rezenAssociatedDealId: getField('REZEN_Associated_Deal_ID') || null,
    
    // Store agent/seller info for later lookup
    _agentZohoId: agentId,
    _agentName: agentNameStr,
    _sellerZohoId: sellerId,
    _sellerName: sellerNameStr,
  }
}

/**
 * Main function
 */
async function main() {
  const accessToken = process.env.ZOHO_ACCESS_TOKEN
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null
  
  if (!accessToken) {
    console.error('❌ Error: ZOHO_ACCESS_TOKEN environment variable is required')
    console.error('\nTo get an access token:')
    console.error('  1. Go to https://api-console.zoho.com/')
    console.error('  2. Create a Self Client or use existing OAuth credentials')
    console.error('  3. Generate an access token with scope: ZohoCRM.modules.READ')
    console.error('  4. Run: ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-listings.js')
    process.exit(1)
  }

  try {
    console.log('🚀 Starting Zoho Listing Import...\n')
    console.log(`Module: ${MODULE_NAME}`)
    if (limit) {
      console.log(`Limit: ${limit} records\n`)
    } else {
      console.log('Fetching all listings...\n')
    }

    // Fetch records from Zoho
    const zohoRecords = await fetchZohoListings(accessToken, limit)
    
    if (zohoRecords.length === 0) {
      console.log('⚠️  No records found in Zoho CRM')
      return
    }

    console.log(`✅ Fetched ${zohoRecords.length} records from Zoho\n`)

    // Map and upsert records
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    for (const zohoRecord of zohoRecords) {
      try {
        const listingData = mapZohoListingToSchema(zohoRecord)
        
        if (!listingData.zohoId) {
          console.log(`⚠️  Skipping record without ID`)
          skipped++
          continue
        }

        // Link agent if Agent_Name is provided
        let agentId = null
        if (listingData._agentZohoId || listingData._agentName) {
          const agent = await prisma.agent.findFirst({
            where: {
              OR: [
                listingData._agentZohoId ? { zohoId: listingData._agentZohoId } : {},
                listingData._agentName ? { name: { contains: listingData._agentName, mode: 'insensitive' } } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          })
          
          if (agent) {
            agentId = agent.id
          } else if (listingData._agentName) {
            console.log(`  ⚠️  Agent not found: ${listingData._agentName} (for listing ${listingData.listingName})`)
          }
        }

        // Link seller if Seller_Name is provided
        let sellerId = null
        if (listingData._sellerZohoId || listingData._sellerName) {
          const seller = await prisma.contact.findFirst({
            where: {
              OR: [
                listingData._sellerZohoId ? { zohoId: listingData._sellerZohoId } : {},
                listingData._sellerName ? { name: { contains: listingData._sellerName, mode: 'insensitive' } } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          })
          
          if (seller) {
            sellerId = seller.id
          }
        }

        // Remove temporary fields before saving
        delete listingData._agentZohoId
        delete listingData._agentName
        delete listingData._sellerZohoId
        delete listingData._sellerName

        // Add agentId and sellerId to listing data
        if (agentId) {
          listingData.agentId = agentId
        }
        if (sellerId) {
          listingData.sellerId = sellerId
        }

        // Check if listing already exists
        const existing = await prisma.listing.findUnique({
          where: { zohoId: listingData.zohoId },
        })

        if (existing) {
          await prisma.listing.update({
            where: { zohoId: listingData.zohoId },
            data: listingData,
          })
          updated++
        } else {
          await prisma.listing.create({
            data: listingData,
          })
          created++
        }

        if ((created + updated) % 10 === 0) {
          console.log(`  Processed ${created + updated}/${zohoRecords.length}...`)
        }
      } catch (error) {
        errors.push({
          zohoId: zohoRecord.id,
          error: error.message,
        })
        console.error(`  ❌ Error processing record ${zohoRecord.id}: ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary')
    console.log('='.repeat(50))
    console.log(`  ✅ Created: ${created}`)
    console.log(`  🔄 Updated: ${updated}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log(`  ❌ Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n❌ Errors:')
      errors.slice(0, 10).forEach(({ zohoId, error }) => {
        console.log(`  - ${zohoId}: ${error}`)
      })
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more`)
      }
    }

    console.log('\n✅ Import complete!')
  } catch (error) {
    console.error('\n❌ Import failed:')
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

