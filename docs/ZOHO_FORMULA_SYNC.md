# Zoho Formula Fields Sync

This feature allows you to sync formula field definitions from Zoho CRM into the Premiere Realty CRM.

## Overview

The sync feature:
1. Fetches field metadata from Zoho CRM using their API
2. Filters for formula fields only
3. Creates corresponding `FormulaField` records in our database
4. Maps Zoho module names to our entity types
5. Converts field names from Zoho format to camelCase

## How to Use

### 1. Get a Zoho Access Token

You need a Zoho OAuth access token with the `ZohoCRM.settings.fields.READ` scope.

**Option A: Using Zoho Developer Console**
1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Create/select your OAuth client
3. Generate an access token with scope: `ZohoCRM.settings.fields.READ`
4. Copy the access token

**Option B: Using Zoho CRM Settings**
1. Go to Zoho CRM → Settings → Developer Space → APIs
2. Create a new OAuth Client (if needed)
3. Generate an access token with the appropriate scope
4. Copy the access token

**Note:** Access tokens expire. You may need to refresh periodically.

### 2. Sync via Web UI

1. Navigate to `/admin/formula-fields`
2. Click the **"Sync from Zoho"** button
3. Enter your Zoho access token
4. Select the Zoho module to sync:
   - `Transactions_NEW` → Transaction entity
   - `Members` → Agent entity
   - `Listings` → Listing entity
   - `Commission_Payments` → CommissionPayment entity
5. Click **"Sync Formulas from Zoho"**
6. Review the results:
   - **Found**: Number of formula fields discovered
   - **Created**: New formula fields added
   - **Skipped**: Fields that already exist or have no formula expression
   - **Errors**: Any failures

### 3. Sync via API

You can also call the API directly:

```bash
curl -X POST http://localhost:3000/api/admin/sync-zoho-formulas \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ZOHO_ACCESS_TOKEN",
    "module": "Transactions_NEW"
  }'
```

### 4. Sync via Script (Development)

For development/testing, you can use the script:

```bash
# Set environment variables
export ZOHO_ACCESS_TOKEN="your_token_here"
export ZOHO_MODULE="Transactions_NEW"

# Run the script (requires tsx or ts-node)
npx tsx scripts/sync-zoho-formulas.ts
```

## Field Mapping

### Module to Entity Type

| Zoho Module | Our Entity Type |
|------------|-----------------|
| `Transactions_NEW` | `Transaction` |
| `Members` | `Agent` |
| `Listings` | `Listing` |
| `Commission_Payments` | `CommissionPayment` |

### Field Name Conversion

Zoho field names (e.g., `Total_Payments`) are converted to camelCase (e.g., `totalPayments`).

### Return Type Mapping

| Zoho Return Type | Our Return Type |
|-----------------|-----------------|
| `currency` | `currency` |
| `double` | `number` |
| `integer` | `number` |
| `text` | `text` |
| `boolean` | `boolean` |

## Limitations

1. **Formula Expression Availability**: The Zoho API may not always return the formula expression in the field metadata. In such cases, the field will be skipped and you'll need to manually add the formula.

2. **Token Expiration**: Zoho access tokens expire. You'll need to refresh them periodically.

3. **Rate Limiting**: Zoho API has rate limits. If you encounter errors, wait a few moments and try again.

4. **Formula Syntax**: Formulas are synced as-is from Zoho. You may need to adjust field references to match our database schema field names.

## Next Steps After Sync

After syncing formulas from Zoho:

1. **Review Created Formulas**: Go to `/admin/formula-fields` to see all synced formulas
2. **Test Formulas**: Use the "Test Formula" feature to verify formulas work correctly
3. **Edit if Needed**: Update formula expressions to match our field names if necessary
4. **Integrate into UI**: Formulas will need to be integrated into record fetching to display calculated values

## Troubleshooting

### Error: "Failed to fetch Zoho fields"

- Verify your access token is valid and not expired
- Check that the token has the correct scope (`ZohoCRM.settings.fields.READ`)
- Ensure the Zoho module name is correct

### Error: "No formula expression in API response"

- Zoho API may not return formula expressions in field metadata
- You'll need to manually add these formulas via the UI
- Consider exporting formulas from Zoho UI and importing them manually

### Field Already Exists

- If a field already exists, it will be skipped during sync
- Edit existing fields via `/admin/formula-fields` if you need to update them

## API Endpoint

**POST** `/api/admin/sync-zoho-formulas`

**Request Body:**
```json
{
  "accessToken": "string (required)",
  "module": "string (optional, default: Transactions_NEW)"
}
```

**Response:**
```json
{
  "success": true,
  "module": "Transactions_NEW",
  "entityType": "Transaction",
  "results": {
    "found": 5,
    "created": 3,
    "skipped": 2,
    "errors": [],
    "fields": [
      {
        "fieldName": "totalPayments",
        "displayName": "Total Payments",
        "status": "created",
        "id": "clx123..."
      }
    ]
  }
}
```

