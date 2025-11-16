
import * as kv from '~/lib/kv-store'
import { createClient } from '~/lib/supabase/server'
import { fetchQuote, fetchHistoricalPrices } from '~/lib/fmp-api'
import {
  fetchLatestAIAnalysis,
  fetchAIAnalysis,
  parseQuarterString,
  formatQuarterString,
  type AIAnalysisItem,
} from '~/lib/ai-analyses-db'

// Result types for error handling
export type SuccessResult<T> = {
  success: true
  data: T
}

export type ErrorResult = {
  success: false
  error: string
}

export type Result<T> = SuccessResult<T> | ErrorResult

// Data types
export type PriceData = {
  ticker: string
  price: number
  change: number
  changePercent: number
  history: { date: string; price: number }[]
}

export type EarningsData = {
  ticker: string
  quarter: string
  date: string
  highlights: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

export type TranscriptHighlight = {
  id: string
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  impact: number
  explanation: string
  aiInsight: string
}

export type TranscriptSection = {
  type: 'regular' | 'highlight'
  content: string
  highlight?: TranscriptHighlight
}

export type TranscriptData = {
  ticker: string
  quarter: string
  date: string
  sections: TranscriptSection[]
  highlights: TranscriptHighlight[]
}

export async function getStockPrice(ticker: string): Promise<PriceData> {
  'use server'

  try {
    // Validate ticker
    if (!ticker || ticker.trim() === '') {
      throw new Error('Invalid ticker symbol')
    }

    // Fetch real-time quote from FMP API
    const quote = await fetchQuote(ticker.trim().toUpperCase())

    // Validate quote data
    if (!quote || typeof quote.price !== 'number') {
      throw new Error(`Invalid price data received for ${ticker}`)
    }

    // Fetch historical prices for chart (30 days)
    const historicalPrices = await fetchHistoricalPrices(ticker.trim().toUpperCase(), 30)

    // Validate historical data
    if (!Array.isArray(historicalPrices) || historicalPrices.length === 0) {
      console.warn(`No historical data for ${ticker}, using current price only`)
      // Fallback: create minimal history with just current price
      const today = new Date().toISOString().split('T')[0]
      return {
        ticker: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changesPercentage,
        history: [{ date: today, price: quote.price }],
      }
    }

    // Convert historical prices to the format expected by the app
    const history = historicalPrices.map((price) => ({
      date: price.date,
      price: price.close,
    }))

    return {
      ticker: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      history,
    }
  } catch (error) {
    console.error(`Error fetching price data for ${ticker}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to fetch price data for ${ticker}: ${errorMessage}`)
  }
}

export async function getEarnings(ticker: string): Promise<EarningsData> {
  'use server'
  try {
    // Validate ticker
    if (!ticker || ticker.trim() === '') {
      throw new Error('Invalid ticker symbol')
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const normalizedTicker = ticker.trim().toUpperCase()
    const cacheKey = `earnings:${user.id}:${normalizedTicker}`
    const cachedData = await kv.get(supabase, cacheKey)

    // If cached data exists, return it
    if (cachedData) {
      return cachedData
    }

    // Fetch latest AI analysis from Supabase (don't filter by model - accept any model)
    const aiAnalysis = await fetchLatestAIAnalysis(normalizedTicker, undefined)

    if (!aiAnalysis) {
      throw new Error(
        `No earnings data available for ${ticker}. Please check back later or contact support.`
      )
    }

    // Validate analysis data
    if (!Array.isArray(aiAnalysis.analysis) || aiAnalysis.analysis.length === 0) {
      console.warn(`Empty analysis data for ${ticker}`)
      throw new Error(`Earnings data for ${ticker} is incomplete. Please try again later.`)
    }

    // Convert AI analysis to earnings data format
    const earningsData: EarningsData = {
      ticker: normalizedTicker,
      quarter: formatQuarterString(aiAnalysis.year, aiAnalysis.quarter),
      date: aiAnalysis.analysis_date.split('T')[0], // Convert timestamp to date string
      highlights: aiAnalysis.analysis.map((item) => item.highlight).filter(Boolean),
      sentiment: determineSentiment(aiAnalysis.analysis),
    }

    // Validate highlights
    if (earningsData.highlights.length === 0) {
      console.warn(`No highlights found in earnings data for ${ticker}`)
      earningsData.highlights = ['No highlights available for this quarter.']
    }

    // Cache the data
    await kv.set(supabase, cacheKey, earningsData)

    return earningsData
  } catch (error) {
    console.error(`Error fetching earnings data for ${ticker}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(errorMessage)
  }
}

export async function getTranscript(ticker: string, quarter: string): Promise<Result<TranscriptData>> {
  'use server'
  try {
    console.log('[getTranscript] Starting fetch:', { ticker, quarter })

    // Validate inputs
    if (!ticker || ticker.trim() === '') {
      console.log('[getTranscript] Invalid ticker')
      return { success: false, error: 'Invalid ticker symbol' }
    }
    if (!quarter || quarter.trim() === '') {
      console.log('[getTranscript] Invalid quarter')
      return { success: false, error: 'Invalid quarter' }
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[getTranscript] User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    const normalizedTicker = ticker.trim().toUpperCase()
    console.log('[getTranscript] Normalized ticker:', normalizedTicker)

    const cacheKey = `transcript:${user.id}:${normalizedTicker}:${quarter}`
    const cachedData = await kv.get(supabase, cacheKey)

    // If cached data exists, return it
    if (cachedData) {
      console.log('[getTranscript] Returning cached data')
      return { success: true, data: cachedData }
    }

    console.log('[getTranscript] No cache, fetching from database')

    // Parse quarter string to get year and quarter number
    const parsed = parseQuarterString(quarter)
    console.log('[getTranscript] Parsed quarter:', parsed)

    if (!parsed) {
      console.log('[getTranscript] Failed to parse quarter:', quarter)
      return {
        success: false,
        error: `Invalid quarter format: "${quarter}". Expected format: "Q1 2024", "Q2 2024", etc.`,
      }
    }

    // Fetch AI analysis from Supabase (don't filter by model - accept any model)
    console.log('[getTranscript] Fetching AI analysis from database')
    const aiAnalysis = await fetchAIAnalysis(normalizedTicker, parsed.year, parsed.quarter, undefined)

    if (!aiAnalysis) {
      console.log('[getTranscript] No AI analysis found in database')
      return {
        success: false,
        error: `No transcript data available for ${ticker} ${quarter}. This quarter may not have been analyzed yet. Please check if data exists in the database for symbol="${normalizedTicker}", year=${parsed.year}, quarter=${parsed.quarter}`,
      }
    }

    console.log('[getTranscript] AI analysis found, processing...')

    // Validate analysis data
    if (!Array.isArray(aiAnalysis.analysis)) {
      console.error('[getTranscript] Invalid analysis format:', typeof aiAnalysis.analysis)
      return {
        success: false,
        error: `Transcript data for ${ticker} ${quarter} is in an invalid format. Please contact support.`,
      }
    }

    // Convert AI analysis items to transcript highlights
    const highlights: TranscriptHighlight[] = aiAnalysis.analysis
      .map((item) => convertAIAnalysisToHighlight(item))
      .filter((highlight) => highlight.text && highlight.text.trim() !== '')

    console.log('[getTranscript] Converted highlights:', highlights.length)

    // Validate highlights
    if (highlights.length === 0) {
      console.warn('[getTranscript] No valid highlights found')
      return {
        success: false,
        error: `No valid transcript highlights found for ${ticker} ${quarter}. The data may be incomplete.`,
      }
    }

    // Create transcript sections (pairs of regular + highlight sections)
    const sections: TranscriptSection[] = createTranscriptSections(
      highlights,
      aiAnalysis.analysis
    )

    const transcriptData: TranscriptData = {
      ticker: normalizedTicker,
      quarter,
      date: aiAnalysis.analysis_date.split('T')[0],
      sections,
      highlights,
    }

    console.log('[getTranscript] Successfully created transcript data')

    // Cache the data
    await kv.set(supabase, cacheKey, transcriptData)

    return { success: true, data: transcriptData }
  } catch (error) {
    console.error('[getTranscript] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: `Failed to fetch transcript: ${errorMessage}`,
    }
  }
}

/**
 * Get available quarters for a ticker from the database
 * Returns an array of quarter strings in "Q# YYYY" format
 */
export async function getAvailableQuarters(ticker: string): Promise<string[]> {
  'use server'
  try {
    console.log('[getAvailableQuarters] Fetching for ticker:', ticker)
    const { fetchAvailableQuarters } = await import('~/lib/ai-analyses-db')
    const quarters = await fetchAvailableQuarters(ticker.trim().toUpperCase())

    console.log('[getAvailableQuarters] Found quarters:', quarters)

    const quarterStrings = quarters.map((q) => formatQuarterString(q.year, q.quarter))
    console.log('[getAvailableQuarters] Formatted quarters:', quarterStrings)

    return quarterStrings
  } catch (error) {
    console.error(`Error fetching available quarters for ${ticker}:`, error)
    return []
  }
}

// Helper functions

/**
 * Convert AI analysis item from database to TranscriptHighlight format
 */
function convertAIAnalysisToHighlight(item: AIAnalysisItem): TranscriptHighlight {
  return {
    id: item.id,
    text: item.highlight,  // Use highlight field for the summary card
    sentiment: item.sentiment,
    impact: item.impact,
    explanation: item.explanation,
    aiInsight: item.ai_insight,
  }
}

/**
 * Create transcript sections from highlights
 * Creates pairs of sections: regular (original_text) + highlight (summary)
 */
function createTranscriptSections(
  highlights: TranscriptHighlight[],
  analysisItems: AIAnalysisItem[]
): TranscriptSection[] {
  const sections: TranscriptSection[] = []

  highlights.forEach((highlight, index) => {
    const originalItem = analysisItems[index]

    // First: Add regular section with full original_text (collapsible)
    if (originalItem?.original_text) {
      sections.push({
        type: 'regular',
        content: originalItem.original_text,
      })
    }

    // Second: Add highlight section with summary (colored card with AI analysis)
    sections.push({
      type: 'highlight',
      content: highlight.text,  // This is the highlight field (short summary)
      highlight: highlight,
    })
  })

  return sections
}

/**
 * Determine overall sentiment from array of AI analysis items
 */
function determineSentiment(analysis: AIAnalysisItem[]): 'positive' | 'neutral' | 'negative' {
  if (analysis.length === 0) {
    return 'neutral'
  }

  // Calculate weighted sentiment score based on impact
  let totalScore = 0
  let totalWeight = 0

  analysis.forEach((item) => {
    const sentimentScore = item.sentiment === 'positive' ? 1 : item.sentiment === 'negative' ? -1 : 0
    const weight = item.impact
    totalScore += sentimentScore * weight
    totalWeight += weight
  })

  if (totalWeight === 0) {
    return 'neutral'
  }

  const averageScore = totalScore / totalWeight

  // Threshold for positive/negative classification
  if (averageScore > 0.2) {
    return 'positive'
  } else if (averageScore < -0.2) {
    return 'negative'
  } else {
    return 'neutral'
  }
}
