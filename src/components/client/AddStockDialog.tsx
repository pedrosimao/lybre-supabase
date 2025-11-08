'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X } from 'lucide-react'
import { format, parse } from 'date-fns'

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStock: (stock: {
    ticker: string
    name: string
    quantity: number
    purchasePrice: number
    purchaseDate: string
  }) => void
}

const AVAILABLE_STOCKS = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'META', name: 'Meta Platforms Inc.' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { ticker: 'V', name: 'Visa Inc.' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.' },
]

export function AddStockDialog({ open, onOpenChange, onAddStock }: AddStockDialogProps) {
  const [selectedStock, setSelectedStock] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState<Date>()
  const [dateInputValue, setDateInputValue] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateInputValue(value)

    // Try to parse the date if it's in YYYY-MM-DD format
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        const parsed = parse(value, 'yyyy-MM-dd', new Date())
        if (!isNaN(parsed.getTime())) {
          setPurchaseDate(parsed)
        }
      } catch (e) {
        // Invalid date, ignore
      }
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    setPurchaseDate(date)
    if (date) {
      setDateInputValue(format(date, 'yyyy-MM-dd'))
    }
    setShowCalendar(false)
  }

  const handleSubmit = () => {
    if (!selectedStock || !quantity || !purchasePrice || !purchaseDate) {
      return
    }

    const stock = AVAILABLE_STOCKS.find((s) => s.ticker === selectedStock)
    if (!stock) return

    onAddStock({
      ticker: stock.ticker,
      name: stock.name,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate: format(purchaseDate, 'yyyy-MM-dd'),
    })

    // Reset form
    setSelectedStock('')
    setQuantity('')
    setPurchasePrice('')
    setPurchaseDate(undefined)
    setDateInputValue('')
    setShowCalendar(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className='bg-card border-border sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-base'>Add Stock to Portfolio</DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Select a stock and enter your purchase details to add it to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3.5 py-2'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Stock</Label>
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger className='bg-input border-border h-9 text-sm'>
                <SelectValue placeholder='Select a stock' />
              </SelectTrigger>
              <SelectContent className='bg-popover border-border z-[100]'>
                {AVAILABLE_STOCKS.map((stock) => (
                  <SelectItem key={stock.ticker} value={stock.ticker} className='text-sm'>
                    {stock.ticker} - {stock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>Quantity</Label>
            <Input
              type='number'
              placeholder='0'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className='bg-input border-border h-9 text-sm'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>Purchase Price</Label>
            <Input
              type='number'
              placeholder='0.00'
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className='bg-input border-border h-9 text-sm'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>Purchase Date</Label>
            <div className='relative'>
              <Input
                type='text'
                placeholder='YYYY-MM-DD'
                value={dateInputValue}
                onChange={handleDateInputChange}
                className='bg-input border-border h-9 text-sm pr-20'
              />
              <div className='absolute right-1 top-1 flex gap-1'>
                {dateInputValue && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setDateInputValue('')
                      setPurchaseDate(undefined)
                    }}
                    className='h-7 w-7 p-0 hover:bg-accent'
                  >
                    <X className='h-3.5 w-3.5' />
                  </Button>
                )}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowCalendar(!showCalendar)}
                  className='h-7 w-7 p-0 hover:bg-accent'
                >
                  <CalendarIcon className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
            {showCalendar && (
              <div className='border border-border rounded-md bg-popover shadow-lg p-3 mt-2'>
                <Calendar
                  mode='single'
                  selected={purchaseDate}
                  onSelect={handleCalendarSelect}
                  initialFocus
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className='w-full gradient-green hover:opacity-90 transition-opacity text-white h-9 text-sm'
            disabled={!selectedStock || !quantity || !purchasePrice || !purchaseDate}
          >
            Add Stock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
