# 7国 + 完整资产体系 + 跨市场联动 — 设计文档

> 日期: 2026-06-04
> 状态: 待审核
> 方案: A — 增量扩展现有引擎

## 概述

将当前6个真实世界资产(USD/EUR/GBP/CHF/OIL/GOLD)替换为设计文档中的完整虚构经济体：7个国家、7种货币、43只股票、4种大宗商品、2种避险资产、3-5种随机虚拟币。同时实现完整国家经济模拟、跨市场关联矩阵和三层情绪系统。

**不破坏现有功能**：交易、KOL、假新闻、Rug Pull等系统保持不变，只扩展底层数据和价格引擎。

---

## 1. 数据层

### 1.1 国家定义 `src/data/countries.ts`

```typescript
export interface CountryState {
  id: string              // 'kalan', 'ember', 'forge', 'silver', 'darkthorn', 'tidal', 'jade'
  name: string            // 伽蓝联邦, 焰砂汗国, 等
  currencyId: string      // KAL, EMK, FOR, SRD, DTR, TDL, JDL

  // 经济基本面
  gdp: number             // 亿美元
  gdpGrowth: number       // 年增速百分比，如 +3.2
  interestRate: number    // 当前利率百分比，如 3.5
  inflation: number       // 通胀率百分比，如 2.1
  unemployment: number    // 失业率百分比
  fiscalDeficit: number   // 财政赤字占GDP百分比

  // 国内局势
  satisfaction: number    // 0-100 民众满意度
  stability: number       // 0-100 政府稳定性

  // 国际关系
  relations: Record<string, number>  // 与其他6国的关系，-100 ~ +100

  // 市场状态
  stockIndex: number      // 股票指数基准值
  bondYield: number       // 国债收益率
  capitalFlow: number     // 资本净流入（正）/ 流出（负）

  // 特殊机制标识
  special: string         // 描述国家独有机制
}
```

初始值取自补充设计文档"十五、各国初始经济指标"：

| 国家 | GDP(亿$) | 利率 | 通胀 | GDP增速 | 核心产业 | 军事支出 |
|------|---------|------|------|---------|---------|---------|
| 伽蓝联邦 kalan | 30,000 | 3.5% | 2.1% | +3.2% | AI/芯片/生物 | GDP 2% |
| 焰砂汗国 ember | 8,000 | 5.0% | 4.5% | +1.5% | 石油/矿产 | GDP 5% |
| 铸链联合体 forge | 20,000 | 2.5% | 1.8% | +4.5% | 制造/基建 | GDP 3% |
| 银脊共和国 silver | 12,000 | 1.5% | 0.8% | +2.0% | 金融/保险 | GDP 1% |
| 暗棘帝国 darkthorn | 10,000 | 7.0% | 8.0% | +0.5% | 军工/核能 | GDP 15% |
| 汐潮自由邦 tidal | 3,000 | 0.5% | 3.0% | +6.0% | 博彩/交易所 | GDP 0.5% |
| 碧芒同盟 jade | 5,000 | 2.0% | 1.5% | +3.8% | 农业/种子 | GDP 1.5% |

国际关系初始矩阵（默认值，每局可微调）：

| | kalan | ember | forge | silver | darkthorn | tidal | jade |
|---|---|---|---|---|---|---|---|
| kalan | — | +10 | +20 | +40 | -50 | +5 | +15 |
| ember | +10 | — | +10 | +5 | -10 | +20 | -5 |
| forge | +20 | +10 | — | +15 | -30 | +10 | +20 |
| silver | +40 | +5 | +15 | — | -5 | +30 | +10 |
| darkthorn | -50 | -10 | -30 | -5 | — | +5 | -15 |
| tidal | +5 | +20 | +10 | +30 | +5 | — | +10 |
| jade | +15 | -5 | +20 | +10 | -15 | +10 | — |

### 1.2 资产定义 `src/data/assets.ts`

完全重写。替换当前6个真实货币为虚构资产。

