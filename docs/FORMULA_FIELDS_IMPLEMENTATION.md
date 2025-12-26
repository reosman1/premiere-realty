# Formula Fields Implementation Plan

## Overview

This document outlines the implementation of formula field functionality to replace Zoho's formula capabilities. This will allow users to create, view, edit, and execute formula fields directly in the CRM.

## Requirements

1. **Formula Field Management**
   - Create formula fields with expressions
   - View existing formulas
   - Edit formula expressions
   - Delete formula fields

2. **Formula Execution**
   - Evaluate formulas when displaying records
   - Support field references (e.g., `Amount * Commission`)
   - Support mathematical operations
   - Support subform aggregations (SUM, COUNT, etc.)

3. **UI Components**
   - Formula editor with syntax highlighting
   - Field reference picker
   - Formula tester/preview
   - Formula field list

## Database Schema

### Formula Field Definition Table

```prisma
model FormulaField {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Field Identification
  entityType  String   // "Transaction", "Agent", "Listing", "CommissionPayment"
  fieldName   String   // Unique field name (e.g., "totalPayments", "grossCommissionGCI")
  displayName String   // Human-readable label
  
  // Formula Definition
  formulaExpression String @db.Text // The formula expression (e.g., "Amount * Commission / 100")
  returnType        String // "currency", "number", "text", "date", "boolean"
  decimalPlaces     Int?   @default(2) // For currency/number types
  
  // Formula Metadata
  description       String? @db.Text
  isActive          Boolean @default(true)
  isReadOnly        Boolean @default(true) // Formulas are always read-only
  
  // Relationships
  entityTypeField   String // Which entity type this applies to
  
  @@unique([entityType, fieldName])
  @@index([entityType])
}
```

## Implementation Phases

### Phase 1: Formula Field Definition & Storage
- [x] Database schema for formula fields
- [ ] API endpoints for CRUD operations
- [ ] Admin UI for managing formula fields

### Phase 2: Formula Parser & Evaluator
- [ ] Formula expression parser
- [ ] Field reference resolver
- [ ] Mathematical expression evaluator
- [ ] Type conversion and validation

### Phase 3: Formula Execution Integration
- [ ] Execute formulas when fetching records
- [ ] Cache calculated values (optional)
- [ ] Handle circular dependencies

### Phase 4: UI Components
- [ ] Formula field list/management page
- [ ] Formula editor component
- [ ] Field reference picker
- [ ] Formula tester/preview

## Formula Syntax

### Supported Operations
- Arithmetic: `+`, `-`, `*`, `/`, `%` (modulo)
- Comparisons: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Functions: `SUM()`, `COUNT()`, `AVG()`, `MAX()`, `MIN()`, `IF()`, `ROUND()`

### Field References
- Direct fields: `Amount`, `Commission`, `Stage`
- Related fields: `Agent.name`, `Transaction.amount`
- Subform aggregations: `Payment_Particpants.SUM(amount)`

### Example Formulas

```
// Simple calculation
Amount * Commission / 100

// Conditional
IF(Stage == "CLOSED", Amount * 0.03, Amount * 0.025)

// Subform sum
SUM(Payment_Particpants.amount)

// Complex calculation
(Amount * Commission / 100) + Firm_Admin_Fee - Discount
```

## API Endpoints

### Formula Field Management
```
GET    /api/formula-fields?entityType=Transaction
POST   /api/formula-fields
GET    /api/formula-fields/:id
PUT    /api/formula-fields/:id
DELETE /api/formula-fields/:id
POST   /api/formula-fields/:id/test  // Test formula with sample data
```

### Formula Execution
Formulas are executed automatically when fetching records, but can also be tested:
```
POST   /api/formula-fields/:id/evaluate
Body: { recordData: {...} }
```

## Libraries/Approaches

### Option 1: Custom Parser (Recommended for Control)
- Build a simple expression parser
- More control over syntax and features
- Can customize for our specific needs

### Option 2: Use Expression Evaluation Library
- Libraries like `expr-eval` or `mathjs`
- Faster to implement
- Less control over syntax

### Option 3: Formula DSL
- Create a domain-specific language
- Most flexible
- Most complex to implement

**Recommendation:** Start with Option 2 (expr-eval) for MVP, then consider Option 1 for more control later.

## Security Considerations

1. **Formula Validation**
   - Validate formula syntax before saving
   - Prevent infinite loops
   - Check for circular dependencies

2. **Access Control**
   - Who can create/edit formulas? (Admin only?)
   - Restrict field access in formulas based on permissions

3. **Error Handling**
   - Graceful handling of invalid formulas
   - Error messages for users
   - Logging formula evaluation errors

## Migration Strategy

1. **Import Existing Zoho Formulas**
   - Fetch formulas from Zoho API
   - Migrate to our formula format
   - Test each formula

2. **Backward Compatibility**
   - Keep Zoho formula fields working during transition
   - Gradually migrate to custom formulas

3. **Data Migration**
   - Calculate values for all existing records
   - Store in database or calculate on-demand

## Next Steps

1. Create database schema for formula fields
2. Build API endpoints for formula management
3. Implement basic formula evaluator
4. Create admin UI for managing formulas
5. Integrate formula execution into record fetching

