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
  /** 冻结到期的时间戳(Date.now())。> now 时禁止交易 */
  frozenUntil: number
  openLong: (assetId: string, price: number, qty: number) => boolean
  closeLong: (assetId: string, price: number, qty: number) => boolean
  openShort: (assetId: string, price: number, qty: number) => boolean
  closeShort: (assetId: string, price: number, qty: number) => boolean
  /** 逮捕惩罚:冻结 N 毫秒 + 罚款比例(0-1) */
  applyArrest: (freezeMs: number, fineRatio: number) => { frozenUntil: number; fine: number }
  isFrozen: () => boolean
}

export type { Position, ShortPosition }

export const usePlayerStore = create<PlayerState>((set, get) => ({
  cash: 100000,
  positions: {},
  shorts: {},
  totalTrades: 0,
  frozenUntil: 0,

  isFrozen: () => Date.now() < get().frozenUntil,

  // 买多: spend cash, acquire asset
  openLong: (assetId, price, qty) => {
    const state = get()
    if (Date.now() < state.frozenUntil) return false
    const cost = price * qty
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
    if (Date.now() < state.frozenUntil) return false
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
    if (Date.now() < state.frozenUntil) return false
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
    if (Date.now() < state.frozenUntil) return false
    const existing = state.shorts[assetId]
    if (!existing || existing.amount < qty) return false

    // Return margin + PnL
    const marginReturn = existing.avgEntry * qty
    const pnl = (existing.avgEntry - price) * qty
    const remaining = existing.amount - qty
    const newShorts = { ...state.shorts }
    if (remaining === 0) delete newShorts[assetId]
    else newShorts[assetId] = { ...existing, amount: remaining }

    set({
      cash: state.cash + marginReturn + pnl,
      shorts: newShorts,
      totalTrades: state.totalTrades + 1,
    })
    return true
  },

  // 逮捕惩罚:冻结 + 罚款。返回冻结到期时间和罚款金额
  applyArrest: (freezeMs, fineRatio) => {
    const state = get()
    const fine = Math.floor(state.cash * fineRatio)
    const frozenUntil = Date.now() + freezeMs
    set({
      frozenUntil,
      cash: Math.max(0, state.cash - fine),
    })
    return { frozenUntil, fine }
  },
}))
