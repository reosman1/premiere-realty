"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  User,
  ExternalLink,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { getListingSummaryFields } from "@/lib/field-preferences"

// Field definitions for formatting (always show values, even if null/zero)
const fieldDefinitions: Record<string, { format?: (v: any) => string; label?: string }> = {
  listingName: { label: "Listing Name" },
  listingPrice: { label: "Listing Price", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
  listingCommissionPct: { label: "Listing Commission %", format: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  stage: { label: "Stage" },
  listingDate: { label: "Listing Date", format: (v) => v ? formatDate(v) : "—" },
  city: { label: "City" },
  state: { label: "State" },
  // Add more common fields
  mlsNumber: { label: "MLS Number" },
  listingType: { label: "Listing Type" },
  expirationDate: { label: "Expiration Date", format: (v) => v ? formatDate(v) : "—" },
  saleCommissionPct: { label: "Sale Commission %", format: (v) => v !== null && v !== undefined ? `${v}%` : "—" },
  listingCommissionAmt: { label: "Listing Commission Amount", format: (v) => v !== null && v !== undefined ? formatCurrency(v) : "—" },
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summaryFields, setSummaryFields] = useState<any[]>([])

  // Load listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`)
        const data = await response.json()
        if (response.ok) {
          setListing(data)
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

  // Load summary field preferences
  useEffect(() => {
    setSummaryFields(getListingSummaryFields())
  }, [])

  // Helper to get field value
  const getFieldValue = (fieldName: string): any => {
    if (!listing) return null
    const parts = fieldName.split('.')
    let value: any = listing
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

  if (!listing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-zinc-400">Listing not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const addressLine = [
    listing.streetNo,
    listing.streetName,
    listing.city,
    listing.state,
    listing.zipCode
  ].filter(Boolean).join(", ")

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
            <h1 className="text-3xl font-bold text-white">
              {listing.listingName || addressLine || "Listing"}
            </h1>
            <p className="mt-1 text-zinc-400">{addressLine || "No address"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(listing.stage)}>
            {listing.stage?.replace(/_/g, " ") || "Unknown"}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/listings/${listingId}/fields`)}>
            View All Fields
          </Button>
          <Button variant="outline" onClick={() => router.push(`/listings/${listingId}/edit`)}>
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

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-3">
        {listing.listingPrice !== null && listing.listingPrice !== undefined && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Listing Price</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(listing.listingPrice)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        )}
        {listing.mlsNumber && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">MLS Number</p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {listing.mlsNumber}
                  </p>
                </div>
                <Home className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        )}
        {listing.listingType && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Listing Type</p>
                  <p className="text-2xl font-bold text-white">
                    {String(listing.listingType).replace(/_/g, " ")}
                  </p>
                </div>
                <Home className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addressLine && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-400">Address</p>
                    <p className="text-zinc-200">{addressLine}</p>
                  </div>
                </div>
              )}
              {listing.listingDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Listed Date</p>
                    <p className="text-zinc-200">{formatDate(listing.listingDate)}</p>
                  </div>
                </div>
              )}
              {listing.expirationDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Expiration Date</p>
                    <p className="text-zinc-200">{formatDate(listing.expirationDate)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Details */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Commission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Listing Commission</p>
                  <p className="text-xl font-semibold text-zinc-200">
                    {listing.listingCommissionPct !== null && listing.listingCommissionPct !== undefined
                      ? `${listing.listingCommissionPct}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Sale Commission</p>
                  <p className="text-xl font-semibold text-zinc-200">
                    {listing.saleCommissionPct !== null && listing.saleCommissionPct !== undefined
                      ? `${listing.saleCommissionPct}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Agent Information */}
          {listing.agent && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Listing Agent</p>
                    <p className="text-zinc-200">{listing.agent.name || "—"}</p>
                    {listing.agent.email && (
                      <p className="text-xs text-zinc-500">{listing.agent.email}</p>
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
