# Zoho Modules Available for Import

This document lists all Zoho CRM modules available for import into the Premiere Realty CRM system.

## Primary Modules (Main Entities)

These modules map directly to core CRM entities and should be imported first:

### 1. ✅ **Deals** → `Transaction` entity
- **Status**: Already imported
- **Zoho Module**: `Deals`
- **Local Entity**: `Transaction`
- **Fields File**: `zoho-exports/fields_Deals.json`
- **Notes**: Transaction data has already been imported. Use this as a reference for field mapping patterns.

### 2. **Members** → `Agent` entity
- **Status**: Ready to import
- **Zoho Module**: `Members`
- **Local Entity**: `Agent`
- **Fields File**: `zoho-exports/fields_Members.json`
- **Alternative Module**: `Accounts` (also maps to `Agent`)
- **Priority**: **HIGH** - Core entity

### 3. **Accounts** → `Agent` entity
- **Status**: Ready to import (alternative to Members)
- **Zoho Module**: `Accounts`
- **Local Entity**: `Agent`
- **Fields File**: `zoho-exports/fields_Accounts.json`
- **Notes**: Alternative module for agents. Use Members or Accounts, not both.

### 4. **Listings** → `Listing` entity
- **Status**: Ready to import
- **Zoho Module**: `Listings`
- **Local Entity**: `Listing`
- **Fields File**: `zoho-exports/fields_Listings.json`
- **Priority**: **HIGH** - Core entity

### 5. **Commission_Payments** → `CommissionPayment` entity
- **Status**: Ready to import
- **Zoho Module**: `Commission_Payments`
- **Local Entity**: `CommissionPayment`
- **Fields File**: `zoho-exports/fields_Commission_Payments.json`
- **Priority**: **HIGH** - Core entity

### 6. **Leads** → `Contact` entity
- **Status**: Ready to import
- **Zoho Module**: `Leads`
- **Local Entity**: `Contact`
- **Fields File**: `zoho-exports/fields_Leads.json`
- **Priority**: **MEDIUM** - If Contact entity is being used

### 7. **Contacts** → `Contact` entity
- **Status**: Ready to import (alternative to Leads)
- **Zoho Module**: `Contacts`
- **Local Entity**: `Contact`
- **Fields File**: `zoho-exports/fields_Contacts.json`
- **Notes**: Alternative module for contacts. Use Leads or Contacts, not both.

## Secondary/Support Modules

These modules contain related data (subforms, relationships, activities) and may be imported after primary modules:

### Subform Data Modules

#### 8. **Payment_Particpants**
- **Status**: Available
- **Zoho Module**: `Payment_Particpants`
- **Fields File**: `zoho-exports/fields_Payment_Particpants.json`
- **Purpose**: Subform data for transactions (participants in payments)
- **Related To**: `Transaction` entity
- **Priority**: **MEDIUM** - May be needed for transaction completeness

#### 9. **Payment_Items**
- **Status**: Available
- **Zoho Module**: `Payment_Items`
- **Fields File**: `zoho-exports/fields_Payment_Items.json`
- **Purpose**: Subform data for payments
- **Related To**: `CommissionPayment` entity
- **Priority**: **MEDIUM**

#### 10. **Commission_Items**
- **Status**: Available
- **Zoho Module**: `Commission_Items`
- **Fields File**: `zoho-exports/fields_Commission_Items.json`
- **Purpose**: Subform data for commission payments
- **Related To**: `CommissionPayment` entity
- **Priority**: **MEDIUM**

### Relationship/Hierarchy Modules

#### 11. **Related_Agents**
- **Status**: Available
- **Zoho Module**: `Related_Agents`
- **Fields File**: `zoho-exports/fields_Related_Agents.json`
- **Purpose**: Agent relationships
- **Related To**: `Agent` entity
- **Priority**: **LOW** - Can be handled as nested data

#### 12. **Team_Leaders**
- **Status**: Available
- **Zoho Module**: `Team_Leaders`
- **Fields File**: `zoho-exports/fields_Team_Leaders.json`
- **Purpose**: Agent hierarchy (team leader assignments)
- **Related To**: `Agent` entity
- **Priority**: **LOW** - May be better as a field on Agent

#### 13. **Sponsors**
- **Status**: Available
- **Zoho Module**: `Sponsors`
- **Fields File**: `zoho-exports/fields_Sponsors.json`
- **Purpose**: Agent hierarchy (sponsor assignments)
- **Related To**: `Agent` entity
- **Priority**: **LOW** - May be better as a field on Agent

#### 14. **Regional_Directors**
- **Status**: Available
- **Zoho Module**: `Regional_Directors`
- **Fields File**: `zoho-exports/fields_Regional_Directors.json`
- **Purpose**: Agent hierarchy (regional director assignments)
- **Related To**: `Agent` entity
- **Priority**: **LOW** - May be better as a field on Agent

#### 15. **Mentors**
- **Status**: Available
- **Zoho Module**: `Mentors`
- **Fields File**: `zoho-exports/fields_Mentors.json`
- **Purpose**: Agent hierarchy (mentor assignments)
- **Related To**: `Agent` entity
- **Priority**: **LOW** - May be better as a field on Agent