**Asset 类型扩展**（在 `src/engine/market/types.ts`）：

```typescript
export interface Asset {
  id: string
  name: string
  type: AssetType
  basePrice: number
  currentPrice: number
  volatility: number

  // 新增字段
  countryId?: string           // 所属国家（货币/股票有，商品/避险无）
  sector?: string              // 板块分类（科技/军工/金融/农业/能源/矿业/数据等）
  sentimentSensitivity: number // 0-2.0，避险资产0.3，虚拟币2.0
}

export type AssetType = 'currency' | 'stock' | 'commodity' | 'safehaven' | 'crypto' | 'player_token'
```

**资产清单（约80种）：**

**货币（7种）**：

| ID | 名称 | 基准价 | 波动率 | 情绪敏感度 | 国家 |
|----|------|--------|--------|-----------|------|
| KAL | 伽蓝币 | 1.0000 | 0.0015 | 0.6 | kalan |
| EMK | 焰砂元 | 0.85 | 0.0025 | 0.8 | ember |
| FOR | 铸链币 | 0.12 | 0.0020 | 0.7 | forge |
| SRD | 银脊盾 | 1.02 | 0.0008 | 0.4 | silver |
| DTR | 暗棘令 | 0.50 | 0.0040 | 0.3 | darkthorn |
| TDL | 汐潮元 | 0.35 | 0.0030 | 1.0 | tidal |
| JDL | 碧芒币 | 0.22 | 0.0018 | 0.5 | jade |

**股票（43只）**：取自补充设计文档"二十一、各国企业补充"。每只股票有：
- id: 如 `QC`（量子芯片公司）
- countryId: 所属国家
- sector: 板块
- basePrice: 初始价格
- volatility: 0.002-0.005（股票波动大于货币）
- sentimentSensitivity: 0.8-1.2

完整列表：
- 伽蓝(7): QC($320), TAI($580), KSP($145), BLT($95), SKG($210), DMP($430), AUF($180)
- 焰砂(5): ROL($85), DMT($62), GEO($38), SLG($120), RSH($55)
- 铸链(8): CHV($150), GRF($88), GFB($65), MGB($110), ELM($72), CTS($45), PPL($95), CEC($130)
- 银脊(6): SRB($280), FST($195), CRG($110), PRT($165), SRM($72), DGL($340)
- 暗棘(5): IWA($175), RSH2($88), CBT($220), NUP($95), DOL($55)
- 汐潮(6): TEX($520), FWS($68), OFF($150), OBT($95), TDT($180), FMD($42)
- 碧芒(6): SDG($260), SLJ($135), BJT($185), CBN($78), BBL($55), GFD($210)

注意：暗棘的红星重工代码用 RSH2 避免与焰砂的 RSH 冲突。

**大宗商品（4种）**：

| ID | 名称 | 基准价 | 波动率 | 情绪敏感度 |
|----|------|--------|--------|-----------|
| OIL | 石油 | 78.5 | 0.0030 | 0.8 |
| GAS | 天然气 | 3.24 | 0.0040 | 0.7 |
| GRAIN | 粮食 | 245.0 | 0.0020 | 0.6 |
| REE | 稀土 | 89.2 | 0.0035 | 0.7 |

**避险资产（2种）**：

| ID | 名称 | 基准价 | 波动率 | 情绪敏感度 |
|----|------|--------|--------|-----------|
| DGOLD | 龙头金 | 2345.0 | 0.0010 | -0.5（负相关：恐慌时涨） |
| ETNL | 永恒 | 100.0 | 0.0005 | 0.1 |

**虚拟币（3-5种）**：每局随机生成（见1.3节）。

### 1.3 虚拟币随机生成 `src/data/virtualCoins.ts`

