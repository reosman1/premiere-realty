import { NextRequest, NextResponse } from "next/server"
import { getZohoAccessToken } from "@/lib/zoho-auth"

const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v8'
const MODULE_NAME = 'Mentors'

/**
 * Fetch Mentors from Zoho
 */
async function fetchZohoMentors(accessToken: string, limit: number | null = null) {
  // Default fields to use if dynamic field fetch fails
  const defaultFields = [
    'id', 'Name', 'Email', 'Firm_Status', 'Status',
    'Regional_Director_Name', 'Regional_Director',
    'QB_Vendor_Number', 'Vendor_Number',
    'Effective_Start_Date', 'Start_Date',
    'Effective_End_Date', 'End_Date',
    'Created_Time', 'Modified_Time', 'Owner'
  ].join(',')

  let fields = defaultFields
  
  // Try to fetch available fields first to get all fields dynamically
  try {
    const fieldsResponse = await fetch(`${ZOHO_API_BASE}/${MODULE_NAME}/fields`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (fieldsResponse.ok) {
      const fieldsData = await fieldsResponse.json()
      if (fieldsData.fields && Array.isArray(fieldsData.fields)) {
        const fieldNames = fieldsData.fields
          .map((f: any) => f.api_name)
          .filter((name: string) => name && !name.startsWith('$'))
        if (fieldNames.length > 0) {
          fields = fieldNames.join(',')
        }
      }
    } else {
      const errorText = await fieldsResponse.text()
      console.warn(`Failed to fetch fields for ${MODULE_NAME}, using default fields: ${errorText}`)
    }
  } catch (error) {
    console.warn(`Error fetching fields for ${MODULE_NAME}, using default fields:`, error)
  }

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
      let errorText = ''
      try {
        const errorData = await response.json()
        errorText = JSON.stringify(errorData)
      } catch {
        errorText = await response.text()
      }
      throw new Error(`Zoho API error (${response.status} ${response.statusText}): ${errorText}`)
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
 * GET /api/mentors
 * Fetch Mentors from Zoho CRM
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
          error: "Failed to fetch mentors", 
          details: tokenError?.message || "Authentication failed",
          message: tokenError?.message || "Authentication failed"
        },
        { status: 500 }
      )
    }

    // Fetch all Mentors from Zoho
    const allMentors = await fetchZohoMentors(accessToken)

    // Transform and filter data
    let filtered = allMentors.map((mentor) => {
      // Handle Regional Director if it exists
      const regionalDirector = mentor.Regional_Director_Name || mentor.Regional_Director
      const rdName = regionalDirector && typeof regionalDirector === 'object' 
        ? (regionalDirector.name || regionalDirector.Name) 
        : regionalDirector

      return {
        id: mentor.id,
        name: mentor.Name || 'N/A',
        email: mentor.Email || null,
        firmStatus: mentor.Firm_Status || mentor.Status || null,
        regionalDirector: rdName || null,
        regionalDirectorId: regionalDirector && typeof regionalDirector === 'object' 
          ? (regionalDirector.id || regionalDirector.Id) 
          : null,
        qbVendorNumber: mentor.QB_Vendor_Number || mentor.Vendor_Number || null,
        effectiveStartDate: mentor.Effective_Start_Date || mentor.Start_Date || null,
        effectiveEndDate: mentor.Effective_End_Date || mentor.End_Date || null,
        createdTime: mentor.Created_Time || null,
        modifiedTime: mentor.Modified_Time || null,
        owner: mentor.Owner && typeof mentor.Owner === 'object' ? mentor.Owner.name : null,
        // Include any other fields that might be present
        ...Object.keys(mentor).reduce((acc, key) => {
          if (!['id', 'Name', 'Email', 'Firm_Status', 'Status', 'Regional_Director_Name', 'Regional_Director', 
                'QB_Vendor_Number', 'Vendor_Number', 'Effective_Start_Date', 'Start_Date', 
                'Effective_End_Date', 'End_Date', 'Created_Time', 'Modified_Time', 'Owner'].includes(key)) {
            acc[key] = mentor[key]
          }
          return acc
        }, {} as any),
      }
    })

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((mentor) => 
        mentor.name?.toLowerCase().includes(searchLower) ||
        mentor.email?.toLowerCase().includes(searchLower) ||
        mentor.regionalDirector?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (status && status !== "all") {
      filtered = filtered.filter((mentor) => 
        mentor.firmStatus?.toLowerCase() === status.toLowerCase()
      )
    }

    // Paginate
    const total = filtered.length
    const skip = (page - 1) * pageSize
    const paginated = filtered.slice(skip, skip + pageSize)

    return NextResponse.json({
      mentors: paginated,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error("Error fetching mentors:", error)
    const errorMessage = error?.message || "Unknown error"
    
    return NextResponse.json(
      { 
        error: "Failed to fetch mentors", 
        details: errorMessage,
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

