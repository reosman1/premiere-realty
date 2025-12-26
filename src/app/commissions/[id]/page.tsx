"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  DollarSign,
  Calendar,
  Edit,
  User,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import { getCommissionSummaryFields } from "@/lib/field-preferences"

// Field definitions for formatting (always show values, even if null/zero)
const fieldDefinitions: Record<string, { format?: (v: any) => string; label?: string }> = {
  amount: { label: "Amount", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  status: { label: "Status" },
  dateEarned: { label: "Date Earned", format: (v) => v ? formatDate(v) : "—" },
  datePaid: { label: "Date Paid", format: (v) => v ? formatDate(v) : "—" },
  paymentType: { label: "Payment Type" },
  // Add more common fields
  qbInvoiceId: { label: "QuickBooks Invoice ID" },
  notes: { label: "Notes" },
}

export default function CommissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const commissionId = params.id as string
  const [commission, setCommission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summaryFields, setSummaryFields] = useState<any[]>([])

  // Load commission data
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const response = await fetch(`/api/commissions/${commissionId}`)
        const data = await response.json()
        if (response.ok) {
          setCommission(data)
        }
      } catch (error) {
        console.error("Error fetching commission payment:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (commissionId) {
      fetchCommission()
    }
  }, [commissionId])

  // Load summary field preferences
  useEffect(() => {
    setSummaryFields(getCommissionSummaryFields())
  }, [])

  // Helper to get field value
  const getFieldValue = (fieldName: string): any => {
    if (!commission) return null
    const parts = fieldName.split('.')
    let value: any = commission
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

  if (!commission) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-zinc-400">Commission payment not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default"
      case "PENDING":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

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
          {commission.agent && (
            <Avatar className="h-16 w-16">
              {commission.agent.name ? (
                <span className="text-xl">{getInitials(commission.agent.name)}</span>
              ) : (
                <User className="h-8 w-8" />
              )}
            </Avatar>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">
              Commission Payment
            </h1>
            <p className="mt-1 text-zinc-400">
              {commission.agent?.name || "Unknown Agent"}
              {commission.transaction?.name && ` - ${commission.transaction.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(commission.status)}>
            {commission.status || "Unknown"}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/commissions/${commissionId}/fields`)}>
            View All Fields
          </Button>
          <Button variant="outline" onClick={() => router.push(`/commissions/${commissionId}/edit`)}>
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {commission.amount !== null && commission.amount !== undefined && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Commission Amount</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(commission.amount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Status</p>
                <p className="text-2xl font-bold text-white">
                  {commission.status || "—"}
                </p>
              </div>
              {commission.status === "PAID" ? (
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              ) : (
                <Clock className="h-8 w-8 text-amber-400" />
              )}
            </div>
          </CardContent>
        </Card>
        {commission.paymentType && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Payment Type</p>
                  <p className="text-2xl font-bold text-white">
                    {commission.paymentType}
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
          {/* Payment Details */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commission.transaction && (
                <div>
                  <p className="text-sm text-zinc-400">Transaction</p>
                  <p className="text-zinc-200">{commission.transaction.name || "—"}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {commission.dateEarned && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm text-zinc-400">Date Earned</p>
                      <p className="text-zinc-200">{formatDate(commission.dateEarned)}</p>
                    </div>
                  </div>
                )}
                {commission.datePaid && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm text-zinc-400">Date Paid</p>
                      <p className="text-zinc-200">{formatDate(commission.datePaid)}</p>
                    </div>
                  </div>
                )}
              </div>
              {commission.qbInvoiceId && (
                <div>
                  <p className="text-sm text-zinc-400">QuickBooks Invoice ID</p>
                  <p className="text-zinc-200 font-mono">{commission.qbInvoiceId}</p>
                </div>
              )}
              {commission.notes && (
                <div>
                  <p className="text-sm text-zinc-400">Notes</p>
                  <p className="text-zinc-200 whitespace-pre-wrap">{commission.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Items */}
          {commission.items && commission.items.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Payment Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commission.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.description || "No description"}</p>
                        {item.itemType && (
                          <p className="text-xs text-zinc-400">{item.itemType}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {item.amount !== null && item.amount !== undefined
                            ? formatCurrency(item.amount)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Agent Information */}
          {commission.agent && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Agent</p>
                    <p className="text-zinc-200">{commission.agent.name || "—"}</p>
                    {commission.agent.email && (
                      <p className="text-xs text-zinc-500">{commission.agent.email}</p>
                    )}
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
