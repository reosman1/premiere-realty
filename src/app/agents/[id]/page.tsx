"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Edit,
  Home,
  FileText,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { formatCurrency, getInitials, formatDate, getStatusColor } from "@/lib/utils"
import { getAgentSummaryFields } from "@/lib/field-preferences"

// Field definitions for formatting (always show values, even if null/zero)
const fieldDefinitions: Record<string, { format?: (v: any) => string; label?: string }> = {
  name: { label: "Name" },
  email: { label: "Email" },
  status: { label: "Status" },
  memberLevel: { label: "Member Level" },
  hireDate: { label: "Hire Date", format: (v) => v ? formatDate(v) : "—" },
  preCapSplitToAgent: { label: "Pre-Cap Split %", format: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  teamCapAmount: { label: "Team Cap Amount", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  // Add more common fields
  phone: { label: "Phone" },
  city: { label: "City" },
  state: { label: "State" },
  postCapSplitToAgent: { label: "Post-Cap Split %", format: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  brokerageCapAmount: { label: "Brokerage Cap Amount", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  monthlyMemberFee: { label: "Monthly Member Fee", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  balanceDue: { label: "Balance Due", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summaryFields, setSummaryFields] = useState<any[]>([])

  // Load agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}`)
        const data = await response.json()
        if (response.ok) {
          setAgent(data)
        }
      } catch (error) {
        console.error("Error fetching agent:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (agentId) {
      fetchAgent()
    }
  }, [agentId])

  // Load summary field preferences
  useEffect(() => {
    setSummaryFields(getAgentSummaryFields())
  }, [])

  // Helper to get field value
  const getFieldValue = (fieldName: string): any => {
    if (!agent) return null
    const parts = fieldName.split('.')
    let value: any = agent
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined || value === null) return null
    }
    return value
  }

  // Helper to format field value (always show something, even if null/zero)
  const formatFieldValue = (fieldName: string, value: any): string => {
    const def = fieldDefinitions[fieldName]
    if (def?.format) {
      return def.format(value)
    }
    if (value === null || value === undefined || value === "") return "—"
    // Show zero values as "0" instead of hiding them
    if (value === 0 || value === "0") return "0"
    return String(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-zinc-400">Agent not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const addressLine = [agent.street, agent.city, agent.state, agent.zipcode]
    .filter(Boolean).join(", ")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={agent.name} />
            ) : (
              <span className="text-xl">{getInitials(agent.name)}</span>
            )}
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-white">{agent.name || "Agent"}</h1>
            <p className="mt-1 text-zinc-400">{agent.email || "No email"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(agent.status)}>
            {agent.status || "Unknown"}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/agents/${agentId}/fields`)}>
            View All Fields
          </Button>
          <Button variant="outline" onClick={() => router.push(`/agents/${agentId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Summary Fields Section */}
      {summaryFields.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              Summary Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaryFields.map((fieldPref) => {
                const value = getFieldValue(fieldPref.field)
                const formattedValue = formatFieldValue(fieldPref.field, value)
                const hasValue = value !== null && value !== undefined && value !== "" && value !== 0
                
                return (
                  <div key={fieldPref.field} className="space-y-1">
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      {fieldPref.displayName || fieldDefinitions[fieldPref.field]?.label || fieldPref.field}
                    </div>
                    <div className={`text-sm font-medium ${hasValue ? "text-white" : "text-zinc-500 italic"}`}>
                      {formattedValue}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-zinc-400" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-300">{agent.email || "—"}</span>
            </div>
            {agent.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">{agent.phone}</span>
              </div>
            )}
            {addressLine && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                <span className="text-zinc-300">{addressLine}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-zinc-400" />
              Employment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-zinc-400">Status</span>
              <Badge className={getStatusColor(agent.status)}>
                {agent.status || "—"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Member Level</span>
              <span className="text-zinc-300">{agent.memberLevel || "—"}</span>
            </div>
            {agent.hireDate && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Hire Date</span>
                <span className="text-zinc-300">{formatDate(agent.hireDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission Structure */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-zinc-400" />
            Commission Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-zinc-400 mb-1">Pre-Cap Split</div>
              <div className="text-lg font-semibold text-white">
                {agent.preCapSplitToAgent !== null && agent.preCapSplitToAgent !== undefined 
                  ? `${agent.preCapSplitToAgent}%` 
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">Post-Cap Split</div>
              <div className="text-lg font-semibold text-white">
                {agent.postCapSplitToAgent !== null && agent.postCapSplitToAgent !== undefined 
                  ? `${agent.postCapSplitToAgent}%` 
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">Per Transaction Fee</div>
              <div className="text-lg font-semibold text-white">
                {agent.perTransactionFee !== null && agent.perTransactionFee !== undefined 
                  ? formatCurrency(agent.perTransactionFee) 
                  : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cap Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Team Cap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-zinc-400">Cap Amount</span>
              <span className="text-zinc-300">
                {agent.teamCapAmount !== null && agent.teamCapAmount !== undefined 
                  ? formatCurrency(agent.teamCapAmount) 
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Amount Paid</span>
              <span className="text-zinc-300">
                {agent.teamCapAmountPaid !== null && agent.teamCapAmountPaid !== undefined 
                  ? formatCurrency(agent.teamCapAmountPaid) 
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Capped</span>
              <Badge variant={agent.cappedWithTeam ? "default" : "secondary"}>
                {agent.cappedWithTeam ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Brokerage Cap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-zinc-400">Cap Amount</span>
              <span className="text-zinc-300">
                {agent.brokerageCapAmount !== null && agent.brokerageCapAmount !== undefined 
                  ? formatCurrency(agent.brokerageCapAmount) 
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Amount Paid</span>
              <span className="text-zinc-300">
                {agent.brokerageCapAmountPaid !== null && agent.brokerageCapAmountPaid !== undefined 
                  ? formatCurrency(agent.brokerageCapAmountPaid) 
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Capped</span>
              <Badge variant={agent.cappedWithBrokerage ? "default" : "secondary"}>
                {agent.cappedWithBrokerage ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
