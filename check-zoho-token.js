/**
 * Check if Zoho token is still active
 * Tests the token by making a simple API call
 */

require('dotenv').config()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token'

/**
 * Get access token using refresh token
 */
async function getAccessTokenFromRefresh(refreshToken, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

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

  if (!data.access_token) {
    throw new Error('No access token in response')
  }

  return data.access_token
}

async function checkZohoToken() {
  console.log("🔍 Checking Zoho token status...\n")

  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  const accessToken = process.env.ZOHO_ACCESS_TOKEN

  let token = accessToken

  // If we have refresh token credentials, use them to get a fresh token
  if (refreshToken && clientId && clientSecret) {
    try {
      console.log("🔄 Getting access token using refresh token...")
      token = await getAccessTokenFromRefresh(refreshToken, clientId, clientSecret)
      console.log(`✅ Token retrieved: ${token.substring(0, 20)}...\n`)
    } catch (error) {
      console.error("❌ Failed to refresh token:", error.message)
      console.error("\n💡 The refresh token may be invalid or expired")
      console.error("You may need to regenerate your refresh token")
      console.error("See docs/ZOHO_REFRESH_TOKEN_GUIDE.md for instructions")
      
      // Fall back to static access token if available
      if (accessToken) {
        console.log("\n⚠️  Falling back to static access token...")
        token = accessToken
      } else {
        process.exit(1)
      }
    }
  } else if (!accessToken) {
    console.error("❌ Error: No Zoho credentials found")
    console.error("Please set either:")
    console.error("  - ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, and ZOHO_CLIENT_SECRET, OR")
    console.error("  - ZOHO_ACCESS_TOKEN")
    console.error("\nin your .env file")
    process.exit(1)
  }

  // Test the token by making a simple API call
  try {
    console.log("🧪 Testing token with Zoho API...")
    // Use a simple module endpoint (Members is commonly available)
    // Limit to 1 record to minimize API usage
    const testUrl = `${ZOHO_API_BASE}/Members?fields=id,Name&per_page=1`
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error(`❌ Token test failed!`)
      console.error(`Status: ${response.status} ${response.statusText}\n`)

      try {
        const error = JSON.parse(responseText)
        console.error("Error details:")
        console.error(JSON.stringify(error, null, 2))
      } catch {
        console.error("Response:", responseText)
      }

      if (response.status === 401) {
        console.error("\n💡 The token is invalid or expired")
        if (refreshToken) {
          console.error("The refresh token may need to be regenerated")
        } else {
          console.error("Please get a new access token or set up refresh token authentication")
        }
        console.error("See docs/ZOHO_REFRESH_TOKEN_GUIDE.md for instructions")
      }

      process.exit(1)
    }

    const data = JSON.parse(responseText)
    
    console.log("✅ Token is active and working!")
    
    // Show results as proof it works
    if (data.data && data.data.length > 0) {
      const record = data.data[0]
      console.log(`\nSuccessfully fetched record: ${record.Name || record.id || 'Record ID: ' + record.id}`)
    } else {
      console.log(`\n✅ API call successful (no records returned, but token is valid)`)
    }
    
    if (data.info) {
      console.log(`Total records available: ${data.info.count || 'Unknown'}`)
    }

    console.log("\n✅ All checks passed! Token is active.\n")
    
  } catch (error) {
    console.error("❌ Error testing token:", error.message)
    process.exit(1)
  }
}

checkZohoToken()

