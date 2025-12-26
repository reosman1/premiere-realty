import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/sync-zoho-formulas
 * Sync formula fields from Zoho CRM
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { module, accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: "Zoho access token is required" },
        { status: 400 }
      )
    }

    const zohoModule = module || "Deals"
    const apiUrl = `https://www.zohoapis.com/crm/v8/settings/fields?module=${zohoModule}`

    // Fetch fields from Zoho
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails: any = { status: response.status, statusText: response.statusText }
      
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = { ...errorDetails, ...errorJson }
      } catch {
        errorDetails.rawResponse = errorText
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch Zoho fields", 
          details: errorDetails,
          troubleshooting: {
            message: "Token authentication failed. Common issues:",
            checks: [
              "1. Verify the token hasn't expired (tokens expire after ~1 hour)",
              "2. Ensure scope includes: ZohoCRM.settings.fields.READ",
              "3. Check API permissions: Zoho CRM > Setup > Users and Control > Security Control > Enable 'Zoho CRM API Access'",
              "4. Verify you're using the correct Zoho domain (zoho.com vs zoho.eu)",
              "5. Check if you've reached the token limit (delete unused tokens)",
            ]
          }
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const zohoFields = data.fields || []

    // Filter to only formula fields
    const formulaFields = zohoFields.filter(
      (field: any) => field.data_type === "formula" && field.formula
    )

    // Map Zoho module to our entity type
    const entityTypeMap: Record<string, string> = {
      "Members": "Agent",
      "Listings": "Listing",
      "Commission_Payments": "CommissionPayment",
    }
    const entityType = entityTypeMap[zohoModule] || zohoModule

    // Map return types
    const returnTypeMap: Record<string, string> = {
      "currency": "currency",
      "double": "number",
      "integer": "number",
      "text": "text",
      "boolean": "boolean",
    }

    // Convert field name format
    function convertFieldName(zohoApiName: string): string {
      return zohoApiName
        .split("_")
        .map((part, index) => 
          index === 0 
            ? part.toLowerCase() 
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("")
    }

    const results = {
      found: formulaFields.length,
      created: 0,
      skipped: 0,
      errors: [] as string[],
      fields: [] as any[],
    }

    // Process each formula field
    for (const zohoField of formulaFields) {
      try {
        const fieldName = convertFieldName(zohoField.api_name)
        const returnType = returnTypeMap[zohoField.formula?.return_type?.toLowerCase() || ""] || "number"
        const formulaExpression = zohoField.formula?.expression || ""

        // Check if already exists
        const existing = await prisma.formulaField.findUnique({
          where: {
            entityType_fieldName: {
              entityType,
              fieldName,
            },
          },
        })

        if (existing) {
          results.skipped++
          results.fields.push({
            fieldName,
            displayName: zohoField.display_label,
            status: "skipped",
            reason: "Already exists",
          })
          continue
        }

        if (!formulaExpression) {
          results.skipped++
          results.fields.push({
            fieldName,
            displayName: zohoField.display_label,
            status: "skipped",
            reason: "No formula expression in API response",
          })
          continue
        }

        // Create formula field
        const formulaField = await prisma.formulaField.create({
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

        results.created++
        results.fields.push({
          fieldName,
          displayName: zohoField.display_label,
          status: "created",
          id: formulaField.id,
        })
      } catch (error: any) {
        results.errors.push(`${zohoField.api_name}: ${error.message}`)
        results.fields.push({
          fieldName: convertFieldName(zohoField.api_name),
          displayName: zohoField.display_label,
          status: "error",
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      module: zohoModule,
      entityType,
      results,
    })
  } catch (error: any) {
    console.error("Error syncing Zoho formulas:", error)
    return NextResponse.json(
      { error: "Failed to sync Zoho formulas", details: error.message },
      { status: 500 }
    )
  }
}

