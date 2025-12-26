/**
 * Generic Zoho Module Fetcher
 * 
 * This script can fetch records from any Zoho CRM module.
 * It automatically handles token refresh and pagination.
 * 
 * Usage:
 *   # Using refresh token (recommended - automatically refreshes):
 *   ZOHO_MODULE=ModuleName node scripts/fetch-zoho-module.js
 * 
 *   # Examples:
 *   ZOHO_MODULE=Regional_Directors node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Mentors node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Sponsors node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Members node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Payments node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Referral_Partners node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Contacts node scripts/fetch-zoho-module.js
 *   ZOHO_MODULE=Leads node scripts/fetch-zoho-module.js
 * 
 *   # With limit:
 *   ZOHO_MODULE=Payments LIMIT=50 node scripts/fetch-zoho-module.js
 */

require('dotenv').config()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token'

/**
 * Get access token using refresh token
 */
async function getAccessTokenFromRefresh(refreshToken, clientId, clientSecret) {
  console.log('🔄 Refreshing access token...\n')
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  try {
    const response = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
    }

    console.log('✅ Successfully refreshed access token\n')
    return data.access_token
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error.message}`)
  }
}

/**
 * Get access token automatically
 */
async function getAccessToken() {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  const accessToken = process.env.ZOHO_ACCESS_TOKEN

  // If refresh token is available, use it to get a fresh access token
  if (refreshToken && clientId && clientSecret) {
    return await getAccessTokenFromRefresh(refreshToken, clientId, clientSecret)
  }

  // Otherwise, use the provided access token
  if (accessToken) {
    return accessToken
  }

  // If neither is available, throw an error
  throw new Error('No authentication method available. Please provide either:\n' +
    '  1. ZOHO_REFRESH_TOKEN + ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET (recommended)\n' +
    '  2. ZOHO_ACCESS_TOKEN\n' +
    '\nSet these in your .env file or as environment variables.')
}

/**
 * Fetch all fields for a module (up to 200 fields)
 */
async function getModuleFields(accessToken, moduleName) {
  try {
    const url = `${ZOHO_API_BASE}/settings/fields?module=${moduleName}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // If we can't get fields, return common fields
      return ['id', 'Name', 'Email', 'Created_Time', 'Modified_Time']
    }

    const data = await response.json()
    if (data.fields && Array.isArray(data.fields)) {
      // Get up to 200 field API names (Zoho limit is 200 fields per request)
      const fields = data.fields
        .filter(f => f.api_name && f.api_name !== 'id') // Exclude id, we'll add it separately
        .slice(0, 199) // Max 199 + id = 200 total
        .map(f => f.api_name)
      
      return ['id', ...fields]
    }
    
    return ['id', 'Name', 'Email', 'Created_Time', 'Modified_Time']
  } catch (error) {
    console.warn(`⚠️  Could not fetch fields for module ${moduleName}, using default fields`)
    return ['id', 'Name', 'Email', 'Created_Time', 'Modified_Time']
  }
}

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoRecords(accessToken, moduleName, limit = null) {
  // Get available fields for this module
  const fields = await getModuleFields(accessToken, moduleName)
  const fieldsString = fields.join(',')

  let allRecords = []
  let pageToken = null
  let pageCount = 0
  const maxPages = limit ? Math.ceil(limit / 200) : 1000 // Fetch all pages if no limit (cap at 1000 pages for safety)

  do {
    let url = `${ZOHO_API_BASE}/${moduleName}?fields=${fieldsString}&per_page=200&sort_order=desc&sort_by=Created_Time`
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
 * Main function
 */
async function main() {
  const moduleName = process.env.ZOHO_MODULE
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null
  
  if (!moduleName) {
    console.error('❌ Error: ZOHO_MODULE environment variable is required')
    console.error('\nUsage:')
    console.error('  ZOHO_MODULE=ModuleName node scripts/fetch-zoho-module.js')
    console.error('\nExamples:')
    console.error('  ZOHO_MODULE=Regional_Directors node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Mentors node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Sponsors node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Members node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Payments node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Referral_Partners node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Contacts node scripts/fetch-zoho-module.js')
    console.error('  ZOHO_MODULE=Leads node scripts/fetch-zoho-module.js')
    console.error('\nCommon modules:')
    console.error('  - Regional_Directors (CustomModule7)')
    console.error('  - Mentors (CustomModule11)')
    console.error('  - Sponsors (CustomModule10)')
    console.error('  - Members (CustomModule15)')
    console.error('  - Payments (CustomModule12)')
    console.error('  - Referral_Partners (CustomModule6)')
    console.error('  - Contacts')
    console.error('  - Leads')
    console.error('  - Accounts (Agents)')
    console.error('  - Deals (Transactions)')
    console.error('  - Listings (CustomModule13)')
    console.error('  - Team_Leaders (CustomModule5)')
    process.exit(1)
  }
  
  let accessToken
  try {
    accessToken = await getAccessToken()
  } catch (error) {
    console.error('❌ Error: ' + error.message)
    console.error('\nTo get credentials:')
    console.error('  1. Go to https://api-console.zoho.com/')
    console.error('  2. Create a Server-based Application or Self Client')
    console.error('  3. Save the Client ID, Client Secret, and Refresh Token')
    console.error('  4. Set in .env file:')
    console.error('     ZOHO_REFRESH_TOKEN=your_refresh_token')
    console.error('     ZOHO_CLIENT_ID=your_client_id')
    console.error('     ZOHO_CLIENT_SECRET=your_client_secret')
    process.exit(1)
  }

  try {
    console.log('🚀 Fetching records from Zoho CRM...\n')
    console.log(`Module: ${moduleName}`)
    if (limit) {
      console.log(`Limit: ${limit} records\n`)
    } else {
      console.log('Fetching all records...\n')
    }

    // Fetch records from Zoho
    const records = await fetchZohoRecords(accessToken, moduleName, limit)
    
    if (records.length === 0) {
      console.log('⚠️  No records found in Zoho CRM')
      return
    }

    console.log(`\n✅ Fetched ${records.length} records\n`)

    // Display summary
    console.log('='.repeat(80))
    console.log(`MODULE: ${moduleName.toUpperCase()}`)
    console.log('='.repeat(80))
    console.log(`Total Records: ${records.length}\n`)

    // Show first few records as examples
    const previewCount = Math.min(5, records.length)
    console.log(`Preview (first ${previewCount} records):\n`)
    
    records.slice(0, previewCount).forEach((record, index) => {
      console.log(`${index + 1}. ${record.Name || record.id || 'N/A'}`)
      if (record.id) console.log(`   ID: ${record.id}`)
      if (record.Email) console.log(`   Email: ${record.Email}`)
      if (record.Created_Time) console.log(`   Created: ${record.Created_Time}`)
      console.log('')
    })

    if (records.length > previewCount) {
      console.log(`... and ${records.length - previewCount} more records\n`)
    }

    console.log('='.repeat(80))
    console.log(`\n✅ Total: ${records.length} records`)
    
    // Also output as JSON for programmatic use
    console.log('\n📋 JSON Output:')
    console.log(JSON.stringify(records, null, 2))

  } catch (error) {
    console.error('\n❌ Fetch failed:')
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()

