import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/commissions
 * Fetch commission payments from database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10)
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        {
          agent: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          transaction: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        { qbInvoiceId: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status && status !== "all") {
      where.status = status
    }

    // Fetch commission payments
    const [commissions, total] = await Promise.all([
      prisma.commissionPayment.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          transaction: {
            select: {
              id: true,
              name: true,
              amount: true,
              grossCommissionGCI: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.commissionPayment.count({ where }),
    ])

    // Transform data for frontend
    const transformedCommissions = commissions.map((comm) => ({
      id: comm.id,
      agent: comm.agent?.name || "Unassigned",
      agentId: comm.agentId,
      transaction: comm.transaction?.name || "No Transaction",
      transactionId: comm.transactionId,
      amount: comm.amount ? Number(comm.amount) : null,
      gci: comm.transaction?.grossCommissionGCI ? Number(comm.transaction.grossCommissionGCI) : null,
      status: comm.status,
      paymentType: comm.paymentType,
      dateEarned: comm.dateEarned,
      datePaid: comm.datePaid,
      qbInvoiceId: comm.qbInvoiceId,
    }))

    return NextResponse.json({
      commissions: transformedCommissions,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error("Error fetching commission payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch commission payments", details: error.message },
      { status: 500 }
    )
  }
}

