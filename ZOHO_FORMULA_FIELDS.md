# Zoho Formula Fields Documentation

## Overview

Some fields in Zoho CRM are calculated using formulas. These fields are **read-only** and cannot be edited directly. Their values are computed automatically based on other fields or subform data.

## How to View Formula Expressions

To see the actual formula expressions used by Zoho, you need to use the Zoho CRM API:

### API Endpoint
```
GET https://www.zohoapis.com/crm/v8/settings/fields?module={module_api_name}
```

### Authentication
You'll need a Zoho CRM OAuth access token in the Authorization header:
```
Authorization: Zoho-oauthtoken {access_token}
```

### Example Modules
- `Transactions_NEW` - Custom module for transactions
- `Members` - Custom module for agents/members
- `Listings` - Listings module
- `Commission_Payments` - Commission payments module

## Known Formula Fields

### Transactions_NEW Module

1. **Total_Payments**
   - **Type:** Formula (Currency)
   - **Read-Only:** Yes
   - **Description:** Sum of payment amounts from Payment_Particpants subform
   - **Formula Expression:** Not available in exports (must fetch via API)

2. **Gross_Commission_Income_GCI**
   - **Type:** Formula (Currency)
   - **Read-Only:** Yes
   - **Description:** Calculated gross commission income
   - **Formula Expression:** Not available in exports (must fetch via API)

## Implementation Notes

### In the UI
- Formula fields should be displayed as **read-only** in edit forms
- Show a clear indicator (badge/icon) that the field is calculated
- Display the calculated value but do not allow editing

### In the Database
- Formula fields are typically **not stored** in the database schema
- Values are calculated on-the-fly when fetching from Zoho
- If you need to cache these values, calculate them during sync operations

### In API Responses
- Formula fields will have their calculated values in Zoho API responses
- The formula expression itself is only available via the field metadata endpoint

## Utility Function

See `src/lib/zoho-field-metadata.ts` for a utility function to fetch formula field metadata:

```typescript
import { fetchZohoFieldMetadata } from '@/lib/zoho-field-metadata'

// Fetch formula fields for Transactions_NEW module
const formulaFields = await fetchZohoFieldMetadata('Transactions_NEW', accessToken)
```

## References

- [Zoho CRM Field Metadata API Documentation](https://www.zoho.com/crm/developer/docs/api/v8/field-meta.html)
- Field export files in `zoho-exports/` directory
- Field reference pages in the UI (accessible via "View All Fields" button on detail pages)

