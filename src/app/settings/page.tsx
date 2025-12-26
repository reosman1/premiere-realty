"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, Database, Webhook, Key } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-zinc-400">Manage your CRM configuration and preferences</p>
        </div>
      </div>

      {/* General Settings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-400" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Company Name
            </label>
            <Input
              defaultValue="Premiere Realty"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Time Zone
            </label>
            <Input
              defaultValue="America/Chicago"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Integrations */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-amber-400" />
            API Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* REZEN */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                  <Webhook className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200">REZEN</h3>
                  <p className="text-sm text-zinc-500">Transaction and agent data sync</p>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>

            {/* QuickBooks */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200">QuickBooks</h3>
                  <p className="text-sm text-zinc-500">Invoice and bill synchronization</p>
                </div>
              </div>
              <Badge variant="secondary">Not Configured</Badge>
            </div>

            {/* Zoho */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                  <Key className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200">Zoho CRM</h3>
                  <p className="text-sm text-zinc-500">Data import and formula field sync</p>
                </div>
              </div>
              <Badge variant="secondary">Read Only</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-400" />
            Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
            <div>
              <h3 className="font-medium text-zinc-200">Database Status</h3>
              <p className="text-sm text-zinc-500">Connection and schema information</p>
            </div>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="text-sm text-zinc-400">
            <p>Database URL: Configured</p>
            <p className="mt-1">Schema Version: Latest</p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-amber-400" />
            Sync Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              REZEN Batch Size
            </label>
            <Input
              defaultValue="10"
              type="number"
              className="bg-zinc-800 border-zinc-700"
              placeholder="Number of transactions per batch"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Number of transactions to process in parallel during sync (default: 10)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              REZEN Batch Delay (ms)
            </label>
            <Input
              defaultValue="500"
              type="number"
              className="bg-zinc-800 border-zinc-700"
              placeholder="Delay between batches in milliseconds"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Delay between batches to respect rate limits (default: 500ms)
            </p>
          </div>
          <div className="flex justify-end">
            <Button disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Sync Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

