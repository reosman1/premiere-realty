"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  UserCheck,
  UserX,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
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
import { formatCurrency, formatDate, getInitials, getStatusColor } from "@/lib/utils"
import { useRouter } from "next/navigation"

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ONBOARDING", label: "Onboarding" },
]

const levelOptions = [
  { value: "all", label: "All Levels" },
  { value: "ASSOCIATE", label: "Associate" },
  { value: "PARTNER", label: "Partner" },
  { value: "SR_PARTNER", label: "Sr. Partner" },
  { value: "STAFF", label: "Staff" },
]

export default function AgentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        })
        
        if (searchQuery) params.append("search", searchQuery)
        if (statusFilter !== "all") params.append("status", statusFilter)
        if (levelFilter !== "all") params.append("level", levelFilter)

        const response = await fetch(`/api/agents?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setAgents(data.agents || [])
          setTotal(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 0)
          setActiveCount(data.stats?.activeCount || 0)
          setInactiveCount(data.stats?.inactiveCount || 0)
        } else {
          console.error("Error fetching agents:", data.error)
        }
      } catch (error) {
        console.error("Error fetching agents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [searchQuery, statusFilter, levelFilter, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, levelFilter])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="mt-1 text-zinc-400">
            Manage your team members and their commission structures
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Agents</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : total}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <UserCheck className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active</p>
                <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <UserCheck className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Inactive</p>
                <p className="text-2xl font-bold text-red-400">{inactiveCount}</p>
              </div>
              <div className="rounded-lg bg-red-500/20 p-2">
                <UserX className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search agents by name, email, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48"
            />
            <Select
              options={levelOptions}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full md:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No agents found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Pre-Cap Split</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow
                      key={agent.id}
                      className="cursor-pointer hover:bg-zinc-800/50"
                      onClick={() => router.push(`/agents/${agent.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar fallback={getInitials(agent.name)} size="sm" />
                          <div>
                            <p className="font-medium text-zinc-200">{agent.name}</p>
                            <p className="text-sm text-zinc-500">{agent.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-300">
                          {agent.memberLevel?.replace("_", " ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">
                            {agent.city && agent.state
                              ? `${agent.city}, ${agent.state}`
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {agent.hireDate ? formatDate(agent.hireDate) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-300">
                          {agent.preCapSplitToAgent !== null && agent.preCapSplitToAgent !== undefined
                            ? `${agent.preCapSplitToAgent}%`
                            : "—"}
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
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} agents
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm text-zinc-400">
                      Page {currentPage} of {totalPages}
                    </div>
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
