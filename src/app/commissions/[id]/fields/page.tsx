"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { 
  getCommissionSummaryFields, 
  addCommissionFieldToSummary, 
  removeCommissionFieldFromSummary,
  isCommissionFieldVisibleOnSummary
} from "@/lib/field-preferences"

// All available Commission Payment fields from Prisma schema
type FieldDef = {
  category: string
  field: string
  type: string
  required: boolean
  isFormula?: boolean
  readOnly?: boolean
  description?: string
  formatValue?: (value: any) => string
}

const commissionFields: FieldDef[] = [
  // External IDs
  { category: "External IDs", field: "zohoId", type: "String", required: false },
  
  // Payment Info
  { category: "Payment Info", field: "amount", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Payment Info", field: "status", type: "PaymentStatus (enum)", required: true },
  { category: "Payment Info", field: "paymentType", type: "String", required: false },
  { category: "Payment Info", field: "dateEarned", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Payment Info", field: "datePaid", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  
  // QuickBooks Integration
  { category: "QuickBooks", field: "qbInvoiceId", type: "String", required: false },
  
  // Notes
  { category: "Notes", field: "notes", type: "Text", required: false },
]

export default function CommissionFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const commissionId = params.id as string
  const [commission, setCommission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  
  // Load visible fields from preferences
  useEffect(() => {
    const summaryFields = getCommissionSummaryFields()
    setVisibleFields(new Set(summaryFields.map(f => f.field)))
  }, [])
  
  // Fetch commission data
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const response = await fetch(`/api/commissions/${commissionId}`)
        const data = await response.json()
        
        if (response.ok) {
          setCommission(data)
        } else {
          setError(data.error || "Failed to load commission payment")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load commission payment")
      } finally {
        setLoading(false)
      }
    }

    if (commissionId) {
      fetchCommission()
    }
  }, [commissionId])

  // Handle toggle field visibility
  const toggleFieldVisibility = (fieldName: string, category: string) => {
    const isVisible = visibleFields.has(fieldName)
    
    if (isVisible) {
      removeCommissionFieldFromSummary(fieldName)
      setVisibleFields(prev => {
        const next = new Set(prev)
        next.delete(fieldName)
        return next
      })
    } else {
      const fieldDef = commissionFields.find(f => f.field === fieldName)
      const displayName = fieldDef?.field || fieldName
      addCommissionFieldToSummary(fieldName, category, displayName)
      setVisibleFields(prev => new Set([...prev, fieldName]))
    }
  }

  const fieldsByCategory = commissionFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, FieldDef[]>)

  // Helper to get field value from commission
  const getFieldValue = (fieldName: string): any => {
    if (!commission) return null
    
    // Handle nested fields (e.g., agent.name, transaction.name)
    const parts = fieldName.split('.')
    let value: any = commission
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
              {commission ? `Commission Payment - Field Values` : "Commission Payment Fields Reference"}
            </h1>
            <p className="mt-1 text-zinc-400">
              {commission ? "All fields and their values for this commission payment" : "All available fields for Commission Payment records"}
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
            <p className="text-zinc-400">Loading commission payment fields...</p>
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
          {Object.entries(fieldsByCategory).map(([category, fields]) => (
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
          ))}
        </div>
      )}

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
        <p className="text-sm text-amber-400">
          <strong>Note:</strong> This is the complete list of fields available in the database schema. 
          Some fields may not be displayed in the detail/edit pages yet. To add more fields to the UI, 
          update the detail and edit page components. For Zoho-specific fields, check the zoho-exports/fields_Commission_Payments.json file.
        </p>
      </div>
    </div>
  )
}
