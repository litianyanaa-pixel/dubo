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
    // ─── 外汇联动（KAL是锚） ───
    this.addRules('KAL', [
      { target: 'EMK', coefficient: -0.35, delay: 1 },
      { target: 'FOR', coefficient: -0.25, delay: 2 },
      { target: 'SRD', coefficient: -0.15, delay: 1 },
      { target: 'TDL', coefficient: -0.20, delay: 2 },
      { target: 'JDL', coefficient: -0.20, delay: 2 },
      { target: 'DTR', coefficient: -0.05, delay: 3 },
    ])
    this.addRules('EMK', [
      { target: 'KAL', coefficient: -0.10, delay: 2 },
    ])
    this.addRules('FOR', [
      { target: 'KAL', coefficient: -0.08, delay: 3 },
      { target: 'EMK', coefficient: -0.30, delay: 1 },
    ])
    this.addRules('SRD', [
      { target: 'KAL', coefficient: -0.12, delay: 2 },
    ])
    // DTR 是封闭经济体，几乎不传导也不受传导

    // ─── 大宗商品→货币 ───
    this.addRules('OIL', [
      { target: 'EMK', coefficient: 0.60, delay: 0 },  // 焰砂是石油出口大国
      { target: 'FOR', coefficient: -0.25, delay: 1 },  // 制造成本上升
      { target: 'KAL', coefficient: -0.08, delay: 2 },
      { target: 'DGOLD', coefficient: 0.15, delay: 1 }, // 通胀→避险
      { target: 'ROL', coefficient: 0.50, delay: 0 },   // 汗室石油直接受益
      { target: 'DOL', coefficient: 0.30, delay: 0 },
    ])
    this.addRules('GAS', [
      { target: 'OIL', coefficient: 0.40, delay: 1 },   // 能源替代效应
      { target: 'EMK', coefficient: 0.30, delay: 0 },
      { target: 'GEO', coefficient: 0.35, delay: 0 },
    ])
    this.addRules('GRAIN', [
      { target: 'JDL', coefficient: 0.50, delay: 0 },   // 碧芒是粮仓
      { target: 'EMK', coefficient: -0.15, delay: 2 },
      { target: 'SDG', coefficient: 0.40, delay: 0 },
    ])
    this.addRules('REE', [
      { target: 'KAL', coefficient: 0.20, delay: 1 },   // 伽蓝稀土依赖进口
      { target: 'DTR', coefficient: 0.35, delay: 0 },
      { target: 'QC', coefficient: -0.25, delay: 1 },   // 芯片成本上升
      { target: 'DMT', coefficient: 0.40, delay: 0 },
    ])

    // ─── 股票→货币（同国联动） ───
    this.addRules('QC', [{ target: 'KAL', coefficient: 0.30, delay: 1 }])
    this.addRules('CHV', [{ target: 'FOR', coefficient: 0.35, delay: 1 }])
    this.addRules('ROL', [{ target: 'EMK', coefficient: 0.50, delay: 0 }])
    this.addRules('IWA', [{ target: 'DTR', coefficient: 0.10, delay: 2 }])
    this.addRules('TEX', [{ target: 'TDL', coefficient: 0.30, delay: 1 }])

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
      } else if (assetId === 'KAL') {
        totalImpact += 0.001
      } else if (assetId === 'DTR') {
        // 封闭经济体不受避险影响
      }
    }

    return totalImpact
  }

  /** 判断是否处于避险模式 */
  isSafeHavenMode(sentiment: number): boolean {
    return sentiment < this.safeHavenThreshold
  }
}
