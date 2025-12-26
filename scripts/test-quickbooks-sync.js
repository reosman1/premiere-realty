/**
 * Test QuickBooks Sync Operations
 * 
 * This script validates QuickBooks sync endpoints are working correctly
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

async function testInvoiceSync() {
  console.log('\n📄 Testing QuickBooks Invoice Sync')
  console.log('-'.repeat(50))
  
  try {
    const response = await makeRequest('/api/cron/quickbooks-sync-invoices', 'GET')
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200 || response.status === 401) {
      if (response.data.success !== false) {
        console.log('✅ Invoice sync endpoint is accessible')
        if (response.data.total !== undefined) {
          console.log(`   Total: ${response.data.total || 0}`)
          console.log(`   Created: ${response.data.created || 0}`)
          console.log(`   Updated: ${response.data.updated || 0}`)
        }
      } else {
        console.log('⚠️  Invoice sync endpoint responded but returned error:')
        console.log(`   Error: ${response.data.error || 'Unknown error'}`)
      }
    } else if (response.status === 401) {
      console.log('⚠️  Requires authentication (cron secret) - this is expected for cron endpoints')
    } else {
      console.log('❌ Invoice sync endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ Invoice sync test failed:')
    console.log(`   Error: ${error.message}`)
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Make sure the dev server is running: npm run dev')
    }
  }
}

async function testBillSync() {
  console.log('\n💰 Testing QuickBooks Bill Sync')
  console.log('-'.repeat(50))
  
  try {
    const response = await makeRequest('/api/cron/quickbooks-sync-bills', 'GET')
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200 || response.status === 401) {
      if (response.data.success !== false) {
        console.log('✅ Bill sync endpoint is accessible')
        if (response.data.total !== undefined) {
          console.log(`   Total: ${response.data.total || 0}`)
          console.log(`   Created: ${response.data.created || 0}`)
          console.log(`   Updated: ${response.data.updated || 0}`)
        }
      } else {
        console.log('⚠️  Bill sync endpoint responded but returned error:')
        console.log(`   Error: ${response.data.error || 'Unknown error'}`)
      }
    } else if (response.status === 401) {
      console.log('⚠️  Requires authentication (cron secret) - this is expected for cron endpoints')
    } else {
      console.log('❌ Bill sync endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ Bill sync test failed:')
    console.log(`   Error: ${error.message}`)
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Make sure the dev server is running: npm run dev')
    }
  }
}

async function testQuickBooksWebhook() {
  console.log('\n🔔 Testing QuickBooks Webhook Endpoint')
  console.log('-'.repeat(50))
  
  try {
    // Test with a sample webhook payload
    const samplePayload = {
      eventNotifications: [{
        realmId: 'test-realm',
        dataChangeEvent: {
          entities: [{
            name: 'Bill',
            id: 'test-bill-id',
            operation: 'Update'
          }]
        }
      }]
    }
    
    const response = await makeRequest('/api/webhooks/quickbooks', 'POST', samplePayload)
    
    console.log(`Status: ${response.status}`)
    if (response.status === 200) {
      console.log('✅ QuickBooks webhook endpoint is accessible')
    } else if (response.status === 400 || response.status === 422) {
      console.log('⚠️  QuickBooks webhook endpoint responded with validation error (expected for test data)')
      console.log(`   This indicates the endpoint is working but needs valid QuickBooks webhook data`)
    } else {
      console.log('❌ QuickBooks webhook endpoint returned unexpected status')
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ QuickBooks webhook test failed:')
    console.log(`   Error: ${error.message}`)
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Make sure the dev server is running: npm run dev')
    }
  }
}

async function main() {
  console.log('🧪 QuickBooks Sync Testing Script')
  console.log('='.repeat(50))
  console.log(`Base URL: ${BASE_URL}`)
  console.log('\n⚠️  Note: These tests check endpoint accessibility.')
  console.log('   Full sync functionality requires QuickBooks OAuth setup.')
  console.log('   Cron endpoints require CRON_SECRET authentication.\n')

  await testInvoiceSync()
  await testBillSync()
  await testQuickBooksWebhook()

  console.log('\n' + '='.repeat(50))
  console.log('✅ QuickBooks Sync Endpoint Tests Complete')
  console.log('\n💡 Tip: Full QuickBooks sync requires:')
  console.log('   1. QuickBooks OAuth credentials configured')
  console.log('   2. Valid access/refresh tokens')
  console.log('   3. CRON_SECRET for cron endpoints')
}

main().catch(console.error)

