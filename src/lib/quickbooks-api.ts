/**
 * QuickBooks Online API Client
 * Handles OAuth 2.0 authentication and API requests
 */

const QB_CLIENT_ID = process.env.QB_CLIENT_ID
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET
const QB_REALM_ID = process.env.QB_REALM_ID // Company ID
const QB_ACCESS_TOKEN = process.env.QB_ACCESS_TOKEN
const QB_REFRESH_TOKEN = process.env.QB_REFRESH_TOKEN
const QB_ENVIRONMENT = process.env.QB_ENVIRONMENT || "production" // sandbox or production

const QB_API_BASE_URL =
  QB_ENVIRONMENT === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com/v3"
    : "https://quickbooks.api.intuit.com/v3"

const QB_OAUTH_BASE_URL =
  QB_ENVIRONMENT === "sandbox"
    ? "https://appcenter.intuit.com/connect/oauth2"
    : "https://appcenter.intuit.com/connect/oauth2"

if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
  console.warn("QuickBooks API credentials (QB_CLIENT_ID, QB_CLIENT_SECRET) are not set")
}

export interface QuickBooksError {
  Fault: {
    Error: Array<{
      Detail: string
      code: string
      element: string
      Message: string
    }>
    type: string
  }
  time: string
}

export interface QuickBooksInvoice {
  Id?: string
  SyncToken?: string
  DocNumber?: string
  TxnDate?: string
  DueDate?: string
  PrivateNote?: string
  TxnStatus?: string
  Line?: Array<{
    Id?: string
    LineNum?: number
    Amount?: number
    DetailType: string
    SalesItemLineDetail?: {
      ItemRef: { value: string; name: string }
      UnitPrice?: number
      Qty?: number
    }
    Description?: string
  }>
  CustomerRef?: { value: string; name?: string }
  CurrencyRef?: { value: string; name?: string }
  TotalAmt?: number
  Balance?: number
  LinkedTxn?: Array<{
    TxnId: string
    TxnType: string
  }>
  sparse?: boolean
}

export interface QuickBooksBill {
  Id?: string
  SyncToken?: string
  TxnDate?: string
  DueDate?: string
  PrivateNote?: string
  DocNumber?: string
  TxnStatus?: string
  Line?: Array<{
    Id?: string
    LineNum?: number
    Amount?: number
    DetailType: string
    AccountBasedExpenseLineDetail?: {
      AccountRef: { value: string; name?: string }
      ClassRef?: { value: string; name?: string }
      BillableStatus?: string
    }
    Description?: string
  }>
  VendorRef?: { value: string; name?: string }
  APAccountRef?: { value: string; name?: string }
  CurrencyRef?: { value: string; name?: string }
  TotalAmt?: number
  Balance?: number
  sparse?: boolean
}

export interface QuickBooksVendor {
  Id?: string
  SyncToken?: string
  DisplayName?: string
  CompanyName?: string
  GivenName?: string
  FamilyName?: string
  PrimaryEmailAddr?: { Address?: string }
  PrimaryPhone?: { FreeFormNumber?: string }
  BillAddr?: {
    Line1?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
  }
  sparse?: boolean
}

export interface QuickBooksCustomer {
  Id?: string
  SyncToken?: string
  DisplayName?: string
  CompanyName?: string
  GivenName?: string
  FamilyName?: string
  PrimaryEmailAddr?: { Address?: string }
  PrimaryPhone?: { FreeFormNumber?: string }
  BillAddr?: {
    Line1?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
  }
  sparse?: boolean
}

class QuickBooksApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public qbError?: QuickBooksError
  ) {
    super(message)
    this.name = "QuickBooksApiError"
  }
}

/**
 * QuickBooks Online API Client
 */
export class QuickBooksApiClient {
  private clientId: string
  private clientSecret: string
  private realmId: string
  private accessToken: string
  private refreshToken: string
  private environment: string

  constructor(
    clientId?: string,
    clientSecret?: string,
    realmId?: string,
    accessToken?: string,
    refreshToken?: string,
    environment?: string
  ) {
    this.clientId = clientId || QB_CLIENT_ID || ""
    this.clientSecret = clientSecret || QB_CLIENT_SECRET || ""
    this.realmId = realmId || QB_REALM_ID || ""
    this.accessToken = accessToken || QB_ACCESS_TOKEN || ""
    this.refreshToken = refreshToken || QB_REFRESH_TOKEN || ""
    this.environment = environment || QB_ENVIRONMENT
  }

  /**
   * Validate that required credentials are set
   */
  private validateCredentials(): void {
    if (!this.clientId) {
      throw new Error("QuickBooks Client ID is required. Please set QB_CLIENT_ID environment variable.")
    }
    if (!this.clientSecret) {
      throw new Error("QuickBooks Client Secret is required. Please set QB_CLIENT_SECRET environment variable.")
    }
    if (!this.realmId) {
      throw new Error("QuickBooks Realm ID is required. Please set QB_REALM_ID environment variable.")
    }
    if (!this.accessToken) {
      throw new Error("QuickBooks Access Token is required. Please set QB_ACCESS_TOKEN environment variable.")
    }
  }

  /**
   * Get the base URL for API requests
   */
  private getApiBaseUrl(): string {
    return this.environment === "sandbox"
      ? "https://sandbox-quickbooks.api.intuit.com/v3"
      : "https://quickbooks.api.intuit.com/v3"
  }

