/**
 * 目标系统状态 store(UI 订阅用)
 */
import { create } from 'zustand'
import type { Milestone, TimedObjective } from '@/engine/objective/ObjectiveEngine'

interface ObjectiveState {
  milestones: Milestone[]
  currentObjective: TimedObjective | null
  /** 上一次达成的里程碑(用于 toast) */
  lastAchieved: Milestone | null
  set: (data: { milestones: Milestone[]; currentObjective: TimedObjective | null }) => void
  setLastAchieved: (m: Milestone | null) => void
  reset: () => void
}

export const useObjectiveStore = create<ObjectiveState>((set) => ({
  milestones: [],
  currentObjective: null,
  lastAchieved: null,
  set: (data) => set(data),
  setLastAchieved: (m) => set({ lastAchieved: m }),
  reset: () => set({ milestones: [], currentObjective: null, lastAchieved: null }),
}))
