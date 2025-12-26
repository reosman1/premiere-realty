"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { 
  Users, 
  Home, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Loader2
} from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, getInitials, formatDate, getStatusColor } from "@/lib/utils"
import { Select } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeAgents: 0,
    activeListings: 0,
    pendingTransactions: 0,
    mtdRevenue: 0,
    ytdRevenue: 0,
    closedThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch recent transactions
        const txResponse = await fetch(`/api/transactions?page=1&pageSize=${pageSize}`)
        const txData = await txResponse.json()
        
        if (txResponse.ok) {
          setRecentTransactions(txData.transactions || [])
          // Calculate stats from transactions
          const pendingCount = (txData.transactions || []).filter((t: any) => t.stage === "PENDING").length
          const closedCount = (txData.transactions || []).filter((t: any) => t.stage === "CLOSED").length
          const mtdGCI = (txData.transactions || [])
            .filter((t: any) => t.stage === "CLOSED" && t.gci)
            .reduce((sum: number, t: any) => sum + (t.gci || 0), 0)
          
          setStats({
            activeAgents: 0, // Would need separate API call
            activeListings: 0, // Would need separate API call
            pendingTransactions: pendingCount,
            mtdRevenue: mtdGCI,
            ytdRevenue: 0, // Would need separate calculation
            closedThisMonth: closedCount,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [pageSize])

  const totalPages = Math.ceil(recentTransactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTransactions = recentTransactions.slice(startIndex, endIndex)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Welcome back! Here's what's happening with your team.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Agents"
          value={loading ? "..." : stats.activeAgents.toString()}
          change=""
          changeType="neutral"
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatsCard
          title="Active Listings"
          value={loading ? "..." : stats.activeListings.toString()}
          change=""
          changeType="neutral"
          icon={Home}
          iconColor="text-emerald-400"
        />
        <StatsCard
          title="Pending Transactions"
          value={loading ? "..." : stats.pendingTransactions.toString()}
          change=""
          changeType="neutral"
          icon={FileText}
          iconColor="text-amber-400"
        />
        <StatsCard
          title="MTD Revenue"
          value={loading ? "..." : formatCurrency(stats.mtdRevenue)}
          change=""
          changeType="neutral"
          icon={DollarSign}
          iconColor="text-green-400"
        />
      </div>

      {/* Charts and Lists Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <a href="/transactions" className="text-sm text-amber-400 hover:text-amber-300">
              View all →
            </a>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="text-sm text-zinc-400">
                Showing {startIndex + 1}-{Math.min(endIndex, recentTransactions.length)} of {recentTransactions.length} transactions
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
                  <TableHead>Agent</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
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
                            <Home className="h-5 w-5 text-zinc-400" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-200">{tx.address || tx.name || "No address"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-300">{tx.agent}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-white">
                          {tx.amount ? formatCurrency(tx.amount) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(tx.stage)}
                        >
                          {tx.stage?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {tx.closingDate ? formatDate(tx.closingDate) : tx.contractDate ? formatDate(tx.contractDate) : "—"}
                        </span>
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
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
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
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
