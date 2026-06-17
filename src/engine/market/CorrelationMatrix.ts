/**
 * 跨市场关联矩阵 — 资产间的传导系数与延迟
 * 数据来源：补充设计文档"二、跨市场传导系数表"
 */

interface CorrelationRule {
  /** 受影响的资产ID（支持通配符 'sector:军工'） */
  target: string
  /** 传导系数（正=同向，负=反向） */
  coefficient: number
  /** 延迟tick数（0=即时） */
  delay: number
}

/** 触发源 → 传导规则列表 */
type RuleMap = Map<string, CorrelationRule[]>

/** 板块共振系数 */
const SECTOR_RESONANCE: Record<string, number> = {
  '虚拟币': 0.7,
  '军工': 0.6,
  '能源': 0.5,
  '科技': 0.4,
  '金融': 0.35,
  '矿业': 0.4,
  '农业': 0.35,
}

export class CorrelationMatrix {
  private rules: RuleMap = new Map()
  /** 历史价格变化环形缓冲，key=assetId，value=最近N个tick的变化率 */
  private history: Map<string, number[]> = new Map()
  private readonly historyDepth = 5
  private safeHavenThreshold = 30

  constructor() {
    this.initRules()
  }

  private initRules(): void {
    // ─── 外汇联动(USD是锚) ───
    this.addRules('USD', [
      { target: 'EUR', coefficient: -0.35, delay: 1 },
      { target: 'GBP', coefficient: -0.25, delay: 2 },
      { target: 'JPY', coefficient: -0.15, delay: 1 },
      { target: 'SGD', coefficient: -0.20, delay: 2 },
      { target: 'CHF', coefficient: -0.20, delay: 2 },
      { target: 'SAR', coefficient: -0.05, delay: 3 },  // SAR盯住USD,传导极弱
    ])
    this.addRules('EUR', [
      { target: 'USD', coefficient: -0.10, delay: 2 },
    ])
    this.addRules('GBP', [
      { target: 'USD', coefficient: -0.08, delay: 3 },
      { target: 'EUR', coefficient: -0.30, delay: 1 },
    ])
    this.addRules('JPY', [
      { target: 'USD', coefficient: -0.12, delay: 2 },
    ])

    // ─── 大宗商品→货币 ───
    this.addRules('OIL', [
      { target: 'SAR', coefficient: 0.60, delay: 0 },   // 沙特是石油出口大国
      { target: 'USD', coefficient: -0.08, delay: 2 },  // 油价涨→美元购买力
      { target: 'DGOLD', coefficient: 0.15, delay: 1 }, // 通胀→避险
      { target: '2222', coefficient: 0.50, delay: 0 },  // 沙特阿美直接受益
      { target: 'XOM', coefficient: 0.30, delay: 0 },   // 埃克森
      { target: 'SHEL', coefficient: 0.30, delay: 0 },  // 壳牌
    ])
    this.addRules('GAS', [
      { target: 'OIL', coefficient: 0.40, delay: 1 },   // 能源替代效应
      { target: 'SAR', coefficient: 0.30, delay: 0 },
      { target: 'XOM', coefficient: 0.35, delay: 0 },
    ])
    this.addRules('GRAIN', [
      { target: 'NESN', coefficient: 0.40, delay: 0 },  // 雀巢食品成本
      { target: 'ULVR', coefficient: 0.35, delay: 0 },  // 联合利华
    ])
    this.addRules('REE', [
      { target: 'USD', coefficient: 0.20, delay: 1 },   // 美国稀土依赖
      { target: 'NVDA', coefficient: -0.25, delay: 1 }, // 芯片成本上升
      { target: 'ASML', coefficient: -0.20, delay: 1 },
    ])

    // ─── 股票→货币(同国联动) ───
    this.addRules('AAPL', [{ target: 'USD', coefficient: 0.25, delay: 1 }])
    this.addRules('NVDA', [{ target: 'USD', coefficient: 0.30, delay: 1 }])
    this.addRules('2222', [{ target: 'SAR', coefficient: 0.50, delay: 0 }])
    this.addRules('7203', [{ target: 'JPY', coefficient: 0.30, delay: 1 }])
    this.addRules('D05', [{ target: 'SGD', coefficient: 0.30, delay: 1 }])

    // ─── 避险资产联动 ───
    this.addRules('DGOLD', [
      { target: 'ETNL', coefficient: 0.40, delay: 1 },
    ])
  }

  private addRules(sourceId: string, rules: CorrelationRule[]): void {
    this.rules.set(sourceId, rules)
  }

  /** 记录一个tick的价格变化（供延迟读取） */
  recordPriceChange(assetId: string, changeRate: number): void {
    let hist = this.history.get(assetId)
    if (!hist) {
      hist = []
      this.history.set(assetId, hist)
    }
    hist.push(changeRate)
    if (hist.length > this.historyDepth) {
      hist.shift()
    }
  }

  /** 计算某资产的跨市场联动影响 */
  calculateImpact(
    assetId: string,
    allAssetIds: string[],
    getSector: (id: string) => string | undefined,
    globalSentiment: number,
  ): number {
    let totalImpact = 0

    // 1. 直接传导规则
    for (const sourceId of allAssetIds) {
      const rules = this.rules.get(sourceId)
      if (!rules) continue

      for (const rule of rules) {
        if (rule.target !== assetId) continue

        const hist = this.history.get(sourceId)
        if (!hist || hist.length <= rule.delay) continue

        // 取 delay tick 之前的变化率
        const idx = hist.length - 1 - rule.delay
        const sourceChange = hist[idx]
        totalImpact += sourceChange * rule.coefficient
      }
    }

    // 2. 板块共振
    const mySector = getSector(assetId)
    if (mySector && SECTOR_RESONANCE[mySector]) {
      const resonance = SECTOR_RESONANCE[mySector]
      for (const sourceId of allAssetIds) {
        if (sourceId === assetId) continue
        const sourceSector = getSector(sourceId)
        if (sourceSector !== mySector) continue

        const hist = this.history.get(sourceId)
        if (!hist || hist.length === 0) continue
        const sourceChange = hist[hist.length - 1]
        totalImpact += sourceChange * resonance * 0.1 // 共振是附加的，幅度打折
      }
    }

    // 3. 避险切换（恐慌模式）
    if (globalSentiment < this.safeHavenThreshold) {
      const isSafeHaven = assetId === 'DGOLD' || assetId === 'ETNL'
      const isCrypto = assetId.startsWith('VCOIN_')
      const getAsset = (id: string) => allAssetIds.includes(id)

      if (isSafeHaven) {
        totalImpact += 0.003 * (this.safeHavenThreshold - globalSentiment) / this.safeHavenThreshold
      } else if (isCrypto) {
        totalImpact -= 0.005 * (this.safeHavenThreshold - globalSentiment) / this.safeHavenThreshold
      } else if (assetId === 'USD') {
        // 美元在恐慌中作为全球锚定货币小幅升值
        totalImpact += 0.001
      } else if (assetId === 'CHF') {
        // 瑞郎传统避险
        totalImpact += 0.0008
      }
    }

    return totalImpact
  }

  /** 判断是否处于避险模式 */
  isSafeHavenMode(sentiment: number): boolean {
    return sentiment < this.safeHavenThreshold
  }
}
