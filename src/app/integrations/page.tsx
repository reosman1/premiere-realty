"use client"

import { 
  Webhook, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Copy,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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

const recentSyncs = [
  { type: "Agent", name: "Sarah Johnson", status: "success", time: "2 min ago" },
  { type: "Transaction", name: "123 Oak Street", status: "success", time: "5 min ago" },
  { type: "Listing", name: "456 Maple Ave", status: "success", time: "8 min ago" },
  { type: "Agent", name: "Michael Chen", status: "failed", time: "12 min ago" },
  { type: "Transaction", name: "789 Cedar Lane", status: "success", time: "15 min ago" },
]

export default function IntegrationsPage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"

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
          <div className="space-y-3">
            {recentSyncs.map((sync, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3"
              >
                <div className="flex items-center gap-3">
                  {sync.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm text-zinc-200">
                      <span className="text-zinc-400">{sync.type}:</span> {sync.name}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{sync.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

