import { create } from 'zustand'
import { useToastStore } from '@/components/Toast'
import { SFX } from '@/utils/sound'

export interface UnlockState {
  /** Track persistent stats across sessions */
  totalFakeNews: number
  totalBankruptcies: number
  bestPnlPercent: number
  /** Which characters are unlocked */
  unlockedIds: string[]
  /** Check and grant unlocks, returns newly unlocked ids */
  checkUnlocks: () => string[]
  recordFakeNews: () => void
  recordBankruptcy: () => void
  recordPnlPercent: (pct: number) => void
  reset: () => void
}

const STORAGE_KEY = 'dubo_unlocks'

function loadFromStorage(): { totalFakeNews: number; totalBankruptcies: number; bestPnlPercent: number; unlockedIds: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { totalFakeNews: 0, totalBankruptcies: 0, bestPnlPercent: -Infinity, unlockedIds: [] }
}

function saveToStorage(state: { totalFakeNews: number; totalBankruptcies: number; bestPnlPercent: number; unlockedIds: string[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

const UNLOCK_CONDITIONS: Record<string, (s: { totalFakeNews: number; totalBankruptcies: number; bestPnlPercent: number; unlockedIds: string[] }) => boolean> = {
  anon: (s) => s.totalFakeNews >= 10,       // 暗影·无名: publish 10 fake news
  dove: (s) => s.bestPnlPercent >= 1.0,     // 白鸽: 100% profit in a single game
  jack: (s) => s.totalBankruptcies >= 3,    // 赌徒·阿杰: go bankrupt 3 times
}

export const useUnlockStore = create<UnlockState>((set, get) => {
  const saved = loadFromStorage()

  return {
    totalFakeNews: saved.totalFakeNews,
    totalBankruptcies: saved.totalBankruptcies,
    bestPnlPercent: saved.bestPnlPercent === -Infinity ? -Infinity : saved.bestPnlPercent,
    unlockedIds: saved.unlockedIds,

    checkUnlocks: () => {
      const state = get()
      const newlyUnlocked: string[] = []

      for (const [id, condition] of Object.entries(UNLOCK_CONDITIONS)) {
        if (!state.unlockedIds.includes(id) && condition(state)) {
          newlyUnlocked.push(id)
        }
      }

      if (newlyUnlocked.length > 0) {
        const merged = [...state.unlockedIds, ...newlyUnlocked]
        set({ unlockedIds: merged })
        const s = get()
        saveToStorage({
          totalFakeNews: s.totalFakeNews,
          totalBankruptcies: s.totalBankruptcies,
          bestPnlPercent: s.bestPnlPercent,
          unlockedIds: s.unlockedIds,
        })
      }

      return newlyUnlocked
    },

    _notifyUnlocks: (ids: string[]) => {
      const NAMES: Record<string, string> = {
        anon: '🎭 暗影·无名',
        dove: '🕊 白鸽',
        jack: '🎲 赌徒·阿杰',
      }
      for (const id of ids) {
        SFX.unlock()
        useToastStore.getState().addToast(`🔓 解锁角色：${NAMES[id] ?? id}`, 'success')
      }
    },

    recordFakeNews: () => {
      const total = get().totalFakeNews + 1
      set({ totalFakeNews: total })
      const s = get()
      saveToStorage({
        totalFakeNews: s.totalFakeNews,
        totalBankruptcies: s.totalBankruptcies,
        bestPnlPercent: s.bestPnlPercent,
        unlockedIds: s.unlockedIds,
      })
      get().checkUnlocks()
    },

    recordBankruptcy: () => {
      const total = get().totalBankruptcies + 1
      set({ totalBankruptcies: total })
      const s = get()
      saveToStorage({
        totalFakeNews: s.totalFakeNews,
        totalBankruptcies: s.totalBankruptcies,
        bestPnlPercent: s.bestPnlPercent,
        unlockedIds: s.unlockedIds,
      })
      get().checkUnlocks()
    },

    recordPnlPercent: (pct: number) => {
      const best = get().bestPnlPercent
      if (pct > best) {
        set({ bestPnlPercent: pct })
        const s = get()
        saveToStorage({
          totalFakeNews: s.totalFakeNews,
          totalBankruptcies: s.totalBankruptcies,
          bestPnlPercent: s.bestPnlPercent,
          unlockedIds: s.unlockedIds,
        })
      }
      const unlocked = get().checkUnlocks()
      if (unlocked.length > 0) get()._notifyUnlocks(unlocked)
      return unlocked
    },

    reset: () => {
      set({
        totalFakeNews: 0,
        totalBankruptcies: 0,
        bestPnlPercent: -Infinity,
        unlockedIds: [],
      })
      saveToStorage({ totalFakeNews: 0, totalBankruptcies: 0, bestPnlPercent: -Infinity, unlockedIds: [] })
    },
  }
})
