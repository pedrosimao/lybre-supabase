import { getUser } from '@/actions/auth'
import { getPortfolios } from '@/actions/portfolio'
import { getHoldings } from '@/actions/holdings'
import { getStockPrice } from '@/actions/stocks'
import { redirect } from 'next/navigation'
import { PortfolioClient } from '@/components/client/PortfolioClient'
import { EnrichedHolding } from '@/lib/types'

export default async function PortfolioPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch portfolios for the user
  const portfolios = await getPortfolios(user.id)

  // If no portfolios exist, we'll pass empty data to the client
  // The client can handle creating the first portfolio
  let holdings: EnrichedHolding[] = []
  let portfolioId = ''

  if (portfolios.length > 0) {
    // Use the first portfolio
    const portfolio = portfolios[0]
    portfolioId = portfolio.id

    // Fetch holdings for this portfolio
    const rawHoldings = await getHoldings(portfolio.id)

    // Enrich holdings with current price data
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
          // Return holding with default price data if fetch fails
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

  return (
    <PortfolioClient
      userId={user.id}
      initialPortfolioId={portfolioId}
      initialHoldings={holdings}
    />
  )
}
