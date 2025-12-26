/**
 * Fetch Transaction Records from Zoho CRM
 * 
 * This script fetches up to 100 transaction records from Zoho CRM
 * and stores them in the local database for testing.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-transactions.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = process.env.ZOHO_MODULE || 'Deals' // Zoho module name - use 'Deals' for transactions

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoTransactions(accessToken, limit = 100) {
  // Fetch fields from Zoho - Note: Zoho has a limit of 50 fields per request
  // We prioritize the most important fields that map to our schema
  let fields
  if (MODULE_NAME === 'Deals') {
    // Prioritized list of important fields (max 50 fields per Zoho API limit)
    // Exactly 49 fields + id = 50 total
    fields = [
      'id', 'Owner', 'Amount', 'Deal_Name', 'Listing_Name', 'Closing_Date', 'Contract_Date',
      'Estimated_Closing_Date', 'Account_Name', 'Stage', 'Type', 'Lead_Source', 'Email',
      'Office', 'Created_Time', 'Modified_Time', 'Commission', 'Commission_Percentage',
      'Commission_Flat_Fee', 'GCI', 'Gross_Commission_Income_GCI', 'Agent_Split_Percent',
      'Broker_Company_Commission', 'Transaction_Fee_to_PREMIERE', 'Admin_Fee', 'Total_Payments',
      'Street_Address', 'City', 'State', 'Zip_Code', 'County', 'Country', 'Unit_Apartment_Number',
      'Broker_Transaction_ID', 'Real_Transaction_ID', 'Transaction_Code', 'Broker_Transaction_Code',
      'Broker_Listing_Link', 'Listing_Link', 'Associated_Listing_Link', 'Broker_Transaction_Link',
      'QB_ID', 'QB_Transaction_Name', 'QB_Invoice_Link', 'Name_of_Title_Entity_Used',
      'Title_and_Escrow_Provider', 'Invoice_Status', 'Error_Message', 'Disable_Split_Automation',
      'Override_Automations'
    ].join(',') // Exactly 49 fields (not counting id) = 50 total including id
  } else {
    // Legacy module fields (not used - Deals module is used instead)
    fields = [
      'id',
      'Name',
      'Email',
      'Amount',
      'Type',
      'Stage',
      'Status',
      'Status_Details',
      'Commission',
      'Commission_Flat_Fee',
      'Gross_Commission_Income_GCI',
      'Broker_Company_Commission',
      'Firm_Admin_Fee',
      'Total_Payments',
      'Contract_Acceptance_Date',
      'Estimated_Closing_Date',
      'Actual_Closing_Date',
      'Broker_Transaction_ID',
      'Broker_Transaction_Code',
      'Broker_Listing_Link',
      'Broker_Transaction_Link',
      'Broker_Deal_Type',
      'Firm_Deal',
      'Lead_Source',
      'Transaction_Support_Rep',
      'Office',
      'Payer_Name',
      'Payer_Email',
      'Payer_Phone',
      'Payer_Company',
      'Payer_Role',
      'Personal_Deal',
      'Firm_Owned_Lead',
      'Halt_Sync_with_Broker',
      'Halt_Sync_with_Firm_Automations',
      'Override_all_Automations',
      'Owner',
      'Created_Time',
      'Modified_Time',
    ].join(',')
  }

  let allRecords = []
  let pageToken = null
  let pageCount = 0
  const maxPages = Math.ceil(limit / 100) // Each page can have up to 100 records

  do {
    let url = `${ZOHO_API_BASE}/${MODULE_NAME}?fields=${fields}&per_page=100&sort_order=desc&sort_by=Created_Time`
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
    const records = data.data || []
    allRecords = allRecords.concat(records)
    
    pageCount++
    pageToken = data.info?.next_page_token || null
    
    console.log(`  Fetched page ${pageCount}: ${records.length} records (total: ${allRecords.length})`)
    
    // Stop if we've reached the limit or there are no more pages
    if (allRecords.length >= limit || !pageToken || !data.info?.more_records) {
      break
    }
  } while (pageCount < maxPages && allRecords.length < limit)

  // Limit to requested amount
  return allRecords.slice(0, limit)
}

/**
 * Map Zoho transaction/deal to our Transaction model
 */
