/**
 * Import formula fields from Zoho export files
 * Much easier than dealing with API tokens!
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Map Zoho module names to our entity types
const moduleMap = {
  'Deals': 'Transaction', // Use Deals module for transactions
  'Members': 'Agent',
  'Listings': 'Listing',
  'Commission_Payments': 'CommissionPayment',
}

// Map Zoho return types to our return types
const returnTypeMap = {
  'currency': 'currency',
  'double': 'number',
  'integer': 'number',
  'text': 'text',
  'boolean': 'boolean',
  'date': 'date',
}

function convertFieldName(zohoApiName) {
  return zohoApiName
    .split('_')
    .map((part, index) => 
      index === 0 
        ? part.toLowerCase() 
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join('')
}

async function importFromExport(moduleName) {
  const exportFile = path.join(__dirname, '..', 'zoho-exports', `fields_${moduleName}.json`)
  
  if (!fs.existsSync(exportFile)) {
    console.log(`⚠️  Export file not found: ${exportFile}`)
    return []
  }

  const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'))
  const formulaFields = data.fields?.filter(f => f.data_type === 'formula') || []
  
  const entityType = moduleMap[moduleName] || moduleName
  
  console.log(`\n📦 Module: ${moduleName} → ${entityType}`)
  console.log(`   Found ${formulaFields.length} formula fields\n`)

  const results = []

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
      console.log(`   ⏭️  ${field.display_label} (${fieldName}) - already exists`)
      results.push({ fieldName, status: 'skipped', reason: 'Already exists' })
      continue
    }

    // Note: Export files don't contain the actual formula expressions
    // We'll create them with a placeholder that you can fill in later
    const formulaExpression = field.formula?.expression || `/* TODO: Add formula for ${field.api_name} */`
    
    try {
      const created = await prisma.formulaField.create({
        data: {
          entityType,
          fieldName,
          displayName: field.display_label,
          formulaExpression,
          returnType,
          decimalPlaces: returnType === 'currency' ? 2 : undefined,
          description: `Imported from Zoho ${moduleName} export. Formula expression needs to be added manually.`,
          isActive: true,
        },
      })

      console.log(`   ✅ ${field.display_label} (${fieldName})`)
      console.log(`      Type: ${returnType}, Expression: ${formulaExpression.substring(0, 50)}...`)
      results.push({ fieldName, status: 'created', id: created.id })
    } catch (error) {
      console.error(`   ❌ Error creating ${fieldName}:`, error.message)
      results.push({ fieldName, status: 'error', error: error.message })
    }
  }

  return results
}

async function main() {
  console.log('🔄 Importing Formula Fields from Zoho Exports\n')
  console.log('=' .repeat(60))

  const modules = ['Deals', 'Members', 'Listings', 'Commission_Payments']
  const allResults = []

  for (const module of modules) {
    const results = await importFromExport(module)
    allResults.push(...results)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 Summary:')
  const created = allResults.filter(r => r.status === 'created').length
  const skipped = allResults.filter(r => r.status === 'skipped').length
  const errors = allResults.filter(r => r.status === 'error').length

  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)

  if (created > 0) {
    console.log('\n💡 Note: Formula expressions from exports are placeholders.')
    console.log('   You can edit them in the UI at /admin/formula-fields')
    console.log('   Or add the actual formulas from Zoho CRM UI.')
  }

  console.log('\n✅ Done!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error)
    prisma.$disconnect()
    process.exit(1)
  })