```typescript
const PREFIXES = ['Moon', 'Doge', 'Safe', 'Rocket', 'Elon', 'AI', 'Meta', 'Cyber', 'Neo', 'Quantum']
const SUFFIXES = ['Coin', 'Token', 'Swap', 'Finance', 'Moon', 'AI', 'Chain', 'Protocol']

export function generateSessionCoins(count: number = 4): Asset[] {
  // 随机组合前缀+后缀，确保不重复
  // 极高波动率 0.02-0.05
  // sentimentSensitivity = 2.0
  // type = 'crypto'
  // basePrice: $0.001 - $5.00 随机
}
```

### 1.4 角色起始地区 `src/data/characters.ts`

**保留现有真实地区名称不变**（美国、英国、新加坡、开曼群岛、瑞士、拉斯维加斯）。startRegion 作为显示用文本，不与虚构国家系统耦合。未来如有需要可通过映射表关联到虚构国家。

---

## 2. 引擎层

### 2.1 CountryEngine 扩展 `src/engine/country/CountryEngine.ts`

从当前的简单随机事件生成器扩展为完整国家经济模拟器。

**新增内部状态：**
```typescript
private countries: Map<string, CountryState>  // 7国完整状态
private activeWars: ActiveWar[]               // 扩展的战争状态
private manipulationScore: number             // 保留
```

**新增方法：**

#### L2 tick — 资本流动
```typescript
updateCapitalFlows(): void
```
- 根据利率差计算资本流动方向
- 高利率国家吸引资本流入
- 资本流动影响货币供需和股票指数

#### L4 tick — 经济指标演化
```typescript
updateEconomics(): EconomicEvent | null
```
- GDP增速：根据资本流动、利率、国内满意度微调
- 通胀：根据利率和GDP增速演变
- 央行AI评估：通胀偏离2%目标时倾向调整利率
- 伽蓝"天算"：每2个L4 tick自动微调利率/补贴
- 满意度/稳定性：根据经济表现缓慢变动
- 返回值：如果央行调整利率或经济指标大幅变化，返回事件

#### L5 tick — 地缘事件（保留现有接口）
```typescript
tick(market, sentiment): GeopoliticalEvent | null
```
扩展内容：
- 国际关系矩阵每tick缓慢回归中性(+1)
- 战争系统5阶段：谍报→摩擦→爆发→战争→结局
- 战争结束条件：经济崩溃投降 / 玩家促和 / 战争疲劳停火
- 战后重建事件（赔款、资源控制、外交威望变化）
- 暗棘：黑市汇率（官方汇率 vs 黑市汇率 3-10倍差距）
- 银脊：情报包拍卖机制
- 汐潮：虚拟币监管状态

**事件类型扩展：**
```typescript
type GeoEventType = 
  | 'war_start' | 'war_end' | 'war_update'      // 战争
  | 'sanction' | 'trade_deal'                     // 外交
  | 'rate_change'                                 // 央行政策
  | 'domestic_crisis' | 'domestic_boom'           // 国内事件
  | 'arrest_risk'                                 // 保留
  | 'special_auction' | 'special_tiansuan'        // 国家特殊机制
```

**战争状态扩展：**
```typescript
interface ActiveWar {
  id: string
  attacker: string      // 国家ID
  defender: string
  phase: 'espionage' | 'friction' | 'outbreak' | 'warfare' | 'resolution'
  phaseTicks: number    // 当前阶段已持续时间
  scoreA: number        // 攻方战争分数
  scoreD: number        // 守方战争分数
  warFatigue: number    // 疲劳度 0-100
}
```

### 2.2 CorrelationMatrix `src/engine/market/CorrelationMatrix.ts`

新模块。存储所有资产间的传导关系。

```typescript
export class CorrelationMatrix {
  private correlations: Map<string, CorrelationRule>
  private safeHavenThreshold: number = 30  // 全局情绪低于此触发避险

  constructor()
  
  /** 计算某资产的跨市场联动影响 */
  calculateImpact(
    assetId: string,
    priceChanges: Record<string, number>,  // 所有资产本次价格变化
    globalSentiment: number
  ): number
  
  /** 判断是否处于避险模式 */
  isSafeHavenMode(sentiment: number): boolean
}
```

