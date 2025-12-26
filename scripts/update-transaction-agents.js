/**
 * Update Existing Transactions with Agent Assignments
 * 
 * This script re-fetches transactions from Zoho and updates the agent assignments
 * for transactions that don't have agents assigned yet.
 * 
 * Usage:
 *   ZOHO_ACCESS_TOKEN=your_token node scripts/update-transaction-agents.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = 'Deals'

/**
 * Fetch a single transaction from Zoho by ID
 */
async function fetchZohoTransaction(accessToken, zohoId) {
  const url = `${ZOHO_API_BASE}/${MODULE_NAME}/${zohoId}?fields=Account_Name,Deal_Name`
  
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
  return data.data?.[0] || null
}

/**
 * Main function
 */
async function main() {
  const accessToken = process.env.ZOHO_ACCESS_TOKEN
  
  if (!accessToken) {
    console.error('❌ Error: ZOHO_ACCESS_TOKEN environment variable is required')
    process.exit(1)
  }

  try {
    console.log('🔄 Updating transaction agent assignments...\n')

    // Find all transactions that don't have an agent assigned
    const transactionsWithoutAgent = await prisma.transaction.findMany({
      where: {
        OR: [
          { agentId: null },
          { agent: null },
        ],
        zohoId: { not: null }, // Only process transactions that have a Zoho ID
      },
      select: {
        id: true,
        zohoId: true,
        name: true,
      },
      take: 1000, // Process up to 1000 transactions at a time
    })

    console.log(`📊 Found ${transactionsWithoutAgent.length} transactions without agents\n`)

    if (transactionsWithoutAgent.length === 0) {
      console.log('✅ All transactions already have agents assigned!')
      return
    }

    let updated = 0
    let errors = 0
    let skipped = 0

    for (const tx of transactionsWithoutAgent) {
      try {
        // Fetch the transaction from Zoho to get Account_Name
        const zohoRecord = await fetchZohoTransaction(accessToken, tx.zohoId)
        
        if (!zohoRecord || !zohoRecord.Account_Name) {
          skipped++
          console.log(`  ⏭️  Skipped: ${tx.name} (no Account_Name in Zoho)`)
          continue
        }

        // Extract agent name from Account_Name (it might be an object or string)
        const accountName = zohoRecord.Account_Name
        const agentName = typeof accountName === 'object' 
          ? (accountName.name || accountName.Name || accountName.Account_Name)
          : accountName
        const accountZohoId = typeof accountName === 'object' 
          ? (accountName.id || accountName.Id)
          : null

        if (!agentName) {
          skipped++
          console.log(`  ⏭️  Skipped: ${tx.name} (could not extract agent name)`)
          continue
        }

        // Find the agent by zohoId or name (try multiple matching strategies)
        let agent = null
        
        if (accountZohoId) {
          agent = await prisma.agent.findFirst({
            where: { zohoId: accountZohoId },
          })
        }
        
        // If not found by zohoId, try name matching with multiple strategies
        if (!agent) {
          // Try exact match first
          agent = await prisma.agent.findFirst({
            where: { name: { equals: agentName.trim(), mode: 'insensitive' } },
          })
        }
        
        // Try contains match
        if (!agent) {
          agent = await prisma.agent.findFirst({
            where: { name: { contains: agentName.trim(), mode: 'insensitive' } },
          })
        }
        
        // Try matching just the first part (first name or last name)
        if (!agent && agentName.includes(' ')) {
          const parts = agentName.trim().split(' ')
          for (const part of parts) {
            if (part.length > 2) { // Only try parts longer than 2 characters
              agent = await prisma.agent.findFirst({
                where: { name: { contains: part, mode: 'insensitive' } },
              })
              if (agent) break
            }
          }
        }

        if (!agent) {
          skipped++
          console.log(`  ⏭️  Skipped: ${tx.name} (agent not found: ${agentName})`)
          continue
        }

        // Update the transaction with the agent ID
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { agentId: agent.id },
        })

        updated++
        console.log(`  ✅ Updated: ${tx.name} → ${agent.name}`)

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        errors++
        console.error(`  ❌ Error processing ${tx.name}:`, error.message)
      }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log('📊 Update Summary')
    console.log('='.repeat(50))
    console.log(`  ✅ Updated: ${updated}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log(`  ❌ Errors: ${errors}`)
    console.log(`  📦 Total processed: ${transactionsWithoutAgent.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