function mapZohoToTransaction(zohoRecord) {
  const record = zohoRecord
  const isDealsModule = MODULE_NAME === 'Deals'

  // Helper to get field value
  const getField = (apiName) => {
    const field = record[apiName]
    return field !== undefined ? field : null
  }

  // Helper to parse decimal
  const parseDecimal = (value) => {
    if (value === null || value === undefined) return null
    const num = parseFloat(value)
    return isNaN(num) ? null : num
  }

  // Helper to parse date
  const parseDate = (value) => {
    if (!value) return null
    try {
      return new Date(value)
    } catch {
      return null
    }
  }

  // Extract owner name if it's an object
  const owner = getField('Owner')
  const ownerName = owner && typeof owner === 'object' ? owner.name : null

  return {
    zohoId: getField('id'),
    name: getField(isDealsModule ? 'Deal_Name' : 'Name') || getField('Listing_Name') || 'Unnamed Transaction',
    email: getField('Email') || getField('SS_Email') || null,
    amount: parseDecimal(getField('Amount') || getField('Listing_Price')),
    
    // Type & Stage
    type: mapTransactionType(getField('Type')),
    stage: mapTransactionStage(getField('Stage')),
    status: getField('Invoice_Status') || getField('Status') || null,
    statusDetails: getField('Error_Message') || getField('Status_Details') || null,
    brokerDealType: mapBrokerDealType(getField('Broker_Deal_Type') || getField('Deal_Type')),
    firmDeal: getField('Firm_Deal') || getField('PREMIERE_Deal') || null,
    lifecycleState: getField('SkySlope_Status') || getField('Stage') || null,
    
    // Commission - note: Commission field might be a percentage string like "3%"
    commissionPct: parseCommissionPercent(getField('Commission') || getField('Commission_Percentage')),
    commissionFlatFee: parseDecimal(getField('Commission_Flat_Fee')),
    grossCommissionGCI: parseDecimal(getField('Gross_Commission_Income_GCI') || getField('GCI')),
    grossCommissionAmount: parseDecimal(getField('Gross_Commission_Amount')),
    grossCommissionPercentage: parseDecimal(getField('Gross_Commission_Percentage')),
    agentSplitPercent: parseDecimal(getField('Agent_Split_Percent')),
    brokerCompanyCommission: parseDecimal(getField('Broker_Company_Commission')),
    firmAdminFee: parseDecimal(getField('Firm_Admin_Fee') || getField('Admin_Fee') || getField('Transaction_Fee_to_PREMIERE')),
    totalPayments: parseDecimal(getField('Total_Payments')),
    
    // Dates
    contractAcceptanceDate: parseDate(getField('Contract_Date') || getField('Contract_Acceptance_Date')),
    estimatedClosingDate: parseDate(getField('Estimated_Closing_Date')),
    actualClosingDate: parseDate(getField('Closing_Date') || getField('Actual_Closing_Date')),
    
    // QuickBooks Integration
    quickbooksId: getField('QB_ID') || getField('Quickbooks_ID') || null,
    quickbooksTransactionName: getField('QB_Transaction_Name') || getField('Quickbooks_Transaction_Name') || null,
    quickbooksInvoiceLink: getField('QB_Invoice_Link') || getField('Quickbooks_Invoice_Link') || null,
    
    // CD Payer Info (Title/Escrow)
    cdPayerName: getField('Name_of_Title_Entity_Used') || null,
    cdPayerBusinessEntity: getField('Title_and_Escrow_Provider') || null,
    
    // Address
    addressOneLine: getField('Address_One_Line') || null,
    streetAddress: getField('Street_Address') || null,
    city: getField('City') || null,
    state: getField('State') || null,
    zipCode: getField('Zip_Code') || getField('ZipCode') || null,
    county: getField('County') || null,
    country: getField('Country') || null,
    unitApartmentNumber: getField('Unit_Apartment_Number') || null,
    
    // Additional info
    leadSource: getField('Lead_Source') || null,
    transactionSupportRep: getField('Transaction_Support_Rep') || getField('Transaction_Coordinator') || null,
    office: getField('Office') || null,
    
    // Broker info
    brokerTransactionId: getField('Broker_Transaction_ID') || getField('Real_Transaction_ID') || null,
    brokerTransactionCode: getField('Broker_Transaction_Code') || getField('Transaction_Code') || null,
    brokerListingLink: getField('Broker_Listing_Link') || getField('Listing_Link') || getField('Associated_Listing_Link') || null,
    brokerTransactionLink: getField('Broker_Transaction_Link') || getField('SkySlope_Deal_Link') || null,
    
    // REZEN fields
    rezenId: getField('Real_Transaction_ID') || getField('reZEN_Transaction_ID') || null,
    transactionCode: getField('Transaction_Code') || null,
    
    // Payer info
    payerName: getField('Payer_Name') || null,
    payerEmail: getField('Payer_Email') || null,
    payerPhone: getField('Payer_Phone') || null,
    payerCompany: getField('Payer_Company') || null,
    payerRole: getField('Payer_Role') || getField('Role') || null,
    
    // Flags
    personalDeal: getField('Personal_Deal') === true || getField('PREMIERE_Deal') === false,
    firmOwnedLead: getField('Firm_Owned_Lead') === true,
    haltSyncWithBroker: getField('Halt_Sync_with_Broker') === true || getField('Halt_SS_Sync') === true,
    haltSyncWithFirmAuto: getField('Halt_Sync_with_Firm_Automations') === true || getField('Halt_NLB_Sync') === true,
    overrideAllAutomations: getField('Override_all_Automations') === true || getField('Override_Automations') === true,
    disableSplitAutomation: getField('Disable_Split_Automation') === true,
    
    // Note: Many formula fields and other fields are available but not mapped here.
    // They can be accessed via formulas or would require schema expansion.
    // Key unmapped fields: Units, Other_Gross_Income, Referral_Fee, Mentoring_Fee_Percent, etc.
  }
}