**数据来源**：补充设计文档"二、跨市场传导系数表"。

核心传导规则（部分）：
- KAL涨1% → EMK -0.35(1tick延迟) → FOR -0.25(2tick) → SRD -0.15(1tick) → TDL -0.20(2tick)
- 石油涨1% → FOR +0.60(0tick) → EMK -0.25(1tick) → DGOLD +0.15(1tick)
- 粮食涨1% → JDL +0.50(0tick)
- 稀土涨1% → KAL +0.20(1tick) → DTR +0.35(0tick)

板块共振系数：
- 虚拟币板块: 0.6-0.8（最高共振）
- 军工板块: 0.5-0.7
- 能源板块: 0.4-0.6
- 科技板块: 0.3-0.5
- 金融板块: 0.25-0.4
- 农业板块: 0.3-0.45

避险切换（全局情绪<30）：
- DGOLD: +0.8%/tick
- ETNL: +0.5%/tick
- 虚拟币: -1.0%/tick
- 所有股市: -0.3%~0.8%/tick
- KAL: +0.2%/tick
- DTR: 0（封闭经济不受影响）

**延迟实现**：使用环形缓冲区存储最近N个tick的价格变化，根据规则中的延迟取对应tick的数据。

### 2.3 MarketEngine 扩展 `src/engine/market/MarketEngine.ts`

**价格公式扩展**（从6项到8项）：

```typescript
// 旧公式
totalChange = drift + macro + sentimentBias + netFlow + noise + meanReversion

// 新公式
totalChange = drift + countryMacro + sentimentBias + correlation + netFlow + noise + meanReversion
```

其中 `countryMacro` 替代旧的硬编码 `MACRO_PROFILES`，改为从 CountryEngine 动态计算：

```typescript
// 国家经济驱动的宏观漂移
countryMacro = calculateCountryMacro(asset, countryState)

function calculateCountryMacro(asset, country): number {
  if (asset.type === 'currency') {
    // 货币：利率差 + 通胀偏差 + GDP增长 + 资本流动
    return country.interestRate * 0.0001       // 高利率吸引资本
         - country.inflation * 0.00005         // 高通胀贬值
         + country.gdpGrowth * 0.00003         // 高增长升值
         + country.capitalFlow * 0.00001       // 资本流入升值
  }
  if (asset.type === 'stock') {
    // 股票：GDP增长 + 企业盈利(与sector相关) + 满意度 + 利率(负相关)
    return country.gdpGrowth * 0.0001
         + country.satisfaction / 100 * 0.0002
         - country.interestRate * 0.0001
  }
  if (asset.type === 'commodity') {
    // 商品：受供需和地缘影响，较弱的基本面因子
    return 0  // 商品主要靠事件和情绪驱动
  }
  if (asset.type === 'safehaven') {
    // 避险资产：与全局情绪负相关（已在sentimentBias中处理）
    return 0
  }
  if (asset.type === 'crypto') {
    // 虚拟币：几乎无基本面
    return 0
  }
  return 0
}
```

**情绪影响改进**：
```typescript
// 旧：统一灵敏度
const sentimentMul = asset.type === 'safehaven' ? 0.3 : ...

// 新：使用 asset.sentimentSensitivity
// DGOLD 是负数（-0.5），表示恐慌时反向（涨）
const rawSentiment = (sentiment - 50) / 100 * 0.002 * asset.sentimentSensitivity
```

**熔断阈值扩展**：
```typescript
// 旧：固定 ±3%
const clamped = Math.max(-0.03, Math.min(0.03, totalChange))

// 新：根据资产类型和状态动态
const maxMove = asset.type === 'crypto' ? 0.15      // 虚拟币无熔断（15%上限）
              : extremeSentiment ? 0.08              // 情绪极端 ±8%
              : 0.03                                 // 正常 ±3%
```

**新增依赖注入**：
```typescript
constructor(
  private correlationMatrix: CorrelationMatrix,
  private getCountryState: (id: string) => CountryState | undefined
)
```

