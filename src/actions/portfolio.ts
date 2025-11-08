'use server'

import * as kv from '@/lib/kv-store'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Portfolio = {
  id: string
  userId: string
  name: string
  createdAt: string
}

export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  try {
    const supabase = await createClient()
    const portfolios = await kv.getByPrefix(supabase, `portfolio:${userId}:`)
    return portfolios || []
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    throw new Error('Failed to fetch portfolios')
  }
}

export async function createPortfolio(userId: string, name: string): Promise<Portfolio> {
  try {
    const supabase = await createClient()
    const portfolioId = `portfolio:${userId}:${Date.now()}`
    const portfolio: Portfolio = {
      id: portfolioId,
      userId,
      name,
      createdAt: new Date().toISOString(),
    }
    await kv.set(supabase, portfolioId, portfolio)
    revalidatePath('/portfolio')
    return portfolio
  } catch (error) {
    console.error('Error creating portfolio:', error)
    throw new Error('Failed to create portfolio')
  }
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  try {
    const supabase = await createClient()
    await kv.del(supabase, portfolioId)
    revalidatePath('/portfolio')
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    throw new Error('Failed to delete portfolio')
  }
}
