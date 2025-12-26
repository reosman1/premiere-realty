"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { 
  isFieldVisibleOnSummary, 
  addFieldToSummary, 
  removeFieldFromSummary,
  getSummaryFields 
} from "@/lib/field-preferences"

// All available Transaction fields from Prisma schema
type FieldDef = {
  category: string
  field: string
  type: string
  required: boolean
  isFormula?: boolean
  readOnly?: boolean
  description?: string
  formatValue?: (value: any) => string // Function to format the value for display
}

const transactionFields: FieldDef[] = [
  // External IDs
  { category: "External IDs", field: "zohoId", type: "String", required: false },
  { category: "External IDs", field: "rezenId", type: "String (unique)", required: false },
  { category: "External IDs", field: "brokerTransactionId", type: "String", required: false },
  { category: "External IDs", field: "brokerTransactionCode", type: "String", required: false },
  { category: "External IDs", field: "transactionCode", type: "String", required: false },
  
  // Transaction Info
  { category: "Transaction Info", field: "name", type: "String", required: true },
  { category: "Transaction Info", field: "email", type: "String", required: false },
  { category: "Transaction Info", field: "amount", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  
  // Type & Stage
  { category: "Type & Stage", field: "type", type: "TransactionType (enum)", required: false },
  { category: "Type & Stage", field: "stage", type: "TransactionStage (enum)", required: true },
  { category: "Type & Stage", field: "status", type: "String", required: false },
  { category: "Type & Stage", field: "statusDetails", type: "String", required: false },
  { category: "Type & Stage", field: "brokerDealType", type: "BrokerDealType (enum)", required: false },
  { category: "Type & Stage", field: "firmDeal", type: "FirmDealStatus (enum)", required: false },
  { category: "Type & Stage", field: "lifecycleState", type: "String", required: false },
  
  // Commission
  { category: "Commission", field: "commissionPct", type: "Decimal (5,3)", required: false, formatValue: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  { category: "Commission", field: "commissionFlatFee", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Commission", field: "grossCommissionGCI", type: "Decimal (12,2)", required: false, isFormula: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Commission", field: "grossCommissionAmount", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Commission", field: "grossCommissionPercentage", type: "Decimal (5,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  { category: "Commission", field: "agentSplitPercent", type: "Decimal (5,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  { category: "Commission", field: "brokerCompanyCommission", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Commission", field: "firmAdminFee", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Commission", field: "totalPayments", type: "Decimal (12,2)", required: false, isFormula: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  
  // Zoho Formula Fields (calculated, read-only)
  { category: "Zoho Formula Fields", field: "Total_Payments", type: "Formula (Currency)", required: false, isFormula: true, readOnly: true, description: "Sum of payment amounts from Payment_Particpants subform" },
  { category: "Zoho Formula Fields", field: "Gross_Commission_Income_GCI", type: "Formula (Currency)", required: false, isFormula: true, readOnly: true, description: "Calculated gross commission income" },
  
  // Dates
  { category: "Dates", field: "contractAcceptanceDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Dates", field: "estimatedClosingDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Dates", field: "actualClosingDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  
  // QuickBooks Integration
  { category: "QuickBooks", field: "quickbooksId", type: "String", required: false },
  { category: "QuickBooks", field: "quickbooksTransactionName", type: "String", required: false },
  { category: "QuickBooks", field: "quickbooksInvoiceLink", type: "String", required: false },
  
  // Payer Info
  { category: "Payer Info", field: "cdPayerName", type: "String", required: false },
  { category: "Payer Info", field: "cdPayerBusinessEntity", type: "String", required: false },
  { category: "Payer Info", field: "payerName", type: "String", required: false },
  { category: "Payer Info", field: "payerEmail", type: "String", required: false },
  { category: "Payer Info", field: "payerPhone", type: "String", required: false },
  { category: "Payer Info", field: "payerCompany", type: "String", required: false },
  { category: "Payer Info", field: "payerRole", type: "String", required: false },
  
  // Address
  { category: "Address", field: "addressOneLine", type: "String", required: false },
  { category: "Address", field: "streetAddress", type: "String", required: false },
  { category: "Address", field: "city", type: "String", required: false },
  { category: "Address", field: "state", type: "String", required: false },
  { category: "Address", field: "zipCode", type: "String", required: false },
  { category: "Address", field: "county", type: "String", required: false },
  { category: "Address", field: "country", type: "String", required: false },
  { category: "Address", field: "unitApartmentNumber", type: "String", required: false },
  
  // Flags
  { category: "Flags", field: "personalDeal", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Flags", field: "firmOwnedLead", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Flags", field: "haltSyncWithBroker", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Flags", field: "haltSyncWithFirmAuto", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Flags", field: "overrideAllAutomations", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Flags", field: "disableSplitAutomation", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  
  // Source
  { category: "Source", field: "leadSource", type: "String", required: false },
  { category: "Source", field: "transactionSupportRep", type: "String", required: false },
  { category: "Source", field: "office", type: "String", required: false },
  
  // Links
  { category: "Links", field: "brokerListingLink", type: "String", required: false },
  { category: "Links", field: "brokerTransactionLink", type: "String", required: false },
]

export default function TransactionFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.id as string
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  
  // Load visible fields from preferences
  useEffect(() => {
    const summaryFields = getSummaryFields()
    setVisibleFields(new Set(summaryFields.map(f => f.field)))
  }, [])
  
  // Handle toggle field visibility
  const toggleFieldVisibility = (fieldName: string, category: string) => {
    const isVisible = visibleFields.has(fieldName)
    
    if (isVisible) {
      removeFieldFromSummary(fieldName)
      setVisibleFields(prev => {
        const next = new Set(prev)
        next.delete(fieldName)
        return next
      })
    } else {
      // Get display name from field definition
      const fieldDef = transactionFields.find(f => f.field === fieldName)
      const displayName = fieldDef?.field || fieldName
      addFieldToSummary(fieldName, category, displayName)
      setVisibleFields(prev => new Set([...prev, fieldName]))
    }
  }

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`)
        const data = await response.json()
        
        if (response.ok) {
          setTransaction(data)
        } else {
          setError(data.error || "Failed to load transaction")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load transaction")
      } finally {
        setLoading(false)
      }
    }

    if (transactionId) {
      fetchTransaction()
    }
  }, [transactionId])

  const fieldsByCategory = transactionFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, FieldDef[]>)

  // Helper to get field value from transaction
  const getFieldValue = (fieldName: string): any => {
    if (!transaction) return null
    
    // Handle nested fields (e.g., agent.name)
    const parts = fieldName.split('.')
    let value: any = transaction
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined || value === null) return null
    }
    return value
  }

  // Helper to format field value for display
  const formatFieldValue = (field: FieldDef, value: any): string => {
    if (value === null || value === undefined) return "—"
    
    if (field.formatValue) {
      return field.formatValue(value)
    }
    
    // Default formatting based on type
    if (field.type.includes("Decimal") || field.type.includes("currency")) {
      return formatCurrency(value)
    }
    if (field.type.includes("DateTime") || field.type.includes("Date")) {
      return formatDate(value)
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2)
    }
    
    return String(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {transaction ? `${transaction.name || "Transaction"} - Field Values` : "Transaction Fields Reference"}
            </h1>
            <p className="mt-1 text-zinc-400">
              {transaction ? "All fields and their values for this transaction" : "All available fields for Transaction records"}
            </p>
            <p className="mt-1 text-sm text-amber-400">
              💡 Click the star icon to add/remove fields from the Summary page
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-400">Loading transaction fields...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-6">
            <p className="text-red-400">Error: {error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(fieldsByCategory).map(([category, fields]) => {
            // Only show categories that have at least one field with a value (or show all if transaction exists)
            const hasValues = transaction && fields.some(field => {
              const value = getFieldValue(field.field)
              return value !== null && value !== undefined && value !== ""
            })
            
            return (
              <Card key={category} className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fields.map((field) => {
                      const value = getFieldValue(field.field)
                      const formattedValue = formatFieldValue(field, value)
                      const hasValue = value !== null && value !== undefined && value !== ""
                      
                      return (
                        <div
                          key={field.field}
                          className={`flex items-start justify-between rounded-lg border p-3 ${
                            field.isFormula 
                              ? "border-purple-500/30 bg-purple-500/10" 
                              : "border-zinc-800 bg-zinc-900/30"
                          } ${!hasValue ? "opacity-60" : ""}`}
                        >
                          <div className="flex flex-col gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <code className="text-sm font-mono text-amber-400 break-all">{field.field}</code>
                              <span className="text-sm text-zinc-400">{field.type}</span>
                              {field.isFormula && (
                                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                                  Formula
                                </Badge>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-zinc-500">{field.description}</p>
                            )}
                            <div className="mt-1">
                              <span className={`text-sm font-medium ${hasValue ? "text-white" : "text-zinc-500"}`}>
                                {formattedValue}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFieldVisibility(field.field, field.category)
                              }}
                              title={visibleFields.has(field.field) ? "Remove from summary" : "Add to summary"}
                            >
                              {visibleFields.has(field.field) ? (
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-zinc-500" />
                              )}
                            </Button>
                            {field.readOnly && (
                              <Badge variant="secondary" className="text-xs">Read-Only</Badge>
                            )}
                            {field.required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
        <p className="text-sm text-amber-400">
          <strong>Note:</strong> This is the complete list of fields available in the database schema. 
          Some fields may not be displayed in the detail/edit pages yet. To add more fields to the UI, 
          update the detail and edit page components. For Zoho-specific fields, check the zoho-exports/fields_Deals.json file.
        </p>
        <div className="mt-3 pt-3 border-t border-amber-500/20">
          <p className="text-sm text-amber-400 font-semibold mb-1">Formula Fields:</p>
          <p className="text-xs text-amber-400/80">
            Fields marked with "Formula" are calculated by Zoho and are read-only. 
            To view the actual formula expressions, use the Zoho API: 
            <code className="ml-1 px-1 py-0.5 bg-zinc-900 rounded text-amber-300">
              GET /settings/fields?module=Deals
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}

