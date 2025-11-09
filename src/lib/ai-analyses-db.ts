/**
 * Supabase AI Analyses Database Integration
 * Table: ai_analyses
 */

import { createClient } from '@/lib/supabase/server'

// Database Types
export type AIAnalysisItem = {
  id: string
  impact: number
  highlight: string
  sentiment: 'positive' | 'neutral' | 'negative'
  ai_insight: string
  explanation: string
  original_text: string
}

export type AIAnalysisRecord = {
  id: string
  symbol: string
  year: number
  quarter: number
  llm_model: string
  analysis_date: string
  topics: unknown // JSONB field, not used currently
  analysis: AIAnalysisItem[]
  created_at: string
  updated_at: string
}

/**
 * Validate AI Analysis Item structure
 */
function validateAnalysisItem(item: any): item is AIAnalysisItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.impact === 'number' &&
    typeof item.highlight === 'string' &&
    ['positive', 'neutral', 'negative'].includes(item.sentiment) &&
    typeof item.ai_insight === 'string' &&
    typeof item.explanation === 'string' &&
    typeof item.original_text === 'string'
  )
}

/**
 * Validate and sanitize analysis array
 */
function validateAnalysisArray(analysis: unknown): AIAnalysisItem[] {
  if (!Array.isArray(analysis)) {
    console.error('Analysis is not an array:', typeof analysis)
    return []
  }

  return analysis.filter((item, index) => {
    const isValid = validateAnalysisItem(item)
    if (!isValid) {
      console.warn(`Invalid analysis item at index ${index}:`, item)
    }
    return isValid
  })
}

/**
 * Fetch AI analysis for a specific symbol and quarter
 */
