import { create } from 'zustand'

interface Position {
  assetId: string
  amount: number
  avgCost: number
}

interface PlayerState {
  cash: number
  positions: Record<string, Position>
  totalTrades: number
  buy: (assetId: string, price: number, quantity: number) => boolean
  sell: (assetId: string, price: number, quantity: number) => boolean
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  cash: 100000,
  positions: {},
  totalTrades: 0,

  buy: (assetId, price, quantity) => {
    const cost = price * quantity
    const state = get()
    if (cost > state.cash) return false

    const existing = state.positions[assetId]
    let newPosition: Position

    if (existing) {
      const totalAmount = existing.amount + quantity
      const totalCost = existing.avgCost * existing.amount + cost
      newPosition = { assetId, amount: totalAmount, avgCost: totalCost / totalAmount }
    } else {
      newPosition = { assetId, amount: quantity, avgCost: price }
    }

    set({
      cash: state.cash - cost,
      positions: { ...state.positions, [assetId]: newPosition },
      totalTrades: state.totalTrades + 1,
    })
    return true
  },

  sell: (assetId, price, quantity) => {
    const state = get()
    const existing = state.positions[assetId]
    if (!existing || existing.amount < quantity) return false

    const revenue = price * quantity
    const newAmount = existing.amount - quantity

    const newPositions = { ...state.positions }
    if (newAmount === 0) {
      delete newPositions[assetId]
    } else {
      newPositions[assetId] = { ...existing, amount: newAmount }
    }

    set({
      cash: state.cash + revenue,
      positions: newPositions,
      totalTrades: state.totalTrades + 1,
    })
    return true
  },
}))
