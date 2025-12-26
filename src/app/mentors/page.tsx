"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { 
  Plus, 
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Loader2,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, getInitials, getStatusColor } from "@/lib/utils"

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Training", label: "Training" },
]

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Fetch mentors from API
  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        })
        
        if (searchQuery) params.append("search", searchQuery)
        if (statusFilter !== "all") params.append("status", statusFilter)

        const response = await fetch(`/api/mentors?${params.toString()}`)
        
        let data: any = {}
        let responseText = ""
        try {
          responseText = await response.text()
          if (responseText.trim()) {
            data = JSON.parse(responseText)
          } else {
            // Empty response body
            console.warn("Empty response body received", {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            })
          }
        } catch (parseError) {
          const errorMessage = parseError instanceof Error 
            ? `Failed to parse response: ${parseError.message}` 
            : "Failed to parse server response"
          setError(errorMessage)
          console.error("Error parsing response:", parseError, {
            status: response.status,
            statusText: response.statusText,
            responseText: responseText.substring(0, 500)
          })
          return
        }

        if (response.ok) {
          setMentors(data.mentors || [])
          setTotal(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 0)
          setError(null)
        } else {
          // Handle error response
          const hasErrorData = data && (data.details || data.message || data.error)
          const errorMessage = hasErrorData 
            ? (data.details || data.message || data.error)
            : `Failed to fetch mentors (${response.status} ${response.statusText || "Unknown error"})`
          
          setError(errorMessage)
          console.error("Error fetching mentors:", {
            status: response.status,
            statusText: response.statusText,
            error: data?.error,
            details: data?.details,
            message: data?.message,
            fullData: data,
            responseText: responseText.substring(0, 500),
            isEmpty: Object.keys(data || {}).length === 0
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch mentors"
        setError(errorMessage)
        console.error("Error fetching mentors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMentors()
  }, [searchQuery, statusFilter, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const activeCount = mentors.filter((m) => m.firmStatus === "Active").length
  const inactiveCount = mentors.filter((m) => m.firmStatus === "Inactive").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mentors</h1>
          <p className="mt-1 text-zinc-400">
            Manage mentors and their information
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Mentor
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Mentors</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : total}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <GraduationCap className="h-5 w-5 text-blue-400" />
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
                  placeholder="Search mentors by name, email, or regional director..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full md:w-48 appearance-none rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 pr-10 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-2">Error loading mentors</p>
              <p className="text-sm text-zinc-500">{error}</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No mentors found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Regional Director</TableHead>
                    <TableHead>QB Vendor #</TableHead>
                    <TableHead>Effective Start</TableHead>
                    <TableHead>Effective End</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentors.map((mentor) => (
                    <TableRow
                      key={mentor.id}
                      className="cursor-pointer hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar fallback={getInitials(mentor.name)} size="sm" />
                          <div>
                            <p className="font-medium text-zinc-200">{mentor.name}</p>
                            {mentor.email && (
                              <p className="text-sm text-zinc-500">{mentor.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(mentor.firmStatus || 'ACTIVE')}>
                          {mentor.firmStatus || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-300">
                          {mentor.regionalDirector || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {mentor.qbVendorNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {mentor.effectiveStartDate ? formatDate(mentor.effectiveStartDate) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {mentor.effectiveEndDate ? formatDate(mentor.effectiveEndDate) : "—"}
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
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} mentors
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize.toString()}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="flex h-10 w-20 appearance-none rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 pr-10 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
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

