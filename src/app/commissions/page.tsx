"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { 
  DollarSign, 
  Search, 
  Filter,
  Download,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Loader2
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
import { useRouter } from "next/navigation"

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
]

export default function CommissionsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch commissions from API
  useEffect(() => {
    const fetchCommissions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        })
        
        if (searchQuery) params.append("search", searchQuery)
        if (statusFilter !== "all") params.append("status", statusFilter)

        const response = await fetch(`/api/commissions?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setCommissions(data.commissions || [])
          setTotal(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 0)
        } else {
          console.error("Error fetching commission payments:", data.error)
        }
      } catch (error) {
        console.error("Error fetching commission payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommissions()
  }, [searchQuery, statusFilter, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const totalPaid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalPending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalGCI = commissions.reduce((sum, c) => sum + (c.gci || 0), 0)
  const avgCommission = commissions.length > 0 ? totalGCI / commissions.length : 0

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
                  {loading ? "..." : formatCurrency(totalGCI)}
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
                <p className="text-sm text-zinc-400">Paid (MTD)</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {loading ? "..." : formatCurrency(totalPaid)}
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
                  {loading ? "..." : formatCurrency(totalPending)}
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
                <p className="text-sm text-zinc-400">Avg. Commission</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : formatCurrency(avgCommission)}
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
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No commission payments found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <div className="text-sm text-zinc-400">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} payments
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
                    <TableHead>Agent</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>GCI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Paid</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((comm) => (
                    <TableRow
                      key={comm.id}
                      className="cursor-pointer hover:bg-zinc-800/50"
                      onClick={() => router.push(`/commissions/${comm.id}`)}
                    >
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
                        <span className="font-semibold text-white">
                          {comm.amount ? formatCurrency(comm.amount) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {comm.gci ? formatCurrency(comm.gci) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={comm.status === "PAID" ? "default" : "secondary"}>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {comm.datePaid ? formatDate(comm.datePaid) : "—"}
                        </span>
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
