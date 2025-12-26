/**
 * Exchange Zoho Authorization Code for Access Token
 * 
 * Usage:
 *   CLIENT_ID=your_client_id CLIENT_SECRET=your_client_secret CODE=your_code node scripts/exchange-zoho-code.js
 */

require('dotenv').config()

const CLIENT_ID = process.env.CLIENT_ID || process.env.ZOHO_CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET
const CODE = process.env.CODE || process.env.ZOHO_CODE

if (!CLIENT_ID || !CLIENT_SECRET || !CODE) {
  console.error('❌ Error: Missing required parameters')
  console.error('\nUsage:')
  console.error('  CLIENT_ID=your_client_id CLIENT_SECRET=your_client_secret CODE=your_code node scripts/exchange-zoho-code.js')
  console.error('\nOr set in .env file:')
  console.error('  ZOHO_CLIENT_ID=your_client_id')
  console.error('  ZOHO_CLIENT_SECRET=your_client_secret')
  console.error('  ZOHO_CODE=your_code')
  process.exit(1)
}

async function exchangeCodeForToken() {
  console.log('🔄 Exchanging Zoho code for access token...\n')

  // For Self Client, the redirect URI should be the one registered with the client
  // Usually it can be empty or the domain you registered
  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000'

  const url = 'https://accounts.zoho.com/oauth/v2/token'

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri,
    code: CODE,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error exchanging code:')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ Success! Token received:\n')
    console.log('='.repeat(60))
    console.log('ACCESS TOKEN:')
    console.log(data.access_token)
    console.log('='.repeat(60))

    if (data.refresh_token) {
      console.log('\nREFRESH TOKEN (save this for future use):')
      console.log(data.refresh_token)
      console.log('='.repeat(60))
    }

    console.log('\n📋 Token expires in:', data.expires_in, 'seconds')
    console.log('   (Approximately', Math.round(data.expires_in / 3600), 'hours)')

    console.log('\n💡 To use this token:')
    console.log('   ZOHO_ACCESS_TOKEN=' + data.access_token + ' node scripts/fetch-zoho-transactions.js')
    console.log('\n   Or add to .env file:')
    console.log('   ZOHO_ACCESS_TOKEN=' + data.access_token)

  } catch (error) {
    console.error('\n❌ Failed to exchange code:')
    console.error(error.message)
    process.exit(1)
  }
}

exchangeCodeForToken()

