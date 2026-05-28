import { create } from 'zustand'
import type { KOL } from '@/engine/kol/KOLEngine'

interface KOLState {
  kols: KOL[]
  setKOLs: (kols: KOL[]) => void
  updateKOL: (id: string, partial: Partial<KOL>) => void
}

export const useKOLStore = create<KOLState>((set, get) => ({
  kols: [],
  setKOLs: (kols) => set({ kols }),
  updateKOL: (id, partial) => {
    const kols = get().kols.map((k) =>
      k.id === id ? { ...k, ...partial } : k
    )
    set({ kols })
  },
}))
