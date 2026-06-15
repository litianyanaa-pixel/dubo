import { create } from 'zustand'

interface SelectionState {
  selectedAsset: string
  setSelectedAsset: (id: string) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedAsset: 'USD',
  setSelectedAsset: (id) => set({ selectedAsset: id }),
}))
