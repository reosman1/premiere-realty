# Make.com Scenario to Test Zoho API

Use this Make.com scenario to test your Zoho access token and fetch field metadata.

## Scenario: Test Zoho Field Metadata

### Module 1: HTTP - Make a Request

```javascript
{
  "url": "https://www.zohoapis.com/crm/v8/settings/fields?module=Transactions_NEW",
  "method": "GET",
  "headers": {
    "Authorization": "Zoho-oauthtoken {{your_access_token}}",
    "Content-Type": "application/json"
  }
}
```

### Module 2: Parse JSON (if needed)

The response will be JSON with field metadata.

---

## Alternative: Using Make's Zoho CRM Module

If you have Make.com connected to Zoho CRM:

### Module 1: Zoho CRM - List Fields

- **Module**: Zoho CRM
- **Action**: List Fields
- **Module**: Transactions_NEW
- **Connection**: Your Zoho CRM connection

This will use Make's built-in Zoho connection (which handles OAuth automatically).

---

## Testing Token in Make

1. **Create a new scenario**
2. **Add HTTP module**
3. **Configure:**
   - URL: `https://www.zohoapis.com/crm/v8/settings/fields?module=Transactions_NEW`
   - Method: `GET`
   - Headers:
     ```
     Authorization: Zoho-oauthtoken YOUR_TOKEN_HERE
     Content-Type: application/json
     ```
4. **Run once** to test
5. **Check the response:**
   - If successful: You'll see field data
   - If 401: Token is invalid/expired
   - If 403: Missing permissions or scope

---

## Getting Token from Make

If you have a working Make.com → Zoho CRM connection:

1. The connection already has a valid token
2. You can see the token in Make's connection settings
3. Or use Make's Zoho modules directly (they handle auth automatically)

---

## Make Scenario JSON

Here's a complete Make scenario you can import:

```json
{
  "name": "Test Zoho Field Metadata",
  "flow": [
    {
      "id": 1,
      "module": "http",
      "version": 1,
      "parameters": {
        "url": "https://www.zohoapis.com/crm/v8/settings/fields",
        "method": "GET",
        "qs": {
          "module": "Transactions_NEW"
        },
        "headers": {
          "Authorization": "Zoho-oauthtoken {{1.token}}",
          "Content-Type": "application/json"
        }
      }
    }
  ]
}
```

