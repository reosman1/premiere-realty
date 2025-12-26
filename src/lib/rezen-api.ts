/**
 * REZEN API Client
 * Direct integration with REZEN (arrakis.therealbrokerage.com) API
 */

const REZEN_API_BASE_URL =
  process.env.REZEN_API_BASE_URL || "https://arrakis.therealbrokerage.com/api/v1"
const REZEN_API_KEY = process.env.REZEN_API_KEY
const REZEN_PARTICIPANT_ID = process.env.REZEN_PARTICIPANT_ID

if (!REZEN_API_KEY) {
  console.warn("REZEN_API_KEY environment variable is not set")
}

export interface RezenTransactionFilters {
  pageNumber?: number
  pageSize?: number
  sortDirection?: "ASC" | "DESC"
  sortBy?: string
  updatedAtFrom?: string // YYYY-MM-DD format
  updatedAtTo?: string // YYYY-MM-DD format
}

export interface RezenTransaction {
  id: string
  code: string
  transactionType: string
  lifecycleState: {
    state: string
  }
  address: {
    oneLine: string
    street?: string
    city?: string
    state?: string
    zipCode?: string
    county?: string
  }
  price: {
    amount: number
    currency?: string
  }
  grossCommission: {
    amount: number
    currency?: string
  }
  grossCommissionPercentage?: number
  contractAcceptanceDate?: string
  closingDateEstimated?: string
  closingDateActual?: string
  office?: {
    name: string
    id?: string
  }
  participants?: Array<{
    id: string
    name: string
    email?: string
    role?: string
  }>
  cdPayer?: {
    fullName: string
    email?: string
  }
  cdPayerBusinessEntity?: {
    name: string
  }
  updatedAt?: string
  createdAt?: string
  [key: string]: any // Allow for additional fields
}

export interface RezenCommissionSplit {
  id: string
  participantId: string
  splitPercentage?: number
  splitAmount?: number
  [key: string]: any
}

class RezenApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message)
    this.name = "RezenApiError"
  }
}

/**
 * REZEN API Client
 */
export class RezenApiClient {
  private apiKey: string
  private baseUrl: string
  private participantId: string

  constructor(
    apiKey?: string,
    baseUrl?: string,
    participantId?: string
  ) {
    this.apiKey = apiKey || REZEN_API_KEY || ""
    this.baseUrl = baseUrl || REZEN_API_BASE_URL
    this.participantId = participantId || REZEN_PARTICIPANT_ID || ""

    // Don't throw in constructor - let methods handle validation
    // This allows the client to be instantiated even if env vars aren't set yet
  }

  /**
   * Validate that required credentials are set
   */
  private validateCredentials(): void {
    if (!this.apiKey) {
      throw new Error("REZEN API key is required. Please set REZEN_API_KEY environment variable.")
    }
    if (!this.participantId) {
      throw new Error("REZEN Participant ID is required. Please set REZEN_PARTICIPANT_ID environment variable.")
    }
  }

