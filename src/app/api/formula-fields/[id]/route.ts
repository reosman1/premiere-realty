import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateFormula, testFormula } from "@/lib/formula-engine"

/**
 * GET /api/formula-fields/:id
 * Get a specific formula field
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const formulaField = await prisma.formulaField.findUnique({
      where: { id },
    })

    if (!formulaField) {
      return NextResponse.json({ error: "Formula field not found" }, { status: 404 })
    }

    return NextResponse.json({ formulaField })
  } catch (error: any) {
    console.error("Error fetching formula field:", error)
    return NextResponse.json(
      { error: "Failed to fetch formula field", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/formula-fields/:id
 * Update a formula field
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { displayName, formulaExpression, returnType, decimalPlaces, description, isActive } = body

    // Check if formula field exists
    const existing = await prisma.formulaField.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Formula field not found" }, { status: 404 })
    }

    // If formula expression is being updated, validate it
    if (formulaExpression !== undefined) {
      const validation = validateFormula(formulaExpression)
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid formula syntax", details: validation.error },
          { status: 400 }
        )
      }
    }

    // Update formula field
    const formulaField = await prisma.formulaField.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(formulaExpression !== undefined && { formulaExpression }),
        ...(returnType !== undefined && { returnType }),
        ...(decimalPlaces !== undefined && { decimalPlaces }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ formulaField })
  } catch (error: any) {
    console.error("Error updating formula field:", error)
    return NextResponse.json(
      { error: "Failed to update formula field", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/formula-fields/:id
 * Delete (deactivate) a formula field
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete by setting isActive to false
    const formulaField = await prisma.formulaField.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ formulaField })
  } catch (error: any) {
    console.error("Error deleting formula field:", error)
    return NextResponse.json(
      { error: "Failed to delete formula field", details: error.message },
      { status: 500 }
    )
  }
}

