/**
 * Quick test script for Zoho formula sync
 * 
 * Usage:
 *   node test-zoho-sync.js YOUR_ZOHO_ACCESS_TOKEN
 */

const ZOHO_ACCESS_TOKEN = process.argv[2] || process.env.ZOHO_ACCESS_TOKEN
const MODULE = process.argv[3] || "Transactions_NEW"
const API_URL = "http://localhost:3000/api/admin/sync-zoho-formulas"

if (!ZOHO_ACCESS_TOKEN) {
  console.error("❌ Error: Zoho access token required")
  console.error("\nUsage:")
  console.error("  node test-zoho-sync.js YOUR_TOKEN [MODULE]")
  console.error("\nOr set environment variable:")
  console.error("  export ZOHO_ACCESS_TOKEN=your_token")
  console.error("  node test-zoho-sync.js")
  process.exit(1)
}

console.log("🔄 Testing Zoho Formula Sync")
console.log("=" .repeat(50))
console.log(`Module: ${MODULE}`)
console.log(`API: ${API_URL}`)
console.log("")

async function testSync() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: ZOHO_ACCESS_TOKEN,
        module: MODULE,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ Sync failed:")
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log("✅ Sync successful!")
    console.log("")
    console.log("Results:")
    console.log(`  Found: ${data.results.found}`)
    console.log(`  Created: ${data.results.created}`)
    console.log(`  Skipped: ${data.results.skipped}`)
    console.log(`  Errors: ${data.results.errors.length}`)
    console.log("")

    if (data.results.fields.length > 0) {
      console.log("Fields:")
      data.results.fields.forEach((field, idx) => {
        const icon = field.status === "created" ? "✅" : field.status === "error" ? "❌" : "⏭️"
        console.log(`  ${icon} ${field.displayName} (${field.fieldName}) - ${field.status}`)
        if (field.reason) {
          console.log(`      Reason: ${field.reason}`)
        }
        if (field.error) {
          console.log(`      Error: ${field.error}`)
        }
      })
    }

    if (data.results.errors.length > 0) {
      console.log("")
      console.log("Errors:")
      data.results.errors.forEach((error) => {
        console.log(`  ❌ ${error}`)
      })
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Make sure the dev server is running:")
      console.error("   npm run dev")
    }
    process.exit(1)
  }
}

testSync()

