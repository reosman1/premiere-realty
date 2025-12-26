/**
 * Agent Sync Service
 * Handles syncing REZEN agent/team member data to the CRM database
 */

import { prisma } from "@/lib/prisma"
import { RezenTeamMember, RezenAgentCapInfo } from "@/lib/rezen-api"

export interface AgentSyncResult {
  success: boolean
  agentId?: string
  action: "created" | "updated" | "skipped"
  error?: string
}

/**
 * Sync a single agent from REZEN team member data
 */
export async function syncAgentFromRezen(
  teamMember: RezenTeamMember,
  capInfo?: RezenAgentCapInfo
): Promise<AgentSyncResult> {
  try {
    const agentData = teamMember.agent
    if (!agentData?.id) {
      return {
        success: false,
        action: "skipped",
        error: "Agent ID is missing",
      }
    }

    // Check if agent already exists
    const existingAgent = await prisma.agent.findFirst({
      where: {
        OR: [
          { rezenId: agentData.id },
          { email: agentData.email },
        ],
      },
    })

    // Prepare agent data
    const agentUpdateData = {
      rezenId: agentData.id,
      name: agentData.name || "Unknown",
      email: agentData.email,
      // Add other fields from teamMember as needed
      // Cap info
      teamCapAmount: capInfo?.teamCapAmount
        ? parseFloat(capInfo.teamCapAmount.toString())
        : undefined,
      teamCapAmountPaid: capInfo?.teamCapAmountPaid
        ? parseFloat(capInfo.teamCapAmountPaid.toString())
        : undefined,
      brokerageCapAmount: capInfo?.brokerageCapAmount
        ? parseFloat(capInfo.brokerageCapAmount.toString())
        : undefined,
      brokerageCapAmountPaid: capInfo?.brokerageCapAmountPaid
        ? parseFloat(capInfo.brokerageCapAmountPaid.toString())
        : undefined,
    }

    let agent
    if (existingAgent) {
      agent = await prisma.agent.update({
        where: { id: existingAgent.id },
        data: agentUpdateData as any,
      })

      return {
        success: true,
        agentId: agent.id,
        action: "updated",
      }
    } else {
      agent = await prisma.agent.create({
        data: agentUpdateData as any,
      })

      return {
        success: true,
        agentId: agent.id,
        action: "created",
      }
    }
  } catch (error) {
    console.error("Error syncing agent from REZEN:", error)
    return {
      success: false,
      action: "skipped",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sync multiple agents from REZEN
 */
export async function syncAgentsFromRezen(
  teamMembers: RezenTeamMember[],
  getCapInfo: (agentId: string) => Promise<RezenAgentCapInfo | undefined> = async () => undefined
): Promise<{
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ agentId: string; error: string }>
}> {
  const results = {
    total: teamMembers.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ agentId: string; error: string }>,
  }

  for (const member of teamMembers) {
    const agentId = member.agent?.id
    if (!agentId) {
      results.skipped++
      continue
    }

    try {
      // Get cap info if available
      const capInfo = await getCapInfo(agentId).catch(() => undefined)

      const result = await syncAgentFromRezen(member, capInfo)

      if (result.success) {
        if (result.action === "created") {
          results.created++
        } else if (result.action === "updated") {
          results.updated++
        } else {
          results.skipped++
        }
      } else {
        results.skipped++
        if (result.error) {
          results.errors.push({
            agentId,
            error: result.error,
          })
        }
      }
    } catch (error) {
      results.skipped++
      results.errors.push({
        agentId,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

