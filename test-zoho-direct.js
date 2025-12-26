/**
 * Direct test of Zoho API using the token
 * This bypasses our API and tests Zoho directly
 * 
 * Usage: node test-zoho-direct.js YOUR_TOKEN
 */

const token = process.argv[2] || process.env.ZOHO_ACCESS_TOKEN
const module = process.argv[3] || "Transactions_NEW"

if (!token) {
  console.error("❌ Error: Token required")
  console.error("\nUsage: node test-zoho-direct.js YOUR_TOKEN [MODULE]")
  process.exit(1)
}

async function testZohoDirect() {
  console.log("🧪 Testing Zoho API directly...")
  console.log(`Token: ${token.substring(0, 20)}...`)
  console.log(`Module: ${module}`)
  console.log("")

  const url = `https://www.zohoapis.com/crm/v8/settings/fields?module=${module}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log("")

    if (!response.ok) {
      console.error("❌ Request failed!")
      console.error("Response:", responseText)
      
      try {
        const error = JSON.parse(responseText)
        console.error("\nError details:")
        console.error(JSON.stringify(error, null, 2))
      } catch {
        console.error("Raw response:", responseText)
      }
      
      if (response.status === 401) {
        console.error("\n💡 Troubleshooting:")
        console.error("1. Token may have expired (tokens expire after ~1 hour)")
        console.error("2. Token may not have the required scope: ZohoCRM.settings.fields.READ")
        console.error("3. Check API permissions in Zoho CRM: Setup → Users and Control → Security Control")
        console.error("4. Verify you're using the correct Zoho domain (zoho.com vs zoho.eu)")
      }
      
      process.exit(1)
    }

    const data = JSON.parse(responseText)
    
    console.log("✅ Success!")
    console.log(`Found ${data.fields?.length || 0} fields`)
    console.log("")

    // Filter formula fields
    const formulaFields = data.fields?.filter(f => f.data_type === "formula") || []
    console.log(`📊 Formula fields: ${formulaFields.length}`)
    
    if (formulaFields.length > 0) {
      console.log("\nFormula fields found:")
      formulaFields.forEach((field, idx) => {
        console.log(`\n${idx + 1}. ${field.display_label} (${field.api_name})`)
        console.log(`   Type: ${field.data_type}`)
        if (field.formula) {
          console.log(`   Return Type: ${field.formula.return_type || "unknown"}`)
          if (field.formula.expression) {
            console.log(`   Formula: ${field.formula.expression}`)
          } else {
            console.log(`   ⚠️  Formula expression not in API response`)
          }
        }
      })
    }

    console.log("\n✅ Token is valid and working!")
    
  } catch (error) {
    console.error("❌ Error:", error.message)
    if (error.message.includes("fetch")) {
      console.error("\n💡 Make sure you're using Node.js 18+ (which has built-in fetch)")
    }
    process.exit(1)
  }
}

testZohoDirect()

