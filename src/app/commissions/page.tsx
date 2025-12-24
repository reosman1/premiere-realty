"use client"

import { useState } from "react"
import { 
  DollarSign, 
  Search, 
  Filter,
  Download,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"

// Demo data
const commissions = [
  {
    id: "1",
    agent: "Sarah Johnson",
    transaction: "123 Oak Street",
    amount: 10125,
    gci: 13500,
    splitPct: 75,
    status: "PAID",
    datePaid: "2024-12-22",
    qbInvoiceId: "INV-2024-0891",
  },
  {
    id: "2",
    agent: "Michael Chen",
    transaction: "456 Maple Ave",
    amount: 7031.25,
    gci: 9375,
    splitPct: 75,
    status: "PENDING",
    datePaid: null,
    qbInvoiceId: "INV-2024-0892",
  },
  {
    id: "3",
    agent: "Emily Brown",
    transaction: "789 Cedar Lane",
    amount: 11812.50,
    gci: 15750,
    splitPct: 75,
    status: "PENDING",
    datePaid: null,
    qbInvoiceId: null,
  },
  {
    id: "4",
    agent: "James Wilson",
    transaction: "321 Pine Road",
    amount: 6525,
    gci: 8700,
    splitPct: 75,
    status: "PAID",
    datePaid: "2024-12-20",
    qbInvoiceId: "INV-2024-0889",
  },
  {
    id: "5",
    agent: "Sarah Johnson",
    transaction: "555 Commerce St",
    amount: 4275,
    gci: 4500,
    splitPct: 95,
    status: "PAID",
    datePaid: "2024-12-18",
    qbInvoiceId: "INV-2024-0887",
  },
  {
    id: "6",
    agent: "Michael Chen",
    transaction: "Referral - 999 Oak",
    amount: 1875,
    gci: 2500,
    splitPct: 75,
    status: "PAID",
    datePaid: "2024-12-15",
    qbInvoiceId: "INV-2024-0885",
  },
]

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
]

export default function CommissionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredCommissions = commissions.filter((comm) => {
    const matchesSearch =
      comm.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.transaction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.qbInvoiceId?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || comm.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPaid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amount, 0)
  const totalPending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amount, 0)
  const totalGCI = commissions.reduce((sum, c) => sum + c.gci, 0)
  const avgCommission = totalGCI / commissions.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Commissions</h1>
          <p className="mt-1 text-zinc-400">
            Track and manage agent commission payments
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total GCI (MTD)</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(totalGCI)}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Paid Out</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending</p>
                <p className="text-2xl font-bold text-amber-400">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Avg Commission</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(avgCommission)}
                </p>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
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
                placeholder="Search by agent, transaction, or invoice ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>GCI</TableHead>
              <TableHead>Split</TableHead>
              <TableHead>Agent Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Paid</TableHead>
              <TableHead>QB Invoice</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommissions.map((comm) => (
              <TableRow key={comm.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar fallback={getInitials(comm.agent)} size="sm" />
                    <span className="font-medium text-zinc-200">{comm.agent}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{comm.transaction}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">{formatCurrency(comm.gci)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">{comm.splitPct}%</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(comm.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={comm.status === "PAID" ? "success" : "warning"}
                  >
                    {comm.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {comm.datePaid ? (
                    <span className="text-zinc-400">{formatDate(comm.datePaid)}</span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {comm.qbInvoiceId ? (
                    <span className="font-mono text-sm text-zinc-400">
                      {comm.qbInvoiceId}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
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

