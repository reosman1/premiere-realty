/**
 * Test REZEN Sync Operations
 * 
 * This script validates REZEN sync endpoints are working correctly
 */

const http = require('http')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data) {
      const postData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {}
          resolve({ status: res.statusCode, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

async function testTransactionSync() {
  console.log('\n📊 Testing Transaction Sync')
  console.log('-'.repeat(50))
  
  try {
    // Test with a small date range (today)
    const today = new Date().toISOString().split('T')[0]
    const response = await makeRequest(
      `/api/cron/rezen-sync?dateFrom=${today}&dateTo=${today}`,
      'GET'
    )
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200 || response.status === 401) {
      if (response.data.success) {
        console.log('✅ Transaction sync endpoint is working')
        console.log(`   Total: ${response.data.total || 0}`)
        console.log(`   Created: ${response.data.created || 0}`)
        console.log(`   Updated: ${response.data.updated || 0}`)
      } else {
        console.log('⚠️  Transaction sync endpoint responded but returned error:')
        console.log(`   Error: ${response.data.error || 'Unknown error'}`)
      }
    } else if (response.status === 401) {
      console.log('⚠️  Requires authentication (cron secret) - this is expected for cron endpoints')
    } else {
      console.log('❌ Transaction sync endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ Transaction sync test failed:')
    console.log(`   Error: ${error.message}`)
  }
}

async function testAgentSync() {
  console.log('\n👥 Testing Agent Sync')
  console.log('-'.repeat(50))
  
  try {
    const response = await makeRequest('/api/cron/rezen-agents', 'GET')
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200 || response.status === 401) {
      if (response.data.success) {
        console.log('✅ Agent sync endpoint is working')
        console.log(`   Total: ${response.data.total || 0}`)
        console.log(`   Created: ${response.data.created || 0}`)
        console.log(`   Updated: ${response.data.updated || 0}`)
      } else {
        console.log('⚠️  Agent sync endpoint responded but returned error:')
        console.log(`   Error: ${response.data.error || 'Unknown error'}`)
      }
    } else if (response.status === 401) {
      console.log('⚠️  Requires authentication (cron secret) - this is expected for cron endpoints')
    } else {
      console.log('❌ Agent sync endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ Agent sync test failed:')
    console.log(`   Error: ${error.message}`)
  }
}

async function testListingSync() {
  console.log('\n🏠 Testing Listing Sync')
  console.log('-'.repeat(50))
  
  try {
    const response = await makeRequest('/api/cron/rezen-listings?group=open', 'GET')
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200 || response.status === 401) {
      if (response.data.success) {
        console.log('✅ Listing sync endpoint is working')
        console.log(`   Total: ${response.data.total || 0}`)
        console.log(`   Created: ${response.data.created || 0}`)
        console.log(`   Updated: ${response.data.updated || 0}`)
      } else {
        console.log('⚠️  Listing sync endpoint responded but returned error:')
        console.log(`   Error: ${response.data.error || 'Unknown error'}`)
      }
    } else if (response.status === 401) {
      console.log('⚠️  Requires authentication (cron secret) - this is expected for cron endpoints')
    } else {
      console.log('❌ Listing sync endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ Listing sync test failed:')
    console.log(`   Error: ${error.message}`)
  }
}

async function testPendingSync() {
  console.log('\n⏳ Testing Pending Transaction Sync')
  console.log('-'.repeat(50))
  
  try {
    const response = await makeRequest('/api/cron/rezen-pending', 'GET')
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200 || response.status === 401) {
      if (response.data.success) {
        console.log('✅ Pending sync endpoint is working')
        console.log(`   Total: ${response.data.total || 0}`)
        console.log(`   Created: ${response.data.created || 0}`)
        console.log(`   Updated: ${response.data.updated || 0}`)
      } else {
        console.log('⚠️  Pending sync endpoint responded but returned error:')
        console.log(`   Error: ${response.data.error || 'Unknown error'}`)
      }
    } else if (response.status === 401) {
      console.log('⚠️  Requires authentication (cron secret) - this is expected for cron endpoints')
    } else {
      console.log('❌ Pending sync endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ Pending sync test failed:')
    console.log(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🧪 REZEN Sync Testing Script')
  console.log('='.repeat(50))
  console.log(`Base URL: ${BASE_URL}`)
  console.log('\n⚠️  Note: Cron endpoints require authentication.')
  console.log('   To test with actual sync, use the admin UI at /admin/rezen-sync')
  console.log('   or provide CRON_SECRET in environment variables.\n')

  await testTransactionSync()
  await testAgentSync()
  await testListingSync()
  await testPendingSync()

  console.log('\n' + '='.repeat(50))
  console.log('✅ REZEN Sync Endpoint Tests Complete')
  console.log('\n💡 Tip: To perform actual syncs, use:')
  console.log('   - Admin UI: http://localhost:3000/admin/rezen-sync')
  console.log('   - Or set CRON_SECRET and use POST requests with Bearer token')
}

main().catch(console.error)

