import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/webhooks/rezen/agents
// Webhook endpoint for REZEN/Make to sync agent data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook secret (optional but recommended)
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const {
      action,
      agent: agentData,
    } = body

    // Log the sync
    await prisma.syncLog.create({
      data: {
        source: "REZEN",
        entityType: "agent",
        externalId: agentData.rezenId || agentData.id,
        action: action?.toUpperCase() || "UPDATE",
        payload: body,
        status: "PENDING",
      },
    })

    // Handle different actions
    switch (action?.toLowerCase()) {
      case "create":
      case "update":
        await upsertAgent(agentData)
        break
      case "delete":
        await deactivateAgent(agentData.rezenId)
        break
      default:
        await upsertAgent(agentData)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("REZEN Agent Webhook Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function upsertAgent(data: any) {
  const agentData = {
    rezenId: data.rezenId || data.yentaId || data.participantId,
    name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
    legalName: data.legalName,
    email: data.email,
    personalEmail: data.personalEmail,
    workEmail: data.workEmail,
    phone: data.phone || data.cellPhone,
    
    // Address
    street: data.street,
    city: data.city,
    state: data.state,
    zipcode: data.zipcode || data.zip,
    county: data.county,
    country: data.country,
    
    // Professional Info
    licenseNumber: data.licenseNumber,
    
    // Employment
    status: mapStatus(data.firmStatus || data.status),
    memberLevel: mapMemberLevel(data.memberLevel),
    hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
    departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
    
    // Commission Structure
    preCapSplitToAgent: data.preCapSplitToAgent || data.splitToAgent,
    postCapSplitToAgent: data.postCapSplitToAgent,
    
    // Cap Tracking
    teamCapAmount: data.teamCapAmount || data.annualCapAmount,
    teamCapAmountPaid: data.teamCapAmountPaid || data.annualCapStatus,
    cappedWithTeam: data.cappedWithTeam || data.capped,
    
    brokerageCapAmount: data.brokerageCapAmount,
    brokerageCapAmountPaid: data.brokerageCapAmountPaid,
    cappedWithBrokerage: data.cappedWithBrokerage,
    
    // Roles
    isActiveSponsor: data.isActiveSponsor || data.recruitingPartner,
    isActiveTeamLeader: data.isActiveTeamLeader || data.isTeamLeader,
    isActiveDirector: data.isActiveDirector || data.isRegionalDirector,
    isActiveMentor: data.isActiveMentor || data.isMentor,
    enrolledInMentorship: data.enrolledInMentorship,
    
    // External IDs
    qbVendorId: data.quickbooksId || data.qbVendorNumber,
    qbVendorName: data.qbVendorName,
    stripeId: data.stripeId,
  }

  // Check if agent exists
  const existingAgent = await prisma.agent.findFirst({
    where: {
      OR: [
        { rezenId: agentData.rezenId },
        { email: agentData.email },
      ],
    },
  })

  if (existingAgent) {
    await prisma.agent.update({
      where: { id: existingAgent.id },
      data: agentData,
    })
  } else {
    await prisma.agent.create({
      data: agentData,
    })
  }

  // Update sync log
  await prisma.syncLog.updateMany({
    where: {
      externalId: agentData.rezenId,
      status: "PENDING",
    },
    data: {
      status: "SUCCESS",
    },
  })
}

async function deactivateAgent(rezenId: string) {
  await prisma.agent.updateMany({
    where: { rezenId },
    data: { status: "INACTIVE" },
  })
}

function mapStatus(status: string): "ACTIVE" | "INACTIVE" | "ONBOARDING" | "OFFBOARDED" {
  const statusMap: Record<string, "ACTIVE" | "INACTIVE" | "ONBOARDING" | "OFFBOARDED"> = {
    active: "ACTIVE",
    inactive: "INACTIVE",
    onboarding: "ONBOARDING",
    offboarded: "OFFBOARDED",
  }
  return statusMap[status?.toLowerCase()] || "ACTIVE"
}

function mapMemberLevel(level: string): "ASSOCIATE" | "PARTNER" | "SR_PARTNER" | "STAFF" {
  const levelMap: Record<string, "ASSOCIATE" | "PARTNER" | "SR_PARTNER" | "STAFF"> = {
    associate: "ASSOCIATE",
    partner: "PARTNER",
    "sr. partner": "SR_PARTNER",
    "sr partner": "SR_PARTNER",
    staff: "STAFF",
  }
  return levelMap[level?.toLowerCase()] || "ASSOCIATE"
}

