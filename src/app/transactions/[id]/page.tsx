"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  FileText,
  Calendar,
  DollarSign,
  Edit,
  User,
  MapPin,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getStatusColor, getStageLabel } from "@/lib/utils"
import { getSummaryFields } from "@/lib/field-preferences"

// Field definitions for formatting (always show values, even if null/zero)
const fieldDefinitions: Record<string, { format?: (v: any) => string; label?: string; icon?: any }> = {
  name: { label: "Name" },
  amount: { label: "Amount", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  grossCommissionGCI: { label: "Gross Commission Income", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  commissionPct: { label: "Commission %", format: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  type: { label: "Transaction Type" },
  stage: { label: "Stage" },
  contractAcceptanceDate: { label: "Contract Date", format: (v) => v ? formatDate(v) : "—" },
  actualClosingDate: { label: "Closing Date", format: (v) => v ? formatDate(v) : "—" },
  brokerTransactionId: { label: "Broker Transaction ID" },
  // Add more common fields that might be added
  email: { label: "Email" },
  agentSplitPercent: { label: "Agent Split %", format: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  brokerCompanyCommission: { label: "Broker Company Commission", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  firmAdminFee: { label: "Firm Admin Fee", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  totalPayments: { label: "Total Payments", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  commissionFlatFee: { label: "Commission Flat Fee", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.id as string
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summaryFields, setSummaryFields] = useState<any[]>([])
  
  // Load transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`)
        const data = await response.json()
        if (response.ok) {
          setTransaction(data)
        }
      } catch (error) {
        console.error("Error fetching transaction:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (transactionId) {
      fetchTransaction()
    }
  }, [transactionId])
  
  // Load summary field preferences
  useEffect(() => {
    setSummaryFields(getSummaryFields())
  }, [])
  
  // Helper to get field value
  const getFieldValue = (fieldName: string): any => {
    if (!transaction) return null
    const parts = fieldName.split('.')
    let value: any = transaction
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
    if (value === null || value === undefined) return "—"
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
  
  if (!transaction) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-zinc-400">Transaction not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const addressOneLine = transaction.addressOneLine || 
    [transaction.streetAddress, transaction.city, transaction.state, transaction.zipCode]
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
          <div>
            <h1 className="text-3xl font-bold text-white">{transaction.name || "Transaction"}</h1>
            <p className="mt-1 text-zinc-400">{addressOneLine || "No address"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(transaction.stage)}>
            {getStageLabel(transaction.stage)}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/transactions/${transactionId}/fields`)}>
            View All Fields
          </Button>
          <Button variant="outline" onClick={() => router.push(`/transactions/${transactionId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {transaction.amount !== null && transaction.amount !== undefined && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Transaction Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        )}
        {transaction.grossCommissionGCI !== null && transaction.grossCommissionGCI !== undefined && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">GCI</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(transaction.grossCommissionGCI)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        )}
        {transaction.commissionPct !== null && transaction.commissionPct !== undefined && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Commission %</p>
                  <p className="text-2xl font-bold text-white">
                    {transaction.commissionPct}%
                  </p>
                </div>
                <FileText className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        )}
        {transaction.type && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Transaction Type</p>
                  <p className="text-2xl font-bold text-white">
                    {String(transaction.type).replace(/_/g, " ")}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Fields (Custom Fields) */}
          {summaryFields.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Summary Fields</CardTitle>
                <p className="text-sm text-zinc-400 mt-1">
                  Custom fields you've marked as important. Manage in "View All Fields".
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {summaryFields.map((fieldPref) => {
                    const value = getFieldValue(fieldPref.field)
                    const formattedValue = formatFieldValue(fieldPref.field, value)
                    const def = fieldDefinitions[fieldPref.field]
                    const label = fieldPref.displayName || def?.label || fieldPref.field
                    
                    // Always show the field if it's marked as important, even if null/zero
                    const isEmpty = value === null || value === undefined || value === "" || value === 0
                    
                    return (
                      <div key={fieldPref.field} className="flex flex-col gap-1">
                        <p className="text-sm text-zinc-400">{label}</p>
                        <p className={`font-medium ${
                          isEmpty 
                            ? "text-zinc-500 italic" 
                            : "text-zinc-200"
                        }`}>
                          {formattedValue}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Transaction Details */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addressOneLine && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Address</p>
                    <p className="text-zinc-200">{addressOneLine}</p>
                  </div>
                </div>
              )}
              {transaction.contractAcceptanceDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Contract Date</p>
                    <p className="text-zinc-200">{formatDate(transaction.contractAcceptanceDate)}</p>
                  </div>
                </div>
              )}
              {transaction.actualClosingDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Closing Date</p>
                    <p className="text-zinc-200">{formatDate(transaction.actualClosingDate)}</p>
                  </div>
                </div>
              )}
              {transaction.brokerTransactionId && (
                <div>
                  <p className="text-sm text-zinc-400">Broker Transaction ID</p>
                  <p className="text-zinc-200 font-mono">{transaction.brokerTransactionId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Agent Information */}
          {transaction.agent && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Agent</p>
                    <p className="text-zinc-200">{transaction.agent.name || "Unassigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

