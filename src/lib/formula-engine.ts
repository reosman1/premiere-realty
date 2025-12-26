/**
 * Formula Engine
 * 
 * Evaluates formula expressions for calculated fields.
 * Uses expr-eval library for safe expression evaluation.
 */

import { Parser } from 'expr-eval'

export type FormulaReturnType = 'currency' | 'number' | 'text' | 'date' | 'boolean'

export interface FormulaContext {
  [key: string]: any // Field values from the record
}

export interface FormulaEvaluationResult {
  value: any
  error?: string
  returnType: FormulaReturnType
}

/**
 * Evaluate a formula expression with given context (field values)
 */
export function evaluateFormula(
  expression: string,
  context: FormulaContext,
  returnType: FormulaReturnType = 'number'
): FormulaEvaluationResult {
  try {
    // Create parser instance
    const parser = new Parser()

    // Register custom functions for common operations
    parser.functions.IF = function(condition: number, trueValue: number, falseValue: number) {
      return condition ? trueValue : falseValue
    }
    parser.functions.IFGT = function(value: number, compare: number, trueValue: number, falseValue: number) {
      return (value || 0) > compare ? trueValue : falseValue
    }
    // Helper to handle null/undefined values (default to a value if null)
    parser.functions.COALESCE = function(value: number, defaultValue: number) {
      return (value !== null && value !== undefined && value !== 0) ? value : defaultValue
    }

    // Convert context values to numbers where appropriate for calculations
    const numericContext: { [key: string]: number } = {}
    const stringContext: { [key: string]: string } = {}
    
    // First, extract all variable names from the expression
    const variableRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g
    const variablesInFormula = expression.match(variableRegex) || []
    const functionNames = ['IF', 'IFGT', 'COALESCE', 'Abs', 'Ceil', 'Floor', 'Round', 'Max', 'Min', 'Sqrt', 'If', 'Len']
    const usedVariables = [...new Set(variablesInFormula.filter(v => !functionNames.includes(v) && isNaN(parseFloat(v))))]
    
    // Initialize all used variables (default to 0 if missing)
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
        // Try to parse as number
        const parsed = parseFloat(value)
        if (!isNaN(parsed)) {
          numericContext[key] = parsed
        } else {
          stringContext[key] = value
        }
      } else if (typeof value === 'boolean') {
        numericContext[key] = value ? 1 : 0
      }
    }

    // Evaluate the expression
    const expr = parser.parse(expression)
    const result = expr.evaluate({ ...numericContext, ...stringContext })

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
      case 'date':
        // Date formulas would need special handling
        formattedResult = result
        break
    }

    return {
      value: formattedResult,
      returnType,
    }
  } catch (error: any) {
    return {
      value: null,
      error: error.message || 'Formula evaluation error',
      returnType,
    }
  }
}

/**
 * Validate formula syntax without evaluating
 */
export function validateFormula(expression: string): { valid: boolean; error?: string } {
  try {
    const parser = new Parser()
    parser.parse(expression)
    return { valid: true }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid formula syntax',
    }
  }
}

/**
 * Extract field references from a formula expression
 * Returns an array of field names used in the formula
 */
export function extractFieldReferences(expression: string): string[] {
  // Simple regex to find field references (alphanumeric + underscore)
  // This is a basic implementation - can be enhanced
  const regex = /[a-zA-Z_][a-zA-Z0-9_]*/g
  const matches = expression.match(regex) || []
  
  // Filter out operators and functions
  const operators = ['if', 'sum', 'count', 'avg', 'max', 'min', 'round', 'abs', 'sqrt', 'log']
  const fieldRefs = matches.filter(
    (match) => !operators.includes(match.toLowerCase()) && isNaN(parseFloat(match))
  )
  
  return [...new Set(fieldRefs)] // Remove duplicates
}

/**
 * Test formula with sample data
 */
export function testFormula(
  expression: string,
  testData: FormulaContext,
  returnType: FormulaReturnType = 'number'
): FormulaEvaluationResult {
  return evaluateFormula(expression, testData, returnType)
}

