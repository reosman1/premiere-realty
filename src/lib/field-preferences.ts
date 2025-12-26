/**
 * Field Preferences Utility
 * Manages which fields are visible on summary/detail pages for all entity types
 */

const STORAGE_KEYS = {
  transaction: 'transaction_summary_fields',
  agent: 'agent_summary_fields',
  listing: 'listing_summary_fields',
  commission: 'commission_summary_fields',
} as const

export type EntityType = 'transaction' | 'agent' | 'listing' | 'commission'

export interface FieldPreference {
  field: string
  category: string
  displayName?: string
  order?: number
}

// Generic functions that work for any entity type
function getStorageKey(entityType: EntityType): string {
  return STORAGE_KEYS[entityType]
}

function getSummaryFieldsForEntity(entityType: EntityType): FieldPreference[] {
  if (typeof window === 'undefined') return []
  
  try {
    const storageKey = getStorageKey(entityType)
    const stored = localStorage.getItem(storageKey)
    if (!stored) return getDefaultSummaryFields(entityType)
    
    const fields = JSON.parse(stored) as FieldPreference[]
    // Sort by order if available
    return fields.sort((a, b) => (a.order || 999) - (b.order || 999))
  } catch (error) {
    console.error(`Error reading field preferences for ${entityType}:`, error)
    return getDefaultSummaryFields(entityType)
  }
}

function getDefaultSummaryFields(entityType: EntityType): FieldPreference[] {
  switch (entityType) {
    case 'transaction':
      return [
        { field: 'name', category: 'Transaction Info', order: 1 },
        { field: 'amount', category: 'Transaction Info', order: 2 },
        { field: 'grossCommissionGCI', category: 'Commission', order: 3 },
        { field: 'commissionPct', category: 'Commission', order: 4 },
        { field: 'type', category: 'Type & Stage', order: 5 },
        { field: 'stage', category: 'Type & Stage', order: 6 },
        { field: 'contractAcceptanceDate', category: 'Dates', order: 7 },
        { field: 'actualClosingDate', category: 'Dates', order: 8 },
        { field: 'brokerTransactionId', category: 'External IDs', order: 9 },
      ]
    case 'agent':
      return [
        { field: 'name', category: 'Personal Info', order: 1 },
        { field: 'email', category: 'Personal Info', order: 2 },
        { field: 'status', category: 'Employment', order: 3 },
        { field: 'memberLevel', category: 'Employment', order: 4 },
        { field: 'hireDate', category: 'Employment', order: 5 },
        { field: 'preCapSplitToAgent', category: 'Commission Structure', order: 6 },
        { field: 'teamCapAmount', category: 'Cap Tracking - Team', order: 7 },
      ]
    case 'listing':
      return [
        { field: 'listingName', category: 'Property Details', order: 1 },
        { field: 'listingPrice', category: 'Pricing', order: 2 },
        { field: 'listingCommissionPct', category: 'Commissions', order: 3 },
        { field: 'stage', category: 'Status', order: 4 },
        { field: 'listingDate', category: 'Dates', order: 5 },
        { field: 'city', category: 'Address', order: 6 },
        { field: 'state', category: 'Address', order: 7 },
      ]
    case 'commission':
      return [
        { field: 'amount', category: 'Payment Info', order: 1 },
        { field: 'status', category: 'Payment Info', order: 2 },
        { field: 'dateEarned', category: 'Dates', order: 3 },
        { field: 'datePaid', category: 'Dates', order: 4 },
        { field: 'paymentType', category: 'Payment Info', order: 5 },
      ]
    default:
      return []
  }
}

function addFieldToSummaryForEntity(
  entityType: EntityType,
  field: string,
  category: string,
  displayName?: string
): void {
  if (typeof window === 'undefined') return
  
  try {
    const currentFields = getSummaryFieldsForEntity(entityType)
    
    // Don't add if already exists
    if (currentFields.some(f => f.field === field)) return
    
    const newField: FieldPreference = {
      field,
      category,
      displayName,
      order: currentFields.length + 1,
    }
    
    const updatedFields = [...currentFields, newField]
    const storageKey = getStorageKey(entityType)
    localStorage.setItem(storageKey, JSON.stringify(updatedFields))
  } catch (error) {
    console.error(`Error saving field preference for ${entityType}:`, error)
  }
}

