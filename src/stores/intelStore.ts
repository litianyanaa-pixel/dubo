/**
 * 瑞士情报拍卖状态 store(UI 订阅用)
 */
import { create } from 'zustand'
import type { IntelPackage } from '@/engine/intel/IntelEngine'

interface IntelState {
  available: IntelPackage[]
  owned: IntelPackage[]
  history: IntelPackage[]
  set: (data: { available: IntelPackage[]; owned: IntelPackage[]; history: IntelPackage[] }) => void
  reset: () => void
}

export const useIntelStore = create<IntelState>((set) => ({
  available: [],
  owned: [],
  history: [],
  set: (data) => set(data),
  reset: () => set({ available: [], owned: [], history: [] }),
}))
