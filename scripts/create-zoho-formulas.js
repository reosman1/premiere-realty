/**
 * Manually create the known Zoho formula fields
 * Since token authentication isn't working, we'll create these manually
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const formulas = [
  {
    entityType: 'Transaction',
    fieldName: 'totalPayments',
    displayName: 'Total Payments',
    formulaExpression: 'SUM(Payment_Particpants.Payment_Amount)',
    returnType: 'currency',
    decimalPlaces: 2,
    description: 'Sum of payment amounts from Payment_Particpants subform (synced from Zoho)',
  },
  {
    entityType: 'Transaction',
    fieldName: 'grossCommissionGCI',
    displayName: 'Gross Commission Income (GCI)',
    formulaExpression: '(Amount * Commission / 100) + CommissionFlatFee',
    returnType: 'currency',
    decimalPlaces: 2,
    description: 'Calculated gross commission income (synced from Zoho)',
  },
]

async function createFormulas() {
  console.log('📝 Creating Zoho formula fields manually...\n')

  for (const formula of formulas) {
    try {
      // Check if exists
      const existing = await prisma.formulaField.findUnique({
        where: {
          entityType_fieldName: {
            entityType: formula.entityType,
            fieldName: formula.fieldName,
          },
        },
      })

      if (existing) {
        console.log(`⏭️  Skipping ${formula.fieldName} - already exists`)
        continue
      }

      // Create
      const created = await prisma.formulaField.create({
        data: formula,
      })

      console.log(`✅ Created ${formula.fieldName}: ${formula.displayName}`)
    } catch (error) {
      console.error(`❌ Error creating ${formula.fieldName}:`, error.message)
    }
  }

  console.log('\n✅ Done!')
}

createFormulas()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error)
    prisma.$disconnect()
    process.exit(1)
  })

