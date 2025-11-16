import * as kv from '~/lib/kv-store'
import { revalidate, action } from '@solidjs/router'
import { createClient } from '~/lib/supabase/server'

export type Holding = {
  id: string
  portfolioId: string
  ticker: string
  name: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  createdAt: string
  updatedAt?: string
}

export type HoldingInput = {
  portfolioId: string
  ticker: string
  name: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
}

export async function getHoldings(portfolioId: string): Promise<Holding[]> {
  'use server'

  try {
    const supabase = createClient()
    const holdings = await kv.getByPrefix(supabase, `holding:${portfolioId}:`)
    return holdings || []
  } catch (error) {
    console.error('Error fetching holdings:', error)
    throw new Error('Failed to fetch holdings')
  }
}

export const addHolding = action(async (input: HoldingInput): Promise<Holding> => {
  'use server'

  try {
    const supabase = createClient()
    const holdingId = `holding:${input.portfolioId}:${input.ticker}:${Date.now()}`
    const holding: Holding = {
      id: holdingId,
      ...input,
      createdAt: new Date().toISOString(),
    }
    await kv.set(supabase, holdingId, holding)
    revalidate('portfolio-data')
    return holding
  } catch (error) {
    console.error('Error adding holding:', error)
    throw new Error('Failed to add holding')
  }
})

export const updateHolding = action(async (
  holdingId: string,
  updates: Partial<Pick<Holding, 'quantity' | 'purchasePrice' | 'purchaseDate'>>
): Promise<Holding> => {
  'use server'

  try {
    const supabase = createClient()
    const existingHolding = await kv.get(supabase, holdingId)
    if (!existingHolding) {
      throw new Error('Holding not found')
    }

    const updatedHolding: Holding = {
      ...existingHolding,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await kv.set(supabase, holdingId, updatedHolding)
    revalidate('portfolio-data')
    return updatedHolding
  } catch (error) {
    console.error('Error updating holding:', error)
    throw new Error('Failed to update holding')
  }
})

export const deleteHolding = action(async (holdingId: string): Promise<void> => {
  'use server'

  try {
    const supabase = createClient()
    const existingHolding = await kv.get(supabase, holdingId)
    if (!existingHolding) {
      throw new Error('Holding not found')
    }

    await kv.del(supabase, holdingId)
    revalidate('portfolio-data')
  } catch (error) {
    console.error('Error deleting holding:', error)
    throw new Error('Failed to delete holding')
  }
})
