"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { 
  Plus, 
  Search, 
  Home,
  MoreHorizontal,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { useRouter } from "next/navigation"

const stageOptions = [
  { value: "all", label: "All Stages" },
  { value: "ACTIVE_LISTING", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELED", label: "Canceled" },
]

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
]

export default function ListingsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        })
        
        if (searchQuery) params.append("search", searchQuery)
        if (stageFilter !== "all") params.append("stage", stageFilter)
        if (typeFilter !== "all") params.append("type", typeFilter)

        const response = await fetch(`/api/listings?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setListings(data.listings || [])
          setTotal(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 0)
        } else {
          console.error("Error fetching listings:", data.error)
        }
      } catch (error) {
        console.error("Error fetching listings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [searchQuery, stageFilter, typeFilter, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, stageFilter, typeFilter])

  const activeCount = listings.filter((l) => l.stage === "ACTIVE_LISTING").length
  const pendingCount = listings.filter((l) => l.stage === "PENDING").length
  const totalValue = listings
    .filter((l) => (l.stage === "ACTIVE_LISTING" || l.stage === "PENDING") && l.listingPrice)
    .reduce((sum, l) => sum + (l.listingPrice || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Listings</h1>
          <p className="mt-1 text-zinc-400">
            Track and manage all property listings
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Listing
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Listings</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : total}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Home className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active</p>
                <p className="text-2xl font-bold text-indigo-400">{activeCount}</p>
              </div>
              <div className="rounded-lg bg-indigo-500/20 p-2">
                <Home className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Home className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pipeline Value</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search by address, MLS#, city, or agent..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={stageOptions}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No listings found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <div className="text-sm text-zinc-400">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} listings
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Show:</span>
                  <Select
                    options={[
                      { value: "10", label: "10" },
                      { value: "25", label: "25" },
                      { value: "50", label: "50" },
                      { value: "100", label: "100" },
                    ]}
                    value={pageSize.toString()}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>
              <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>MLS #</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Listed</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {listings.map((listing) => (
              <TableRow 
                key={listing.id} 
                className="cursor-pointer hover:bg-zinc-800/50"
                onClick={() => router.push(`/listings/${listing.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                      <Home className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{listing.address}</p>
                      <p className="text-sm text-zinc-500">
                        {listing.city}, {listing.state} {listing.zipCode}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-zinc-400">
                    {listing.mlsNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-white">
                    {formatCurrency(listing.listingPrice)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(listing.stage)}>
                    {listing.stage.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{listing.listingType}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{listing.agent}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">{formatDate(listing.listingDate)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">{formatDate(listing.expirationDate)}</span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
              </TableBody>
            </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-800 p-4">
            <div className="text-sm text-zinc-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
                </div>
              </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