/**
 * Map Zoho transaction type to our enum
 */
function mapTransactionType(zohoType) {
  if (!zohoType) return null
  
  const typeMap = {
    'Sale': 'SALE',
    'Purchase': 'PURCHASE',
    'Lease': 'LEASE',
    'Referral': 'REFERRAL',
    'LISTING': 'LISTING',
    'PURCHASE': 'PURCHASE',
  }
  
  const normalized = zohoType.toString().toUpperCase().replace(/\s+/g, '_')
  return typeMap[zohoType] || (['SALE', 'PURCHASE', 'LEASE', 'REFERRAL', 'LISTING'].includes(normalized) ? normalized : null)
}

/**
 * Map Zoho broker deal type to our enum
 */
function mapBrokerDealType(zohoType) {
  if (!zohoType) return null
  const normalized = zohoType.toString().toUpperCase()
  if (normalized.includes('LEASE')) return 'LEASE'
  if (normalized.includes('SALE')) return 'SALE'
  return null
}

/**
 * Map Zoho transaction stage to our enum
 */
function mapTransactionStage(zohoStage) {
  if (!zohoStage) return 'NEW_ENTRY'
  
  const stageMap = {
    'New Entry': 'NEW_ENTRY',
    'Active': 'ACTIVE',
    'Pending': 'PENDING',
    'Closed': 'CLOSED',
    'Canceled': 'CANCELED',
    'Expired': 'EXPIRED',
  }
  
  return stageMap[zohoStage] || 'NEW_ENTRY'
}

/**
 * Parse commission percentage (might be "3%" or "3" or 3)
 * Note: Schema has Decimal(5,3) which means max 99.999
 * If value > 100, it might be stored as a decimal (e.g., 0.03 for 3%) or needs to be divided by 100
 */
