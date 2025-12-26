"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function CommissionEditPage() {
  const params = useParams()
  const router = useRouter()
  const commissionId = params.id as string

  const [formData, setFormData] = useState({
    amount: "",
    status: "PENDING",
    paymentType: "",
    dateEarned: "",
    datePaid: "",
    qbInvoiceId: "",
    notes: "",
  })
  const [loading, setLoading] = useState(true)

  // Fetch commission data
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const response = await fetch(`/api/commissions/${commissionId}`)
        const data = await response.json()
        if (response.ok) {
          setFormData({
            amount: data.amount?.toString() || "",
            status: data.status || "PENDING",
            paymentType: data.paymentType || "",
            dateEarned: data.dateEarned ? new Date(data.dateEarned).toISOString().split('T')[0] : "",
            datePaid: data.datePaid ? new Date(data.datePaid).toISOString().split('T')[0] : "",
            qbInvoiceId: data.qbInvoiceId || "",
            notes: data.notes || "",
          })
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
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // TODO: Call API to update commission payment
      // await fetch(`/api/commissions/${commissionId}`, { method: "PUT", body: JSON.stringify(formData) })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push(`/commissions/${commissionId}`)
    } catch (error) {
      console.error("Error updating commission:", error)
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
            <h1 className="text-3xl font-bold text-white">Edit Commission Payment</h1>
            <p className="mt-1 text-zinc-400">Update commission payment information</p>
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
            {/* Payment Information */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      GCI *
                    </label>
                    <Input
                      type="number"
                      value={formData.gci}
                      onChange={(e) => setFormData({ ...formData, gci: e.target.value })}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Split Percentage (%)
                    </label>
                    <Input
                      type="number"
                      value={formData.splitPct}
                      onChange={(e) => setFormData({ ...formData, splitPct: e.target.value })}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Agent Commission Amount *
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
                    QuickBooks Invoice ID
                  </label>
                  <Input
                    value={formData.qbInvoiceId}
                    onChange={(e) => setFormData({ ...formData, qbInvoiceId: e.target.value })}
                    placeholder="QB Invoice ID"
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
                  placeholder="Add any additional notes about this commission payment..."
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Status */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Payment Status *
                  </label>
                  <Select
                    options={[
                      { value: "PENDING", label: "Pending" },
                      { value: "PAID", label: "Paid" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Date Paid
                  </label>
                  <Input
                    type="date"
                    value={formData.datePaid}
                    onChange={(e) => setFormData({ ...formData, datePaid: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

