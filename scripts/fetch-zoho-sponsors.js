/**
 * Fetch Sponsor Records from Zoho CRM
 * 
 * This script fetches sponsor records from Zoho CRM CustomModule10 (Sponsors)
 * and links them to existing agents in the database.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-sponsors.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = 'Sponsors' // Zoho API name for Sponsors (CustomModule10)

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoSponsors(accessToken, limit = null) {
  // Fetch fields from Zoho - Note: Zoho has a limit of 50 fields per request
  // Based on fields_Sponsors.json export
  const fields = [
    'id', 'Name', 'Email', 'Secondary_Email', 
    'Sponsor_Percent', 'Firm_Status', 'QB_Vendor_Number'
  ].join(',') // 7 fields total (well under the 50 limit)

  let allRecords = []
  let pageToken = null
  let pageCount = 0
  const maxPages = limit ? Math.ceil(limit / 200) : 1000 // Fetch all pages if no limit

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
 * Parse a date string from Zoho
 */
function parseDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr)
  } catch (e) {
    return null
  }
}

/**
 * Parse a decimal/percentage value
 */
function parseDecimal(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Parse a boolean value
 */
function parseBoolean(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    return lower === 'true' || lower === '1' || lower === 'yes'
  }
  return Boolean(value)
}

/**
 * Map Zoho Firm_Status to AgentStatus enum
 */
function mapStatus(status) {
  if (!status || status === '-None-') return 'ACTIVE'
  const statusMap = {
    'Active': 'ACTIVE',
    'Inactive': 'INACTIVE',
  }
  return statusMap[status] || 'ACTIVE'
}

/**
 * Main function
 */
async function main() {
  const accessToken = process.env.ZOHO_ACCESS_TOKEN
  
  if (!accessToken) {
    console.error('❌ Error: ZOHO_ACCESS_TOKEN environment variable is required')
    console.error('Usage: ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-sponsors.js')
    process.exit(1)
  }

  try {
    console.log('🔄 Fetching sponsors from Zoho CRM...')
    console.log(`Module: ${MODULE_NAME}\n`)
    
    const zohoSponsors = await fetchZohoSponsors(accessToken) // Fetch all sponsors
    console.log(`\n📊 Fetched ${zohoSponsors.length} sponsors from Zoho\n`)

    if (zohoSponsors.length === 0) {
      console.log('⚠️  No sponsors found in Zoho')
      return
    }

    let created = 0
    let updated = 0
    let linked = 0
    let notFound = 0
    let errors = 0

    for (const zohoRecord of zohoSponsors) {
      try {
        const sponsorName = zohoRecord.Name || 'Unknown'
        const sponsorEmail = zohoRecord.Email || zohoRecord.Secondary_Email
        
        if (!sponsorEmail && !sponsorName) {
          console.log(`  ⏭️  Skipped: No email or name found (ID: ${zohoRecord.id})`)
          notFound++
          continue
        }

        // Try to find the agent by email first, then by name
        let agent = null
        
        if (sponsorEmail) {
          agent = await prisma.agent.findFirst({
            where: {
              OR: [
                { email: sponsorEmail },
                { personalEmail: sponsorEmail },
                { workEmail: sponsorEmail },
              ],
            },
          })
        }
        
        if (!agent && sponsorName) {
          agent = await prisma.agent.findFirst({
            where: {
              OR: [
                { name: { equals: sponsorName, mode: 'insensitive' } },
                { name: { contains: sponsorName, mode: 'insensitive' } },
              ],
            },
          })
        }

        if (agent) {
          // Update the agent with sponsor information
          const updateData = {
            isActiveSponsor: true,
          }

          // Update QB Vendor Number if provided and not already set
          if (zohoRecord.QB_Vendor_Number && !agent.qbVendorId) {
            updateData.qbVendorId = zohoRecord.QB_Vendor_Number
          }

          // Update status if provided
          if (zohoRecord.Firm_Status) {
            updateData.status = mapStatus(zohoRecord.Firm_Status)
          }

          await prisma.agent.update({
            where: { id: agent.id },
            data: updateData,
          })

          linked++
          updated++
          console.log(`  ✅ Linked: ${sponsorName} (${sponsorEmail || 'no email'}) → Agent: ${agent.name}`)
        } else {
          notFound++
          console.log(`  ⚠️  Not Found: ${sponsorName} (${sponsorEmail || 'no email'}) - No matching agent in database`)
        }
      } catch (error) {
        errors++
        console.error(`  ❌ Error processing sponsor ${zohoRecord.id || 'unknown'}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary')
    console.log('='.repeat(50))
    console.log(`  ✅ Linked to Agents: ${linked}`)
    console.log(`  ✅ Updated: ${updated}`)
    console.log(`  ⚠️  Agents Not Found: ${notFound}`)
    console.log(`  ❌ Errors: ${errors}`)
    console.log(`  📦 Total processed: ${zohoSponsors.length}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Error during sponsor import:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

