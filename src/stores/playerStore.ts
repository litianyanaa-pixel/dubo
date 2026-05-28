import { create } from 'zustand'

interface Position {
  assetId: string
  amount: number
  avgCost: number
}

interface ShortPosition {
  assetId: string
  amount: number
  avgEntry: number // price when shorted
}

interface PlayerState {
  cash: number
  positions: Record<string, Position>
  shorts: Record<string, ShortPosition>
  totalTrades: number
  openLong: (assetId: string, price: number, qty: number) => boolean
  closeLong: (assetId: string, price: number, qty: number) => boolean
  openShort: (assetId: string, price: number, qty: number) => boolean
  closeShort: (assetId: string, price: number, qty: number) => boolean
}

export type { Position, ShortPosition }

export const usePlayerStore = create<PlayerState>((set, get) => ({
  cash: 100000,
  positions: {},
  shorts: {},
  totalTrades: 0,

  // 买多: spend cash, acquire asset
  openLong: (assetId, price, qty) => {
    const cost = price * qty
    const state = get()
    if (cost > state.cash) return false

    const existing = state.positions[assetId]
    let newPos: Position
    if (existing) {
      const totalAmt = existing.amount + qty
      newPos = { assetId, amount: totalAmt, avgCost: (existing.avgCost * existing.amount + cost) / totalAmt }
    } else {
      newPos = { assetId, amount: qty, avgCost: price }
    }

    set({
      cash: state.cash - cost,
      positions: { ...state.positions, [assetId]: newPos },
      totalTrades: state.totalTrades + 1,
    })
    return true
  },

  // 平多: sell held asset, receive cash
  closeLong: (assetId, price, qty) => {
    const state = get()
    const existing = state.positions[assetId]
    if (!existing || existing.amount < qty) return false

    const revenue = price * qty
    const remaining = existing.amount - qty
    const newPositions = { ...state.positions }
    if (remaining === 0) delete newPositions[assetId]
    else newPositions[assetId] = { ...existing, amount: remaining }

    set({
      cash: state.cash + revenue,
      positions: newPositions,
      totalTrades: state.totalTrades + 1,
    })
    return true
  },

  // 开空: put up margin (100% of position value), profit = entry - exit
  openShort: (assetId, price, qty) => {
    const state = get()
    const margin = price * qty
    if (margin > state.cash) return false

    const existing = state.shorts[assetId]
    let newShort: ShortPosition
    if (existing) {
      const totalAmt = existing.amount + qty
      newShort = { assetId, amount: totalAmt, avgEntry: (existing.avgEntry * existing.amount + price * qty) / totalAmt }
    } else {
      newShort = { assetId, amount: qty, avgEntry: price }
    }

    set({
      cash: state.cash - margin,
      shorts: { ...state.shorts, [assetId]: newShort },
      totalTrades: state.totalTrades + 1,
    })
    return true
  },

  // 平空: buy back asset to cover, profit = (entry - cover) * qty
  closeShort: (assetId, price, qty) => {
    const state = get()
    const existing = state.shorts[assetId]
    if (!existing || existing.amount < qty) return false

    // PnL: positive when covered below entry price
    const pnl = (existing.avgEntry - price) * qty
    const remaining = existing.amount - qty
    const newShorts = { ...state.shorts }
    if (remaining === 0) delete newShorts[assetId]
    else newShorts[assetId] = { ...existing, amount: remaining }

    set({
      cash: state.cash + pnl,
      shorts: newShorts,
      totalTrades: state.totalTrades + 1,
    })
    return true
  },
}))
