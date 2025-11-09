/**
 * Financial Modeling Prep API Integration
 * Documentation: https://site.financialmodelingprep.com/developer/docs
 */

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3'
const FMP_API_KEY = process.env.FMP_API_KEY

if (!FMP_API_KEY) {
  console.warn('FMP_API_KEY is not set in environment variables')
}

// FMP API Response Types
export type FMPQuote = {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  change: number
  dayLow: number
  dayHigh: number
  yearHigh: number
  yearLow: number
  marketCap: number
  priceAvg50: number
  priceAvg200: number
  volume: number
  avgVolume: number
  exchange: string
  open: number
  previousClose: number
  eps: number
  pe: number
  earningsAnnouncement: string
  sharesOutstanding: number
  timestamp: number
}

export type FMPHistoricalPrice = {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjClose: number
  volume: number
  unadjustedVolume: number
  change: number
  changePercent: number
  vwap: number
  label: string
  changeOverTime: number
}

export type FMPHistoricalResponse = {
  symbol: string
  historical: FMPHistoricalPrice[]
}

/**
 * Fetch real-time stock quote
 */
export async function fetchQuote(symbol: string): Promise<FMPQuote> {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY is not configured')
  }

  const url = `${FMP_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No quote data found for symbol: ${symbol}`)
    }

    return data[0]
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error)
    throw error
  }
}

/**
 * Fetch historical prices (daily)
 * @param symbol Stock symbol
 * @param days Number of days of history (default 30)
 */
export async function fetchHistoricalPrices(
  symbol: string,
  days: number = 30
): Promise<FMPHistoricalPrice[]> {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY is not configured')
  }

  // Calculate date range
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const from = fromDate.toISOString().split('T')[0]
  const to = toDate.toISOString().split('T')[0]

  const url = `${FMP_BASE_URL}/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`)
    }

    const data: FMPHistoricalResponse = await response.json()

    if (!data.historical || !Array.isArray(data.historical)) {
      throw new Error(`No historical data found for symbol: ${symbol}`)
    }

    // Return in chronological order (oldest to newest)
    return data.historical.reverse()
  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error)
    throw error
  }
}

/**
 * Fetch quotes for multiple symbols
 */
export async function fetchBatchQuotes(symbols: string[]): Promise<FMPQuote[]> {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY is not configured')
  }

  const symbolList = symbols.join(',')
  const url = `${FMP_BASE_URL}/quote/${symbolList}?apikey=${FMP_API_KEY}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      throw new Error('Invalid batch quote response')
    }

    return data
  } catch (error) {
    console.error('Error fetching batch quotes:', error)
    throw error
  }
}
