/**
 * 瑞士情报拍卖引擎
 *
 * 玩法: 瑞士凭借绝对保密法,定期"拍卖"各国权贵即将大额买入/卖出某资产的内部信息。
 * 玩家花钱购买情报包,获得限时内幕(类似猎犬天赋,但来源是购买)。
 * 情报包会"自动兑现":在有效期结束时,对应的资产会按情报方向产生价格冲击。
 *
 * 挂载于 useGameLoop 的 L4 tick(30s)。
 */
import { eventBus } from '@/engine/core/EventBus'
import { ALL_ASSETS } from '@/data/assets'

export interface IntelPackage {
  id: string
  /** 情报描述(例如"某国权贵即将大额买入苹果") */
  title: string
  description: string
  /** 情报涉及的目标资产 */
  assetId: string
  assetName: string
  /** 权贵行动方向(影响价格方向) */
  direction: 'up' | 'down'
  /** 价格冲击幅度 0.01-0.05 */
  magnitude: number
  /** 购买价格 */
  cost: number
  /** 距离兑现(价格冲击发生)的剩余 tick 数 */
  expireInTicks: number
  /** 是否已被玩家购买 */
  purchased: boolean
  /** 是否已兑现 */
  resolved: boolean
}

const VIP_TITLES_UP = [
  '对冲基金巨头建立多头头寸',
  '主权财富基金大举增持',
  '神秘买家扫货',
  '内部人士集中买入',
]
const VIP_TITLES_DOWN = [
  '机构大客户集中抛售',
  '主权基金减持套现',
  '神秘卖家大单砸盘',
  '内部人士出货',
]

let pkgCounter = 0

export class IntelEngine {
  /** 待售情报包(未购买) */
  private available: IntelPackage[] = []
  /** 玩家已购买的情报(等待兑现) */
  private owned: IntelPackage[] = []
  /** 已兑现历史 */
  private history: IntelPackage[] = []
  private tickCount = 0
  private readonly spawnInterval = 3 // 每 3 个 L4 tick(约 90s)生成一个新情报

  tick(): IntelPackage[] {
    this.tickCount++

    // 生成新情报包
    if (this.tickCount % this.spawnInterval === 0) {
      this.spawnPackage()
    }

    // 推进已购买情报的倒计时,到期兑现
    const resolved: IntelPackage[] = []
    const stillOwned: IntelPackage[] = []
    for (const pkg of this.owned) {
      pkg.expireInTicks--
      if (pkg.expireInTicks <= 0) {
        pkg.resolved = true
        resolved.push(pkg)
      } else {
        stillOwned.push(pkg)
      }
    }
    this.owned = stillOwned

    this.history.push(...resolved)
    if (this.history.length > 8) this.history.splice(0, this.history.length - 8)

    return resolved
  }

  private spawnPackage(): void {
    // 随机选一个可交易资产(偏好股票/虚拟币,价格冲击更明显)
    const candidates = ALL_ASSETS.filter(a => a.type === 'stock' || a.type === 'crypto')
    const asset = candidates[Math.floor(Math.random() * candidates.length)]
    if (!asset) return

    const direction: 'up' | 'down' = Math.random() > 0.5 ? 'up' : 'down'
    const magnitude = 0.01 + Math.random() * 0.04
    const titles = direction === 'up' ? VIP_TITLES_UP : VIP_TITLES_DOWN
    const cost = Math.round(20000 + Math.random() * 40000)

    const pkg: IntelPackage = {
      id: `intel_${pkgCounter++}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: `${direction === 'up' ? '买入' : '卖出'} ${asset.name}`,
      assetId: asset.id,
      assetName: asset.name,
      direction,
      magnitude,
      cost,
      expireInTicks: 0, // 购买后才开始倒计时
      purchased: false,
      resolved: false,
    }
    this.available.push(pkg)

    // 限制待售数量
    if (this.available.length > 5) this.available.shift()
  }

  /** 玩家购买情报包。成功后情报进入 owned,开始倒计时。返回包或 null */
  purchase(packageId: string): IntelPackage | null {
    const idx = this.available.findIndex(p => p.id === packageId)
    if (idx < 0) return null
    const pkg = this.available.splice(idx, 1)[0]
    pkg.purchased = true
    pkg.expireInTicks = 2 + Math.floor(Math.random() * 2) // 购买后 2-3 个 tick 兑现
    this.owned.push(pkg)
    return pkg
  }

  getAvailable(): IntelPackage[] {
    return [...this.available]
  }

  getOwned(): IntelPackage[] {
    return [...this.owned]
  }

  getHistory(): IntelPackage[] {
    return [...this.history]
  }
}
