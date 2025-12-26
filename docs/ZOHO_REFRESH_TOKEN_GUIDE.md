# How to Get a Zoho Refresh Token

Refresh tokens allow you to automatically get new access tokens without manually generating them each time.

## Step 1: Find Your Registered Redirect URI

**IMPORTANT:** You need to know what redirect URI was configured when you created your OAuth client.

1. Go to https://api-console.zoho.com/
2. Find your client (Client ID: `1000.JFQ7BE2UVXH9MHCUSABNU9W4531UAU`)
3. Check the **Authorized Redirect URIs** field - this is what you need to use

Common redirect URIs:
- `http://localhost:3000`
- `https://accounts.zoho.com/oauth/v2/auth`
- Your actual domain URL

## Step 2: Create Authorization URL

Use this URL format with the redirect URI that matches your OAuth client configuration:

```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.READ&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=YOUR_REGISTERED_REDIRECT_URI
```

**Example with common redirect URIs:**

If your redirect URI is `http://localhost:3000`:
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.READ&client_id=1000.JFQ7BE2UVXH9MHCUSABNU9W4531UAU&response_type=code&access_type=offline&redirect_uri=http://localhost:3000
```

If your redirect URI is the Zoho default:
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.READ&client_id=1000.JFQ7BE2UVXH9MHCUSABNU9W4531UAU&response_type=code&access_type=offline&redirect_uri=https://accounts.zoho.com/oauth/v2/auth
```

**Important:** 
- `access_type=offline` is required to get a refresh token
- The `redirect_uri` must match **exactly** what you registered with your OAuth client (case-sensitive)

## Step 3: Authorize the Application

1. Copy the URL above and paste it in your browser
2. Sign in to Zoho if prompted
3. Authorize the application
4. You'll be redirected to `http://localhost:3000?code=XXXXX`
5. **Copy the code** from the URL (the part after `code=`)

## Step 4: Exchange Code for Tokens

Now use the `exchange-zoho-code.js` script to get both access token and refresh token:

```bash
ZOHO_CODE=your_code_from_url node scripts/exchange-zoho-code.js
```

Or if you have the credentials in your .env file:
```bash
ZOHO_CODE=your_code_from_url node scripts/exchange-zoho-code.js
```

The script will output:
- **ACCESS TOKEN** (expires in ~1 hour)
- **REFRESH TOKEN** (save this - it doesn't expire)

## Step 5: Add Refresh Token to .env

Add the refresh token to your `.env` file:

```env
ZOHO_REFRESH_TOKEN=your_refresh_token_here
```

Now your script will automatically refresh access tokens!

## Alternative: Using curl

You can also use curl to exchange the code:

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=1000.JFQ7BE2UVXH9MHCUSABNU9W4531UAU" \
  -d "client_secret=d96c2e122a49d0c2bc5345d686235fcd9727e3da8c" \
  -d "redirect_uri=http://localhost:3000" \
  -d "code=YOUR_CODE_FROM_URL"
```

The response will include both `access_token` and `refresh_token`.

## Notes

- **Refresh tokens don't expire** (unless revoked)
- **Access tokens expire after 1 hour**
- Once you have a refresh token, you never need to manually generate tokens again
- The refresh token is only provided when using `access_type=offline` in the authorization URL

## Troubleshooting

### "Invalid Redirect Uri" Error

This means the redirect URI in the URL doesn't match what's configured in your OAuth client.

**Solution:**
1. Go to https://api-console.zoho.com/
2. Click on your client (Client ID: `1000.JFQ7BE2UVXH9MHCUSABNU9W4531UAU`)
3. Check the **Authorized Redirect URIs** field
4. Use that exact URI in the authorization URL (replace `redirect_uri=` in the URL)

**Alternative:** If you can't find the redirect URI, you can:
1. Edit your OAuth client in Zoho API Console
2. Add `http://localhost:3000` to the Authorized Redirect URIs
3. Save the changes
4. Then use the URL with `redirect_uri=http://localhost:3000`

## Quick Summary

1. Check your OAuth client's Authorized Redirect URIs in https://api-console.zoho.com/
2. Visit the authorization URL with the correct redirect_uri
3. Authorize and copy the `code` from the redirect URL
4. Run: `ZOHO_CODE=your_code node scripts/exchange-zoho-code.js`
5. Copy the refresh token from the output
6. Add `ZOHO_REFRESH_TOKEN=your_refresh_token` to your `.env` file

