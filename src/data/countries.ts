/**
 * 7 个真实国家(不出现中国及中国省市)的定义与初始数据
 * 货币: USD(美元) / EUR(欧元) / GBP(英镑) / JPY(日元) / CHF(瑞郎) / SAR(里亚尔) / SGD(新元)
 */

export interface CountryState {
  id: string
  name: string
  currencyId: string

  // 经济基本面
  gdp: number           // 亿美元
  gdpGrowth: number     // 年增速百分比，如 3.2
  interestRate: number  // 当前利率百分比
  inflation: number     // 通胀率百分比
  unemployment: number  // 失业率百分比
  fiscalDeficit: number // 财政赤字占GDP百分比

  // 国内局势
  satisfaction: number  // 0-100 民众满意度
  stability: number     // 0-100 政府稳定性

  // 国际关系（与其他6国的关系值 -100 ~ +100）
  relations: Record<string, number>

  // 市场状态
  stockIndex: number    // 股票指数基准
  bondYield: number     // 国债收益率
  capitalFlow: number   // 资本净流入（正）/ 流出（负）

  // 国家独有机制
  special: string
}

/** 7 国初始数据 */
export const INITIAL_COUNTRIES: CountryState[] = [
  {
    id: 'usa',
    name: '美国',
    currencyId: 'USD',
    gdp: 27_000,
    gdpGrowth: 2.5,
    interestRate: 5.25,
    inflation: 3.2,
    unemployment: 3.8,
    fiscalDeficit: 5.5,
    satisfaction: 55,
    stability: 70,
    relations: { euro: 30, uk: 50, japan: 40, swiss: 35, saudi: 25, singapore: 20 },
    stockIndex: 5200,
    bondYield: 4.3,
    capitalFlow: 0,
    special: '美联储AI周期评估政策，自动调整利率/缩表/前瞻指引',
  },
  {
    id: 'euro',
    name: '欧元区',
    currencyId: 'EUR',
    gdp: 18_000,
    gdpGrowth: 0.8,
    interestRate: 4.0,
    inflation: 2.9,
    unemployment: 6.5,
    fiscalDeficit: 3.2,
    satisfaction: 50,
    stability: 65,
    relations: { usa: 30, uk: 45, japan: 25, swiss: 60, saudi: 10, singapore: 15 },
    stockIndex: 4800,
    bondYield: 2.8,
    capitalFlow: 0,
    special: '欧洲央行统一货币政策，成员国经济分化导致内部张力',
  },
  {
    id: 'uk',
    name: '英国',
    currencyId: 'GBP',
    gdp: 3_400,
    gdpGrowth: 0.5,
    interestRate: 5.0,
    inflation: 4.0,
    unemployment: 4.2,
    fiscalDeficit: 4.5,
    satisfaction: 42,
    stability: 60,
    relations: { usa: 50, euro: 45, japan: 20, swiss: 30, saudi: 15, singapore: 25 },
    stockIndex: 7600,
    bondYield: 4.1,
    capitalFlow: 0,
    special: '伦敦金融城——全球外汇与衍生品交易中心',
  },
  {
    id: 'japan',
    name: '日本',
    currencyId: 'JPY',
    gdp: 4_200,
    gdpGrowth: 1.0,
    interestRate: 0.1,
    inflation: 2.8,
    unemployment: 2.6,
    fiscalDeficit: 6.0,
    satisfaction: 52,
    stability: 72,
    relations: { usa: 40, euro: 25, uk: 20, swiss: 20, saudi: 10, singapore: 35 },
    stockIndex: 33000,
    bondYield: 0.8,
    capitalFlow: 0,
    special: '超低利率与量化宽松——全球套利交易(carry trade)的融资货币',
  },
  {
    id: 'swiss',
    name: '瑞士',
    currencyId: 'CHF',
    gdp: 900,
    gdpGrowth: 1.5,
    interestRate: 1.75,
    inflation: 1.5,
    unemployment: 2.2,
    fiscalDeficit: 1.0,
    satisfaction: 75,
    stability: 88,
    relations: { usa: 35, euro: 60, uk: 30, japan: 20, saudi: 5, singapore: 30 },
    stockIndex: 12000,
    bondYield: 1.0,
    capitalFlow: 0,
    special: '绝对保密法——定期拍卖"情报包"(各国权贵离岸资产明细)',
  },
  {
    id: 'saudi',
    name: '沙特',
    currencyId: 'SAR',
    gdp: 1_100,
    gdpGrowth: 3.0,
    interestRate: 6.0,
    inflation: 2.2,
    unemployment: 4.9,
    fiscalDeficit: 2.5,
    satisfaction: 60,
    stability: 55,
    relations: { usa: 25, euro: 10, uk: 15, japan: 10, swiss: 5, singapore: 10 },
    stockIndex: 11000,
    bondYield: 4.5,
    capitalFlow: 0,
    special: 'OPEC核心——年度石油资源拍卖直接影响全球大宗商品价格',
  },
  {
    id: 'singapore',
    name: '新加坡',
    currencyId: 'SGD',
    gdp: 500,
    gdpGrowth: 3.5,
    interestRate: 3.8,
    inflation: 3.0,
    unemployment: 1.9,
    fiscalDeficit: 0.5,
    satisfaction: 70,
    stability: 85,
    relations: { usa: 20, euro: 15, uk: 25, japan: 35, swiss: 30, saudi: 10 },
    stockIndex: 3200,
    bondYield: 2.9,
    capitalFlow: 0,
    special: '法外离岸金融中心——虚拟币交易所合法,提供离岸账户与利差套利',
  },
]

export const COUNTRY_IDS = INITIAL_COUNTRIES.map(c => c.id)

/** 经济权重（用于三层情绪中的国家→全局传导），基于GDP占比 */
export function getEconomicWeight(countryId: string): number {
  const country = INITIAL_COUNTRIES.find(c => c.id === countryId)
  if (!country) return 0
  const totalGdp = INITIAL_COUNTRIES.reduce((s, c) => s + c.gdp, 0)
  return country.gdp / totalGdp
}
