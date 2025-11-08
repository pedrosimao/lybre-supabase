'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
} from 'lucide-react'
import { getEarnings, type EarningsData } from '@/actions/stocks'
import { type Holding } from '@/actions/holdings'

interface StockPreviewPanelProps {
  holding: Holding | null
  currentPrice?: number
  change?: number
  changePercent?: number
}

export function StockPreviewPanel({
  holding,
  currentPrice,
  change,
  changePercent,
}: StockPreviewPanelProps) {
  const [earningsData, setEarningsData] =
    useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!holding) {
      setEarningsData(null)
      return
    }

    const fetchEarningsData = async () => {
      setLoading(true)
      try {
        const data = await getEarnings(holding.ticker)
        setEarningsData(data)
      } catch (error) {
        console.error('Error fetching earnings data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEarningsData()
  }, [holding])

  if (!holding) {
    return (
      <div className='h-full flex items-center justify-center text-muted-foreground text-sm'>
        <p>Select a stock to view details</p>
      </div>
    )
  }

  const isPositive = (change ?? 0) >= 0
  const totalValue = currentPrice
    ? currentPrice * holding.quantity
    : 0
  const costBasis = holding.purchasePrice * holding.quantity
  const totalGain = totalValue - costBasis
  const totalGainPercent = (totalGain / costBasis) * 100

  return (
    <div className='h-full overflow-y-auto p-6 space-y-6 text-foreground'>
      {/* Stock Header */}
      <div>
        <h2 className='text-2xl mb-1'>{holding.ticker}</h2>
        <p className='text-muted-foreground text-xs'>
          {holding.name}
        </p>
      </div>

      {/* Current Price */}
      {currentPrice && (
        <Card
          className={`glass floating-sm p-5 rounded-2xl ${isPositive ? 'glow-green-sm' : 'glow-red-sm'}`}
        >
          <div className='flex items-baseline gap-2'>
            <span className='text-2xl'>
              ${currentPrice.toFixed(2)}
            </span>
            <div
              className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-primary' : 'text-red-primary'}`}
            >
              {isPositive ? (
                <TrendingUp className='w-3.5 h-3.5' />
              ) : (
                <TrendingDown className='w-3.5 h-3.5' />
              )}
              <span>
                {isPositive ? '+' : ''}
                {change?.toFixed(2)} (
                {changePercent?.toFixed(2)}%)
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Position Details */}
      <div>
        <h3 className='mb-3 text-sm'>Position Details</h3>
        <Card className='glass floating-sm p-4 space-y-0 gap-2 rounded-2xl'>
          <div className='flex justify-between items-center py-0.5 text-xs'>
            <span className='text-muted-foreground'>
              Shares
            </span>
            <span className='text-foreground'>
              {holding.quantity}
            </span>
          </div>
          <Separator className='bg-border' />
          <div className='flex justify-between items-center py-0.5 text-xs'>
            <span className='text-muted-foreground'>
              Avg. Cost
            </span>
            <span className='text-foreground'>
              ${holding.purchasePrice.toFixed(2)}
            </span>
          </div>
          <Separator className='bg-border' />
          <div className='flex justify-between items-center py-0.5 text-xs'>
            <span className='text-muted-foreground'>
              Cost Basis
            </span>
            <span className='text-foreground'>
              ${costBasis.toFixed(2)}
            </span>
          </div>
          <Separator className='bg-border' />
          <div className='flex justify-between items-center py-0.5 text-xs'>
            <span className='text-muted-foreground'>
              Market Value
            </span>
            <span className='text-foreground'>
              ${totalValue.toFixed(2)}
            </span>
          </div>
          <Separator className='bg-border' />
          <div className='flex justify-between items-center py-0.5 text-xs'>
            <span className='text-muted-foreground'>
              Total Gain/Loss
            </span>
            <span
              className={
                totalGain >= 0
                  ? 'text-green-primary'
                  : 'text-red-primary'
              }
            >
              {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}{' '}
              ({totalGainPercent.toFixed(2)}%)
            </span>
          </div>
        </Card>
      </div>

      {/* Earnings Transcript Analysis */}
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <FileText className='w-4 h-4' />
          <h3 className='text-sm'>Earnings Analysis</h3>
        </div>

        {loading ? (
          <Card className='glass floating-sm p-4 rounded-2xl'>
            <p className='text-muted-foreground text-xs'>
              Loading earnings data...
            </p>
          </Card>
        ) : earningsData ? (
          <Card className='glass floating-sm p-4 space-y-4 rounded-2xl'>
            <div className='flex items-center gap-2.5'>
              <Badge
                variant={
                  earningsData.sentiment === 'positive'
                    ? 'default'
                    : 'secondary'
                }
                className='text-[10px] px-2 py-0.5'
              >
                {earningsData.quarter}
              </Badge>
              <div className='flex items-center gap-1.5 text-muted-foreground'>
                <Calendar className='w-3 h-3' />
                <span className='text-[10px]'>
                  {earningsData.date}
                </span>
              </div>
            </div>

            <div>
              <h4 className='mb-2.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                Key Highlights
              </h4>
              <ul className='space-y-2'>
                {earningsData.highlights.map(
                  (highlight, index) => (
                    <li
                      key={index}
                      className='flex gap-2 text-xs'
                    >
                      <span className='text-green-primary mt-1'>
                        •
                      </span>
                      <span className='flex-1 text-foreground/90'>
                        {highlight}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </Card>
        ) : (
          <Card className='bg-card/50 border-border p-3.5 backdrop-blur-sm'>
            <p className='text-muted-foreground text-xs'>
              No earnings data available
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