function parseCommissionPercent(value) {
  if (value === null || value === undefined) return null
  
  let num
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    // Remove % sign and parse
    const cleaned = value.replace('%', '').trim()
    num = parseFloat(cleaned)
    if (isNaN(num)) return null
  } else {
    return null
  }
  
  // If the number is > 100, it's likely a percentage that needs to be converted
  // Or if it's > 10, it might be stored incorrectly (e.g., 300 for 3%)
  // For safety, cap at 99.999 (schema limit: Decimal(5,3))
  if (num > 100) {
    // Likely a percentage like 300 for 3%, or a decimal like 0.03
    // Try dividing by 100 first
    num = num / 100
  }
  
  // Cap at schema limit (Decimal(5,3) = max 99.999)
  if (num > 99.999) {
    console.warn(`  Warning: Commission percentage ${num} exceeds schema limit, capping at 99.999`)
    num = 99.999
  }
  
  // Round to 3 decimal places to match schema
  return Math.round(num * 1000) / 1000
}

/**
 * Main function
 */
async function main() {
  const accessToken = process.env.ZOHO_ACCESS_TOKEN
  const limit = parseInt(process.env.LIMIT || '100', 10)

  if (!accessToken) {
    console.error('❌ Error: ZOHO_ACCESS_TOKEN environment variable is required')
    console.error('\nTo get an access token:')
    console.error('  1. Go to https://api-console.zoho.com/')
    console.error('  2. Create a Self Client or use existing OAuth credentials')
    console.error('  3. Generate an access token with scope: ZohoCRM.modules.READ')
    console.error('  4. Run: ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-transactions.js')
    process.exit(1)
  }

  try {
    console.log('🚀 Starting Zoho Transaction Import...\n')

    // Fetch records from Zoho
    const zohoRecords = await fetchZohoTransactions(accessToken, limit)
    
    if (zohoRecords.length === 0) {
      console.log('⚠️  No records found in Zoho CRM')
      return
    }

    console.log(`✅ Fetched ${zohoRecords.length} records from Zoho\n`)

    // Map and upsert records
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    for (const zohoRecord of zohoRecords) {
      try {
        const transactionData = mapZohoToTransaction(zohoRecord)
        
        if (!transactionData.zohoId) {
          console.log(`⚠️  Skipping record without ID`)
          skipped++
          continue
        }

        // Link agent if Account_Name is provided
        let agentId = null
        const accountName = zohoRecord.Account_Name
        if (accountName) {
          // Account_Name is a lookup field, it might be an object with id/name or just a string
          const agentName = typeof accountName === 'object' ? (accountName.name || accountName.Name) : accountName
          const accountZohoId = typeof accountName === 'object' ? (accountName.id || accountName.Id) : null
          
          if (agentName || accountZohoId) {
            // Try to find agent by zohoId first, then by name
            const agent = await prisma.agent.findFirst({
              where: {
                OR: [
                  accountZohoId ? { zohoId: accountZohoId } : {},
                  agentName ? { name: { contains: agentName, mode: 'insensitive' } } : {},
                ].filter(condition => Object.keys(condition).length > 0),
              },
            })
            
            if (agent) {
              agentId = agent.id
            } else if (agentName) {
              console.log(`  ⚠️  Agent not found: ${agentName} (for transaction ${transactionData.name})`)
            }
          }
        }
        
        // Add agentId to transaction data
        if (agentId) {
          transactionData.agentId = agentId
        }

        // Check if transaction already exists
        const existing = await prisma.transaction.findUnique({
          where: { zohoId: transactionData.zohoId },
        })

        if (existing) {
          await prisma.transaction.update({
            where: { zohoId: transactionData.zohoId },
            data: transactionData,
          })
          updated++
        } else {
          await prisma.transaction.create({
            data: transactionData,
          })
          created++
        }

        if ((created + updated) % 10 === 0) {
          console.log(`  Processed ${created + updated}/${zohoRecords.length}...`)
        }
      } catch (error) {
        errors.push({
          zohoId: zohoRecord.id,
          error: error.message,
        })
        console.error(`  ❌ Error processing record ${zohoRecord.id}: ${error.message}`)
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
      errors.slice(0, 10).forEach(({ zohoId, error }) => {
        console.log(`  - ${zohoId}: ${error}`)
      })
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more`)
      }
    }

    console.log('\n✅ Import complete!')
    console.log(`\n💡 You can now test formulas with real data:`)
    console.log(`   node scripts/test-formulas.js`)
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

