/**
 * 沙特资源拍卖引擎
 *
 * 玩法: 沙特作为 OPEC 核心国,每隔一段时间举行资源拍卖(OIL/GAS/REE 等大宗商品)。
 * 拍卖结果会影响相关大宗商品价格(涨或跌)。
 * 玩家可花钱"竞标内幕"提前获知拍卖结果方向(限时内幕),据此布局获利。
 *
 * 挂载于 useGameLoop 的 L4 tick(30s),每 N 个 tick 生成一次拍卖。
 */
import { eventBus } from '@/engine/core/EventBus'

export interface AuctionPackage {
  id: string
  assetId: string        // 受影响的大宗商品(OIL/GAS/REE/GRAIN)
  assetName: string
  direction: 'up' | 'down'  // 拍卖后价格方向
  magnitude: number         // 价格冲击幅度 0.02-0.08
  title: string
  description: string
  /** 距离揭晓的剩余 tick 数 */
  revealInTicks: number
  /** 是否已被玩家竞标(获知内幕) */
  insiderKnown: boolean
  insiderCost: number
  /** 揭晓后是否已应用价格冲击 */
  revealed: boolean
}

const COMMODITY_TARGETS = [
  { id: 'OIL',   name: '石油',   upTitles: ['OPEC减产协议达成','沙特削减出口配额'],   downTitles: ['OPEC增产决议','沙特放开出口限制'] },
  { id: 'GAS',   name: '天然气', upTitles: ['冬季需求激增','LNG出口配额收紧'],         downTitles: ['暖冬预期下调','新气田投产'] },
  { id: 'REE',   name: '稀土',   upTitles: ['稀土出口管控升级','战略储备收购'],         downTitles: ['新矿投产','替代材料突破'] },
  { id: 'GRAIN', name: '粮食',   upTitles: ['产区干旱减产','出口禁令扩大'],             downTitles: ['全球丰收','储备投放市场'] },
]

let pkgCounter = 0

export class AuctionEngine {
  /** 当前等待揭晓的拍卖包 */
  private pending: AuctionPackage[] = []
  /** 已揭晓的历史(最近 N 条,供 UI 展示) */
  private history: AuctionPackage[] = []
  /** tick 计数器,控制拍卖生成频率 */
  private tickCount = 0
  /** 每 4 个 L4 tick(约 2 分钟)生成一次拍卖 */
  private readonly spawnInterval = 4

  /** 由 useGameLoop 在 L4 调用。返回本次揭晓的拍卖包(若有),供外层应用价格冲击 + 发新闻 */
  tick(): AuctionPackage[] {
    this.tickCount++

    // 生成新拍卖包
    if (this.tickCount % this.spawnInterval === 0) {
      this.spawnPackage()
    }

    // 推进所有待揭晓包的倒计时,到期的标记为可揭晓
    const revealed: AuctionPackage[] = []
    const stillPending: AuctionPackage[] = []
    for (const pkg of this.pending) {
      pkg.revealInTicks--
      if (pkg.revealInTicks <= 0) {
        pkg.revealed = true
        revealed.push(pkg)
      } else {
        stillPending.push(pkg)
      }
    }
    this.pending = stillPending

    // 揭晓的包进历史(保留最近 8 条)
    this.history.push(...revealed)
    if (this.history.length > 8) this.history.splice(0, this.history.length - 8)

    return revealed
  }

  private spawnPackage(): void {
    const target = COMMODITY_TARGETS[Math.floor(Math.random() * COMMODITY_TARGETS.length)]
    const direction: 'up' | 'down' = Math.random() > 0.5 ? 'up' : 'down'
    const magnitude = 0.02 + Math.random() * 0.06
    const titles = direction === 'up' ? target.upTitles : target.downTitles
    const title = titles[Math.floor(Math.random() * titles.length)]
    const cost = Math.round(15000 + Math.random() * 25000)

    const pkg: AuctionPackage = {
      id: `auc_${pkgCounter++}`,
      assetId: target.id,
      assetName: target.name,
      direction,
      magnitude,
      title,
      description: `${direction === 'up' ? '推升' : '打压'}${target.name}价格`,
      revealInTicks: 1 + Math.floor(Math.random() * 3), // 1-3 个 tick 后揭晓
      insiderKnown: false,
      insiderCost: cost,
      revealed: false,
    }
    this.pending.push(pkg)

    // 生成时发一条"拍卖开始"新闻预告(不透露方向)
    eventBus.emit('news:published', {
      id: pkg.id + '_pre',
      templateId: 'auction_announce',
      targetCountry: 'saudi',
    })
  }

  /** 玩家花钱竞标某拍卖包的内幕。成功后 insiderKnown=true,可提前看到方向。返回包或 null */
  bidInsider(packageId: string): AuctionPackage | null {
    const pkg = this.pending.find(p => p.id === packageId)
    if (!pkg || pkg.insiderKnown) return null
    pkg.insiderKnown = true
    return pkg
  }

  /** 获取当前待揭晓的拍卖包(供 UI 展示) */
  getPending(): AuctionPackage[] {
    return [...this.pending]
  }

  /** 获取历史揭晓记录 */
  getHistory(): AuctionPackage[] {
    return [...this.history]
  }
}
