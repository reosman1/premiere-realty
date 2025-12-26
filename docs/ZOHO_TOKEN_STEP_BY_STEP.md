# Step-by-Step: Getting Zoho Access Token

Follow these steps exactly to get your Zoho CRM access token.

## Step 1: Sign In to Zoho

1. **Go to**: https://api-console.zoho.com/
2. You'll be redirected to the Zoho sign-in page
3. **Enter your email/username** (the one you use for Zoho CRM)
4. **Click "Next"**
5. **Enter your password**
6. **Click "Sign In"**

If you have 2FA enabled, complete that step as well.

---

## Step 2: Navigate to Clients

After signing in, you should see the Zoho API Console dashboard.

1. **Look for "Clients" in the left sidebar** or top navigation
2. **Click on "Clients"** or **"Add Client"** button

If you don't see a Clients section, look for:
- "Server-based Applications"
- "OAuth Clients"
- Or a "+" or "Add" button

---

## Step 3: Create a New Client

1. **Click "Add Client"** or **"Create Client"** button
2. You'll see different client types. **Select "Server-based Applications"**
   - This is the most common type for API access
3. **Fill in the form**:

   **Client Name**: 
   ```
   Premiere Realty CRM Sync
   ```
   (or any name you prefer)

   **Homepage URL**: 
   ```
   http://localhost:3000
   ```
   (or your production domain)

   **Authorized Redirect URIs**: 
   ```
   http://localhost:3000
   ```
   (same as homepage, or add multiple if needed)

4. **Click "Create"** or **"Save"**

---

## Step 4: Get Your Client Credentials

After creating the client, you'll see:

- **Client ID**: A long string (copy this, you might need it later)
- **Client Secret**: Another long string (copy this too)

**Important**: Save these somewhere safe! You might need them for refresh tokens later.

---

## Step 5: Generate Access Token

Now you need to generate an access token. There are a few ways to do this:

### Option A: Using "Generate Code" Button

1. **Find the "Generate Code"** or **"Generate Token"** button next to your client
2. **Click it**
3. You'll be asked to select **scopes** (permissions)
4. **Check the box for**: `ZohoCRM.settings.fields.READ`
   - You might see it as "ZohoCRM.settings.fields.READ" or just "Fields Read"
5. **Click "Generate"** or **"Create"**
6. **Copy the Access Token** that appears

### Option B: Using Authorization URL

1. You might see an **Authorization URL** in your client details
2. **Copy that URL**
3. **Paste it in a new browser tab** and press Enter
4. **Sign in** if prompted
5. **Authorize the application**
6. You'll be redirected to a page with `code=` in the URL
7. **Copy the code** from the URL
8. Use this code to get an access token (see Step 6)

### Option C: Self-Client (Easier for Testing)

1. **Click "Add Client"** again
2. **Select "Self Client"** instead of "Server-based Applications"
3. **Fill in**:
   - Client Name: `Premiere Realty Test`
   - Scope: `ZohoCRM.settings.fields.READ`
4. **Click "Create"**
5. **Click "Generate"** next to your Self-Client
6. **Copy the Access Token**

---

## Step 6: Exchange Code for Token (If using Option B)

If you got a code instead of a token directly:

1. You'll need to make a POST request to exchange the code for a token
2. Use this command (replace the placeholders):

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000" \
  -d "code=YOUR_CODE_FROM_URL"
```

3. The response will contain an `access_token` - copy that!

---

## Step 7: Test Your Token

Once you have your access token:

1. **Go to**: `http://localhost:3000/admin/formula-fields/sync`
2. **Paste your token** in the "Zoho Access Token" field
3. **Select a module** (start with "Transactions_NEW")
4. **Click "Sync Formulas from Zoho"**

If it works, you'll see a success message with the number of formulas found!

---

## Troubleshooting

### "Invalid Token" Error
- Token might have expired (they expire after ~1 hour)
- Generate a new token
- Make sure you copied the entire token (they're very long)

### "Insufficient Permissions" Error
- Make sure you selected the `ZohoCRM.settings.fields.READ` scope
- Try creating a new client and selecting the scope again

### Can't Find "Clients" Section
- Look for "OAuth" or "API" in the navigation
- Try going directly to: https://api-console.zoho.com/console
- Some accounts might have it under "Settings" → "Developer Space"

### Token Expired
- Access tokens expire after ~1 hour
- You'll need to generate a new one
- For production, consider implementing refresh tokens

---

## What the Token Looks Like

Your access token will be a long string that looks something like:
```
1000.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567.1234567890abcdefghijklmnopqrstuvwxyz
```

It's usually 100+ characters long.

---

## Next Steps

Once you have your token working:

1. ✅ Test the sync with `Transactions_NEW` module
2. ✅ Try syncing other modules (`Members`, `Listings`, `Commission_Payments`)
3. ✅ Review the synced formulas in `/admin/formula-fields`
4. ✅ Edit any formulas that need adjustment for our field names

---

## Need Help?

If you get stuck at any step:
1. Take a screenshot of where you are
2. Note any error messages
3. Check the browser console for errors (F12 → Console tab)

