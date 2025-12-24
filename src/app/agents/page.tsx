"use client"

import { useState } from "react"
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
  UserX
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

// Demo data - will be replaced with real API data
const agents = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@premiere.com",
    phone: "(512) 555-0123",
    status: "ACTIVE",
    memberLevel: "SR_PARTNER",
    hireDate: "2021-03-15",
    teamLeader: "David Keener",
    city: "Austin",
    state: "TX",
    dealsYTD: 15,
    volumeYTD: 4250000,
    cappedWithTeam: true,
    preCapSplit: 75,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@premiere.com",
    phone: "(214) 555-0456",
    status: "ACTIVE",
    memberLevel: "PARTNER",
    hireDate: "2022-01-10",
    teamLeader: "David Keener",
    city: "Dallas",
    state: "TX",
    dealsYTD: 12,
    volumeYTD: 3890000,
    cappedWithTeam: false,
    preCapSplit: 75,
  },
  {
    id: "3",
    name: "Emily Brown",
    email: "emily.brown@premiere.com",
    phone: "(713) 555-0789",
    status: "ACTIVE",
    memberLevel: "PARTNER",
    hireDate: "2022-06-20",
    teamLeader: null,
    city: "Houston",
    state: "TX",
    dealsYTD: 11,
    volumeYTD: 3450000,
    cappedWithTeam: false,
    preCapSplit: 75,
  },
  {
    id: "4",
    name: "James Wilson",
    email: "james.wilson@premiere.com",
    phone: "(210) 555-0321",
    status: "ACTIVE",
    memberLevel: "ASSOCIATE",
    hireDate: "2023-02-15",
    teamLeader: "Sarah Johnson",
    city: "San Antonio",
    state: "TX",
    dealsYTD: 9,
    volumeYTD: 2780000,
    cappedWithTeam: false,
    preCapSplit: 75,
  },
  {
    id: "5",
    name: "Lisa Martinez",
    email: "lisa.martinez@premiere.com",
    phone: "(512) 555-0654",
    status: "ONBOARDING",
    memberLevel: "ASSOCIATE",
    hireDate: "2024-12-01",
    teamLeader: "Michael Chen",
    city: "Austin",
    state: "TX",
    dealsYTD: 0,
    volumeYTD: 0,
    cappedWithTeam: false,
    preCapSplit: 75,
  },
  {
    id: "6",
    name: "Robert Davis",
    email: "robert.davis@premiere.com",
    phone: "(469) 555-0987",
    status: "INACTIVE",
    memberLevel: "ASSOCIATE",
    hireDate: "2022-08-10",
    teamLeader: null,
    city: "Plano",
    state: "TX",
    dealsYTD: 3,
    volumeYTD: 890000,
    cappedWithTeam: false,
    preCapSplit: 75,
  },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.city.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter
    const matchesLevel = levelFilter === "all" || agent.memberLevel === levelFilter

    return matchesSearch && matchesStatus && matchesLevel
  })

  const activeCount = agents.filter((a) => a.status === "ACTIVE").length
  const onboardingCount = agents.filter((a) => a.status === "ONBOARDING").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Members</h1>
          <p className="mt-1 text-zinc-400">
            Manage your agents, sponsors, and team hierarchy
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Agents</p>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
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
                <p className="text-sm text-zinc-400">Onboarding</p>
                <p className="text-2xl font-bold text-amber-400">{onboardingCount}</p>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-2">
                <UserCheck className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Capped Agents</p>
                <p className="text-2xl font-bold text-white">
                  {agents.filter((a) => a.cappedWithTeam).length}
                </p>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-2">
                <UserCheck className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search agents by name, email, or city..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={levelOptions}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Team Leader</TableHead>
              <TableHead>Deals YTD</TableHead>
              <TableHead>Volume YTD</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.map((agent) => (
              <TableRow key={agent.id} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar fallback={getInitials(agent.name)} size="md" />
                    <div>
                      <p className="font-medium text-zinc-200">{agent.name}</p>
                      <p className="text-sm text-zinc-500">{agent.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={getStatusColor(agent.status)}
                  >
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-300">
                    {agent.memberLevel.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    <span>{agent.city}, {agent.state}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {agent.teamLeader ? (
                    <span className="text-zinc-300">{agent.teamLeader}</span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-zinc-200">{agent.dealsYTD}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-emerald-400">
                    {formatCurrency(agent.volumeYTD)}
                  </span>
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
      </Card>
    </div>
  )
}

