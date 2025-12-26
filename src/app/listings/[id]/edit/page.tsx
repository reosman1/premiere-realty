"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function ListingEditPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string

  const [formData, setFormData] = useState({
    mlsNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    listingPrice: "",
    stage: "ACTIVE_LISTING",
    listingType: "RESIDENTIAL",
    listingDate: "",
    expirationDate: "",
    listingCommissionPct: "",
    saleCommissionPct: "",
    notes: "",
  })
  const [loading, setLoading] = useState(true)

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`)
        const data = await response.json()
        if (response.ok) {
          setFormData({
            mlsNumber: data.mlsNumber || "",
            address: [data.streetNo, data.streetName, data.city, data.state, data.zipCode].filter(Boolean).join(" ") || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zipCode || "",
            listingPrice: data.listingPrice?.toString() || "",
            stage: data.stage || "ACTIVE_LISTING",
            listingType: data.listingType || "RESIDENTIAL",
            listingDate: data.listingDate ? new Date(data.listingDate).toISOString().split('T')[0] : "",
            expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString().split('T')[0] : "",
            listingCommissionPct: data.listingCommissionPct?.toString() || "",
            saleCommissionPct: data.saleCommissionPct?.toString() || "",
            notes: "",
          })
        }
      } catch (error) {
        console.error("Error fetching listing:", error)
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId])
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // TODO: Call API to update listing
      // await fetch(`/api/listings/${listingId}`, { method: "PUT", body: JSON.stringify(formData) })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push(`/listings/${listingId}`)
    } catch (error) {
      console.error("Error updating listing:", error)
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
            <h1 className="text-3xl font-bold text-white">Edit Listing</h1>
            <p className="mt-1 text-zinc-400">Update listing information</p>
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
            {/* Property Information */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    MLS Number *
                  </label>
                  <Input
                    value={formData.mlsNumber}
                    onChange={(e) => setFormData({ ...formData, mlsNumber: e.target.value })}
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      City *
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      State *
                    </label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      ZIP Code *
                    </label>
                    <Input
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Listing Price *
                  </label>
                  <Input
                    type="number"
                    value={formData.listingPrice}
                    onChange={(e) => setFormData({ ...formData, listingPrice: e.target.value })}
                    min="0"
                    required
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
                  placeholder="Add any additional notes about this listing..."
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
                      { value: "ACTIVE_LISTING", label: "Active Listing" },
                      { value: "PENDING", label: "Pending" },
                      { value: "CLOSED", label: "Closed" },
                      { value: "EXPIRED", label: "Expired" },
                      { value: "CANCELED", label: "Canceled" },
                    ]}
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Listing Type *
                  </label>
                  <Select
                    options={[
                      { value: "RESIDENTIAL", label: "Residential" },
                      { value: "COMMERCIAL", label: "Commercial" },
                    ]}
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
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
                    Listing Date
                  </label>
                  <Input
                    type="date"
                    value={formData.listingDate}
                    onChange={(e) => setFormData({ ...formData, listingDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Expiration Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
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
                    Listing Commission (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.listingCommissionPct}
                    onChange={(e) => setFormData({ ...formData, listingCommissionPct: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Sale Commission (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.saleCommissionPct}
                    onChange={(e) => setFormData({ ...formData, saleCommissionPct: e.target.value })}
                    min="0"
                    max="100"
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

