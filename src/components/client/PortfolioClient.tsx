'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PortfolioTable } from './PortfolioTable'
import { AddStockDialog } from './AddStockDialog'
import { EditStockDialog } from './EditStockDialog'
import { StockPreviewPanel } from './StockPreviewPanel'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { addHolding, updateHolding, deleteHolding, type Holding } from '@/actions/holdings'
import { createPortfolio } from '@/actions/portfolio'
import { EnrichedHolding } from '@/lib/types'

interface PortfolioClientProps {
  userId: string
  initialPortfolioId: string
  initialHoldings: EnrichedHolding[]
}

export function PortfolioClient({
  userId,
  initialPortfolioId,
  initialHoldings,
}: PortfolioClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [portfolioId, setPortfolioId] = useState(initialPortfolioId)
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)

  const selectedHolding = initialHoldings.find((h) => h.id === selectedHoldingId) || null

  const handleAddStock = async (stock: {
    ticker: string
    name: string
    quantity: number
    purchasePrice: number
    purchaseDate: string
  }) => {
    try {
      let currentPortfolioId = portfolioId

      // If no portfolio exists, create one
      if (!currentPortfolioId) {
        const newPortfolio = await createPortfolio(userId, 'My Portfolio')
        currentPortfolioId = newPortfolio.id
        setPortfolioId(currentPortfolioId)
      }

      await addHolding({
        portfolioId: currentPortfolioId,
        ticker: stock.ticker,
        name: stock.name,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        purchaseDate: stock.purchaseDate,
      })

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error adding stock:', error)
    }
  }

  const handleEditStock = async (
    holdingId: string,
    data: {
      quantity: number
      purchasePrice: number
      purchaseDate: string
    }
  ) => {
    try {
      await updateHolding(holdingId, data)

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const handleDeleteStock = async (holdingId: string) => {
    try {
      await deleteHolding(holdingId)

      if (selectedHoldingId === holdingId) {
        setSelectedHoldingId(null)
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting stock:', error)
    }
  }

  const handleViewTranscript = (holding: Holding) => {
    router.push(`/transcript/${holding.ticker}`)
  }

  return (
    <div className='min-h-screen p-8'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl mb-2 text-foreground'>Portfolio</h1>
            <p className='text-muted-foreground text-sm'>
              Track your investments and earnings insights
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className='gradient-green hover:opacity-90 transition-opacity text-white'
            disabled={isPending}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Stock
          </Button>
        </div>

        {/* Portfolio Table and Preview Panel */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            <PortfolioTable
              holdings={initialHoldings}
              onSelectHolding={(holding) => setSelectedHoldingId(holding.id)}
              selectedHoldingId={selectedHoldingId}
              onEditHolding={(holding) => setEditingHolding(holding)}
              onDeleteHolding={handleDeleteStock}
              onViewTranscript={handleViewTranscript}
            />
          </div>
          <div className='glass-strong floating-lg rounded-3xl overflow-hidden'>
            <StockPreviewPanel
              holding={selectedHolding}
              currentPrice={selectedHolding?.currentPrice}
              change={selectedHolding?.change}
              changePercent={selectedHolding?.changePercent}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddStockDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddStock={handleAddStock}
      />

      <EditStockDialog
        open={!!editingHolding}
        onOpenChange={(open) => !open && setEditingHolding(null)}
        holding={editingHolding}
        onUpdateStock={handleEditStock}
      />
    </div>
  )
}
