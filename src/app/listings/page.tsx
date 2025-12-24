"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  Home,
  MoreHorizontal,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink
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

// Demo data
const listings = [
  {
    id: "1",
    mlsNumber: "MLS-2024-001",
    address: "123 Oak Street",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    listingPrice: 450000,
    stage: "ACTIVE_LISTING",
    listingType: "RESIDENTIAL",
    listingDate: "2024-11-15",
    expirationDate: "2025-05-15",
    agent: "Sarah Johnson",
    listingCommissionPct: 3.0,
    saleCommissionPct: 2.5,
  },
  {
    id: "2",
    mlsNumber: "MLS-2024-002",
    address: "456 Maple Avenue",
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    listingPrice: 375000,
    stage: "PENDING",
    listingType: "RESIDENTIAL",
    listingDate: "2024-10-20",
    expirationDate: "2025-04-20",
    agent: "Michael Chen",
    listingCommissionPct: 3.0,
    saleCommissionPct: 3.0,
  },
  {
    id: "3",
    mlsNumber: "MLS-2024-003",
    address: "789 Cedar Lane",
    city: "Houston",
    state: "TX",
    zipCode: "77002",
    listingPrice: 525000,
    stage: "ACTIVE_LISTING",
    listingType: "RESIDENTIAL",
    listingDate: "2024-12-01",
    expirationDate: "2025-06-01",
    agent: "Emily Brown",
    listingCommissionPct: 2.5,
    saleCommissionPct: 2.5,
  },
  {
    id: "4",
    mlsNumber: "MLS-2024-004",
    address: "321 Pine Road",
    city: "San Antonio",
    state: "TX",
    zipCode: "78205",
    listingPrice: 290000,
    stage: "CLOSED",
    listingType: "RESIDENTIAL",
    listingDate: "2024-09-10",
    expirationDate: "2025-03-10",
    agent: "James Wilson",
    listingCommissionPct: 3.0,
    saleCommissionPct: 3.0,
  },
  {
    id: "5",
    mlsNumber: "MLS-2024-005",
    address: "555 Commerce Street",
    city: "Austin",
    state: "TX",
    zipCode: "78702",
    listingPrice: 1250000,
    stage: "ACTIVE_LISTING",
    listingType: "COMMERCIAL",
    listingDate: "2024-11-01",
    expirationDate: "2025-05-01",
    agent: "Sarah Johnson",
    listingCommissionPct: 4.0,
    saleCommissionPct: 4.0,
  },
  {
    id: "6",
    mlsNumber: "MLS-2024-006",
    address: "888 Sunset Blvd",
    city: "Dallas",
    state: "TX",
    zipCode: "75202",
    listingPrice: 675000,
    stage: "EXPIRED",
    listingType: "RESIDENTIAL",
    listingDate: "2024-06-01",
    expirationDate: "2024-12-01",
    agent: "Michael Chen",
    listingCommissionPct: 3.0,
    saleCommissionPct: 2.5,
  },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.mlsNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.agent.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStage = stageFilter === "all" || listing.stage === stageFilter
    const matchesType = typeFilter === "all" || listing.listingType === typeFilter

    return matchesSearch && matchesStage && matchesType
  })

  const activeCount = listings.filter((l) => l.stage === "ACTIVE_LISTING").length
  const pendingCount = listings.filter((l) => l.stage === "PENDING").length
  const totalValue = listings
    .filter((l) => l.stage === "ACTIVE_LISTING" || l.stage === "PENDING")
    .reduce((sum, l) => sum + l.listingPrice, 0)

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
                <p className="text-2xl font-bold text-white">{listings.length}</p>
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
            {filteredListings.map((listing) => (
              <TableRow key={listing.id} className="cursor-pointer">
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
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

