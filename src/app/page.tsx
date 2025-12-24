import { 
  Users, 
  Home, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { formatCurrency, getInitials } from "@/lib/utils"

// Demo data - will be replaced with real data from database
const stats = {
  activeAgents: 47,
  activeListings: 23,
  pendingTransactions: 18,
  mtdRevenue: 125750,
  ytdRevenue: 1847250,
  closedThisMonth: 12,
}

const recentTransactions = [
  {
    id: "1",
    address: "123 Oak Street, Austin TX",
    agent: "Sarah Johnson",
    amount: 450000,
    stage: "CLOSED",
    date: "2024-12-20",
  },
  {
    id: "2",
    address: "456 Maple Ave, Dallas TX",
    agent: "Michael Chen",
    amount: 375000,
    stage: "PENDING",
    date: "2024-12-22",
  },
  {
    id: "3",
    address: "789 Cedar Lane, Houston TX",
    agent: "Emily Brown",
    amount: 525000,
    stage: "NEW_ENTRY",
    date: "2024-12-23",
  },
  {
    id: "4",
    address: "321 Pine Road, San Antonio TX",
    agent: "James Wilson",
    amount: 290000,
    stage: "PENDING",
    date: "2024-12-24",
  },
]

const topAgents = [
  { name: "Sarah Johnson", deals: 15, volume: 4250000 },
  { name: "Michael Chen", deals: 12, volume: 3890000 },
  { name: "Emily Brown", deals: 11, volume: 3450000 },
  { name: "James Wilson", deals: 9, volume: 2780000 },
  { name: "Lisa Martinez", deals: 8, volume: 2340000 },
]

const upcomingDeadlines = [
  { title: "Closing: 456 Maple Ave", date: "Dec 28", type: "closing" },
  { title: "License Renewal: M. Chen", date: "Jan 5", type: "license" },
  { title: "Inspection: 789 Cedar Lane", date: "Dec 26", type: "inspection" },
  { title: "Contract Due: Oak Street", date: "Dec 27", type: "contract" },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Welcome back! Here's what's happening with your team.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Agents"
          value={stats.activeAgents.toString()}
          change="+3 this month"
          changeType="positive"
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatsCard
          title="Active Listings"
          value={stats.activeListings.toString()}
          change="+5 this week"
          changeType="positive"
          icon={Home}
          iconColor="text-emerald-400"
        />
        <StatsCard
          title="Pending Transactions"
          value={stats.pendingTransactions.toString()}
          change="4 closing this week"
          changeType="neutral"
          icon={FileText}
          iconColor="text-amber-400"
        />
        <StatsCard
          title="MTD Revenue"
          value={formatCurrency(stats.mtdRevenue)}
          change="+12% vs last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-green-400"
        />
      </div>

      {/* Charts and Lists Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <a href="/transactions" className="text-sm text-amber-400 hover:text-amber-300">
              View all →
            </a>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4 transition-colors hover:bg-zinc-800/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                      <Home className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{tx.address}</p>
                      <p className="text-sm text-zinc-500">{tx.agent}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(tx.amount)}
                    </p>
                    <Badge
                      variant={
                        tx.stage === "CLOSED"
                          ? "success"
                          : tx.stage === "PENDING"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {tx.stage.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
        </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Deadlines</CardTitle>
            <Clock className="h-5 w-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        deadline.type === "closing"
                          ? "bg-emerald-400"
                          : deadline.type === "license"
                          ? "bg-red-400"
                          : deadline.type === "inspection"
                          ? "bg-blue-400"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="text-sm text-zinc-300">{deadline.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{deadline.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Performing Agents</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAgents.map((agent, i) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                      #{i + 1}
                    </div>
                    <Avatar fallback={getInitials(agent.name)} size="sm" />
                    <div>
                      <p className="font-medium text-zinc-200">{agent.name}</p>
                      <p className="text-xs text-zinc-500">
                        {agent.deals} deals closed
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-400">
                    {formatCurrency(agent.volume)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-600/10 p-4">
                <div>
                  <p className="text-sm text-zinc-400">Year to Date Revenue</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {formatCurrency(stats.ytdRevenue)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="font-semibold">+18%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                  <p className="text-sm text-zinc-400">Closed This Month</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stats.closedThisMonth}
                  </p>
                  <p className="mt-1 text-xs text-emerald-400">+4 vs last month</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                  <p className="text-sm text-zinc-400">Avg. Commission</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatCurrency(stats.mtdRevenue / stats.closedThisMonth)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Per transaction</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
    </div>
  )
}
// Trigger redeploy Wed Dec 24 15:51:15 EST 2025
