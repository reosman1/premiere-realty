"use client"

import { useState, useEffect } from "react"
import { 
  Webhook, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Copy,
  Settings,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const integrations = [
  {
    id: "rezen",
    name: "REZEN",
    description: "Real Broker's transaction management platform",
    status: "connected",
    lastSync: "2 minutes ago",
    syncCount: 1247,
    icon: "🏠",
  },
  {
    id: "make",
    name: "Make (Integromat)",
    description: "Automation platform for data syncing",
    status: "connected",
    lastSync: "5 minutes ago",
    syncCount: 3891,
    icon: "⚡",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Accounting and invoice management",
    status: "connected",
    lastSync: "1 hour ago",
    syncCount: 892,
    icon: "📊",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing for monthly fees",
    status: "pending",
    lastSync: "Never",
    syncCount: 0,
    icon: "💳",
  },
]

const webhookEndpoints = [
  {
    name: "Agent Sync",
    path: "/api/webhooks/rezen/agents",
    method: "POST",
    description: "Sync agent data from REZEN",
  },
  {
    name: "Listing Sync",
    path: "/api/webhooks/rezen/listings",
    method: "POST",
    description: "Sync listing data from REZEN",
  },
  {
    name: "Transaction Sync",
    path: "/api/webhooks/rezen/transactions",
    method: "POST",
    description: "Sync transaction data from REZEN",
  },
  {
    name: "Make Generic",
    path: "/api/webhooks/make",
    method: "POST",
    description: "Generic webhook for Make automations",
  },
]

// Recent syncs removed - can be fetched from API if needed
const recentSyncs: any[] = []

export default function IntegrationsPage() {
  const [baseUrl, setBaseUrl] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    // Set baseUrl only on client side after mount to avoid hydration mismatch
    setBaseUrl(window.location.origin)
  }, [])

  // Pagination for recent syncs (empty for now, can fetch from API)
  const totalPages = Math.max(1, Math.ceil(recentSyncs.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedSyncs: any[] = recentSyncs.slice(startIndex, endIndex)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-zinc-400">
          Manage connections with REZEN, Make, QuickBooks, and other services
        </p>
      </div>

      {/* Connected Services */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.id} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{integration.name}</h3>
                    <p className="text-sm text-zinc-400">{integration.description}</p>
                  </div>
                </div>
                <Badge
                  variant={integration.status === "connected" ? "success" : "warning"}
                >
                  {integration.status}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Clock className="h-4 w-4" />
                    {integration.lastSync}
                  </div>
                  <div className="text-zinc-400">
                    {integration.syncCount.toLocaleString()} syncs
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Webhook Endpoints */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-amber-400" />
            Webhook Endpoints
          </CardTitle>
          <CardDescription>
            Use these endpoints in your Make scenarios or direct API integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookEndpoints.map((endpoint) => (
            <div
              key={endpoint.path}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="font-mono">
                  {endpoint.method}
                </Badge>
                <div>
                  <p className="font-medium text-zinc-200">{endpoint.name}</p>
                  <p className="text-sm text-zinc-500">{endpoint.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-300">
                  {baseUrl}{endpoint.path}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400">
              <strong>Webhook Secret:</strong> Add the header{" "}
              <code className="rounded bg-zinc-800 px-1 py-0.5">x-webhook-secret</code>{" "}
              with your secret key to authenticate requests.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>Latest synchronization events</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="text-sm text-zinc-400">
              Showing {startIndex + 1}-{Math.min(endIndex, recentSyncs.length)} of {recentSyncs.length} syncs
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Show:</span>
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
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSyncs.map((sync, i) => (
                <TableRow key={i} className="cursor-pointer">
                  <TableCell>
                    {sync.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-300">{sync.type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-200">{sync.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-zinc-500">{sync.time}</span>
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
  )
}

