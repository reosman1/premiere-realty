import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/transactions
 * Fetch transactions from database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const stage = searchParams.get("stage")
    const type = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10)
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { addressOneLine: { contains: search, mode: "insensitive" } },
        { brokerTransactionId: { contains: search, mode: "insensitive" } },
        { transactionCode: { contains: search, mode: "insensitive" } },
      ]
    }

    if (stage && stage !== "all") {
      where.stage = stage
    }

    if (type && type !== "all") {
      where.type = type
    }

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ])

    // Transform data for frontend
    const transformedTransactions = transactions.map((tx) => ({
      id: tx.id,
      name: tx.name,
      address: tx.addressOneLine || tx.streetAddress || "",
      agent: tx.agent?.name || "Unassigned",
      agentId: tx.agentId,
      amount: tx.amount ? Number(tx.amount) : null,
      commissionPct: tx.commissionPct ? Number(tx.commissionPct) : null,
      gci: tx.grossCommissionGCI ? Number(tx.grossCommissionGCI) : null,
      stage: tx.stage,
      type: tx.type,
      contractDate: tx.contractAcceptanceDate,
      closingDate: tx.actualClosingDate,
      brokerTransactionId: tx.brokerTransactionId || tx.transactionCode || "",
      zohoId: tx.zohoId,
    }))

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error.message },
      { status: 500 }
    )
  }
}