function removeFieldFromSummaryForEntity(entityType: EntityType, fieldName: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const currentFields = getSummaryFieldsForEntity(entityType)
    const updatedFields = currentFields.filter(f => f.field !== fieldName)
    const storageKey = getStorageKey(entityType)
    localStorage.setItem(storageKey, JSON.stringify(updatedFields))
  } catch (error) {
    console.error(`Error removing field preference for ${entityType}:`, error)
  }
}

// Transaction-specific exports (for backward compatibility)
export function getSummaryFields(): FieldPreference[] {
  return getSummaryFieldsForEntity('transaction')
}

export function isFieldVisibleOnSummary(fieldName: string): boolean {
  return isFieldVisibleOnSummaryForEntity('transaction', fieldName)
}

export function addFieldToSummary(field: string, category: string, displayName?: string): void {
  addFieldToSummaryForEntity('transaction', field, category, displayName)
}

export function removeFieldFromSummary(fieldName: string): void {
  removeFieldFromSummaryForEntity('transaction', fieldName)
}

// Agent-specific exports
export function getAgentSummaryFields(): FieldPreference[] {
  return getSummaryFieldsForEntity('agent')
}

export function isAgentFieldVisibleOnSummary(fieldName: string): boolean {
  return isFieldVisibleOnSummaryForEntity('agent', fieldName)
}

export function addAgentFieldToSummary(field: string, category: string, displayName?: string): void {
  addFieldToSummaryForEntity('agent', field, category, displayName)
}

export function removeAgentFieldFromSummary(fieldName: string): void {
  removeFieldFromSummaryForEntity('agent', fieldName)
}

// Listing-specific exports
export function getListingSummaryFields(): FieldPreference[] {
  return getSummaryFieldsForEntity('listing')
}

export function isListingFieldVisibleOnSummary(fieldName: string): boolean {
  return isFieldVisibleOnSummaryForEntity('listing', fieldName)
}

export function addListingFieldToSummary(field: string, category: string, displayName?: string): void {
  addFieldToSummaryForEntity('listing', field, category, displayName)
}

export function removeListingFieldFromSummary(fieldName: string): void {
  removeFieldFromSummaryForEntity('listing', fieldName)
}

// Commission-specific exports
export function getCommissionSummaryFields(): FieldPreference[] {
  return getSummaryFieldsForEntity('commission')
}

export function isCommissionFieldVisibleOnSummary(fieldName: string): boolean {
  return isFieldVisibleOnSummaryForEntity('commission', fieldName)
}

export function addCommissionFieldToSummary(field: string, category: string, displayName?: string): void {
  addFieldToSummaryForEntity('commission', field, category, displayName)
}

export function removeCommissionFieldFromSummary(fieldName: string): void {
  removeFieldFromSummaryForEntity('commission', fieldName)
}

// Generic helper functions
export function isFieldVisibleOnSummaryForEntity(entityType: EntityType, fieldName: string): boolean {
  const summaryFields = getSummaryFieldsForEntity(entityType)
  return summaryFields.some(f => f.field === fieldName)
}

export function updateFieldOrder(fields: FieldPreference[]): void {
  updateFieldOrderForEntity('transaction', fields)
}

export function updateFieldOrderForEntity(entityType: EntityType, fields: FieldPreference[]): void {
  if (typeof window === 'undefined') return
  
  try {
    const orderedFields = fields.map((f, index) => ({ ...f, order: index + 1 }))
    const storageKey = getStorageKey(entityType)
    localStorage.setItem(storageKey, JSON.stringify(orderedFields))
  } catch (error) {
    console.error(`Error updating field order for ${entityType}:`, error)
  }
}

