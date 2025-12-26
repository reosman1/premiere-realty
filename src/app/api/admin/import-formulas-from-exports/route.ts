import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

// Ensure prisma is available
if (!prisma) {
  throw new Error("Prisma client not initialized")
}

/**
 * POST /api/admin/import-formulas-from-exports
 * Import formula fields from Zoho export files (much easier than API!)
 */
export async function POST(request: NextRequest) {
  try {
    const moduleMap: Record<string, string> = {
      'Deals': 'Transaction', // Use Deals module for transactions
      'Accounts': 'Agent', // Accounts module is used for agents
      'Listings': 'Listing',
      'Commission_Payments': 'CommissionPayment',
      'Leads': 'Contact', // Leads map to contacts
    }

    const returnTypeMap: Record<string, string> = {
      'currency': 'currency',
      'double': 'number',
      'integer': 'number',
      'text': 'text',
      'boolean': 'boolean',
      'date': 'date',
    }

    function convertFieldName(zohoApiName: string): string {
      return zohoApiName
        .split('_')
        .map((part, index) => 
          index === 0 
            ? part.toLowerCase() 
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join('')
    }

    // Check all modules that might have formula fields
    // We'll process all export files that exist and have formula fields
    const modulesDir = path.join(process.cwd(), 'zoho-exports')
    const allExportFiles = fs.readdirSync(modulesDir)
      .filter((f: string) => f.startsWith('fields_') && f.endsWith('.json'))
      .map((f: string) => f.replace('fields_', '').replace('.json', ''))
    
    // Prioritize known modules, but also check all others
    const knownModules = ['Deals', 'Accounts', 'Listings', 'Commission_Payments', 'Leads']
    const modules = [...new Set([...knownModules, ...allExportFiles])]
    
    const allResults: any[] = []

    for (const moduleName of modules) {
      const exportFile = path.join(process.cwd(), 'zoho-exports', `fields_${moduleName}.json`)
      
      if (!fs.existsSync(exportFile)) {
        continue
      }

      const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'))
      const formulaFields = data.fields?.filter((f: any) => f.data_type === 'formula') || []
      const entityType = moduleMap[moduleName] || moduleName

      for (const field of formulaFields) {
        const fieldName = convertFieldName(field.api_name)
        const returnType = returnTypeMap[field.formula?.return_type?.toLowerCase() || 'number'] || 'number'

        // Check if already exists
        const existing = await prisma.formulaField.findUnique({
          where: {
            entityType_fieldName: {
              entityType,
              fieldName,
            },
          },
        })

        if (existing) {
          allResults.push({
            module: moduleName,
            fieldName,
            displayName: field.display_label,
            status: 'skipped',
            reason: 'Already exists',
          })
          continue
        }

        // Export files don't contain actual formula expressions
        const formulaExpression = field.formula?.expression || `/* TODO: Add formula for ${field.api_name} - check Zoho CRM UI */`

        try {
          const created = await prisma.formulaField.create({
            data: {
              entityType,
              fieldName,
              displayName: field.display_label,
              formulaExpression,
              returnType,
              decimalPlaces: returnType === 'currency' ? 2 : undefined,
              description: `Imported from Zoho ${moduleName} export. Formula expression needs to be added manually from Zoho CRM UI.`,
              isActive: true,
            },
          })

          allResults.push({
            module: moduleName,
            fieldName,
            displayName: field.display_label,
            status: 'created',
            id: created.id,
          })
        } catch (error: any) {
          allResults.push({
            module: moduleName,
            fieldName,
            displayName: field.display_label,
            status: 'error',
            error: error.message,
          })
        }
      }
    }

    const created = allResults.filter(r => r.status === 'created').length
    const skipped = allResults.filter(r => r.status === 'skipped').length
    const errors = allResults.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      message: `Imported ${created} formula fields from export files`,
      results: {
        found: allResults.length,
        created,
        skipped,
        errors,
        fields: allResults,
      },
      note: 'Formula expressions are placeholders. Edit them in the UI with actual formulas from Zoho CRM.',
    })
  } catch (error: any) {
    console.error('Error importing from exports:', error)
    return NextResponse.json(
      { error: 'Failed to import formulas from exports', details: error.message },
      { status: 500 }
    )
  }
}

