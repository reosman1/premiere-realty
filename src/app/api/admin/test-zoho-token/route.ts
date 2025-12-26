import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/admin/test-zoho-token
 * Test Zoho access token validity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      )
    }

    // Test with a simple API call - get modules list
    const testUrl = "https://www.zohoapis.com/crm/v8/settings/modules"
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    let responseData: any = {}
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        troubleshooting: {
          message: "Token test failed. Possible issues:",
          checks: [
            "Token expired (tokens expire after ~1 hour)",
            "Missing required scope: ZohoCRM.settings.fields.READ",
            "API access not enabled for your user account",
            "Wrong Zoho domain (try zoho.eu if you're in EU)",
            "Token limit reached - delete unused tokens",
          ]
        }
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: "Token is valid!",
      modules: responseData.modules?.length || 0,
      sampleModules: responseData.modules?.slice(0, 5).map((m: any) => m.api_name) || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to test token", 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

