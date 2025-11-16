import { createAsync, redirect, cache } from '@solidjs/router'
import { Show } from 'solid-js'
import { getUser } from '~/server/auth'
import { getPortfolios } from '~/server/portfolio'
import { getHoldings } from '~/server/holdings'
import { getStockPrice } from '~/server/stocks'
import type { EnrichedHolding } from '~/lib/types'

const loadPortfolioData = cache(async () => {
  'use server'
  
  const user = await getUser()
  if (!user) {
    throw redirect('/login')
  }

  const portfolios = await getPortfolios(user.id)
  let holdings: EnrichedHolding[] = []
  let portfolioId = ''

  if (portfolios.length > 0) {
    const portfolio = portfolios[0]
    portfolioId = portfolio.id
    
    const rawHoldings = await getHoldings(portfolio.id)
    holdings = await Promise.all(
      rawHoldings.map(async (holding) => {
        try {
          const priceData = await getStockPrice(holding.ticker)
          return {
            ...holding,
            currentPrice: priceData.price,
            change: priceData.change,
            changePercent: priceData.changePercent,
            priceHistory: priceData.history,
          }
        } catch (error) {
          console.error(`Error fetching price for ${holding.ticker}:`, error)
          return {
            ...holding,
            currentPrice: holding.purchasePrice,
            change: 0,
            changePercent: 0,
            priceHistory: [],
          }
        }
      })
    )
  }

  return { user, portfolioId, holdings }
}, 'portfolio-data')

export const route = {
  preload: () => loadPortfolioData(),
}

export default function PortfolioPage() {
  const data = createAsync(() => loadPortfolioData())

  return (
    <Show when={data()} fallback={<div>Loading...</div>}>
      {(d) => (
        <div class="min-h-screen bg-background p-8">
          <h1 class="text-3xl font-bold mb-6">Portfolio</h1>
          <div class="text-sm text-muted-foreground">
            User ID: {d().user.id}
          </div>
          <div class="text-sm text-muted-foreground">
            Holdings: {d().holdings.length}
          </div>
          {/* PortfolioClient will be added here */}
        </div>
      )}
    </Show>
  )
}
