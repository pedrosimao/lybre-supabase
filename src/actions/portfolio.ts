'use server'

import * as kv from '@/lib/kv-store'
import { revalidatePath } from 'next/cache'

export type Portfolio = {
  id: string
  userId: string
  name: string
  createdAt: string
}

export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  try {
    const portfolios = await kv.getByPrefix(`portfolio:${userId}:`)
    return portfolios || []
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    throw new Error('Failed to fetch portfolios')
  }
}

export async function createPortfolio(userId: string, name: string): Promise<Portfolio> {
  try {
    const portfolioId = `portfolio:${userId}:${Date.now()}`
    const portfolio: Portfolio = {
      id: portfolioId,
      userId,
      name,
      createdAt: new Date().toISOString(),
    }
    await kv.set(portfolioId, portfolio)
    revalidatePath('/portfolio')
    return portfolio
  } catch (error) {
    console.error('Error creating portfolio:', error)
    throw new Error('Failed to create portfolio')
  }
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  try {
    await kv.del(portfolioId)
    revalidatePath('/portfolio')
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    throw new Error('Failed to delete portfolio')
  }
}
