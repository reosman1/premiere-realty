"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AgentEditPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    memberLevel: "ASSOCIATE",
    hireDate: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    preCapSplit: "",
    postCapSplit: "",
    teamCapAmount: "",
    notes: "",
  })
  const [loading, setLoading] = useState(true)

  // Fetch agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}`)
        const data = await response.json()
        if (response.ok) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            status: data.status || "ACTIVE",
            memberLevel: data.memberLevel || "ASSOCIATE",
            hireDate: data.hireDate ? new Date(data.hireDate).toISOString().split('T')[0] : "",
            street: data.street || "",
            city: data.city || "",
            state: data.state || "",
            zipcode: data.zipcode || "",
            preCapSplit: data.preCapSplitToAgent?.toString() || "",
            postCapSplit: data.postCapSplitToAgent?.toString() || "",
            teamCapAmount: data.teamCapAmount?.toString() || "",
            notes: data.notes || "",
          })
        }
      } catch (error) {
        console.error("Error fetching agent:", error)
      } finally {
        setLoading(false)
      }
    }

    if (agentId) {
      fetchAgent()
    }
  }, [agentId])
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // TODO: Call API to update agent
      // await fetch(`/api/agents/${agentId}`, { method: "PUT", body: JSON.stringify(formData) })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate back to detail page
      router.push(`/agents/${agentId}`)
    } catch (error) {
      console.error("Error updating agent:", error)
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Agent</h1>
            <p className="mt-1 text-zinc-400">Update agent information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Street
                  </label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      City
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      State
                    </label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      ZIP Code
                    </label>
                    <Input
                      value={formData.zipcode}
                      onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  placeholder="Add any additional notes about this agent..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Status & Level */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Status & Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Status *
                  </label>
                  <Select
                    options={[
                      { value: "ACTIVE", label: "Active" },
                      { value: "INACTIVE", label: "Inactive" },
                      { value: "ONBOARDING", label: "Onboarding" },
                    ]}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Member Level *
                  </label>
                  <Select
                    options={[
                      { value: "ASSOCIATE", label: "Associate" },
                      { value: "PARTNER", label: "Partner" },
                      { value: "SR_PARTNER", label: "Sr. Partner" },
                      { value: "STAFF", label: "Staff" },
                    ]}
                    value={formData.memberLevel}
                    onChange={(e) => setFormData({ ...formData, memberLevel: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Hire Date
                  </label>
                  <Input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Team Leader
                  </label>
                  <Input
                    value={formData.teamLeader}
                    onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })}
                    placeholder="Team leader name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Commission Structure */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle>Commission Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Pre-Cap Split (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.preCapSplit}
                    onChange={(e) => setFormData({ ...formData, preCapSplit: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Post-Cap Split (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.postCapSplit}
                    onChange={(e) => setFormData({ ...formData, postCapSplit: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Team Cap Amount ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.teamCapAmount}
                    onChange={(e) => setFormData({ ...formData, teamCapAmount: e.target.value })}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