  /**
   * Make authenticated request to REZEN API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "X-API-KEY": this.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new RezenApiError(
          `REZEN API error: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof RezenApiError) {
        throw error
      }
      throw new RezenApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Get OPEN transactions for the participant
   */
  async getOpenTransactions(
    filters: RezenTransactionFilters = {}
  ): Promise<RezenTransaction[]> {
    this.validateCredentials()
    
    const {
      pageNumber = 0,
      pageSize = 100,
      sortDirection = "DESC",
      sortBy = "CREATED_AT",
      updatedAtFrom,
      updatedAtTo,
    } = filters

    const queryParams = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      sortDirection,
      sortBy,
    })

    if (updatedAtFrom) {
      queryParams.append("updatedAtFrom", updatedAtFrom)
    }
    if (updatedAtTo) {
      queryParams.append("updatedAtTo", updatedAtTo)
    }

    const endpoint = `/transactions/participant/${this.participantId}/transactions/OPEN?${queryParams.toString()}`

    const response = await this.request<RezenTransaction[]>(endpoint, {
      method: "GET",
    })

    return Array.isArray(response) ? response : []
  }

  /**
   * Get detailed transaction data by ID
   */
  async getTransactionDetails(transactionId: string): Promise<RezenTransaction> {
    this.validateCredentials()
    
    const endpoint = `/transactions/${transactionId}`
    return this.request<RezenTransaction>(endpoint, {
      method: "GET",
    })
  }

  /**
   * Get commission splits for a transaction participant
   */
  async getCommissionSplits(
    transactionId: string,
    participantId: string
  ): Promise<RezenCommissionSplit[]> {
    this.validateCredentials()
    
    const endpoint = `/transactions/${transactionId}/participants/${participantId}/pro-teammate-commission-splits`
    
    try {
      const response = await this.request<RezenCommissionSplit[]>(endpoint, {
        method: "GET",
      })
      return Array.isArray(response) ? response : []
    } catch (error) {
      // Commission splits endpoint may not exist for all transactions
      if (error instanceof RezenApiError && error.statusCode === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * Get all transactions with pagination
   */
  async getAllOpenTransactions(
    filters: RezenTransactionFilters = {}
  ): Promise<RezenTransaction[]> {
    const allTransactions: RezenTransaction[] = []
    let pageNumber = filters.pageNumber || 0
    const pageSize = filters.pageSize || 100
    let hasMore = true

    while (hasMore) {
      const transactions = await this.getOpenTransactions({
        ...filters,
        pageNumber,
        pageSize,
      })

      allTransactions.push(...transactions)

      // If we got fewer results than page size, we've reached the end
      hasMore = transactions.length === pageSize
      pageNumber++
    }

    return allTransactions
  }

  /**
   * Get team members from Yenta API
   */
  async getTeamMembers(teamId: string): Promise<RezenTeamMember[]> {
    this.validateCredentials()
    
    const yentaBaseUrl = "https://yenta.therealbrokerage.com/api/v1"
    const url = `${yentaBaseUrl}/teams/${teamId}`
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new RezenApiError(
          `Yenta API error: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()
      return Array.isArray(data.members) ? data.members : (Array.isArray(data) ? data : [])
    } catch (error) {
      if (error instanceof RezenApiError) {
        throw error
      }
      throw new RezenApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Get agent cap information
   */
  async getAgentCapInfo(agentId: string): Promise<RezenAgentCapInfo> {
    this.validateCredentials()
    
    const endpoint = `/agent/${agentId}/cap-info`
    return this.request<RezenAgentCapInfo>(endpoint, {
      method: "GET",
    })
  }

  /**
   * Get listings by lifecycle group (OPEN, CLOSED, TERMINATED)
   */
  async getListings(
    lifecycleGroup: "open" | "closed" | "terminated",
    filters: {
      pageNumber?: number
      pageSize?: number
      sortBy?: string
      sortDirection?: "ASC" | "DESC"
    } = {}
  ): Promise<RezenListing[]> {
    this.validateCredentials()
    
    const {
      pageNumber = 0,
      pageSize = 250,
      sortBy = "CREATED_AT",
      sortDirection = "DESC",
    } = filters

    const queryParams = new URLSearchParams({
      lifeCycleGroup: lifecycleGroup.toUpperCase(),
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortDirection,
    })

    const endpoint = `/transactions/participant/${this.participantId}/listing-transactions/${lifecycleGroup}?${queryParams.toString()}`

    const response = await this.request<RezenListing[]>(endpoint, {
      method: "GET",
    })

    return Array.isArray(response) ? response : []
  }

  /**
   * Get all listings with pagination
   */
  async getAllListings(
    lifecycleGroup: "open" | "closed" | "terminated",
    filters: {
      pageNumber?: number
      pageSize?: number
      sortBy?: string
      sortDirection?: "ASC" | "DESC"
    } = {}
  ): Promise<RezenListing[]> {
    const allListings: RezenListing[] = []
    let pageNumber = filters.pageNumber || 0
    const pageSize = filters.pageSize || 250
    let hasMore = true

    while (hasMore) {
      const listings = await this.getListings(lifecycleGroup, {
        ...filters,
        pageNumber,
        pageSize,
      })

      allListings.push(...listings)

      hasMore = listings.length === pageSize
      pageNumber++
    }

    return allListings
  }
}

/**
 * Get team members from Yenta API
 */
export interface RezenTeamMember {
  id: string
  agent: {
    id: string
    name?: string
    email?: string
    [key: string]: any
  }
  [key: string]: any
}

export interface RezenAgentCapInfo {
  teamCapAmount?: number
  teamCapAmountPaid?: number
  brokerageCapAmount?: number
  brokerageCapAmountPaid?: number
  [key: string]: any
}

export interface RezenListing {
  id: string
  code?: string
  address?: {
    oneLine?: string
    street?: string
    city?: string
    state?: string
    zipCode?: string
    [key: string]: any
  }
  listingPrice?: {
    amount?: number
    [key: string]: any
  }
  agent?: {
    id?: string
    name?: string
    email?: string
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Default client instance
 */
export const rezenApi = new RezenApiClient()

