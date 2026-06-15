/**
 * 7 个虚构国家的定义与初始数据
 * 数据来源：补充设计文档"十五、各国初始经济指标"+"一、国家系统"
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
    id: 'kalan',
    name: '伽蓝联邦',
    currencyId: 'KAL',
    gdp: 30_000,
    gdpGrowth: 3.2,
    interestRate: 3.5,
    inflation: 2.1,
    unemployment: 4.2,
    fiscalDeficit: 3.5,
    satisfaction: 68,
    stability: 75,
    relations: { ember: 10, forge: 20, silver: 40, darkthorn: -50, tidal: 5, jade: 15 },
    stockIndex: 8500,
    bondYield: 3.8,
    capitalFlow: 0,
    special: '天算AI每72秒自动评估政策，调整利率/税收/补贴',
  },
  {
    id: 'ember',
    name: '焰砂汗国',
    currencyId: 'EMK',
    gdp: 8_000,
    gdpGrowth: 1.5,
    interestRate: 5.0,
    inflation: 4.5,
    unemployment: 8.5,
    fiscalDeficit: 6.0,
    satisfaction: 45,
    stability: 50,
    relations: { kalan: 10, forge: 10, silver: 5, darkthorn: -10, tidal: 20, jade: -5 },
    stockIndex: 3200,
    bondYield: 5.5,
    capitalFlow: 0,
    special: '年度资源拍卖会直接影响全球大宗商品价格',
  },
  {
    id: 'forge',
    name: '铸链联合体',
    currencyId: 'FOR',
    gdp: 20_000,
    gdpGrowth: 4.5,
    interestRate: 2.5,
    inflation: 1.8,
    unemployment: 5.5,
    fiscalDeficit: 4.0,
    satisfaction: 58,
    stability: 65,
    relations: { kalan: 20, ember: 10, silver: 15, darkthorn: -30, tidal: 10, jade: 20 },
    stockIndex: 6800,
    bondYield: 3.0,
    capitalFlow: 0,
    special: '全民持股制——民众满意度直接影响股市指数',
  },
  {
    id: 'silver',
    name: '银脊共和国',
    currencyId: 'SRD',
    gdp: 12_000,
    gdpGrowth: 2.0,
    interestRate: 1.5,
    inflation: 0.8,
    unemployment: 3.0,
    fiscalDeficit: 1.5,
    satisfaction: 72,
    stability: 85,
    relations: { kalan: 40, ember: 5, forge: 15, darkthorn: -5, tidal: 30, jade: 10 },
    stockIndex: 5200,
    bondYield: 2.0,
    capitalFlow: 0,
    special: '绝对保密法——定期拍卖"情报包"（各国权贵资产明细）',
  },
  {
    id: 'darkthorn',
    name: '暗棘帝国',
    currencyId: 'DTR',
    gdp: 10_000,
    gdpGrowth: 0.5,
    interestRate: 7.0,
    inflation: 8.0,
    unemployment: 12.0,
    fiscalDeficit: 8.5,
    satisfaction: 25,
    stability: 40,
    relations: { kalan: -50, ember: -10, forge: -30, silver: -5, tidal: 5, jade: -15 },
    stockIndex: 2800,
    bondYield: 8.5,
    capitalFlow: 0,
    special: '双汇率制度——官方汇率与黑市汇率差3-10倍',
  },
  {
    id: 'tidal',
    name: '汐潮自由邦',
    currencyId: 'TDL',
    gdp: 3_000,
    gdpGrowth: 6.0,
    interestRate: 0.5,
    inflation: 3.0,
    unemployment: 6.0,
    fiscalDeficit: 2.0,
    satisfaction: 55,
    stability: 35,
    relations: { kalan: 5, ember: 20, forge: 10, silver: 30, darkthorn: 5, jade: 10 },
    stockIndex: 1800,
    bondYield: 1.0,
    capitalFlow: 0,
    special: '法外经济区——虚拟币交易所合法，无金融监管',
  },
  {
    id: 'jade',
    name: '碧芒同盟',
    currencyId: 'JDL',
    gdp: 5_000,
    gdpGrowth: 3.8,
    interestRate: 2.0,
    inflation: 1.5,
    unemployment: 4.8,
    fiscalDeficit: 2.5,
    satisfaction: 65,
    stability: 70,
    relations: { kalan: 15, ember: -5, forge: 20, silver: 10, darkthorn: -15, tidal: 10 },
    stockIndex: 3500,
    bondYield: 2.5,
    capitalFlow: 0,
    special: '全球种子库——掌控70%粮食品种专利',
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
