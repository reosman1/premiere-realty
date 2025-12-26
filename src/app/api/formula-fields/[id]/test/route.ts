import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { testFormula, extractFieldReferences } from "@/lib/formula-engine"

/**
 * POST /api/formula-fields/:id/test
 * Test a formula with sample data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { testData } = body

    // Get formula field
    const formulaField = await prisma.formulaField.findUnique({
      where: { id },
    })

    if (!formulaField) {
      return NextResponse.json({ error: "Formula field not found" }, { status: 404 })
    }

    // Extract field references to show which fields are needed
    const fieldReferences = extractFieldReferences(formulaField.formulaExpression)

    // Test the formula
    const result = testFormula(
      formulaField.formulaExpression,
      testData || {},
      formulaField.returnType as any
    )

    return NextResponse.json({
      result,
      fieldReferences,
      formula: formulaField.formulaExpression,
    })
  } catch (error: any) {
    console.error("Error testing formula:", error)
    return NextResponse.json(
      { error: "Failed to test formula", details: error.message },
      { status: 500 }
    )
  }
}

