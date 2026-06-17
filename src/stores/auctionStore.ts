/**
 * 沙特资源拍卖状态 store(UI 订阅用)
 */
import { create } from 'zustand'
import type { AuctionPackage } from '@/engine/auction/AuctionEngine'

interface AuctionState {
  pending: AuctionPackage[]
  history: AuctionPackage[]
  set: (data: { pending: AuctionPackage[]; history: AuctionPackage[] }) => void
  markInsider: (packageId: string) => void
  reset: () => void
}

export const useAuctionStore = create<AuctionState>((set) => ({
  pending: [],
  history: [],
  set: (data) => set(data),
  markInsider: (packageId) =>
    set((s) => ({
      pending: s.pending.map((p) => (p.id === packageId ? { ...p, insiderKnown: true } : p)),
    })),
  reset: () => set({ pending: [], history: [] }),
}))
