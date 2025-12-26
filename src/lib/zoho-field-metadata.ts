/**
 * Zoho CRM Field Metadata Utilities
 * 
 * To fetch formula field details from Zoho, use:
 * GET https://www.zohoapis.com/crm/v8/settings/fields?module={module_api_name}
 * 
 * Example modules:
 * - Deals (Transactions module)
 * - Members (Custom Module for Agents)
 * - Listings
 * - Commission_Payments
 * 
 * The response will include formula fields with their expressions in the formula object.
 */

export interface ZohoFormulaField {
  api_name: string
  display_label: string
  data_type: "formula"
  formula: {
    expression?: string
    return_type: string
    dynamic?: boolean
    stop_compute_conditionally?: boolean
  }
  read_only: boolean
}

/**
 * Known formula fields from Zoho (from field exports)
 * Note: Actual formula expressions are not in exports, must fetch via API
 */
export const ZOHO_FORMULA_FIELDS = {
  Deals: [
    {
      api_name: "Total_Payments",
      display_label: "Total Payments",
      data_type: "formula" as const,
      return_type: "currency",
      read_only: true,
      description: "Sum of payment amounts from Payment_Particpants subform",
      note: "Formula expression not available in exports. Fetch via Zoho API: GET /settings/fields?module=Deals"
    },
    {
      api_name: "Gross_Commission_Income_GCI",
      display_label: "Gross Commission Income (GCI)",
      data_type: "formula" as const,
      return_type: "currency",
      read_only: true,
      description: "Calculated gross commission income",
      note: "Formula expression not available in exports. Fetch via Zoho API: GET /settings/fields?module=Deals"
    }
  ]
}

/**
 * Fetch Zoho field metadata including formula expressions
 * 
 * @param moduleApiName - Zoho module API name (e.g., "Deals", "Members")
 * @param accessToken - Zoho CRM OAuth access token
 * @returns Field metadata with formula expressions
 */
export async function fetchZohoFieldMetadata(
  moduleApiName: string,
  accessToken: string
): Promise<ZohoFormulaField[]> {
  const apiUrl = `https://www.zohoapis.com/crm/v8/settings/fields?module=${moduleApiName}`
  
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Zoho field metadata: ${response.statusText}`)
  }

  const data = await response.json()
  const fields = data.fields || []

  // Filter to only formula fields
  return fields
    .filter((field: any) => field.data_type === "formula")
    .map((field: any) => ({
      api_name: field.api_name,
      display_label: field.display_label,
      data_type: "formula" as const,
      formula: field.formula || {},
      read_only: field.read_only || true
    }))
}