### 2.4 SentimentEngine 三层扩展 `src/engine/sentiment/SentimentEngine.ts`

**新增状态：**
```typescript
private countries: Map<string, number> = new Map()   // 每国情绪
private assets: Map<string, number> = new Map()      // 每资产情绪
```

**更新逻辑（L2 tick）：**

```
1. 全局情绪更新：
   global(t) = global(t-1)
     + Σ(国家情绪变化 × 该国经济权重)   // 经济权重 = GDP / 总GDP
     + 惯性衰减（向50回归，速度0.5/tick）

2. 国家情绪更新：
   country(t) = country(t-1)
     + 全局传导（差值 × 0.1）
     + 国内政策影响（利率变化、制裁等）
     + 满意度影响
     + 惯性衰减（向50回归，速度0.3/tick）

3. 资产情绪更新：
   asset(t) = asset(t-1)
     + 国家情绪传导（如果有所属国家）
     + 价格走势反馈（涨→情绪升，跌→情绪降）
     + 新闻/假新闻冲击
     + AI集体行为反馈
     + 惯性衰减（向50回归，速度1.0/tick）
```

**新增方法：**
```typescript
getCountry(countryId: string): number
getAsset(assetId: string): number
applyCountryShock(countryId: string, impact: number): void
applyAssetShock(assetId: string, impact: number): void
update(countryEngine: CountryEngine, market: MarketEngine): void
```

**EventBus 事件扩展：**
```
'sentiment:changed' → 新增 countries 和 assets 字段
```

---

## 3. Store + UI 适配

### 3.1 Store 变更

**marketStore** — 新增国家数据：
```typescript
interface MarketState {
  prices: Record<string, number>     // 不变，只是assetId变了
  prevPrices: Record<string, number> // 不变
  candles: Record<string, OHLCV[]>   // 不变
  countrySnapshots: Record<string, CountrySnapshot>  // 新增
}
```

**sentimentStore** — 三层：
```typescript
interface SentimentState {
  global: number                     // 保留
  countries: Record<string, number>  // 新增
  assets: Record<string, number>     // 新增
}
```

**countryStore**（新）：
```typescript
interface CountryState {
  countries: Record<string, CountrySnapshot>
  activeWars: WarInfo[]
  relations: Record<string, Record<string, number>>
}
```

### 3.2 UI 组件适配

**TopBar** (`src/components/layout/TopBar.tsx`):
- 资产选择tabs改为分类：货币(7) | 股票(43) | 商品(4) | 虚拟币 | 避险
- 每个分类是可滚动的横向列表
- 当前选中的分类高亮

**BottomBar** (`src/components/layout/BottomBar.tsx`):
- 显示所有货币和主要商品的迷你卡片
- 每个卡片显示：名称、价格、涨跌幅

**RightPanel** (`src/components/layout/RightPanel.tsx`):
- 交易面板的资产选择器改为带分类和搜索的下拉框
- 显示资产所属国家/板块

**LeftPanel** (`src/components/layout/LeftPanel.tsx`):
- 新闻/交易/社交feed中的资产引用从 USD/EUR 改为 KAL/EMK 等
- 显示国家名称而非真实地区名

**PriceDisplay** (`src/components/market/PriceDisplay.tsx`):
- 显示国家旗帜/图标
- 显示板块标签

**characters.ts**:
- startRegion 保留真实地区名称不变（不与虚构国家系统耦合）

### 3.3 useGameLoop 变更

```
初始化时：
  1. new CorrelationMatrix()
  2. new CountryEngine(countries)  // 注入国家初始数据
  3. new MarketEngine(correlationMatrix, countryEngine.getCountry)  // 注入依赖
  4. new SentimentEngine()
  5. 注册所有资产（货币+股票+商品+避险+随机虚拟币）
  6. 初始化三层情绪（每国50，每资产50）

L0 (500ms):
  market.updatePrices(tick, sentiment.getAll(), correlationMatrix)  // 扩展参数

L2 (3s):
  sentiment.update(countryEngine, market)  // 三层更新
  countryEngine.updateCapitalFlows()       // 资本流动

L4 (30s):
  countryEngine.updateEconomics()          // 经济指标演化
  → EventBus: country:economy-updated

L5 (60s):
  countryEngine.tick(market, sentiment)    // 地缘事件
  → EventBus 事件扩展
```

