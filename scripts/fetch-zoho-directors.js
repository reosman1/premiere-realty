/**
 * Fetch Director Records from Zoho CRM
 * 
 * This script fetches all director records from Zoho CRM CustomModule7 (Regional_Directors)
 * and stores them in the local database as Agents with isActiveDirector flag set.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-directors.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = 'Regional_Directors' // API name for CustomModule7

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoDirectors(accessToken, limit = null) {
  // Fetch fields from Zoho - prioritizing important fields
  const fields = [
    'id', 'Name', 'Email', 
    'Regional_Director_Percent', 
    'Firm_Status', 
    'QB_Vendor_Number',
    'Effective_Start_Date_as_RD',
    'Director_Type',
    'Effective_End_Date',
    'Created_Time', 'Modified_Time'
  ].join(',')

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
 * Map Zoho status to AgentStatus enum
 */
function mapStatus(zohoStatus) {
  if (!zohoStatus || zohoStatus === '-None-') return 'ACTIVE'
  
  const statusMap = {
    'Active': 'ACTIVE',
    'Inactive': 'INACTIVE',
  }
  
  return statusMap[zohoStatus] || 'ACTIVE'
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
 * Map Zoho director record to Agent schema
 * Returns both agent data and director metadata separately
 */
function mapZohoDirectorToAgent(zohoRecord) {
  // Helper to get field value
  const getField = (apiName) => {
    const field = zohoRecord[apiName]
    return field !== undefined ? field : null
  }

  const name = getField('Name') || 'Unknown'
  const email = getField('Email') || ''
  
  // Email is required - skip if missing
  if (!email) {
    return null
  }
  
  // Director-specific metadata (not part of Agent schema)
  const directorMetadata = {
    directorStartDate: parseDate(getField('Effective_Start_Date_as_RD')),
    directorEndDate: parseDate(getField('Effective_End_Date')),
    directorType: getField('Director_Type') || null,
    directorCommissionPercent: parseDecimal(getField('Regional_Director_Percent')),
  }
  
  // Build notes from director metadata
  const notesParts = []
  if (directorMetadata.directorStartDate) {
    notesParts.push(`Director Start: ${directorMetadata.directorStartDate.toISOString().split('T')[0]}`)
  }
  if (directorMetadata.directorEndDate) {
    notesParts.push(`Director End: ${directorMetadata.directorEndDate.toISOString().split('T')[0]}`)
  }
  if (directorMetadata.directorType && directorMetadata.directorType !== '-None-') {
    notesParts.push(`Director Type: ${directorMetadata.directorType}`)
  }
  if (directorMetadata.directorCommissionPercent !== null) {
    notesParts.push(`Director Commission %: ${directorMetadata.directorCommissionPercent}%`)
  }

  // Agent data (matches Prisma schema)
  const agentData = {
    // Personal Info
    name: name,
    email: email,
    workEmail: email, // Use same email for work email
    
    // Employment
    status: mapStatus(getField('Firm_Status')),
    
    // Roles - Directors
    isActiveDirector: true,
    
    // External IDs
    qbVendorId: getField('QB_Vendor_Number') || null,
    
    // Notes - include director metadata
    notes: notesParts.length > 0 ? notesParts.join(' | ') : null,
  }

  return agentData
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
    console.error('  4. Run: ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-directors.js')
    process.exit(1)
  }

  try {
    console.log('🚀 Starting Zoho Director Import...\n')
    console.log(`Module: ${MODULE_NAME} (CustomModule7)`)
    if (limit) {
      console.log(`Limit: ${limit} records\n`)
    } else {
      console.log('Fetching all directors...\n')
    }

    // Fetch records from Zoho
    const zohoDirectors = await fetchZohoDirectors(accessToken, limit)
    
    if (zohoDirectors.length === 0) {
      console.log('⚠️  No records found in Zoho CRM')
      return
    }

    console.log(`✅ Fetched ${zohoDirectors.length} directors from Zoho\n`)

    // Map and upsert records
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    for (const zohoDirector of zohoDirectors) {
      try {
        const zohoDirectorId = zohoDirector.id
        
        if (!zohoDirectorId) {
          console.log(`⚠️  Skipping record without ID`)
          skipped++
          continue
        }

        const directorData = mapZohoDirectorToAgent(zohoDirector)
        
        // Skip if email is missing (required field)
        if (!directorData) {
          console.log(`⚠️  Skipping director "${zohoDirector.Name}" - missing email`)
          skipped++
          continue
        }

        // Find existing agent by email (primary) or name
        const existingAgent = await prisma.agent.findFirst({
          where: {
            OR: [
              { email: directorData.email },
              // Also check by name if email doesn't match
              { name: directorData.name },
              // Check by QB Vendor ID if it exists
              ...(directorData.qbVendorId ? [{ qbVendorId: directorData.qbVendorId }] : []),
            ],
          },
        })

        if (existingAgent) {
          // Update existing agent - only update director-specific fields
          // Don't update email, name, or other critical fields
          const updateData = {
            isActiveDirector: true, // Always set director flag
          }
          
          // Only update status if it's different
          if (directorData.status !== existingAgent.status) {
            updateData.status = directorData.status
          }
          
          // Only update QB Vendor ID if it's provided and different
          if (directorData.qbVendorId && directorData.qbVendorId !== existingAgent.qbVendorId) {
            updateData.qbVendorId = directorData.qbVendorId
          }
          
          // Append director notes if we have new director metadata
          if (directorData.notes) {
            const existingNotes = existingAgent.notes || ''
            const directorNotePrefix = '[Director Info]'
            
            // Check if director notes already exist
            if (!existingNotes.includes(directorNotePrefix)) {
              updateData.notes = existingNotes 
                ? `${existingNotes}\n${directorNotePrefix} ${directorData.notes}`.trim()
                : `${directorNotePrefix} ${directorData.notes}`
            }
          }
          
          await prisma.agent.update({
            where: { id: existingAgent.id },
            data: updateData,
          })
          updated++
          console.log(`  ✅ Updated director: ${directorData.name} (${existingAgent.email})`)
        } else {
          // Create new agent as director
          await prisma.agent.create({
            data: directorData,
          })
          created++
          console.log(`  ✅ Created director: ${directorData.name} (${directorData.email})`)
        }

        if ((created + updated) % 10 === 0) {
          console.log(`  Processed ${created + updated}/${zohoDirectors.length}...`)
        }
      } catch (error) {
        errors.push({
          zohoId: zohoDirector.id,
          name: zohoDirector.Name,
          error: error.message,
        })
        console.error(`  ❌ Error processing director ${zohoDirector.id || zohoDirector.Name}: ${error.message}`)
        
        // If it's a unique constraint error on email, log it specifically
        if (error.message && error.message.includes('Unique constraint')) {
          console.error(`     → This likely means an agent with this email already exists`)
        }
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
      errors.slice(0, 10).forEach(({ zohoId, name, error }) => {
        console.log(`  - ${name || zohoId}: ${error}`)
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

