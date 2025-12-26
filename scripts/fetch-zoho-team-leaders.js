/**
 * Fetch Team Leader Records from Zoho CRM
 * 
 * This script fetches all Team Leader records from Zoho CRM CustomModule5 (Team_Leaders)
 * and outputs them to the console.
 * 
 * Usage:
 *   # Using refresh token (recommended - automatically refreshes):
 *   ZOHO_REFRESH_TOKEN=your_refresh_token ZOHO_CLIENT_ID=your_client_id ZOHO_CLIENT_SECRET=your_client_secret node scripts/fetch-zoho-team-leaders.js
 * 
 *   # Using direct access token:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-team-leaders.js
 */

require('dotenv').config()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token'
const MODULE_NAME = 'Team_Leaders' // API name for CustomModule5

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
 * Fetch records from Zoho CRM API
 */
async function fetchZohoTeamLeaders(accessToken, limit = null) {
  // Fetch all available fields (up to 50 fields per request limit)
  // Based on fields_Team_Leaders.json export
  const fields = [
    'id', 'Name', 'Email', 'Firm_Status', 'Team_Leader_Percent',
    'Regional_Director_Name', 'QB_Vendor_Number', 
    'Effective_Start_Date_as_TL', 'Effective_End_Date',
    'Owner', 'Created_Time', 'Modified_Time', 'Created_By', 'Modified_By',
    'Last_Activity_Time', 'Email_Opt_Out', 'Record_Image'
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
 * Main function
 */
async function main() {
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null
  
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
    console.log('🚀 Fetching Team Leaders from Zoho CRM...\n')
    console.log(`Module: ${MODULE_NAME} (CustomModule5)`)
    if (limit) {
      console.log(`Limit: ${limit} records\n`)
    } else {
      console.log('Fetching all Team Leaders...\n')
    }

    // Fetch records from Zoho
    const teamLeaders = await fetchZohoTeamLeaders(accessToken, limit)
    
    if (teamLeaders.length === 0) {
      console.log('⚠️  No Team Leader records found in Zoho CRM')
      return
    }

    console.log(`\n✅ Fetched ${teamLeaders.length} Team Leader records\n`)

    // Display the records
    console.log('='.repeat(80))
    console.log('TEAM LEADERS')
    console.log('='.repeat(80))
    
    teamLeaders.forEach((tl, index) => {
      console.log(`\n${index + 1}. ${tl.Name || 'N/A'}`)
      console.log(`   ID: ${tl.id}`)
      console.log(`   Email: ${tl.Email || 'N/A'}`)
      console.log(`   Firm Status: ${tl.Firm_Status || 'N/A'}`)
      console.log(`   Team Leader %: ${tl.Team_Leader_Percent || 'N/A'}%`)
      console.log(`   QB Vendor Number: ${tl.QB_Vendor_Number || 'N/A'}`)
      console.log(`   Effective Start Date: ${tl.Effective_Start_Date_as_TL || 'N/A'}`)
      console.log(`   Effective End Date: ${tl.Effective_End_Date || 'N/A'}`)
      
      // Handle Regional Director lookup field
      const regionalDirector = tl.Regional_Director_Name
      if (regionalDirector) {
        const rdName = typeof regionalDirector === 'object' ? (regionalDirector.name || regionalDirector.Name) : regionalDirector
        const rdId = typeof regionalDirector === 'object' ? (regionalDirector.id || regionalDirector.Id) : null
        console.log(`   Regional Director: ${rdName || 'N/A'} ${rdId ? `(${rdId})` : ''}`)
      } else {
        console.log(`   Regional Director: N/A`)
      }
      
      console.log(`   Created: ${tl.Created_Time || 'N/A'}`)
      console.log(`   Modified: ${tl.Modified_Time || 'N/A'}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log(`\n✅ Total: ${teamLeaders.length} Team Leader records`)
    
    // Also output as JSON for programmatic use
    console.log('\n📋 JSON Output:')
    console.log(JSON.stringify(teamLeaders, null, 2))

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

