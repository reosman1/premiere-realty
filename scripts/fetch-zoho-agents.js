/**
 * Fetch Agent Records from Zoho CRM
 * 
 * This script fetches agent records from Zoho CRM Accounts module
 * and stores them in the local database.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-agents.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = process.env.ZOHO_MODULE || 'Accounts' // Zoho module name for agents

/**
 * Fetch records from Zoho CRM API
 */
async function fetchZohoAgents(accessToken, limit = null) {
  // Fetch fields from Zoho - Note: Zoho has a limit of 50 fields per request
  // We prioritize the most important fields that map to our schema
  // Using actual field names from the Accounts module export
  // Exactly 49 fields + id = 50 total
  const fields = [
    'id', 'Account_Name', 'Personal_Email', 'Work_Email', 'Cell_Phone',
    'Street', 'City', 'State', 'Zipcode',
    'Hire_Date', 'Departure_Date',
    'Firm_Status', 'Member_Level',
    'Split_to_Agent', 'Post_Cap_Split_to_Agent', 'Pre_Cap_Split_to_Agent', 'Pre_Transaction_Fee',
    'Annual_Cap_Amount', 'Annual_Cap_Status', 'Capped', 'Team_Anniversary_Date', 'Next_Team_Anniversary', 'Last_Anniversary_Date',
    'Brokerage_Cap_Amount', 'Brokerage_Cap_Amount_Paid', 'Capped_with_Brokerage', 'Brokerage_Anniversary_Date',
    'Recruiting_Partner', 'Is_a_Team_Leader', 'Is_a_Regional_Director', 'Is_a_Mentor', 'Active_Growth_Partner',
    'Enrolled_in_Mentorship', 'Mentor_Assignment',
    'Deals_Closed_PRIOR_to_PG', 'Deals_Closed_WITH_PG', 'Months_with_Firm_NEW',
    'Pays_Monthly_Member_Fee', 'Monthly_Member_Fee', 'Balance_Due',
    'Em_Contact_Name', 'Em_Contact_Phone',
    'VA_Assistant_Name', 'VA_Assistant_Email',
    'Quickbooks_ID', 'QB_Vendor_Name', 'Stripe_ID', 'REAL_Participant_ID',
    'Created_Time', 'Modified_Time'
  ].join(',') // 49 fields + id = 50 total (removed: Owner, Country, County, First_Closing_Date1, Career)

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
  if (!zohoStatus) return 'ACTIVE'
  
  const statusMap = {
    'Active': 'ACTIVE',
    'Inactive': 'INACTIVE',
    'Onboarding': 'ONBOARDING',
    'Offboarded': 'OFFBOARDED',
  }
  
  return statusMap[zohoStatus] || 'ACTIVE'
}

/**
 * Map Zoho member level to MemberLevel enum
 */
function mapMemberLevel(zohoLevel) {
  if (!zohoLevel) return 'ASSOCIATE'
  
  const levelMap = {
    'Associate': 'ASSOCIATE',
    'Partner': 'PARTNER',
    'Sr. Partner': 'SR_PARTNER',
    'Senior Partner': 'SR_PARTNER',
    'Staff': 'STAFF',
  }
  
  return levelMap[zohoLevel] || 'ASSOCIATE'
}

/**
 * Map Zoho career to Career enum
 */
function mapCareer(zohoCareer) {
  if (!zohoCareer) return null
  
  const careerMap = {
    'Part Time': 'PART_TIME',
    'Full Time': 'FULL_TIME',
  }
  
  return careerMap[zohoCareer] || null
}

/**
 * Parse date from Zoho format
 */
