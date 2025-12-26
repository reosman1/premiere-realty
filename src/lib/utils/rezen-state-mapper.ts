/**
 * REZEN Lifecycle State to CRM Transaction Stage Mapper
 * Maps REZEN transaction lifecycle states to CRM transaction stages
 */

import { TransactionStage } from "@prisma/client"

/**
 * REZEN lifecycle states and their corresponding CRM stages
 */
const REZEN_STATE_MAP: Record<string, TransactionStage> = {
  NEW: "NEW_ENTRY",
  CALCULATE_LEDGER: "PENDING",
  NEEDS_COMMISSION_VALIDATION: "PENDING",
  COMMISSION_VALIDATED: "PENDING",
  READY_FOR_COMMISSION_DOCUMENT_GENERATION: "PENDING",
  COMMISSION_DOCUMENT_GENERATED: "PENDING",
  COMMISSION_DOCUMENT_APPROVED: "PENDING",
  COMMISSION_DOCUMENT_SENT: "PENDING",
  APPROVED_FOR_CLOSING: "PENDING",
  "CLOSED, WAITING_ON_PAYMENT": "PENDING",
  PAYMENT_ACCEPTED: "PENDING",
  PAYMENT_SCHEDULED: "PENDING",
  SETTLED: "CLOSED",
  TERMINATION_REQUESTED: "CANCELED_PEND",
  TERMINATED: "CANCELED_APP",
  LISTING_ACTIVE: "ACTIVE_LISTING",
  LISTING_IN_CONTRACT: "PENDING",
  LISTING_CLOSED: "CLOSED",
}

/**
 * Maps REZEN lifecycle state to CRM transaction stage
 * @param rezenState - The REZEN lifecycle state (e.g., "NEW", "SETTLED")
 * @returns The corresponding CRM transaction stage
 */
export function mapRezenStateToTransactionStage(
  rezenState: string | null | undefined
): TransactionStage {
  if (!rezenState) {
    return "NEW_ENTRY"
  }

  // Normalize the state (uppercase, trim whitespace)
  const normalizedState = rezenState.toUpperCase().trim()

  // Check if we have a direct mapping
  if (REZEN_STATE_MAP[normalizedState]) {
    return REZEN_STATE_MAP[normalizedState]
  }

  // Fallback: try partial matches for variations
  for (const [key, stage] of Object.entries(REZEN_STATE_MAP)) {
    if (normalizedState.includes(key) || key.includes(normalizedState)) {
      return stage
    }
  }

  // Default fallback
  return "NEW_ENTRY"
}

/**
 * Get human-readable stage name from REZEN state
 * This matches the Make scenario's stage mapping
 */
export function getStageNameFromRezenState(
  rezenState: string | null | undefined
): string {
  if (!rezenState) {
    return "NEW ENTRY"
  }

  const normalizedState = rezenState.toUpperCase().trim()

  const stageNameMap: Record<string, string> = {
    NEW: "NEW ENTRY",
    CALCULATE_LEDGER: "Pending",
    NEEDS_COMMISSION_VALIDATION: "Pending",
    COMMISSION_VALIDATED: "Pending",
    READY_FOR_COMMISSION_DOCUMENT_GENERATION: "Pending",
    COMMISSION_DOCUMENT_GENERATED: "Pending",
    COMMISSION_DOCUMENT_APPROVED: "Pending",
    COMMISSION_DOCUMENT_SENT: "Pending",
    APPROVED_FOR_CLOSING: "Pending",
    "CLOSED, WAITING_ON_PAYMENT": "Pending",
    PAYMENT_ACCEPTED: "Pending",
    PAYMENT_SCHEDULED: "Pending",
    SETTLED: "Closed",
    TERMINATION_REQUESTED: "Canceled/Pend",
    TERMINATED: "Canceled/App",
    LISTING_ACTIVE: "Active Listing",
    LISTING_IN_CONTRACT: "Pending",
    LISTING_CLOSED: "Closed",
  }

  return stageNameMap[normalizedState] || normalizedState
}

