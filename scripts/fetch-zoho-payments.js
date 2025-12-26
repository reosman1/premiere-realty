/**
 * Fetch Payment Records from Zoho CRM
 * 
 * This script fetches all payment records from Zoho CRM CustomModule12 (Payments)
 * and stores them in the local database as CommissionPayments.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-payments.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = 'Payments' // API name for CustomModule12

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoPayments(accessToken, limit = null) {
  // Fetch key fields from Zoho Payments module (CustomModule12)
  const fields = [
    'id', 'Name', 'Payment_Amount', 'Payment_Date', 'Payment_Status',
    'Transaction', 'Agent', 'Member',
    'NLB_Payment_Type', 'Description',
    'QB_Vendor_ID', 'QB_BillPay_ID', 
    'QB_Payment_Link', 'QB_Invoice_Link', 'QB_BillPayment_Link',
    'Invoice_Status', 'RD_Payment_Balance',
    'Created_Time', 'Modified_Time', 'Last_Updated'
  ].join(',')

  let allRecords = []
  let pageToken = null
  let pageCount = 0
  const maxPages = limit ? Math.ceil(limit / 200) : 1000

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
      
      if (limit && allRecords.length >= limit) {
        break
      }
      
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
 * Map Zoho payment status to PaymentStatus enum
 */
function mapPaymentStatus(zohoStatus) {
  if (!zohoStatus || zohoStatus === '-None-') return 'PENDING'
  
  const statusMap = {
    'Paid': 'PAID',
    'Unpaid': 'PENDING',
    'Void': 'CANCELLED',
  }
  
  return statusMap[zohoStatus] || 'PENDING'
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
 * Extract lookup field value (id or name)
 */
function extractLookup(field) {
  if (!field) return null
  if (typeof field === 'object') {
    return field.id || field.Id || field.name || field.Name || null
  }
  return field
}

/**
 * Map Zoho payment record to CommissionPayment schema
 */
function mapZohoPaymentToSchema(zohoRecord) {
  // Helper to get field value
  const getField = (apiName) => {
    const field = zohoRecord[apiName]
    return field !== undefined ? field : null
  }

  const agent = getField('Agent')
  const agentId = agent && typeof agent === 'object' ? (agent.id || agent.Id) : null
  const agentName = agent && typeof agent === 'object' ? (agent.name || agent.Name) : agent

  const transaction = getField('Transaction')
  const transactionId = transaction && typeof transaction === 'object' ? (transaction.id || transaction.Id) : null
  const transactionName = transaction && typeof transaction === 'object' ? (transaction.name || transaction.Name) : transaction

  // Build notes with payment metadata
  const notesParts = []
  if (getField('NLB_Payment_Type') && getField('NLB_Payment_Type') !== '-None-') {
    notesParts.push(`Payment Type: ${getField('NLB_Payment_Type')}`)
  }
  if (getField('Description')) {
    notesParts.push(`Description: ${getField('Description')}`)
  }
  if (getField('QB_BillPay_ID')) {
    notesParts.push(`QB BillPay ID: ${getField('QB_BillPay_ID')}`)
  }
  if (getField('QB_Vendor_ID')) {
    notesParts.push(`QB Vendor ID: ${getField('QB_Vendor_ID')}`)
  }
  if (getField('RD_Payment_Balance') !== null && getField('RD_Payment_Balance') !== undefined) {
    notesParts.push(`RD Payment Balance: $${getField('RD_Payment_Balance')}`)
  }

  return {
    zohoId: zohoRecord.id,
    amount: parseDecimal(getField('Payment_Amount')),
    status: mapPaymentStatus(getField('Payment_Status')),
    paymentType: getField('NLB_Payment_Type') || null,
    datePaid: parseDate(getField('Payment_Date')),
    notes: notesParts.length > 0 ? notesParts.join(' | ') : null,
    // Store lookup IDs for later resolution
    _agentZohoId: agentId,
    _agentName: agentName,
    _transactionZohoId: transactionId,
    _transactionName: transactionName,
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
    console.error('  4. Run: ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-payments.js')
    process.exit(1)
  }

  try {
    console.log('🚀 Starting Zoho Payments Import...\n')
    console.log(`Module: ${MODULE_NAME} (CustomModule12)`)
    if (limit) {
      console.log(`Limit: ${limit} records\n`)
    } else {
      console.log('Fetching all payments...\n')
    }

    // Fetch records from Zoho
    const zohoPayments = await fetchZohoPayments(accessToken, limit)
    
    if (zohoPayments.length === 0) {
      console.log('⚠️  No records found in Zoho CRM')
      return
    }

    console.log(`✅ Fetched ${zohoPayments.length} payments from Zoho\n`)

    // Map and upsert records
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    for (const zohoPayment of zohoPayments) {
      try {
        const zohoPaymentId = zohoPayment.id
        
        if (!zohoPaymentId) {
          console.log(`⚠️  Skipping record without ID`)
          skipped++
          continue
        }

        const paymentData = mapZohoPaymentToSchema(zohoPayment)

        // Find agent by Zoho ID or name
        let agentId = null
        if (paymentData._agentZohoId || paymentData._agentName) {
          const agent = await prisma.agent.findFirst({
            where: {
              OR: [
                paymentData._agentZohoId ? { zohoId: paymentData._agentZohoId } : {},
                paymentData._agentName ? { name: { contains: paymentData._agentName, mode: 'insensitive' } } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          })
          
          if (agent) {
            agentId = agent.id
          }
        }

        // Find transaction by Zoho ID
        let transactionId = null
        if (paymentData._transactionZohoId) {
          const transaction = await prisma.transaction.findFirst({
            where: { zohoId: paymentData._transactionZohoId },
          })
          
          if (transaction) {
            transactionId = transaction.id
          }
        }

        // Remove temporary fields
        const { _agentZohoId, _agentName, _transactionZohoId, _transactionName, ...cleanPaymentData } = paymentData
        
        // Add agentId and transactionId
        if (agentId) {
          cleanPaymentData.agentId = agentId
        }
        if (transactionId) {
          cleanPaymentData.transactionId = transactionId
        }

        // Check if payment already exists
        const existingPayment = await prisma.commissionPayment.findUnique({
          where: { zohoId: cleanPaymentData.zohoId },
        })

        if (existingPayment) {
          // Update existing payment
          await prisma.commissionPayment.update({
            where: { zohoId: cleanPaymentData.zohoId },
            data: cleanPaymentData,
          })
          updated++
        } else {
          // Create new payment
          await prisma.commissionPayment.create({
            data: cleanPaymentData,
          })
          created++
        }

        if ((created + updated) % 100 === 0) {
          console.log(`  Processed ${created + updated}/${zohoPayments.length}...`)
        }
      } catch (error) {
        errors.push({
          zohoId: zohoPayment.id,
          name: zohoPayment.Name,
          error: error.message,
        })
        console.error(`  ❌ Error processing payment ${zohoPayment.id || zohoPayment.Name}: ${error.message}`)
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
