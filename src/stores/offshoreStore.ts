/**
 * 新加坡离岸账户状态 store(UI 订阅用)
 */
import { create } from 'zustand'
import type { OffshoreState } from '@/engine/offshore/OffshoreEngine'

interface OffshoreStoreState extends OffshoreState {
  set: (data: OffshoreState) => void
  reset: () => void
}

export const useOffshoreStore = create<OffshoreStoreState>((set) => ({
  balance: 0,
  shieldStrength: 0,
  carryTrades: [],
  set: (data) => set(data),
  reset: () => set({ balance: 0, shieldStrength: 0, carryTrades: [] }),
}))