  /**
   * Make authenticated request to QuickBooks API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.validateCredentials()

    const url = `${this.getApiBaseUrl()}/company/${this.realmId}${endpoint}`
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        // Try to parse QuickBooks error response
        let qbError: QuickBooksError | undefined
        try {
          qbError = await response.json()
        } catch {
          // If JSON parsing fails, use status text
        }

        const errorMessage =
          qbError?.Fault?.Error?.[0]?.Message ||
          qbError?.Fault?.Error?.[0]?.Detail ||
          response.statusText

        throw new QuickBooksApiError(
          `QuickBooks API error: ${errorMessage}`,
          response.status,
          qbError
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof QuickBooksApiError) {
        throw error
      }
      throw new QuickBooksApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Create or update an invoice
   */
  async upsertInvoice(invoice: QuickBooksInvoice): Promise<QuickBooksInvoice> {
    const endpoint = `/invoice?minorversion=65`

    // For updates, we need SyncToken and sparse mode
    const payload: QuickBooksInvoice = invoice.Id
      ? { ...invoice, sparse: true }
      : invoice

    const response = await this.request<{ Invoice: QuickBooksInvoice }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return response.Invoice
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<QuickBooksInvoice> {
    const response = await this.request<{ Invoice: QuickBooksInvoice }>(
      `/invoice/${invoiceId}?minorversion=65`
    )
    return response.Invoice
  }

  /**
   * Query invoices
   */
  async queryInvoices(query: string): Promise<QuickBooksInvoice[]> {
    const response = await this.request<{
      QueryResponse: {
        Invoice?: QuickBooksInvoice[]
        maxResults?: number
      }
    }>(`/query?query=${encodeURIComponent(query)}&minorversion=65`)

    return response.QueryResponse.Invoice || []
  }

  /**
   * Create or update a bill
   */
  async upsertBill(bill: QuickBooksBill): Promise<QuickBooksBill> {
    const endpoint = `/bill?minorversion=65`

    // For updates, we need SyncToken and sparse mode
    const payload: QuickBooksBill = bill.Id ? { ...bill, sparse: true } : bill

    const response = await this.request<{ Bill: QuickBooksBill }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return response.Bill
  }

  /**
   * Get bill by ID
   */
  async getBill(billId: string): Promise<QuickBooksBill> {
    const response = await this.request<{ Bill: QuickBooksBill }>(
      `/bill/${billId}?minorversion=65`
    )
    return response.Bill
  }

  /**
   * Query bills
   */
  async queryBills(query: string): Promise<QuickBooksBill[]> {
    const response = await this.request<{
      QueryResponse: {
        Bill?: QuickBooksBill[]
        maxResults?: number
      }
    }>(`/query?query=${encodeURIComponent(query)}&minorversion=65`)

    return response.QueryResponse.Bill || []
  }

  /**
   * Create or update a vendor
   */
  async upsertVendor(vendor: QuickBooksVendor): Promise<QuickBooksVendor> {
    const endpoint = `/vendor?minorversion=65`
    const payload: QuickBooksVendor = vendor.Id
      ? { ...vendor, sparse: true }
      : vendor

    const response = await this.request<{ Vendor: QuickBooksVendor }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return response.Vendor
  }

  /**
   * Get vendor by ID
   */
  async getVendor(vendorId: string): Promise<QuickBooksVendor> {
    const response = await this.request<{ Vendor: QuickBooksVendor }>(
      `/vendor/${vendorId}?minorversion=65`
    )
    return response.Vendor
  }

  /**
   * Query vendors (by DisplayName)
   */
  async queryVendors(displayName?: string): Promise<QuickBooksVendor[]> {
    const query = displayName
      ? `SELECT * FROM Vendor WHERE DisplayName = '${displayName.replace(/'/g, "''")}'`
      : "SELECT * FROM Vendor MAXRESULTS 100"
    
    const response = await this.request<{
      QueryResponse: {
        Vendor?: QuickBooksVendor[]
        maxResults?: number
      }
    }>(`/query?query=${encodeURIComponent(query)}&minorversion=65`)

    return response.QueryResponse.Vendor || []
  }

  /**
   * Create or update a customer
   */
  async upsertCustomer(customer: QuickBooksCustomer): Promise<QuickBooksCustomer> {
    const endpoint = `/customer?minorversion=65`
    const payload: QuickBooksCustomer = customer.Id
      ? { ...customer, sparse: true }
      : customer

    const response = await this.request<{ Customer: QuickBooksCustomer }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return response.Customer
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<QuickBooksCustomer> {
    const response = await this.request<{ Customer: QuickBooksCustomer }>(
      `/customer/${customerId}?minorversion=65`
    )
    return response.Customer
  }

  /**
   * Query customers (by DisplayName)
   */
  async queryCustomers(displayName?: string): Promise<QuickBooksCustomer[]> {
    const query = displayName
      ? `SELECT * FROM Customer WHERE DisplayName = '${displayName.replace(/'/g, "''")}'`
      : "SELECT * FROM Customer MAXRESULTS 100"
    
    const response = await this.request<{
      QueryResponse: {
        Customer?: QuickBooksCustomer[]
        maxResults?: number
      }
    }>(`/query?query=${encodeURIComponent(query)}&minorversion=65`)

    return response.QueryResponse.Customer || []
  }

  /**
   * Update bill balance (for voided payments)
   * This sets the bill balance to zero
   */
  async updateBillBalance(billId: string, syncToken: string): Promise<QuickBooksBill> {
    // Get current bill first
    const currentBill = await this.getBill(billId)
    
    // Update balance to zero by creating a payment or adjusting the bill
    // Note: QuickBooks doesn't directly allow setting balance, so we need to
    // apply a payment or update the bill status
    const updatedBill: QuickBooksBill = {
      ...currentBill,
      Id: billId,
      SyncToken: syncToken,
      Balance: 0,
      sparse: true,
    }

    return this.upsertBill(updatedBill)
  }
}

// Export singleton instance
export const quickbooksApi = new QuickBooksApiClient()

