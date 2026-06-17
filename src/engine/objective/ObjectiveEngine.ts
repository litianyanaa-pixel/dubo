/**
 * 目标与节奏系统
 *
 * 1. 资金里程碑阶段:基于起始资金的多档目标,达成即推进阶段
 * 2. 限时任务:随机生成,限时完成奖励现金
 *
 * 由 useGameLoop 在 L2 tick(3s)驱动检查。
 */
import { eventBus } from '@/engine/core/EventBus'

export interface Milestone {
  stage: number
  label: string
  /** 目标净值(总资产) */
  target: number
  achieved: boolean
}

export interface TimedObjective {
  id: string
  description: string
  type: 'profit_pct' | 'trade_count' | 'manipulate' | 'no_bankrupt'
  /** 目标值 */
  target: number
  /** 当前进度 */
  progress: number
  /** 剩余 L2 tick 数(每 tick 3s) */
  remainTicks: number
  /** 奖励现金 */
  reward: number
  /** 是否完成 */
  completed: boolean
  /** 是否过期 */
  expired: boolean
}

let objectiveCounter = 0

export class ObjectiveEngine {
  private milestones: Milestone[] = []
  private currentObjective: TimedObjective | null = null
  private tickCount = 0
  /** 每 10 个 L2 tick(30s)检查是否生成新任务 */
  private readonly spawnInterval = 10
  private startCash = 100000

  /** 初始化里程碑(根据角色起始资金) */
  init(startCash: number): void {
    this.startCash = startCash
    this.milestones = [
      { stage: 1, label: '站稳脚跟', target: Math.round(startCash * 2), achieved: false },
      { stage: 2, label: '小有名气', target: Math.round(startCash * 5), achieved: false },
      { stage: 3, label: '市场玩家', target: Math.round(startCash * 10), achieved: false },
      { stage: 4, label: '金融巨鳄', target: Math.round(startCash * 25), achieved: false },
      { stage: 5, label: '传奇操盘手', target: Math.round(startCash * 50), achieved: false },
    ]
  }

  getMilestones(): Milestone[] {
    return [...this.milestones]
  }

  getCurrentStage(): number {
    let stage = 0
    for (const m of this.milestones) {
      if (m.achieved) stage = m.stage
    }
    return stage
  }

  getCurrentObjective(): TimedObjective | null {
    return this.currentObjective
  }

  /**
   * L2 tick 检查。返回本次 tick 发生的事件:新达成里程碑/任务完成/任务过期/新任务生成
   */
  tick(totalNetWorth: number, profitThisObjective: number, tradeCountDelta: number, manipulateDelta: number): {
    milestonesAchieved: Milestone[]
    objectiveCompleted: TimedObjective | null
    objectiveExpired: TimedObjective | null
    newObjective: TimedObjective | null
  } {
    this.tickCount++
    const milestonesAchieved: Milestone[] = []
    let objectiveCompleted: TimedObjective | null = null
    let objectiveExpired: TimedObjective | null = null
    let newObjective: TimedObjective | null = null

    // 1. 检查里程碑
    for (const m of this.milestones) {
      if (!m.achieved && totalNetWorth >= m.target) {
        m.achieved = true
        milestonesAchieved.push(m)
      }
    }

    // 2. 推进当前任务
    if (this.currentObjective && !this.currentObjective.completed && !this.currentObjective.expired) {
      const obj = this.currentObjective
      // 更新进度
      switch (obj.type) {
        case 'profit_pct':
          obj.progress = Math.max(obj.progress, (profitThisObjective / this.startCash) * 100)
          break
        case 'trade_count':
          obj.progress += tradeCountDelta
          break
        case 'manipulate':
          obj.progress += manipulateDelta
          break
        case 'no_bankrupt':
          obj.progress = totalNetWorth > 0 ? Math.min(obj.target, obj.progress + 1) : 0
          break
      }
      obj.remainTicks--
      if (obj.progress >= obj.target) {
        obj.completed = true
        objectiveCompleted = obj
        this.currentObjective = null
      } else if (obj.remainTicks <= 0) {
        obj.expired = true
        objectiveExpired = obj
        this.currentObjective = null
      }
    }

    // 3. 生成新任务(若当前无任务且到生成时机)
    if (!this.currentObjective && this.tickCount % this.spawnInterval === 0) {
      this.currentObjective = this.generateObjective()
      newObjective = this.currentObjective
    }

    return { milestonesAchieved, objectiveCompleted, objectiveExpired, newObjective }
  }

  private generateObjective(): TimedObjective {
    const types: TimedObjective['type'][] = ['profit_pct', 'trade_count', 'manipulate', 'no_bankrupt']
    const type = types[Math.floor(Math.random() * types.length)]
    const reward = Math.round(this.startCash * (0.05 + Math.random() * 0.15))

    const presets: Record<TimedObjective['type'], { desc: string; target: number; ticks: number }> = {
      profit_pct: {
        desc: '60 秒内让总资产再增长 {t}%',
        target: 5 + Math.floor(Math.random() * 15),
        ticks: 20, // 60s
      },
      trade_count: {
        desc: '90 秒内完成 {t} 笔交易',
        target: 3 + Math.floor(Math.random() * 5),
        ticks: 30,
      },
      manipulate: {
        desc: '120 秒内执行 {t} 次市场操纵(造假/喊单/砸盘等)',
        target: 2 + Math.floor(Math.random() * 3),
        ticks: 40,
      },
      no_bankrupt: {
        desc: '120 秒内保持不破产',
        target: 40,
        ticks: 40,
      },
    }

    const preset = presets[type]
    const description = preset.desc.replace('{t}', String(preset.target))

    return {
      id: `obj_${objectiveCounter++}`,
      description,
      type,
      target: preset.target,
      progress: 0,
      remainTicks: preset.ticks,
      reward,
      completed: false,
      expired: false,
    }
  }
}
