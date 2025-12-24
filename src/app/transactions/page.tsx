"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  FileText,
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp
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
import { formatCurrency, formatDate, getStatusColor, getStageLabel } from "@/lib/utils"

// Demo data
const transactions = [
  {
    id: "1",
    name: "123 Oak Street Purchase",
    address: "123 Oak Street, Austin TX 78701",
    agent: "Sarah Johnson",
    amount: 450000,
    commissionPct: 3.0,
    gci: 13500,
    stage: "CLOSED",
    type: "PURCHASE",
    contractDate: "2024-11-01",
    closingDate: "2024-12-20",
    brokerTransactionId: "TXN-2024-001",
  },
  {
    id: "2",
    name: "456 Maple Ave Sale",
    address: "456 Maple Avenue, Dallas TX 75201",
    agent: "Michael Chen",
    amount: 375000,
    commissionPct: 2.5,
    gci: 9375,
    stage: "PENDING",
    type: "LISTING",
    contractDate: "2024-12-10",
    closingDate: "2024-12-28",
    brokerTransactionId: "TXN-2024-002",
  },
  {
    id: "3",
    name: "789 Cedar Lane Purchase",
    address: "789 Cedar Lane, Houston TX 77002",
    agent: "Emily Brown",
    amount: 525000,
    commissionPct: 3.0,
    gci: 15750,
    stage: "NEW_ENTRY",
    type: "PURCHASE",
    contractDate: "2024-12-22",
    closingDate: null,
    brokerTransactionId: "TXN-2024-003",
  },
  {
    id: "4",
    name: "321 Pine Road Sale",
    address: "321 Pine Road, San Antonio TX 78205",
    agent: "James Wilson",
    amount: 290000,
    commissionPct: 3.0,
    gci: 8700,
    stage: "PENDING",
    type: "LISTING",
    contractDate: "2024-12-15",
    closingDate: "2025-01-10",
    brokerTransactionId: "TXN-2024-004",
  },
  {
    id: "5",
    name: "555 Commerce St Lease",
    address: "555 Commerce Street, Austin TX 78702",
    agent: "Sarah Johnson",
    amount: 4500,
    commissionPct: 100,
    gci: 4500,
    stage: "CLOSED",
    type: "LEASE_LANDLORD",
    contractDate: "2024-12-01",
    closingDate: "2024-12-15",
    brokerTransactionId: "TXN-2024-005",
  },
  {
    id: "6",
    name: "Referral - 999 Oak",
    address: "999 Oak Blvd, Dallas TX 75201",
    agent: "Michael Chen",
    amount: 10000,
    commissionPct: 25,
    gci: 2500,
    stage: "CLOSED",
    type: "REFERRAL",
    contractDate: "2024-11-20",
    closingDate: "2024-12-10",
    brokerTransactionId: "TXN-2024-006",
  },
]

const stageOptions = [
  { value: "all", label: "All Stages" },
  { value: "NEW_ENTRY", label: "New Entry" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELED_PEND", label: "Canceled" },
]

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "LISTING", label: "Listing" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "LEASE_TENANT", label: "Lease (Tenant)" },
  { value: "LEASE_LANDLORD", label: "Lease (Landlord)" },
  { value: "REFERRAL", label: "Referral" },
]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.brokerTransactionId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStage = stageFilter === "all" || tx.stage === stageFilter
    const matchesType = typeFilter === "all" || tx.type === typeFilter

    return matchesSearch && matchesStage && matchesType
  })

  const pendingCount = transactions.filter((t) => t.stage === "PENDING").length
  const closedCount = transactions.filter((t) => t.stage === "CLOSED").length
  const totalGCI = transactions
    .filter((t) => t.stage === "CLOSED")
    .reduce((sum, t) => sum + t.gci, 0)
  const pendingGCI = transactions
    .filter((t) => t.stage === "PENDING")
    .reduce((sum, t) => sum + t.gci, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="mt-1 text-zinc-400">
            Track deals from contract to close
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{transactions.length}</p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <FileText className="h-5 w-5 text-blue-400" />
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
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Closed MTD</p>
                <p className="text-2xl font-bold text-emerald-400">{closedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">GCI Closed MTD</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(totalGCI)}
                </p>
              </div>
              <div className="rounded-lg bg-green-500/20 p-2">
                <DollarSign className="h-5 w-5 text-green-400" />
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
                placeholder="Search by name, address, agent, or transaction ID..."
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

      {/* Transactions Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>GCI</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Closing</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                      <FileText className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{tx.name}</p>
                      <p className="text-sm text-zinc-500">{tx.address}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{tx.type.replace("_", " ")}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{tx.agent}</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-white">
                    {formatCurrency(tx.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">{tx.commissionPct}%</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(tx.gci)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(tx.stage)}>
                    {getStageLabel(tx.stage)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tx.closingDate ? (
                    <span className="text-zinc-400">{formatDate(tx.closingDate)}</span>
                  ) : (
                    <span className="text-zinc-600">TBD</span>
                  )}
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

