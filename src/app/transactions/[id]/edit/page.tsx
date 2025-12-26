"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function TransactionEditPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.id as string

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    amount: "",
    commissionPct: "",
    stage: "NEW_ENTRY",
    type: "PURCHASE",
    contractDate: "",
    closingDate: "",
    brokerTransactionId: "",
    notes: "",
  })
  const [loading, setLoading] = useState(true)

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`)
        const data = await response.json()
        if (response.ok) {
          setFormData({
            name: data.name || "",
            address: data.addressOneLine || data.streetAddress || "",
            amount: data.amount?.toString() || "",
            commissionPct: data.commissionPct?.toString() || "",
            stage: data.stage || "NEW_ENTRY",
            type: data.type || "PURCHASE",
            contractDate: data.contractAcceptanceDate ? new Date(data.contractAcceptanceDate).toISOString().split('T')[0] : "",
            closingDate: data.actualClosingDate ? new Date(data.actualClosingDate).toISOString().split('T')[0] : "",
            brokerTransactionId: data.brokerTransactionId || "",
            notes: "",
          })
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
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // TODO: Call API to update transaction
      // await fetch(`/api/transactions/${transactionId}`, { method: "PUT", body: JSON.stringify(formData) })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push(`/transactions/${transactionId}`)
    } catch (error) {
      console.error("Error updating transaction:", error)
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Transaction</h1>
            <p className="mt-1 text-zinc-400">Update transaction information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Information */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Transaction Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Transaction Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Address *
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Transaction Amount *
                  </label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Broker Transaction ID
                  </label>
                  <Input
                    value={formData.brokerTransactionId}
                    onChange={(e) => setFormData({ ...formData, brokerTransactionId: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  placeholder="Add any additional notes about this transaction..."
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Status & Type */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Status & Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Stage *
                  </label>
                  <Select
                    options={[
                      { value: "NEW_ENTRY", label: "New Entry" },
                      { value: "PENDING", label: "Pending" },
                      { value: "CLOSED", label: "Closed" },
                      { value: "EXPIRED", label: "Expired" },
                      { value: "CANCELED_PEND", label: "Canceled Pending" },
                    ]}
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Transaction Type *
                  </label>
                  <Select
                    options={[
                      { value: "LISTING", label: "Listing" },
                      { value: "PURCHASE", label: "Purchase" },
                      { value: "LEASE_TENANT", label: "Lease (Tenant)" },
                      { value: "LEASE_LANDLORD", label: "Lease (Landlord)" },
                      { value: "REFERRAL", label: "Referral" },
                    ]}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Contract Date
                  </label>
                  <Input
                    type="date"
                    value={formData.contractDate}
                    onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Closing Date
                  </label>
                  <Input
                    type="date"
                    value={formData.closingDate}
                    onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Commission */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Commission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Commission Percentage (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.commissionPct}
                    onChange={(e) => setFormData({ ...formData, commissionPct: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <p className="text-xs text-purple-300 mb-1">
                    <strong>Note:</strong> Some commission fields are calculated by Zoho formulas and cannot be edited directly:
                  </p>
                  <ul className="text-xs text-purple-300/80 list-disc list-inside space-y-1">
                    <li>Total_Payments (calculated from Payment_Particpants subform)</li>
                    <li>Gross_Commission_Income_GCI (formula field)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

