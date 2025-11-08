'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarIcon, X } from 'lucide-react'
import { format, parse } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { type Holding } from '@/actions/holdings'

interface EditStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holding: Holding | null
  onUpdateStock: (holdingId: string, data: {
    quantity: number
    purchasePrice: number
    purchaseDate: string
  }) => void
}

export function EditStockDialog({ open, onOpenChange, holding, onUpdateStock }: EditStockDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState<Date>()
  const [dateInputValue, setDateInputValue] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    if (holding) {
      setQuantity(holding.quantity.toString())
      setPurchasePrice(holding.purchasePrice.toString())
      setDateInputValue(holding.purchaseDate)
      try {
        const parsed = parse(holding.purchaseDate, 'yyyy-MM-dd', new Date())
        setPurchaseDate(parsed)
      } catch (e) {
        // Invalid date
      }
    }
  }, [holding])

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
    if (!holding || !quantity || !purchasePrice || !purchaseDate) {
      return
    }

    onUpdateStock(holding.id, {
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate: format(purchaseDate, 'yyyy-MM-dd'),
    })

    onOpenChange(false)
  }

  if (!holding) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-base'>Edit Stock Position</DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Update the details for {holding.ticker} - {holding.name}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3.5 py-2'>
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
              <div className='glass-strong floating-sm rounded-md p-3 mt-2'>
                <Calendar
                  mode='single'
                  selected={purchaseDate}
                  onSelect={handleCalendarSelect}
                  initialFocus
                />
              </div>
            )}
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='flex-1 border-border h-9 text-sm'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className='flex-1 gradient-green hover:opacity-90 transition-opacity text-white h-9 text-sm'
              disabled={!quantity || !purchasePrice || !purchaseDate}
            >
              Update Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
