"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Play, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface FormulaField {
  id: string
  entityType: string
  fieldName: string
  displayName: string
  formulaExpression: string
  returnType: string
  decimalPlaces?: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function FormulaFieldsPage() {
  const router = useRouter()
  const [formulaFields, setFormulaFields] = useState<FormulaField[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    entityType: "Transaction",
    fieldName: "",
    displayName: "",
    formulaExpression: "",
    returnType: "currency",
    decimalPlaces: 2,
    description: "",
  })

  // Test data state
  const [testData, setTestData] = useState("{}")
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    fetchFormulaFields()
  }, [])

  const fetchFormulaFields = async () => {
    try {
      const response = await fetch("/api/formula-fields")
      const data = await response.json()
      setFormulaFields(data.formulaFields || [])
    } catch (error) {
      console.error("Error fetching formula fields:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/formula-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error || "Failed to create formula field"}`)
        return
      }

      await fetchFormulaFields()
      setShowCreateForm(false)
      setFormData({
        entityType: "Transaction",
        fieldName: "",
        displayName: "",
        formulaExpression: "",
        returnType: "currency",
        decimalPlaces: 2,
        description: "",
      })
    } catch (error) {
      console.error("Error creating formula field:", error)
      alert("Failed to create formula field")
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/formula-fields/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error || "Failed to update formula field"}`)
        return
      }

      await fetchFormulaFields()
      setEditingId(null)
      setFormData({
        entityType: "Transaction",
        fieldName: "",
        displayName: "",
        formulaExpression: "",
        returnType: "currency",
        decimalPlaces: 2,
        description: "",
      })
    } catch (error) {
      console.error("Error updating formula field:", error)
      alert("Failed to update formula field")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this formula field?")) return

    try {
      const response = await fetch(`/api/formula-fields/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        alert("Failed to delete formula field")
        return
      }

      await fetchFormulaFields()
    } catch (error) {
      console.error("Error deleting formula field:", error)
      alert("Failed to delete formula field")
    }
  }

  const handleTest = async (id: string) => {
    try {
      const parsedTestData = JSON.parse(testData)
      const response = await fetch(`/api/formula-fields/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testData: parsedTestData }),
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error("Error testing formula:", error)
      alert("Failed to test formula. Check your test data JSON format.")
    }
  }

  const startEdit = (field: FormulaField) => {
    setEditingId(field.id)
    setFormData({
      entityType: field.entityType,
      fieldName: field.fieldName,
      displayName: field.displayName,
      formulaExpression: field.formulaExpression,
      returnType: field.returnType,
      decimalPlaces: field.decimalPlaces || 2,
      description: field.description || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      entityType: "Transaction",
      fieldName: "",
      displayName: "",
      formulaExpression: "",
      returnType: "currency",
      decimalPlaces: 2,
      description: "",
    })
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Formula Fields</h1>
            <p className="mt-1 text-zinc-400">Manage calculated/formula fields</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              if (confirm('Import formula fields from Zoho export files? (Much easier than API tokens!)')) {
                setLoading(true)
                try {
                  const response = await fetch('/api/admin/import-formulas-from-exports', { method: 'POST' })
                  const data = await response.json()
                  if (data.success) {
                    alert(`✅ Imported ${data.results.created} formula fields!\n\nNote: Formula expressions are placeholders. Edit them in the UI with actual formulas from Zoho CRM.`)
                    fetchFormulaFields()
                  } else {
                    alert(`Error: ${data.error}`)
                  }
                } catch (error: any) {
                  alert(`Error: ${error.message}`)
                } finally {
                  setLoading(false)
                }
              }
            }}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Import from Exports
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/formula-fields/sync")}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync from Zoho API
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Formula Field
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Create Formula Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Entity Type *
                </label>
                <Select
                  options={[
                    { value: "Transaction", label: "Transaction" },
                    { value: "Agent", label: "Agent" },
                    { value: "Listing", label: "Listing" },
                    { value: "CommissionPayment", label: "Commission Payment" },
                  ]}
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Field Name * (e.g., totalPayments)
                </label>
                <Input
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  placeholder="totalPayments"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Display Name *
              </label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Total Payments"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Formula Expression * (e.g., Amount * Commission / 100)
              </label>
              <Textarea
                value={formData.formulaExpression}
                onChange={(e) => setFormData({ ...formData, formulaExpression: e.target.value })}
                placeholder="Amount * Commission / 100"
                rows={3}
                className="font-mono"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Return Type *
                </label>
                <Select
                  options={[
                    { value: "currency", label: "Currency" },
                    { value: "number", label: "Number" },
                    { value: "text", label: "Text" },
                    { value: "boolean", label: "Boolean" },
                  ]}
                  value={formData.returnType}
                  onChange={(e) => setFormData({ ...formData, returnType: e.target.value })}
                  required
                />
              </div>
              {formData.returnType === "currency" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Decimal Places
                  </label>
                  <Input
                    type="number"
                    value={formData.decimalPlaces}
                    onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) || 2 })}
                    min="0"
                    max="10"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this formula calculate?"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formula Fields List */}
      <div className="space-y-4">
        {formulaFields.map((field) => (
          <Card key={field.id} className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {field.displayName}
                    <Badge variant="secondary">{field.entityType}</Badge>
                    <Badge variant={field.isActive ? "success" : "secondary"}>
                      {field.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  {field.description && (
                    <p className="text-sm text-zinc-400 mt-1">{field.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTestingId(field.id)
                      setTestResult(null)
                      setTestData("{}")
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(field)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingId === field.id ? (
                // Edit Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Formula Expression *
                    </label>
                    <Textarea
                      value={formData.formulaExpression}
                      onChange={(e) => setFormData({ ...formData, formulaExpression: e.target.value })}
                      rows={3}
                      className="font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(field.id)}>Save</Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Formula
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-zinc-400">Formula:</span>
                    <code className="block mt-1 p-3 bg-zinc-900 rounded-lg text-amber-400 font-mono text-sm">
                      {field.formulaExpression}
                    </code>
                  </div>
                  <div className="text-sm text-zinc-400">
                    <span>Return Type: </span>
                    <Badge variant="secondary">{field.returnType}</Badge>
                    {field.fieldName && (
                      <>
                        <span className="ml-4">Field Name: </span>
                        <code className="text-amber-400">{field.fieldName}</code>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Test Panel */}
              {testingId === field.id && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">Test Formula</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Test Data (JSON)
                      </label>
                      <Textarea
                        value={testData}
                        onChange={(e) => setTestData(e.target.value)}
                        placeholder='{"Amount": 450000, "Commission": 3}'
                        rows={3}
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button onClick={() => handleTest(field.id)} size="sm">
                      Run Test
                    </Button>
                    {testResult && (
                      <div className="mt-4 p-4 bg-zinc-900 rounded-lg">
                        {testResult.result.error ? (
                          <div className="text-red-400">
                            <strong>Error:</strong> {testResult.result.error}
                          </div>
                        ) : (
                          <div>
                            <div className="text-green-400 mb-2">
                              <strong>Result:</strong>{" "}
                              {field.returnType === "currency"
                                ? formatCurrency(testResult.result.value)
                                : String(testResult.result.value)}
                            </div>
                            {testResult.fieldReferences && testResult.fieldReferences.length > 0 && (
                              <div className="text-sm text-zinc-400 mt-2">
                                <strong>Field References:</strong>{" "}
                                {testResult.fieldReferences.join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {formulaFields.length === 0 && !showCreateForm && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">No formula fields yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

