import { NextRequest, NextResponse } from "next/server"
import { getZohoAccessToken } from "@/lib/zoho-auth"

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = 'Regional_Directors' // API name for CustomModule7

/**
 * Fetch Regional Directors from Zoho
 */
async function fetchZohoRegionalDirectors(accessToken: string, limit: number | null = null) {
  const fields = [
    'id', 'Name', 'Email', 'Firm_Status', 'Regional_Director_Percent',
    'Director_Type', 'QB_Vendor_Number', 
    'Effective_Start_Date_as_RD', 'Effective_End_Date',
    'Owner', 'Created_Time', 'Modified_Time', 'Created_By', 'Modified_By',
    'Last_Activity_Time', 'Email_Opt_Out', 'Record_Image'
  ].join(',')

  let allRecords: any[] = []
  let pageToken: string | null = null
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
      pageToken = data.info?.next_page_token || null
      pageCount++
      
      if (limit && allRecords.length >= limit) {
        break
      }
      
      if (!pageToken) {
        break
      }
    } else {
      break
    }
  } while (pageToken && pageCount < maxPages)

  return limit ? allRecords.slice(0, limit) : allRecords
}

/**
 * GET /api/regional-directors
 * Fetch Regional Directors from Zoho CRM
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10)

    // Get access token (cached to prevent rate limiting)
    let accessToken: string
    try {
      accessToken = await getZohoAccessToken()
    } catch (tokenError: any) {
      console.error("Failed to get Zoho access token:", tokenError)
      return NextResponse.json(
        { 
          error: "Failed to fetch regional directors", 
          details: tokenError?.message || "Authentication failed",
          message: tokenError?.message || "Authentication failed"
        },
        { status: 500 }
      )
    }

    // Fetch all Regional Directors from Zoho
    const allDirectors = await fetchZohoRegionalDirectors(accessToken)

    // Transform and filter data
    let filtered = allDirectors.map((dir) => {
      return {
        id: dir.id,
        name: dir.Name || 'N/A',
        email: dir.Email || null,
        firmStatus: dir.Firm_Status || null,
        directorPercent: dir.Regional_Director_Percent || null,
        directorType: dir.Director_Type || null,
        qbVendorNumber: dir.QB_Vendor_Number || null,
        effectiveStartDate: dir.Effective_Start_Date_as_RD || null,
        effectiveEndDate: dir.Effective_End_Date || null,
        createdTime: dir.Created_Time || null,
        modifiedTime: dir.Modified_Time || null,
        owner: dir.Owner && typeof dir.Owner === 'object' ? dir.Owner.name : null,
      }
    })

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((dir) => 
        dir.name?.toLowerCase().includes(searchLower) ||
        dir.email?.toLowerCase().includes(searchLower) ||
        dir.directorType?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (status && status !== "all") {
      filtered = filtered.filter((dir) => 
        dir.firmStatus?.toLowerCase() === status.toLowerCase()
      )
    }

    // Paginate
    const total = filtered.length
    const skip = (page - 1) * pageSize
    const paginated = filtered.slice(skip, skip + pageSize)

    return NextResponse.json({
      directors: paginated,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error("Error fetching regional directors:", error)
    const errorMessage = error?.message || "Unknown error"
    
    return NextResponse.json(
      { 
        error: "Failed to fetch regional directors", 
        details: errorMessage,
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