export async function fetchAIAnalysis(
  symbol: string,
  year: number,
  quarter: number,
  llmModel?: string
): Promise<AIAnalysisRecord | null> {
  console.log('[fetchAIAnalysis] === FUNCTION START ===')
  console.log('[fetchAIAnalysis] Raw parameters received:', {
    symbol,
    year,
    quarter,
    llmModel,
    llmModelType: typeof llmModel,
    llmModelIsUndefined: llmModel === undefined,
    llmModelIsNull: llmModel === null,
  })

  try {
    const supabase = await createClient()
    console.log('[fetchAIAnalysis] ✓ Supabase client created')

    // First, let's query without the model filter to see what's available
    console.log('[fetchAIAnalysis] → Running debug query (ALL records for this symbol/year/quarter)...')
    const { data: allRecords, error: debugError } = await supabase
      .from('ai_analyses')
      .select('symbol, year, quarter, llm_model')
      .eq('symbol', symbol)
      .eq('year', year)
      .eq('quarter', quarter)

    console.log('[fetchAIAnalysis] ✓ Debug query completed')
    console.log('[fetchAIAnalysis] → Debug results:')
    console.log('[fetchAIAnalysis]   - Records found:', allRecords?.length || 0)
    console.log('[fetchAIAnalysis]   - Records:', JSON.stringify(allRecords, null, 2))

    if (debugError) {
      console.log('[fetchAIAnalysis] ⚠ Debug query error:', debugError)
    }

    if (!allRecords || allRecords.length === 0) {
      console.log('[fetchAIAnalysis] ⚠ No records exist in database for this symbol/year/quarter combination')
      console.log('[fetchAIAnalysis] === FUNCTION END (NO RECORDS IN DB) ===')
      return null
    }

    // Build the main query
    console.log('[fetchAIAnalysis] → Building main query...')
    let query = supabase
      .from('ai_analyses')
      .select('*')
      .eq('symbol', symbol)
      .eq('year', year)
      .eq('quarter', quarter)

    // Only filter by model if specified
    if (llmModel !== undefined && llmModel !== null) {
      console.log('[fetchAIAnalysis] → Filtering by llm_model:', llmModel)
      query = query.eq('llm_model', llmModel)
    } else {
      console.log('[fetchAIAnalysis] → NOT filtering by llm_model (accepting any model)')
    }

    // Order by date and get the most recent one
    query = query.order('analysis_date', { ascending: false }).limit(1)

    console.log('[fetchAIAnalysis] → Executing main query...')
    const { data, error } = await query.maybeSingle()
    console.log('[fetchAIAnalysis] ✓ Main query completed')

    if (error) {
      console.log('[fetchAIAnalysis] ✗ Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      throw error
    }

    if (!data) {
      console.log('[fetchAIAnalysis] ⚠ Main query returned no data')
      console.log('[fetchAIAnalysis] === FUNCTION END (NO MATCH) ===')
      return null
    }

    console.log('[fetchAIAnalysis] ✓ Found record:', {
      id: data.id,
      symbol: data.symbol,
      year: data.year,
      quarter: data.quarter,
      llmModel: data.llm_model,
      analysisItemCount: Array.isArray(data.analysis) ? data.analysis.length : 0,
    })

    // Validate and sanitize the analysis array
    const validatedAnalysis = validateAnalysisArray(data.analysis)

    console.log('[fetchAIAnalysis] ✓ Validation complete, returning record')
    console.log('[fetchAIAnalysis] === FUNCTION END (SUCCESS) ===')
    return {
      ...data,
      analysis: validatedAnalysis
    } as AIAnalysisRecord
  } catch (error) {
    console.error('[fetchAIAnalysis] === FUNCTION END (ERROR) ===')
    console.error('[fetchAIAnalysis] Caught error:', error)
    throw error
  }
}

/**
 * Fetch the most recent AI analysis for a symbol
 */
export async function fetchLatestAIAnalysis(
  symbol: string,
  llmModel?: string
): Promise<AIAnalysisRecord | null> {
  try {
    console.log('[fetchLatestAIAnalysis] Querying database:', { symbol, llmModel: llmModel || 'ANY' })

    const supabase = await createClient()

    // First check what models are available for this symbol
    const { data: debugData } = await supabase
      .from('ai_analyses')
      .select('symbol, year, quarter, llm_model, analysis_date')
      .eq('symbol', symbol)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .limit(5)

    console.log('[fetchLatestAIAnalysis] Recent records for symbol:', debugData)

    // Build query
    let query = supabase
      .from('ai_analyses')
      .select('*')
      .eq('symbol', symbol)

    // Only filter by model if specified
    if (llmModel) {
      query = query.eq('llm_model', llmModel)
    }

    const { data, error } = await query
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.log('[fetchLatestAIAnalysis] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      throw error
    }

    if (!data) {
      console.log('[fetchLatestAIAnalysis] No data found')
      return null
    }

    console.log('[fetchLatestAIAnalysis] Found latest record:', {
      id: data.id,
      symbol: data.symbol,
      year: data.year,
      quarter: data.quarter,
      llmModel: data.llm_model,
      analysisItemCount: Array.isArray(data.analysis) ? data.analysis.length : 0,
    })

    // Validate and sanitize the analysis array
    const validatedAnalysis = validateAnalysisArray(data.analysis)

    return {
      ...data,
      analysis: validatedAnalysis
    } as AIAnalysisRecord
  } catch (error) {
    console.error(`Error fetching latest AI analysis for ${symbol}:`, error)
    throw error
  }
}

/**
 * Fetch all available quarters for a symbol
 * Returns quarters that actually exist in the database (any model)
 */
export async function fetchAvailableQuarters(
  symbol: string
): Promise<Array<{ year: number; quarter: number; date: string }>> {
  try {
    console.log('[fetchAvailableQuarters] Fetching for symbol:', symbol)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_analyses')
      .select('year, quarter, analysis_date')
      .eq('symbol', symbol)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })

    if (error) {
      console.error('[fetchAvailableQuarters] Database error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log('[fetchAvailableQuarters] No quarters found for symbol:', symbol)
      return []
    }

    console.log('[fetchAvailableQuarters] Found quarters:', data)

    return data.map((item: { year: number; quarter: number; analysis_date: string }) => ({
      year: item.year,
      quarter: item.quarter,
      date: item.analysis_date
    }))
  } catch (error) {
    console.error(`Error fetching available quarters for ${symbol}:`, error)
    throw error
  }
}

/**
 * Parse quarter string (e.g., "Q3 2024") to year and quarter number
 */
export function parseQuarterString(quarterString: string): { year: number; quarter: number } | null {
  console.log('[parseQuarterString] Input:', quarterString)
  const match = quarterString.match(/Q([1-4])\s+(\d{4})/)
  if (!match) {
    console.log('[parseQuarterString] Failed to match pattern. Expected format: "Q1 2024", "Q2 2024", etc.')
    return null
  }

  const result = {
    quarter: parseInt(match[1]),
    year: parseInt(match[2])
  }
  console.log('[parseQuarterString] Parsed:', result)
  return result
}

/**
 * Format year and quarter to quarter string (e.g., 2024, 3 => "Q3 2024")
 */
export function formatQuarterString(year: number, quarter: number): string {
  return `Q${quarter} ${year}`
}
