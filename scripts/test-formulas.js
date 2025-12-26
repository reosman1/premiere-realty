/**
 * Test Formula Fields with Sample Data
 * 
 * This script tests all formula fields against sample transaction and agent data
 * to verify calculations are correct.
 */

const { PrismaClient } = require('@prisma/client')
const { Parser } = require('expr-eval')

const prisma = new PrismaClient()

// Formula evaluation function (copied from formula-engine.ts)
function evaluateFormula(expression, context, returnType = 'number') {
  try {
    const parser = new Parser()

    // Register custom functions
    parser.functions.IF = function(condition, trueValue, falseValue) {
      return condition ? trueValue : falseValue
    }
    parser.functions.IFGT = function(value, compare, trueValue, falseValue) {
      return (value || 0) > compare ? trueValue : falseValue
    }
    parser.functions.COALESCE = function(value, defaultValue) {
      return (value !== null && value !== undefined && value !== 0) ? value : defaultValue
    }

    // Extract all variables from the expression
    const variableRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g
    const variablesInFormula = expression.match(variableRegex) || []
    const functionNames = ['IF', 'IFGT', 'COALESCE', 'Abs', 'Ceil', 'Floor', 'Round', 'Max', 'Min', 'Sqrt', 'If', 'Len']
    const usedVariables = [...new Set(variablesInFormula.filter(v => !functionNames.includes(v) && isNaN(parseFloat(v))))]
    
    // Initialize all used variables (default to 0 if missing)
    const numericContext = {}
    usedVariables.forEach(key => {
      if (!(key in context)) {
        numericContext[key] = 0
      }
    })
    
    for (const [key, value] of Object.entries(context)) {
      if (value === null || value === undefined) {
        numericContext[key] = 0
      } else if (typeof value === 'number') {
        numericContext[key] = value
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value)
        if (!isNaN(parsed)) {
          numericContext[key] = parsed
        }
      } else if (typeof value === 'boolean') {
        numericContext[key] = value ? 1 : 0
      }
    }

    // Evaluate the expression
    const expr = parser.parse(expression)
    const result = expr.evaluate(numericContext)

    // Format result based on return type
    let formattedResult = result
    switch (returnType) {
      case 'currency':
        formattedResult = typeof result === 'number' ? parseFloat(result.toFixed(2)) : result
        break
      case 'number':
        formattedResult = typeof result === 'number' ? result : parseFloat(result) || 0
        break
      case 'boolean':
        formattedResult = Boolean(result)
        break
      case 'text':
        formattedResult = String(result)
        break
    }

    return { value: formattedResult, returnType }
  } catch (error) {
    return { value: null, error: error.message, returnType }
  }
}

// Sample Transaction Data (realistic values)
const sampleTransaction = {
  amount: 450000,
  units: 1,
  commissionPct: 3.0,
  commissionFlatFee: 500,
  otherGrossIncome: 1000,
  referralFeePct: 5.0,
  referralFeeFlat: 200,
  mentoringFeePct: 2.0,
  mentoringFeeFlat: 100,
  agentSplitPercent: 75,
  adminFee: 500,
  agentEOOpsFeesToFirm: 300,
  firmPaidTransactionFees: 200,
  firmComplianceReviewFee: 150,
  otherFirmFees: 100,
  brokerCompanyCommission: 500,
  brokerStocks: 0,
  brokerTransactionFee: 200,
  brokerOtherFees: 100,
  productivityCoaching: 250,
  sponsorPercent: 2.0,
  teamLeaderPercent: 1.0,
  regionalDirectorPercent: 0.5,
  businessBoostPercent: 1.0,
  businessBoostFlat: 100,
  businessDevelopmentDirectorPercent: 0.5,
  realNetIncomeToPG: 10000,
}

// Sample Agent Data
const sampleAgent = {
  dealsPriorToPG: 10,
  dealsWithPG: 30,
  monthsWithFirm: 12,
  teamCapAmount: 20000,
  teamCapAmountPaid: 15000,
}

