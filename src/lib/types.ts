import { Holding } from '@/actions/holdings'

export type EnrichedHolding = Holding & {
  currentPrice: number
  change: number
  changePercent: number
  priceHistory: { date: string; price: number }[]
}