### Commission Split Modules

#### 16. **Team_Splits**
- **Status**: Available
- **Zoho Module**: `Team_Splits`
- **Fields File**: `zoho-exports/fields_Team_Splits.json`
- **Purpose**: Commission splits
- **Related To**: `Transaction` or `CommissionPayment` entities
- **Priority**: **LOW** - May need custom handling

#### 17. **Team_Item_Payments**
- **Status**: Available
- **Zoho Module**: `Team_Item_Payments`
- **Fields File**: `zoho-exports/fields_Team_Item_Payments.json`
- **Purpose**: Team item payments
- **Related To**: `CommissionPayment` entity
- **Priority**: **LOW**

### Activity Modules

#### 18. **Notes**
- **Status**: Available
- **Zoho Module**: `Notes`
- **Fields File**: `zoho-exports/fields_Notes.json`
- **Purpose**: Notes/annotations on records
- **Priority**: **LOW** - Can be stored as JSON or in activity log

#### 19. **Calls**
- **Status**: Available
- **Zoho Module**: `Calls`
- **Fields File**: `zoho-exports/fields_Calls.json`
- **Purpose**: Call logs/activities
- **Priority**: **LOW** - May need ActivityLog model extension

#### 20. **Events**
- **Status**: Available
- **Zoho Module**: `Events`
- **Fields File**: `zoho-exports/fields_Events.json`
- **Purpose**: Calendar events/appointments
- **Priority**: **LOW** - May need ActivityLog model extension

#### 21. **Tasks**
- **Status**: Available
- **Zoho Module**: `Tasks`
- **Fields File**: `zoho-exports/fields_Tasks.json`
- **Purpose**: Task/to-do items
- **Priority**: **LOW** - May need ActivityLog model extension

### Other Modules

#### 22. **Vendors**
- **Status**: Available
- **Zoho Module**: `Vendors`
- **Fields File**: `zoho-exports/fields_Vendors.json`
- **Purpose**: External vendors
- **Priority**: **LOW** - May not be needed if using QuickBooks

#### 23. **Agent_Contacts**
- **Status**: Available
- **Zoho Module**: `Agent_Contacts`
- **Fields File**: `zoho-exports/fields_Agent_Contacts.json`
- **Purpose**: Agent contact information
- **Related To**: `Agent` entity
- **Priority**: **LOW** - Likely redundant with Agent fields

#### 24. **Profit_Dividend_Payments**
- **Status**: Available
- **Zoho Module**: `Profit_Dividend_Payments`
- **Fields File**: `zoho-exports/fields_Profit_Dividend_Payments.json`
- **Purpose**: Profit/dividend payment tracking
- **Priority**: **LOW** - May need custom handling

#### 25. **Referral_Partners**
- **Status**: Available
- **Zoho Module**: `Referral_Partners`
- **Fields File**: `zoho-exports/fields_Referral_Partners.json`
- **Purpose**: Referral partner information
- **Priority**: **LOW**

#### 26. **Trainings**
- **Status**: Available
- **Zoho Module**: `Trainings`
- **Fields File**: `zoho-exports/fields_Trainings.json`
- **Purpose**: Training records
- **Priority**: **LOW**

#### 27. **Payments**
- **Status**: Available
- **Zoho Module**: `Payments`
- **Fields File**: `zoho-exports/fields_Payments.json`
- **Purpose**: Payment records
- **Priority**: **LOW** - May overlap with Commission_Payments

#### 28. **Subform_1, Test_of_Subform**
- **Status**: Available but likely test/unused modules
- **Priority**: **SKIP** - Appear to be test modules

#### 29. **Transactions_NEW**
- **Status**: Available but deprecated
- **Zoho Module**: `Transactions_NEW`
- **Fields File**: `zoho-exports/fields_Transactions_NEW.json`
- **Notes**: **DO NOT USE** - Use `Deals` module instead. This module is deprecated.

## Recommended Import Order

1. **Members** or **Accounts** (Agents) - HIGH PRIORITY
2. **Listings** - HIGH PRIORITY
3. **Commission_Payments** - HIGH PRIORITY
4. **Leads** or **Contacts** (if Contact entity is being used) - MEDIUM PRIORITY
5. Subform modules (Payment_Particpants, Payment_Items, Commission_Items) - MEDIUM PRIORITY
6. Other modules as needed - LOW PRIORITY

## Import Script Pattern

Each import script should follow the pattern established in `scripts/fetch-zoho-transactions.js`:

- Handle Zoho's 50-field limit per request
- Map Zoho field names to Prisma schema fields
- Handle data type conversions (dates, decimals, enums)
- Upsert records (create if new, update if exists)
- Support pagination for large datasets
- Handle Zoho API authentication (access token)

## Notes

- The Zoho API has a limit of **50 fields per request**. When importing, you'll need to carefully select which fields to fetch in each API call.
- Field mappings are defined in `src/app/api/admin/import-formulas-from-exports/route.ts` in the `moduleMap` object.
- Use the field definition files in `zoho-exports/fields_*.json` to understand available fields for each module.
- Test imports with small batches first before importing full datasets.