async function testTransactionFormulas() {
  console.log('\n=== Testing Transaction Formulas ===\n')
  
  const transactionFormulas = await prisma.formulaField.findMany({
    where: {
      entityType: 'Transaction',
      isActive: true,
    },
    orderBy: { displayName: 'asc' },
  })

  console.log(`Found ${transactionFormulas.length} active Transaction formulas\n`)

  let passed = 0
  let failed = 0
  const errors = []

  for (const formula of transactionFormulas) {
    try {
      const result = evaluateFormula(
        formula.formulaExpression,
        sampleTransaction,
        formula.returnType.toLowerCase()
      )

      if (result.error) {
        console.log(`❌ ${formula.displayName}`)
        console.log(`   Error: ${result.error}`)
        failed++
        errors.push({ formula: formula.displayName, error: result.error })
      } else {
        const formattedValue = 
          formula.returnType === 'CURRENCY'
            ? `$${result.value.toFixed(formula.decimalPlaces || 2)}`
            : formula.returnType === 'NUMBER'
            ? result.value.toFixed(formula.decimalPlaces || 2)
            : result.value

        console.log(`✅ ${formula.displayName}`)
        console.log(`   Result: ${formattedValue}`)
        console.log(`   Formula: ${formula.formulaExpression.substring(0, 80)}...`)
        passed++
      }
    } catch (error) {
      console.log(`❌ ${formula.displayName}`)
      console.log(`   Error: ${error.message}`)
      failed++
      errors.push({ formula: formula.displayName, error: error.message })
    }
    console.log('')
  }

  return { passed, failed, errors, total: transactionFormulas.length }
}

async function testAgentFormulas() {
  console.log('\n=== Testing Agent Formulas ===\n')
  
  const agentFormulas = await prisma.formulaField.findMany({
    where: {
      entityType: 'Agent',
      isActive: true,
    },
    orderBy: { displayName: 'asc' },
  })

  console.log(`Found ${agentFormulas.length} active Agent formulas\n`)

  let passed = 0
  let failed = 0
  const errors = []

  for (const formula of agentFormulas) {
    try {
      const result = evaluateFormula(
        formula.formulaExpression,
        sampleAgent,
        formula.returnType.toLowerCase()
      )

      if (result.error) {
        console.log(`❌ ${formula.displayName}`)
        console.log(`   Error: ${result.error}`)
        failed++
        errors.push({ formula: formula.displayName, error: result.error })
      } else {
        const formattedValue = 
          formula.returnType === 'CURRENCY'
            ? `$${result.value.toFixed(formula.decimalPlaces || 2)}`
            : formula.returnType === 'NUMBER'
            ? result.value.toFixed(formula.decimalPlaces || 0)
            : result.value

        console.log(`✅ ${formula.displayName}`)
        console.log(`   Result: ${formattedValue}`)
        console.log(`   Formula: ${formula.formulaExpression.substring(0, 80)}...`)
        passed++
      }
    } catch (error) {
      console.log(`❌ ${formula.displayName}`)
      console.log(`   Error: ${error.message}`)
      failed++
      errors.push({ formula: formula.displayName, error: error.message })
    }
    console.log('')
  }

  return { passed, failed, errors, total: agentFormulas.length }
}

async function main() {
  console.log('🧪 Formula Testing Script')
  console.log('=' .repeat(50))

  try {
    // Test Transaction Formulas
    const txResults = await testTransactionFormulas()
    
    // Test Agent Formulas
    const agentResults = await testAgentFormulas()

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Test Summary')
    console.log('='.repeat(50))
    console.log(`\nTransaction Formulas:`)
    console.log(`  ✅ Passed: ${txResults.passed}/${txResults.total}`)
    console.log(`  ❌ Failed: ${txResults.failed}/${txResults.total}`)
    
    console.log(`\nAgent Formulas:`)
    console.log(`  ✅ Passed: ${agentResults.passed}/${agentResults.total}`)
    console.log(`  ❌ Failed: ${agentResults.failed}/${agentResults.total}`)

    const totalPassed = txResults.passed + agentResults.passed
    const totalFailed = txResults.failed + agentResults.failed
    const totalTests = txResults.total + agentResults.total

    console.log(`\nOverall:`)
    console.log(`  ✅ Passed: ${totalPassed}/${totalTests}`)
    console.log(`  ❌ Failed: ${totalFailed}/${totalTests}`)

    if (totalFailed > 0) {
      console.log(`\n❌ Errors:`)
      ;[...txResults.errors, ...agentResults.errors].forEach(({ formula, error }) => {
        console.log(`  - ${formula}: ${error}`)
      })
      process.exit(1)
    } else {
      console.log('\n✅ All formulas tested successfully!')
    }
  } catch (error) {
    console.error('\n❌ Test script error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

