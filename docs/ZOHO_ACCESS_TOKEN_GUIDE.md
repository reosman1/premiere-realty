# How to Get a Zoho CRM Access Token

This guide will walk you through obtaining an OAuth access token from Zoho CRM for use with the formula sync feature.

## Method 1: Using Zoho API Console (Recommended)

### Step 1: Go to Zoho API Console
1. Visit: https://api-console.zoho.com/
2. Sign in with your Zoho account (the same account used for Zoho CRM)

### Step 2: Create a New Client
1. Click **"Add Client"** or **"Create Client"**
2. Select **"Server-based Applications"** as the client type
3. Fill in the details:
   - **Client Name**: `Premiere Realty CRM Sync` (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorized Redirect URIs**: 
     - `http://localhost:3000` (for local development)
     - `https://your-domain.com` (for production)
4. Click **"Create"**

### Step 3: Generate Access Token
1. After creating the client, you'll see:
   - **Client ID**
   - **Client Secret**
2. Click **"Generate Code"** or **"Generate Token"**
3. Select the scopes you need:
   - ✅ `ZohoCRM.settings.fields.READ` (Required for formula sync)
   - ✅ `ZohoCRM.modules.READ` (Optional, for module info)
4. Copy the generated **Access Token**
   - ⚠️ **Important**: Access tokens expire (usually after 1 hour)
   - You'll need to generate a new one when it expires

### Step 4: Use the Token
- Copy the access token
- Use it in the sync UI at `/admin/formula-fields/sync`
- Or set it as an environment variable: `ZOHO_ACCESS_TOKEN=your_token_here`

---

## Method 2: Using Zoho CRM Settings (Alternative)

### Step 1: Access Developer Space
1. Log in to Zoho CRM
2. Go to **Settings** (gear icon in top right)
3. Navigate to **Developer Space** → **APIs**

### Step 2: Create OAuth Client
1. Click **"Create OAuth Client"** or **"Add Client"**
2. Fill in:
   - **Client Name**: `Premiere Realty CRM`
   - **Client Type**: Server-based Application
   - **Redirect URI**: `http://localhost:3000` (or your domain)
3. Click **"Create"**

### Step 3: Generate Token
1. After creating, you'll see your **Client ID** and **Client Secret**
2. Click **"Generate Token"** or use the authorization URL
3. Select scopes:
   - `ZohoCRM.settings.fields.READ`
4. Authorize the application
5. Copy the **Access Token** from the response

---

## Method 3: Using Self-Client (For Testing)

If you have a Zoho account with admin access, you can create a "Self-Client" which is simpler for testing:

### Step 1: Create Self-Client
1. Go to https://api-console.zoho.com/
2. Click **"Add Client"**
3. Select **"Self Client"**
4. Fill in:
   - **Client Name**: `Premiere Realty Test`
   - **Scope**: `ZohoCRM.settings.fields.READ`
5. Click **"Create"**

### Step 2: Generate Token
1. Click **"Generate"** next to your Self-Client
2. Copy the **Access Token**

---

## Token Expiration & Refresh

### Access Token Lifetime
- **Access tokens expire after 1 hour** (typically)
- You'll need to generate a new token when it expires

### Refresh Token (For Long-term Use)
If you need a token that doesn't expire frequently:

1. When generating the initial token, also get a **Refresh Token**
2. Use the refresh token to get new access tokens:
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "refresh_token=YOUR_REFRESH_TOKEN" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "grant_type=refresh_token"
   ```

### Storing Tokens Securely
- ⚠️ **Never commit tokens to git**
- Store in `.env` file (which should be in `.gitignore`)
- For production, use environment variables or a secrets manager

---

## Quick Test

Once you have your access token, test it:

```bash
# Test via API
curl -X POST http://localhost:3000/api/admin/sync-zoho-formulas \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_TOKEN_HERE",
    "module": "Transactions_NEW"
  }'
```

Or use the web UI:
1. Go to `/admin/formula-fields/sync`
2. Paste your token
3. Select module
4. Click "Sync Formulas from Zoho"

---

## Troubleshooting

### "Invalid Token" Error
- Token may have expired (generate a new one)
- Check that you selected the correct scopes
- Verify the token hasn't been revoked

### "Insufficient Permissions" Error
- Make sure you selected `ZohoCRM.settings.fields.READ` scope
- Verify your Zoho account has admin/owner permissions

### "Module Not Found" Error
- Check the module name is correct (case-sensitive)
- Common modules:
  - `Transactions_NEW`
  - `Members`
  - `Listings`
  - `Commission_Payments`

### Token Expired During Sync
- Access tokens expire after ~1 hour
- Generate a new token and try again
- Consider implementing refresh token logic for production

---

## Security Best Practices

1. **Never share tokens publicly**
2. **Rotate tokens regularly**
3. **Use environment variables** for storage
4. **Limit token scopes** to only what's needed
5. **Revoke unused tokens** in Zoho API Console

---

## References

- [Zoho API Console](https://api-console.zoho.com/)
- [Zoho OAuth Documentation](https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html)
- [Zoho Field Metadata API](https://www.zoho.com/crm/developer/docs/api/v8/field-meta.html)