**新增 EventBus 事件：**
- `country:economy-updated` — 经济指标变化
- `country:rate-changed` — 央行利率调整
- `country:war-update` — 战争阶段进展
- `sentiment:layer-updated` — 三层情绪更新

---

## 4. 文件变更清单

### 新增文件
| 文件 | 用途 |
|------|------|
| `src/data/countries.ts` | 7国初始数据定义 |
| `src/data/virtualCoins.ts` | 虚拟币随机生成器 |
| `src/engine/market/CorrelationMatrix.ts` | 跨市场关联矩阵 |
| `src/stores/countryStore.ts` | 国家状态store |

### 重写文件
| 文件 | 改动说明 |
|------|---------|
| `src/data/assets.ts` | 从6个真实资产改为~80个虚构资产 |
| `src/engine/market/types.ts` | Asset接口扩展 countryId/sector/sentimentSensitivity |
| `src/engine/country/CountryEngine.ts` | 从简单事件生成器扩展为完整经济模拟器 |
| `src/engine/market/MarketEngine.ts` | 价格公式扩展8项，新增依赖注入 |
| `src/engine/sentiment/SentimentEngine.ts` | 从单层扩展为三层 |
| `src/hooks/useGameLoop.ts` | 注入新依赖，扩展tick回调 |
| `src/stores/marketStore.ts` | 新增 countrySnapshots |
| `src/stores/sentimentStore.ts` | 新增 countries/assets |

### 修改文件
| 文件 | 改动说明 |
|------|---------|
| `src/data/characters.ts` | startRegion 保留真实地区名称不变 |
| `src/components/layout/TopBar.tsx` | 资产选择改为分类列表 |
| `src/components/layout/BottomBar.tsx` | 显示国家概览 |
| `src/components/layout/RightPanel.tsx` | 资产选择器增加分类和搜索 |
| `src/components/layout/LeftPanel.tsx` | 资产引用更新 |
| `src/components/market/PriceDisplay.tsx` | 显示国家/板块信息 |
| `src/engine/core/EventBus.ts` | 新增事件类型 |

### 不变文件
| 文件 | 原因 |
|------|------|
| `src/engine/core/GameLoop.ts` | tick层架构不变 |
| `src/engine/core/types.ts` | TickLayer定义不变 |
| `src/engine/ai/AIEngine.ts` | 本轮不扩展AI |
| `src/engine/event/EventEngine.ts` | 本轮不扩展事件池 |
| `src/engine/news/NewsEngine.ts` | 本轮不扩展假新闻 |
| `src/engine/kol/KOLEngine.ts` | 本轮不扩展KOL |
| `src/engine/player/TraitEngine.ts` | 本轮不扩展天赋 |
| `src/components/market/PriceChart.tsx` | lightweight-charts不关心数据内容 |
| `src/components/StartScreen.tsx` | 角色选择UI不变 |
| `src/components/GameOverScreen.tsx` | 不变 |

---

## 5. 测试计划

### 现有测试
- `MarketEngine.test.ts` — 需要更新：注册新的虚构资产，删除MACRO_PROFILES相关断言
- `stores.test.ts` — 需要更新：assetId从USD改为KAL
- 其他测试（EventBus/GameLoop/AIEngine等）— 不变或微小改动

### 新增测试
- `CountryEngine.test.ts` — 扩展：经济演化、战争系统、国际关系
- `CorrelationMatrix.test.ts` — 新增：传导系数计算、延迟机制、避险切换
- `SentimentEngine.test.ts` — 扩展：三层传导、资产情绪、国家情绪
