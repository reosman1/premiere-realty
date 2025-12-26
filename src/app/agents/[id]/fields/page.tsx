"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { 
  getAgentSummaryFields, 
  addAgentFieldToSummary, 
  removeAgentFieldFromSummary,
  isAgentFieldVisibleOnSummary
} from "@/lib/field-preferences"

// All available Agent fields from Prisma schema
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

const agentFields: FieldDef[] = [
  // External IDs
  { category: "External IDs", field: "zohoId", type: "String", required: false },
  { category: "External IDs", field: "rezenId", type: "String (unique)", required: false },
  { category: "External IDs", field: "stripeId", type: "String", required: false },
  { category: "External IDs", field: "qbVendorId", type: "String", required: false },
  { category: "External IDs", field: "qbVendorName", type: "String", required: false },
  
  // Personal Info
  { category: "Personal Info", field: "name", type: "String", required: true },
  { category: "Personal Info", field: "legalName", type: "String", required: false },
  { category: "Personal Info", field: "email", type: "String (unique)", required: true },
  { category: "Personal Info", field: "personalEmail", type: "String", required: false },
  { category: "Personal Info", field: "workEmail", type: "String", required: false },
  { category: "Personal Info", field: "phone", type: "String", required: false },
  { category: "Personal Info", field: "avatarUrl", type: "String", required: false },
  
  // Address
  { category: "Address", field: "street", type: "String", required: false },
  { category: "Address", field: "city", type: "String", required: false },
  { category: "Address", field: "state", type: "String", required: false },
  { category: "Address", field: "zipcode", type: "String", required: false },
  { category: "Address", field: "county", type: "String", required: false },
  { category: "Address", field: "country", type: "String", required: false },
  
  // Professional Info
  { category: "Professional Info", field: "licenseNumber", type: "String", required: false },
  { category: "Professional Info", field: "licenseExpiry", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Professional Info", field: "website", type: "String", required: false },
  
  // Employment
  { category: "Employment", field: "status", type: "AgentStatus (enum)", required: true },
  { category: "Employment", field: "memberLevel", type: "MemberLevel (enum)", required: true },
  { category: "Employment", field: "hireDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Employment", field: "departureDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Employment", field: "firstClosingDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Employment", field: "daysToFirstClose", type: "Int", required: false },
  { category: "Employment", field: "career", type: "Career (enum)", required: false },
  
  // Commission Structure
  { category: "Commission Structure", field: "preCapSplitToAgent", type: "Decimal (5,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  { category: "Commission Structure", field: "postCapSplitToAgent", type: "Decimal (5,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  { category: "Commission Structure", field: "perTransactionFee", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  
  // Cap Tracking - Team
  { category: "Cap Tracking - Team", field: "teamCapAmount", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Cap Tracking - Team", field: "teamCapAmountPaid", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Cap Tracking - Team", field: "cappedWithTeam", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Cap Tracking - Team", field: "teamAnniversaryDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Cap Tracking - Team", field: "nextTeamAnniversary", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Cap Tracking - Team", field: "lastAnniversaryDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  
  // Cap Tracking - Brokerage
  { category: "Cap Tracking - Brokerage", field: "brokerageCapAmount", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Cap Tracking - Brokerage", field: "brokerageCapAmountPaid", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Cap Tracking - Brokerage", field: "cappedWithBrokerage", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Cap Tracking - Brokerage", field: "brokerageAnniversaryDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  
  // Roles / Flags
  { category: "Roles / Flags", field: "isActiveSponsor", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Roles / Flags", field: "isActiveTeamLeader", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Roles / Flags", field: "isActiveDirector", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Roles / Flags", field: "isActiveMentor", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Roles / Flags", field: "isActiveGrowthLeader", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Roles / Flags", field: "enrolledInMentorship", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  
  // Mentorship
  { category: "Mentorship", field: "mentorAssignmentDate", type: "DateTime", required: false, formatValue: (v) => v ? formatDate(v) : "—" },
  { category: "Mentorship", field: "dealsAsMentee", type: "Int", required: false },
  
  // Stats
  { category: "Stats", field: "dealsPriorToPG", type: "Int", required: false },
  { category: "Stats", field: "dealsWithPG", type: "Int", required: false },
  { category: "Stats", field: "monthsWithFirm", type: "Int", required: false },
  { category: "Stats", field: "daysWithFirm", type: "Int", required: false },
  { category: "Stats", field: "yearsWithFirm", type: "Int", required: false },
  
  // Billing
  { category: "Billing", field: "paysMonthlyMemberFee", type: "Boolean", required: false, formatValue: (v) => v ? "Yes" : "No" },
  { category: "Billing", field: "monthlyMemberFee", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Billing", field: "balanceDue", type: "Decimal (12,2)", required: false, formatValue: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  { category: "Billing", field: "defaultPaymentMethod", type: "String", required: false },
  { category: "Billing", field: "subscription", type: "String", required: false },
  
  // Emergency Contact
  { category: "Emergency Contact", field: "emContactName", type: "String", required: false },
  { category: "Emergency Contact", field: "emContactPhone", type: "String", required: false },
  
  // VA/Assistant
  { category: "VA/Assistant", field: "vaAssistantName", type: "String", required: false },
  { category: "VA/Assistant", field: "vaAssistantEmail", type: "String", required: false },
  
  // Notes
  { category: "Notes", field: "notes", type: "Text", required: false },
]

export default function AgentFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  
  // Load visible fields from preferences
  useEffect(() => {
    const summaryFields = getAgentSummaryFields()
    setVisibleFields(new Set(summaryFields.map(f => f.field)))
  }, [])
  
  // Fetch agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}`)
        const data = await response.json()
        
        if (response.ok) {
          setAgent(data)
        } else {
          setError(data.error || "Failed to load agent")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load agent")
      } finally {
        setLoading(false)
      }
    }

    if (agentId) {
      fetchAgent()
    }
  }, [agentId])

  // Handle toggle field visibility
  const toggleFieldVisibility = (fieldName: string, category: string) => {
    const isVisible = visibleFields.has(fieldName)
    
    if (isVisible) {
      removeAgentFieldFromSummary(fieldName)
      setVisibleFields(prev => {
        const next = new Set(prev)
        next.delete(fieldName)
        return next
      })
    } else {
      const fieldDef = agentFields.find(f => f.field === fieldName)
      const displayName = fieldDef?.field || fieldName
      addAgentFieldToSummary(fieldName, category, displayName)
      setVisibleFields(prev => new Set([...prev, fieldName]))
    }
  }

  const fieldsByCategory = agentFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, FieldDef[]>)

  // Helper to get field value from agent
  const getFieldValue = (fieldName: string): any => {
    if (!agent) return null
    
    // Handle nested fields (e.g., teamLeader.name)
    const parts = fieldName.split('.')
    let value: any = agent
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
              {agent ? `${agent.name || "Agent"} - Field Values` : "Agent Fields Reference"}
            </h1>
            <p className="mt-1 text-zinc-400">
              {agent ? "All fields and their values for this agent" : "All available fields for Agent records"}
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
            <p className="text-zinc-400">Loading agent fields...</p>
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
          update the detail and edit page components.
        </p>
      </div>
    </div>
  )
}
