"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface SyncResult {
  success: boolean
  module?: string
  entityType?: string
  results?: {
    found: number
    created: number
    skipped: number
    errors: string[]
    fields: Array<{
      fieldName: string
      displayName: string
      status: "created" | "skipped" | "error"
      reason?: string
      error?: string
      id?: string
    }>
  }
  error?: string
  details?: string
  troubleshooting?: {
    message: string
    checks?: string[]
  }
}

export default function SyncZohoFormulasPage() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState("")
  const [module, setModule] = useState("Deals")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const handleTestToken = async () => {
    if (!accessToken) {
      alert("Please enter a Zoho access token")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/test-zoho-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      })

      const data = await response.json()
      alert(data.success 
        ? `✅ Token is valid! Found ${data.modules} modules.`
        : `❌ Token test failed: ${data.error?.message || data.error || "Unknown error"}`
      )
    } catch (error: any) {
      alert(`❌ Error testing token: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!accessToken) {
      alert("Please enter a Zoho access token")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/sync-zoho-formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, accessToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Failed to sync",
          details: data.details,
          troubleshooting: data.troubleshooting,
        })
      } else {
        setResult(data)
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: "Failed to sync formulas",
        details: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Sync Formulas from Zoho</h1>
          <p className="mt-1 text-zinc-400">Import formula field definitions from Zoho CRM</p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-blue-500/30 bg-blue-500/10">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">How to get Zoho Access Token:</h3>
          <div className="text-sm text-blue-300/80 space-y-2">
            <p className="font-medium">Method 1: Zoho API Console (Recommended)</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Visit <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">api-console.zoho.com</a></li>
              <li>Sign in with your Zoho account</li>
              <li>Click "Add Client" → Select "Server-based Applications"</li>
              <li>Fill in details and create the client</li>
              <li>Click "Generate Code" and select scope: <code className="bg-blue-900/50 px-1 rounded">ZohoCRM.settings.fields.READ</code></li>
              <li>Copy the generated access token</li>
            </ol>
            <p className="font-medium mt-3">Method 2: Zoho CRM Settings</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to Zoho CRM → Settings → Developer Space → APIs</li>
              <li>Create a new OAuth Client</li>
              <li>Generate an access token with scope: <code className="bg-blue-900/50 px-1 rounded">ZohoCRM.settings.fields.READ</code></li>
              <li>Copy the access token and paste it below</li>
            </ol>
            <p className="text-xs text-blue-300/60 mt-3 border-t border-blue-500/30 pt-2">
              ⚠️ Note: Access tokens expire after ~1 hour. You'll need to generate a new one when it expires.
              <br />
              📖 See <code className="bg-blue-900/50 px-1 rounded">docs/ZOHO_ACCESS_TOKEN_GUIDE.md</code> for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Form */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle>Zoho Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Zoho Access Token *
            </label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter Zoho OAuth access token"
              className="font-mono"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Token will not be saved - only used for this sync operation
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Zoho Module
            </label>
            <Select
              options={[
                { value: "Deals", label: "Deals (Transactions)" },
                { value: "Members", label: "Members (Agents)" },
                { value: "Listings", label: "Listings" },
                { value: "Commission_Payments", label: "Commission_Payments" },
              ]}
              value={module}
              onChange={(e) => setModule(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleTestToken} 
              disabled={loading || !accessToken}
              variant="outline"
              className="flex-1"
            >
              Test Token
            </Button>
            <Button 
              onClick={handleSync} 
              disabled={loading || !accessToken}
              className="flex-1"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Formulas from Zoho
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sync Results
              {result.success ? (
                <Badge variant="success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Success
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  Failed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result.success && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-red-400 font-medium mb-1">Error:</p>
                  <p className="text-red-300 text-sm">{result.error}</p>
                </div>
                {result.details && (
                  <div>
                    <p className="text-red-400 font-medium mb-1">Details:</p>
                    <pre className="text-xs text-red-300/80 mt-2 overflow-auto bg-red-900/20 p-2 rounded">
                      {typeof result.details === 'string' 
                        ? result.details 
                        : JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
                {result.troubleshooting && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-3">
                    <p className="text-yellow-400 font-medium mb-2">{result.troubleshooting.message}</p>
                    <ul className="text-xs text-yellow-300/80 space-y-1 list-disc list-inside">
                      {result.troubleshooting.checks?.map((check: string, idx: number) => (
                        <li key={idx}>{check}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.success && result.results && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-400">Found</p>
                    <p className="text-2xl font-bold text-white">{result.results.found}</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-xs text-green-400">Created</p>
                    <p className="text-2xl font-bold text-green-400">{result.results.created}</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-400">Skipped</p>
                    <p className="text-2xl font-bold text-yellow-400">{result.results.skipped}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-xs text-red-400">Errors</p>
                    <p className="text-2xl font-bold text-red-400">{result.results.errors.length}</p>
                  </div>
                </div>

                {result.results.fields.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-300">Fields:</h4>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {result.results.fields.map((field, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between rounded-lg border p-2 ${
                            field.status === "created"
                              ? "border-green-500/30 bg-green-500/10"
                              : field.status === "error"
                              ? "border-red-500/30 bg-red-500/10"
                              : "border-zinc-800 bg-zinc-800/30"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-200">
                              {field.displayName}
                            </p>
                            <p className="text-xs text-zinc-400 font-mono">{field.fieldName}</p>
                          </div>
                          <Badge
                            variant={
                              field.status === "created"
                                ? "success"
                                : field.status === "error"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {field.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.results.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 font-medium mb-2">Errors:</p>
                    <ul className="text-sm text-red-300 space-y-1">
                      {result.results.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

