'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PortfolioTable } from './PortfolioTable'
import { AddStockDialog } from './AddStockDialog'
import { EditStockDialog } from './EditStockDialog'
import { StockPreviewPanel } from './StockPreviewPanel'
import { Button } from '@/components/ui/button'
import { PlusCircle, TrendingUp, LogOut } from 'lucide-react'
import { addHolding, updateHolding, deleteHolding, type Holding } from '@/actions/holdings'
import { createPortfolio } from '@/actions/portfolio'
import { EnrichedHolding } from '@/lib/types'
import { signOut } from '@/actions/auth'

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

  const selectedHolding = initialHoldings.find(h => h.id === selectedHoldingId) || null

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

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const totalValue = initialHoldings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0)
  const totalCost = initialHoldings.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const isPortfolioPositive = totalGain >= 0

  return (
    <div className="dark h-screen w-screen bg-background flex flex-col overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-destructive/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 px-6 py-4 glass floating-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-green flex items-center justify-center glow-green-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base text-foreground">Lybre Tracker</h1>
              <p className="text-[10px] text-muted-foreground">My Portfolio</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] text-foreground uppercase tracking-wider">Total Value</p>
              <p className="text-lg text-muted-foreground">${totalValue.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-foreground uppercase tracking-wider">
                Total Gain/Loss
              </p>
              <p
                className={`text-lg ${isPortfolioPositive ? 'text-green-primary' : 'text-red-primary'}`}
              >
                {isPortfolioPositive ? '+' : ''}${totalGain.toFixed(2)} (
                {totalGainPercent.toFixed(2)}%)
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gradient-green hover:opacity-90 transition-all text-white h-9 px-4 text-sm rounded-xl floating-sm"
              disabled={isPending}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add Stock
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="glass border-border/50 h-9 px-4 text-sm rounded-xl hover:bg-white/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 flex overflow-hidden gap-6 p-6">
        {/* Portfolio Table */}
        <div className="flex-1 overflow-auto">
          <PortfolioTable
            holdings={initialHoldings}
            onSelectHolding={holding => setSelectedHoldingId(holding.id)}
            selectedHoldingId={selectedHoldingId}
            onEditHolding={holding => setEditingHolding(holding)}
            onDeleteHolding={handleDeleteStock}
            onViewTranscript={handleViewTranscript}
          />
        </div>

        {/* Side Panel */}
        <div className="w-96 glass-strong floating-lg rounded-3xl overflow-hidden">
          <StockPreviewPanel
            holding={selectedHolding}
            currentPrice={selectedHolding?.currentPrice}
            change={selectedHolding?.change}
            changePercent={selectedHolding?.changePercent}
          />
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
        onOpenChange={open => !open && setEditingHolding(null)}
        holding={editingHolding}
        onUpdateStock={handleEditStock}
      />
    </div>
  )
}
