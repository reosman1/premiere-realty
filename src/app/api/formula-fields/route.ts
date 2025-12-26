import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateFormula } from "@/lib/formula-engine"

/**
 * GET /api/formula-fields
 * List all formula fields, optionally filtered by entity type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entityType")

    const where = entityType ? { entityType, isActive: true } : { isActive: true }

    const formulaFields = await prisma.formulaField.findMany({
      where,
      orderBy: [
        { entityType: 'asc' },
        { displayName: 'asc' }
      ]
    })

    return NextResponse.json({ formulaFields })
  } catch (error: any) {
    console.error("Error fetching formula fields:", error)
    return NextResponse.json(
      { error: "Failed to fetch formula fields", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/formula-fields
 * Create a new formula field
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entityType, fieldName, displayName, formulaExpression, returnType, decimalPlaces, description } = body

    // Validate required fields
    if (!entityType || !fieldName || !displayName || !formulaExpression || !returnType) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, fieldName, displayName, formulaExpression, returnType" },
        { status: 400 }
      )
    }

    // Validate formula syntax
    const validation = validateFormula(formulaExpression)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid formula syntax", details: validation.error },
        { status: 400 }
      )
    }

    // Check if field already exists
    const existing = await prisma.formulaField.findUnique({
      where: {
        entityType_fieldName: {
          entityType,
          fieldName,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Formula field ${fieldName} already exists for ${entityType}` },
        { status: 409 }
      )
    }

    // Create formula field
    const formulaField = await prisma.formulaField.create({
      data: {
        entityType,
        fieldName,
        displayName,
        formulaExpression,
        returnType,
        decimalPlaces: returnType === 'currency' ? (decimalPlaces || 2) : decimalPlaces,
        description,
        isActive: true,
      },
    })

    return NextResponse.json({ formulaField }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating formula field:", error)
    return NextResponse.json(
      { error: "Failed to create formula field", details: error.message },
      { status: 500 }
    )
  }
}

