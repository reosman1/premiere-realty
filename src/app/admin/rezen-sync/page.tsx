"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface SyncResult {
  success: boolean
  message?: string
  total?: number
  created?: number
  updated?: number
  skipped?: number
  errors?: Array<{ transactionId: string; error: string }>
  duration?: string
  dateFrom?: string
  dateTo?: string
}

interface SyncLog {
  id: string
  createdAt: string
  status: "PENDING" | "SUCCESS" | "FAILED"
  payload?: any
  errorMessage?: string
}

export default function RezenSyncPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"))
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"))

  // Fetch recent sync logs
  useEffect(() => {
    fetchSyncLogs()
  }, [])

  const fetchSyncLogs = async () => {
    try {
      const response = await fetch("/api/admin/sync-logs?source=REZEN&entityType=transaction&limit=10")
      if (response.ok) {
        const data = await response.json()
        setSyncLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error fetching sync logs:", error)
    }
  }

  const handleSync = async () => {
    setIsLoading(true)
    setSyncResult(null)

    try {
      const response = await fetch(
        `/api/cron/rezen-sync?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        {
          method: "GET",
        }
      )

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }

      const data = await response.json()
      
      // If there's an error in the response, show it
      if (!data.success && data.error) {
        setSyncResult({
          success: false,
          message: data.error,
        })
      } else {
        setSyncResult(data)
      }

      // Refresh sync logs after sync
      await fetchSyncLogs()
    } catch (error) {
      console.error("Sync error:", error)
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-400"
      case "FAILED":
        return "text-red-400"
      case "PENDING":
        return "text-yellow-400"
      default:
        return "text-zinc-400"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">REZEN Sync</h1>
        <p className="text-zinc-400">
          Manually trigger REZEN transaction sync or view sync history
        </p>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Sync</CardTitle>
          <CardDescription>
            Sync transactions from REZEN API for a specific date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Date From
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Date To
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <Button
            onClick={handleSync}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Syncing..." : "Start Sync"}
          </Button>
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              Sync Results
              <span
                className={`ml-2 text-sm ${
                  syncResult.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {syncResult.success ? "✓ Success" : "✗ Failed"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Show error message only when sync failed */}
            {((syncResult as any).error || (syncResult.message && !syncResult.success)) && (
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-red-500/20">
                <p className="text-red-400 font-medium mb-2">Error:</p>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap break-words">
                  {(syncResult as any).error || syncResult.message}
                </p>
              </div>
            )}
            {/* Show success message when sync succeeded */}
            {syncResult.message && syncResult.success && (
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-green-500/20">
                <p className="text-green-400 font-medium mb-2">Status:</p>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap break-words">
                  {syncResult.message}
                </p>
              </div>
            )}
            {syncResult.total !== undefined && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-zinc-400">Total</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {syncResult.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Created</p>
                  <p className="text-lg font-semibold text-green-400">
                    {syncResult.created || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Updated</p>
                  <p className="text-lg font-semibold text-blue-400">
                    {syncResult.updated || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Skipped</p>
                  <p className="text-lg font-semibold text-yellow-400">
                    {syncResult.skipped || 0}
                  </p>
                </div>
              </div>
            )}
            {syncResult.duration && (
              <p className="text-sm text-zinc-400 mt-4">
                Duration: {syncResult.duration}
              </p>
            )}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-red-400 mb-2">
                  Errors ({syncResult.errors.length}):
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {syncResult.errors.map((error, idx) => (
                    <p key={idx} className="text-xs text-zinc-400">
                      {error.transactionId}: {error.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent REZEN sync operations</CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-zinc-400 text-sm">No sync logs found</p>
          ) : (
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  {log.payload && (
                    <div className="text-sm text-zinc-400 space-y-1">
                      {log.payload.dateFrom && log.payload.dateTo && (
                        <p>
                          Date Range: {log.payload.dateFrom} to {log.payload.dateTo}
                        </p>
                      )}
                      {log.payload.total !== undefined && (
                        <p>
                          Total: {log.payload.total} | Created: {log.payload.created || 0} |
                          Updated: {log.payload.updated || 0}
                        </p>
                      )}
                      {log.payload.duration && (
                        <p>Duration: {log.payload.duration}</p>
                      )}
                    </div>
                  )}
                  {log.errorMessage && (
                    <p className="text-sm text-red-400 mt-2">
                      Error: {log.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

