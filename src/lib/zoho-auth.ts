/**
 * Shared Zoho authentication utility with token caching
 * Prevents rate limiting by caching access tokens
 */

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

// In-memory token cache
let tokenCache: CachedToken | null = null

// Token expires 5 minutes before actual expiry to be safe
const TOKEN_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get access token using refresh token
 */
async function getAccessTokenFromRefresh(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  let data: any = {}
  try {
    const text = await response.text()
    if (text.trim()) {
      data = JSON.parse(text)
    }
  } catch (parseError) {
    tokenCache = null
    throw new Error(`Token refresh failed: Invalid response format - ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
  }

  if (!response.ok) {
    // Clear cache on error so we don't keep using a bad token
    tokenCache = null
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  }

  if (!data.access_token) {
    tokenCache = null
    throw new Error('No access token in response')
  }

  // Cache the token - Zoho tokens typically expire in 1 hour (3600 seconds)
  const expiresIn = (data.expires_in || 3600) * 1000 // Convert to milliseconds
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresIn - TOKEN_BUFFER_MS, // Expire 5 min early
  }

  return data.access_token
}

/**
 * Get access token automatically with caching
 * Caches tokens to prevent rate limiting from too many refresh requests
 */
export async function getZohoAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken
  }

  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  const accessToken = process.env.ZOHO_ACCESS_TOKEN

  // If refresh token is available, use it to get a fresh access token
  if (refreshToken && clientId && clientSecret) {
    try {
      return await getAccessTokenFromRefresh(refreshToken, clientId, clientSecret)
    } catch (error) {
      // If refresh fails and we have a static token, use that as fallback
      if (accessToken) {
        console.warn('Token refresh failed, using static access token:', error)
        return accessToken
      }
      throw error
    }
  }

  // Otherwise, use the provided access token
  if (accessToken) {
    return accessToken
  }

  throw new Error('No authentication method available')
}

/**
 * Clear the token cache (useful for testing or forced refresh)
 */
export function clearZohoTokenCache(): void {
  tokenCache = null
}

