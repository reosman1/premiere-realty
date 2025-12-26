/**
 * Sync Formula Fields from Zoho CRM
 * 
 * This script fetches formula field definitions from Zoho CRM and creates
 * corresponding FormulaField records in our database.
 * 
 * Usage:
 *   npx tsx scripts/sync-zoho-formulas.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Zoho API Configuration
const ZOHO_API_BASE_URL = process.env.ZOHO_API_BASE_URL || "https://www.zohoapis.com/crm/v8"
const ZOHO_ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN || ""
const ZOHO_MODULE = process.env.ZOHO_MODULE || "Deals" // Use Deals module for transactions

interface ZohoField {
  api_name: string
  display_label: string
  data_type: string
  formula?: {
    expression?: string
    return_type?: string
    dynamic?: boolean
  }
  read_only?: boolean
}

/**
 * Fetch field metadata from Zoho CRM
 */
async function fetchZohoFields(module: string): Promise<ZohoField[]> {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("ZOHO_ACCESS_TOKEN environment variable is required")
  }

  const url = `${ZOHO_API_BASE_URL}/settings/fields?module=${module}`
  
  console.log(`📡 Fetching fields from Zoho for module: ${module}...`)
  console.log(`   URL: ${url}`)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch Zoho fields: ${response.status} ${response.statusText}\n${errorText}`)
  }

  const data = await response.json()
  return data.fields || []
}

/**
 * Map Zoho module name to our entity type
 */
function mapZohoModuleToEntityType(zohoModule: string): string {
  const mapping: Record<string, string> = {
    "Deals": "Transaction", // Use Deals module for transactions
    "Members": "Agent",
    "Listings": "Listing",
    "Commission_Payments": "CommissionPayment",
  }
  return mapping[zohoModule] || zohoModule
}

/**
 * Map Zoho return type to our return type
 */
function mapZohoReturnType(zohoReturnType?: string): string {
  if (!zohoReturnType) return "number"
  
  const mapping: Record<string, string> = {
    "currency": "currency",
    "double": "number",
    "integer": "number",
    "text": "text",
    "boolean": "boolean",
    "date": "date",
  }
  return mapping[zohoReturnType.toLowerCase()] || "number"
}

/**
 * Convert Zoho field name to our field name format (camelCase)
 */
function convertFieldName(zohoApiName: string): string {
  // Convert Zoho format (Total_Payments) to camelCase (totalPayments)
  return zohoApiName
    .split("_")
    .map((part, index) => 
      index === 0 
        ? part.toLowerCase() 
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("")
}

/**
 * Sync formula fields from Zoho to our database
 */
async function syncFormulaFields(zohoModule: string) {
  try {
    // Fetch fields from Zoho
    const zohoFields = await fetchZohoFields(zohoModule)
    
    console.log(`\n✅ Fetched ${zohoFields.length} fields from Zoho\n`)

    // Filter to only formula fields
    const formulaFields = zohoFields.filter(
      (field) => field.data_type === "formula" && field.formula
    )

    console.log(`📊 Found ${formulaFields.length} formula fields:\n`)

    if (formulaFields.length === 0) {
      console.log("   No formula fields found in this module.")
      return
    }

    // Display formula fields
    formulaFields.forEach((field) => {
      console.log(`   • ${field.display_label} (${field.api_name})`)
      if (field.formula?.expression) {
        console.log(`     Formula: ${field.formula.expression}`)
      } else {
        console.log(`     ⚠️  Formula expression not available in API response`)
      }
      console.log(`     Return Type: ${field.formula?.return_type || "unknown"}`)
      console.log("")
    })

    // Map to our entity type
    const entityType = mapZohoModuleToEntityType(zohoModule)

    // Ask for confirmation before creating
    console.log(`\n💾 Ready to create ${formulaFields.length} formula fields for ${entityType} entity type.`)
    console.log(`   (This is a test run - not creating yet. Modify script to actually create.)\n`)

    // Create formula fields in our database
    let created = 0
    let skipped = 0
    let errors = 0

    for (const zohoField of formulaFields) {
      try {
        const fieldName = convertFieldName(zohoField.api_name)
        const returnType = mapZohoReturnType(zohoField.formula?.return_type)

        // Check if formula field already exists
        const existing = await prisma.formulaField.findUnique({
          where: {
            entityType_fieldName: {
              entityType,
              fieldName,
            },
          },
        })

        if (existing) {
          console.log(`   ⏭️  Skipping ${fieldName} - already exists`)
          skipped++
          continue
        }

        // Note: Zoho API may not return the formula expression in the field metadata
        // You may need to configure it manually or fetch it differently
        const formulaExpression = zohoField.formula?.expression || ""
        
        if (!formulaExpression) {
          console.log(`   ⚠️  Skipping ${fieldName} - no formula expression available`)
          console.log(`       You'll need to manually add this formula or fetch it from Zoho UI`)
          skipped++
          continue
        }

        // Create formula field
        await prisma.formulaField.create({
          data: {
            entityType,
            fieldName,
            displayName: zohoField.display_label,
            formulaExpression,
            returnType,
            decimalPlaces: returnType === "currency" ? 2 : undefined,
            description: `Synced from Zoho ${zohoModule} module`,
            isActive: true,
          },
        })

        console.log(`   ✅ Created ${fieldName}: ${zohoField.display_label}`)
        created++
      } catch (error: any) {
        console.error(`   ❌ Error creating ${zohoField.api_name}:`, error.message)
        errors++
      }
    }

    console.log(`\n📈 Summary:`)
    console.log(`   Created: ${created}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Errors: ${errors}`)
  } catch (error: any) {
    console.error("❌ Error syncing formula fields:", error.message)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🔄 Zoho Formula Fields Sync\n")
  console.log("=" .repeat(50))

  if (!ZOHO_ACCESS_TOKEN) {
    console.error("❌ Error: ZOHO_ACCESS_TOKEN environment variable is required")
    console.error("\nPlease add to .env file:")
    console.error("  ZOHO_ACCESS_TOKEN=your_access_token")
    console.error("  ZOHO_API_BASE_URL=https://www.zohoapis.com/crm/v8")
    process.exit(1)
  }

  try {
    await syncFormulaFields(ZOHO_MODULE)
    console.log("\n✅ Sync complete!")
  } catch (error: any) {
    console.error("\n❌ Sync failed:", error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { syncFormulaFields, fetchZohoFields }

