"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { 
  Plus, 
  Search, 
  FileText,
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp,
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
import { formatCurrency, formatDate, getStatusColor, getStageLabel } from "@/lib/utils"
import { useRouter } from "next/navigation"

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

interface Transaction {
  id: string
  name: string
  address: string
  agent: string
  agentId?: string | null
  amount: number | null
  commissionPct: number | null
  gci: number | null
  stage: string
  type: string | null
  contractDate: string | Date | null
  closingDate: string | Date | null
  brokerTransactionId: string
  zohoId?: string | null
}

export default function TransactionsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        })
        
        if (searchQuery) params.append("search", searchQuery)
        if (stageFilter !== "all") params.append("stage", stageFilter)
        if (typeFilter !== "all") params.append("type", typeFilter)

        const response = await fetch(`/api/transactions?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setTransactions(data.transactions || [])
          setTotal(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 0)
        } else {
          console.error("Error fetching transactions:", data.error)
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [searchQuery, stageFilter, typeFilter, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, stageFilter, typeFilter])

  const paginatedTransactions = transactions

  // Calculate stats from current page data (or we could add stats endpoint)
  const pendingCount = transactions.filter((t) => t.stage === "PENDING").length
  const closedCount = transactions.filter((t) => t.stage === "CLOSED").length
  const totalGCI = transactions
    .filter((t) => t.stage === "CLOSED" && t.gci)
    .reduce((sum, t) => sum + (t.gci || 0), 0)
  const pendingGCI = transactions
    .filter((t) => t.stage === "PENDING" && t.gci)
    .reduce((sum, t) => sum + (t.gci || 0), 0)

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
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : total}
                </p>
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
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">
            {loading ? (
              "Loading..."
            ) : (
              `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)} of ${total} transactions`
            )}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading transactions...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-zinc-400">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((tx) => (
              <TableRow 
                key={tx.id} 
                className="cursor-pointer hover:bg-zinc-800/50"
                onClick={() => router.push(`/transactions/${tx.id}`)}
              >
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
                  <span className="text-zinc-300">
                    {tx.type ? tx.type.replace(/_/g, " ") : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{tx.agent}</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-white">
                    {tx.amount !== null ? formatCurrency(tx.amount) : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">
                    {tx.commissionPct !== null ? `${tx.commissionPct}%` : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-emerald-400">
                    {tx.gci !== null ? formatCurrency(tx.gci) : "—"}
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              ))
            )}
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
      </Card>
    </div>
  )
}

