import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0%"
  return `${value.toFixed(2)}%`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    INACTIVE: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    ONBOARDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    OFFBOARDED: "bg-red-500/20 text-red-400 border-red-500/30",
    PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    CLOSED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    EXPIRED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    CANCELED: "bg-red-500/20 text-red-400 border-red-500/30",
    NEW_ENTRY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    ACTIVE_LISTING: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  }
  return colors[status] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    ACTIVE_LISTING: "Active Listing",
    NEW_ENTRY: "New Entry",
    INCOMPLETE: "Incomplete",
    PENDING: "Pending",
    CLOSED: "Closed",
    CLOSED_ARCHIVED: "Closed (Archived)",
    EXPIRED: "Expired",
    CANCELED_PEND: "Canceled/Pend",
    CANCELED_APP: "Canceled/App",
  }
  return labels[stage] || stage
}

