# Quick Start: Get Zoho Access Token

This guide will help you get a Zoho access token in under 5 minutes.

## Method 1: Self Client (Easiest - Recommended)

### Step 1: Go to Zoho API Console
1. Open your browser
2. Go to: **https://api-console.zoho.com/**
3. Sign in with your Zoho account (same account used for Zoho CRM)

### Step 2: Create a Self Client
1. Click **"Add Client"** button (top right)
2. Select **"Self Client"** as the client type
3. Fill in:
   - **Client Name**: `Premiere Realty CRM` (or any name)
   - **Client Domain**: `localhost` (or your domain)
   - **Authorization Redirect URI**: Leave blank or use `http://localhost:3000`
4. Click **"Create"**

### Step 3: Generate Access Token
1. After creating, you'll see your **Client ID** and **Client Secret**
2. Scroll down to **"Generate Code"** section
3. Select scopes:
   - ✅ **ZohoCRM.modules.READ** (to read transaction records)
   - ✅ **ZohoCRM.settings.ALL** (optional, for field metadata)
4. Click **"Generate"**
5. Copy the generated **Access Token**
   - ⚠️ **Important**: Token expires in 1 hour
   - You'll need a new token each time you run the import

### Step 4: Use the Token
```bash
# Option 1: Set in environment variable
export ZOHO_ACCESS_TOKEN=your_token_here

# Option 2: Add to .env file
echo "ZOHO_ACCESS_TOKEN=your_token_here" >> .env

# Then run the script
node scripts/fetch-zoho-transactions.js
```

---

## Method 2: Server-based Application (For Production)

If you need a more permanent solution with refresh tokens:

### Step 1: Create Server-based Client
1. Go to **https://api-console.zoho.com/**
2. Click **"Add Client"**
3. Select **"Server-based Applications"**
4. Fill in:
   - **Client Name**: `Premiere Realty CRM`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorized Redirect URIs**: `http://localhost:3000`
5. Click **"Create"**

### Step 2: Generate Authorization Code
1. Click **"Generate Code"**
2. Select scopes (same as above)
3. Copy the **Authorization Code**

### Step 3: Exchange Code for Tokens
Use this curl command (replace with your values):

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000" \
  -d "code=YOUR_AUTHORIZATION_CODE"
```

This returns:
- **access_token**: Use immediately (expires in 1 hour)
- **refresh_token**: Use to get new access tokens (doesn't expire)

---

## Troubleshooting

### Error: "invalid_client"
- Make sure Client ID and Client Secret are correct
- Check that the redirect URI matches exactly

### Error: "invalid_grant"
- Authorization code may have expired (valid for 10 minutes)
- Generate a new code

### Error: "invalid_token" or 401 Unauthorized
- Access token has expired (valid for 1 hour)
- Generate a new token

### Error: "insufficient_scope"
- Make sure you selected the required scopes:
  - `ZohoCRM.modules.READ` (minimum required)
  - `ZohoCRM.settings.ALL` (optional, for formula fields)

---

## Quick Test

Once you have the token, test it:

```bash
# Set the token
export ZOHO_ACCESS_TOKEN=your_token_here

# Test API access
curl -X GET "https://www.zohoapis.com/crm/v8/Transactions_NEW?per_page=1" \
  -H "Authorization: Zoho-oauthtoken $ZOHO_ACCESS_TOKEN"

# Should return JSON with transaction data
```

---

## Next Steps

After getting the token:

1. **Run the import script:**
   ```bash
   ZOHO_ACCESS_TOKEN=your_token node scripts/fetch-zoho-transactions.js
   ```

2. **Verify records were imported:**
   - Check your database
   - Or visit `/transactions` in your app

3. **Test formulas with real data:**
   ```bash
   node scripts/test-formulas.js
   ```