function parseDate(dateValue) {
  if (!dateValue) return null
  
  try {
    // Zoho dates are typically in ISO format or specific format
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
 * Parse boolean value
 */
function parseBoolean(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    return lower === 'true' || lower === 'yes' || lower === '1'
  }
  return Boolean(value)
}

/**
 * Map Zoho agent record to Prisma schema
 */
function mapZohoAgentToSchema(zohoRecord) {
  return {
    zohoId: zohoRecord.id,
    name: zohoRecord.Account_Name || 'Unknown',
    email: zohoRecord.Personal_Email || zohoRecord.Work_Email || '', // Use Personal_Email as primary (REZEN email)
    personalEmail: zohoRecord.Personal_Email || null,
    workEmail: zohoRecord.Work_Email || null,
    phone: zohoRecord.Cell_Phone || null,
    
    // Address
    street: zohoRecord.Street || null,
    city: zohoRecord.City || null,
    state: zohoRecord.State || null,
    zipcode: zohoRecord.Zipcode || null,
    country: zohoRecord.Country || null,
    county: zohoRecord.County || null,
    
    // Employment
    status: mapStatus(zohoRecord.Firm_Status),
    memberLevel: mapMemberLevel(zohoRecord.Member_Level),
    hireDate: parseDate(zohoRecord.Hire_Date),
    departureDate: parseDate(zohoRecord.Departure_Date),
    firstClosingDate: parseDate(zohoRecord.First_Closing_Date1),
    career: mapCareer(zohoRecord.Career),
    
    // Commission Structure
    preCapSplitToAgent: parseDecimal(zohoRecord.Pre_Cap_Split_to_Agent || zohoRecord.Split_to_Agent),
    postCapSplitToAgent: parseDecimal(zohoRecord.Post_Cap_Split_to_Agent),
    perTransactionFee: parseDecimal(zohoRecord.Pre_Transaction_Fee),
    
    // Cap Tracking - Team
    teamCapAmount: parseDecimal(zohoRecord.Annual_Cap_Amount),
    teamCapAmountPaid: parseDecimal(zohoRecord.Annual_Cap_Status),
    cappedWithTeam: parseBoolean(zohoRecord.Capped),
    teamAnniversaryDate: parseDate(zohoRecord.Team_Anniversary_Date),
    nextTeamAnniversary: parseDate(zohoRecord.Next_Team_Anniversary),
    lastAnniversaryDate: parseDate(zohoRecord.Last_Anniversary_Date),
    
    // Cap Tracking - Brokerage
    brokerageCapAmount: parseDecimal(zohoRecord.Brokerage_Cap_Amount),
    brokerageCapAmountPaid: parseDecimal(zohoRecord.Brokerage_Cap_Amount_Paid),
    cappedWithBrokerage: parseBoolean(zohoRecord.Capped_with_Brokerage),
    brokerageAnniversaryDate: parseDate(zohoRecord.Brokerage_Anniversary_Date),
    
    // Roles / Flags
    isActiveSponsor: parseBoolean(zohoRecord.Recruiting_Partner),
    isActiveTeamLeader: parseBoolean(zohoRecord.Is_a_Team_Leader),
    isActiveDirector: parseBoolean(zohoRecord.Is_a_Regional_Director),
    isActiveMentor: parseBoolean(zohoRecord.Is_a_Mentor),
    isActiveGrowthLeader: parseBoolean(zohoRecord.Active_Growth_Partner),
    enrolledInMentorship: parseBoolean(zohoRecord.Enrolled_in_Mentorship),
    
    // Mentorship
    mentorAssignmentDate: parseDate(zohoRecord.Mentor_Assignment),
    
    // Stats
    dealsPriorToPG: zohoRecord.Deals_Closed_PRIOR_to_PG ? parseInt(zohoRecord.Deals_Closed_PRIOR_to_PG) : null,
    dealsWithPG: zohoRecord.Deals_Closed_WITH_PG ? parseInt(zohoRecord.Deals_Closed_WITH_PG) : null,
    monthsWithFirm: zohoRecord.Months_with_Firm_NEW ? parseInt(zohoRecord.Months_with_Firm_NEW) : null,
    
    // Billing
    paysMonthlyMemberFee: parseBoolean(zohoRecord.Pays_Monthly_Member_Fee),
    monthlyMemberFee: parseDecimal(zohoRecord.Monthly_Member_Fee),
    balanceDue: parseDecimal(zohoRecord.Balance_Due) || 0,
    
    // Emergency Contact
    emContactName: zohoRecord.Em_Contact_Name || null,
    emContactPhone: zohoRecord.Em_Contact_Phone || null,
    
    // VA/Assistant
    vaAssistantName: zohoRecord.VA_Assistant_Name || null,
    vaAssistantEmail: zohoRecord.VA_Assistant_Email || null,
    
    // External IDs
    qbVendorId: zohoRecord.Quickbooks_ID || null,
    qbVendorName: zohoRecord.QB_Vendor_Name || null,
    stripeId: zohoRecord.Stripe_ID || null,
    rezenId: zohoRecord.REAL_Participant_ID || null,
  }
}

/**
 * Main function
 */
async function main() {
  const accessToken = process.env.ZOHO_ACCESS_TOKEN
  
  if (!accessToken) {
    console.error('Error: ZOHO_ACCESS_TOKEN environment variable is required')
    console.error('Usage: ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-agents.js')
    process.exit(1)
  }

  try {
    console.log('Fetching agents from Zoho CRM...')
    console.log(`Module: ${MODULE_NAME}`)
    
    const zohoAgents = await fetchZohoAgents(accessToken) // Fetch all agents (no limit)
    console.log(`\nFetched ${zohoAgents.length} agents from Zoho`)
    
    let created = 0
    let updated = 0
    let errors = 0
    
    for (const zohoAgent of zohoAgents) {
      try {
        const agentData = mapZohoAgentToSchema(zohoAgent)
        
        // Check if agent already exists (by zohoId or email)
        const existingAgent = await prisma.agent.findFirst({
          where: {
            OR: [
              { zohoId: agentData.zohoId },
              { email: agentData.email },
            ],
          },
        })
        
        if (existingAgent) {
          // Update existing agent
          await prisma.agent.update({
            where: { id: existingAgent.id },
            data: agentData,
          })
          updated++
          console.log(`Updated agent: ${agentData.name} (${agentData.email})`)
        } else {
          // Create new agent
          await prisma.agent.create({
            data: agentData,
          })
          created++
          console.log(`Created agent: ${agentData.name} (${agentData.email})`)
        }
      } catch (error) {
        errors++
        console.error(`Error processing agent ${zohoAgent.id || zohoAgent.Account_Name}:`, error.message)
      }
    }
    
    console.log(`\n=== Summary ===`)
    console.log(`Created: ${created}`)
    console.log(`Updated: ${updated}`)
    console.log(`Errors: ${errors}`)
    console.log(`Total processed: ${zohoAgents.length}`)
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

