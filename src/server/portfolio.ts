import * as kv from '~/lib/kv-store'
import { revalidate, action } from '@solidjs/router'
import { createClient } from '~/lib/supabase/server'

export type Portfolio = {
  id: string
  userId: string
  name: string
  createdAt: string
}

export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  'use server'

  try {
    const supabase = createClient()
    const portfolios = await kv.getByPrefix(supabase, `portfolio:${userId}:`)
    return portfolios || []
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    throw new Error('Failed to fetch portfolios')
  }
}

export const createPortfolio = action(async (userId: string, name: string): Promise<Portfolio> => {
  'use server'

  try {
    const supabase = createClient()
    const portfolioId = `portfolio:${userId}:${Date.now()}`
    const portfolio: Portfolio = {
      id: portfolioId,
      userId,
      name,
      createdAt: new Date().toISOString(),
    }
    await kv.set(supabase, portfolioId, portfolio)
    revalidate('portfolio-data')
    return portfolio
  } catch (error) {
    console.error('Error creating portfolio:', error)
    throw new Error('Failed to create portfolio')
  }
})

export const deletePortfolio = action(async (portfolioId: string): Promise<void> => {
  'use server'

  try {
    const supabase = createClient()
    await kv.del(supabase, portfolioId)
    revalidate('portfolio-data')
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    throw new Error('Failed to delete portfolio')
  }
})
