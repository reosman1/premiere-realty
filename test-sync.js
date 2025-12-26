/**
 * Test script for REZEN sync endpoints
 * Run with: node test-sync.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

async function testSync(endpoint, name) {
  console.log(`\n🧪 Testing ${name}...`)
  console.log(`   Endpoint: ${endpoint}`)
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ Success!`)
      console.log(`   Results:`, JSON.stringify(data, null, 2))
      return true
    } else {
      console.log(`   ❌ Failed:`, data.error || response.statusText)
      return false
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting REZEN Sync Tests')
  console.log(`   Base URL: ${BASE_URL}`)
  console.log('\n⚠️  Make sure the dev server is running (npm run dev)')
  console.log('⚠️  Make sure REZEN_API_KEY and REZEN_PARTICIPANT_ID are set in .env\n')

  const tests = [
    {
      endpoint: '/api/cron/rezen-sync?dateFrom=2024-12-20&dateTo=2024-12-20',
      name: 'Transaction Sync (Small Date Range)'
    },
    {
      endpoint: '/api/cron/rezen-agents',
      name: 'Agent Sync'
    },
    {
      endpoint: '/api/cron/rezen-listings?group=open',
      name: 'Open Listings Sync'
    },
    {
      endpoint: '/api/cron/rezen-pending',
      name: 'Pending Transactions Sync'
    },
  ]

  const results = []
  for (const test of tests) {
    const result = await testSync(test.endpoint, test.name)
    results.push({ name: test.name, success: result })
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n📊 Test Summary:')
  console.log('='.repeat(50))
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
  })
  
  const successCount = results.filter(r => r.success).length
  console.log(`\n${successCount}/${results.length} tests passed`)
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with fetch support')
  console.error('   Or install node-fetch: npm install node-fetch')
  process.exit(1)
}

runTests().catch(console.error)


