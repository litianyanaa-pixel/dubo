/**
 * 完整资产体系(真实国家版)
 * 7种货币(USD/EUR/GBP/JPY/CHF/SAR/SGD) + 43只股票 + 4种大宗商品 + 2种避险资产
 * 虚拟币由 virtualCoins.ts 每局随机生成
 * 注: 不出现中国及中国省市,不出现中国公司
 */
import type { Asset } from '@/engine/market/types'

// ─── 货币(7种) ───────────────────────────────────────────

const CURRENCY_ASSETS: Asset[] = [
  { id: 'USD', name: '美元',   type: 'currency', basePrice: 1.0000, currentPrice: 1.0000, volatility: 0.0012, countryId: 'usa',       sentimentSensitivity: 0.6 },
  { id: 'EUR', name: '欧元',   type: 'currency', basePrice: 1.08,   currentPrice: 1.08,   volatility: 0.0018, countryId: 'euro',      sentimentSensitivity: 0.7 },
  { id: 'GBP', name: '英镑',   type: 'currency', basePrice: 1.27,   currentPrice: 1.27,   volatility: 0.0022, countryId: 'uk',        sentimentSensitivity: 0.8 },
  { id: 'JPY', name: '日元',   type: 'currency', basePrice: 0.0067, currentPrice: 0.0067, volatility: 0.0025, countryId: 'japan',     sentimentSensitivity: 0.5 },
  { id: 'CHF', name: '瑞郎',   type: 'currency', basePrice: 1.12,   currentPrice: 1.12,   volatility: 0.0015, countryId: 'swiss',     sentimentSensitivity: 0.4 },
  { id: 'SAR', name: '里亚尔', type: 'currency', basePrice: 0.27,   currentPrice: 0.27,   volatility: 0.0008, countryId: 'saudi',     sentimentSensitivity: 0.3 },
  { id: 'SGD', name: '新元',   type: 'currency', basePrice: 0.74,   currentPrice: 0.74,   volatility: 0.0016, countryId: 'singapore', sentimentSensitivity: 0.6 },
]

// ─── 股票(43只) ───────────────────────────────────────────

const STOCK_ASSETS: Asset[] = [
  // 美国(10只)
  { id: 'AAPL', name: '苹果',     type: 'stock', basePrice: 195, currentPrice: 195, volatility: 0.0035, countryId: 'usa', sector: '科技',   sentimentSensitivity: 1.0 },
  { id: 'MSFT', name: '微软',     type: 'stock', basePrice: 420, currentPrice: 420, volatility: 0.0030, countryId: 'usa', sector: '科技',   sentimentSensitivity: 1.0 },
  { id: 'NVDA', name: '英伟达',   type: 'stock', basePrice: 880, currentPrice: 880, volatility: 0.0050, countryId: 'usa', sector: '半导体', sentimentSensitivity: 1.2 },
  { id: 'GOOG', name: '谷歌',     type: 'stock', basePrice: 175, currentPrice: 175, volatility: 0.0030, countryId: 'usa', sector: '科技',   sentimentSensitivity: 0.9 },
  { id: 'AMZN', name: '亚马逊',   type: 'stock', basePrice: 185, currentPrice: 185, volatility: 0.0035, countryId: 'usa', sector: '电商',   sentimentSensitivity: 0.9 },
  { id: 'TSLA', name: '特斯拉',   type: 'stock', basePrice: 250, currentPrice: 250, volatility: 0.0050, countryId: 'usa', sector: '汽车',   sentimentSensitivity: 1.3 },
  { id: 'META', name: 'Meta',     type: 'stock', basePrice: 500, currentPrice: 500, volatility: 0.0040, countryId: 'usa', sector: '科技',   sentimentSensitivity: 1.0 },
  { id: 'JPM',  name: '摩根大通', type: 'stock', basePrice: 200, currentPrice: 200, volatility: 0.0025, countryId: 'usa', sector: '银行',   sentimentSensitivity: 0.8 },
  { id: 'XOM',  name: '埃克森',   type: 'stock', basePrice: 115, currentPrice: 115, volatility: 0.0030, countryId: 'usa', sector: '能源',   sentimentSensitivity: 0.9 },
  { id: 'LMT',  name: '洛克希德', type: 'stock', basePrice: 450, currentPrice: 450, volatility: 0.0025, countryId: 'usa', sector: '军工',   sentimentSensitivity: 0.7 },

  // 欧元区(8只)
  { id: 'SAP',  name: 'SAP',      type: 'stock', basePrice: 175, currentPrice: 175, volatility: 0.0030, countryId: 'euro', sector: '科技',   sentimentSensitivity: 0.9 },
  { id: 'ASML', name: '阿斯麦',   type: 'stock', basePrice: 950, currentPrice: 950, volatility: 0.0045, countryId: 'euro', sector: '半导体', sentimentSensitivity: 1.1 },
  { id: 'SIE',  name: '西门子',   type: 'stock', basePrice: 175, currentPrice: 175, volatility: 0.0028, countryId: 'euro', sector: '工业',   sentimentSensitivity: 0.8 },
  { id: 'AIR',  name: '空客',     type: 'stock', basePrice: 140, currentPrice: 140, volatility: 0.0030, countryId: 'euro', sector: '航空',   sentimentSensitivity: 0.9 },
  { id: 'LVMH', name: '路威酩轩', type: 'stock', basePrice: 850, currentPrice: 850, volatility: 0.0025, countryId: 'euro', sector: '消费',   sentimentSensitivity: 0.8 },
  { id: 'TOT',  name: '道达尔',   type: 'stock', basePrice: 65,  currentPrice: 65,  volatility: 0.0030, countryId: 'euro', sector: '能源',   sentimentSensitivity: 0.9 },
  { id: 'SAN',  name: '赛诺菲',   type: 'stock', basePrice: 95,  currentPrice: 95,  volatility: 0.0022, countryId: 'euro', sector: '医药',   sentimentSensitivity: 0.7 },
  { id: 'ALV',  name: '安联',     type: 'stock', basePrice: 280, currentPrice: 280, volatility: 0.0025, countryId: 'euro', sector: '保险',   sentimentSensitivity: 0.7 },

  // 英国(6只)
  { id: 'SHEL', name: '壳牌',     type: 'stock', basePrice: 75,  currentPrice: 75,  volatility: 0.0030, countryId: 'uk', sector: '能源',   sentimentSensitivity: 0.9 },
  { id: 'HSBC', name: '汇丰',     type: 'stock', basePrice: 65,  currentPrice: 65,  volatility: 0.0028, countryId: 'uk', sector: '银行',   sentimentSensitivity: 0.8 },
  { id: 'AZN',  name: '阿斯利康', type: 'stock', basePrice: 125, currentPrice: 125, volatility: 0.0025, countryId: 'uk', sector: '医药',   sentimentSensitivity: 0.8 },
  { id: 'ULVR', name: '联合利华', type: 'stock', basePrice: 48,  currentPrice: 48,  volatility: 0.0020, countryId: 'uk', sector: '消费',   sentimentSensitivity: 0.7 },
  { id: 'BP',   name: '英国石油', type: 'stock', basePrice: 38,  currentPrice: 38,  volatility: 0.0032, countryId: 'uk', sector: '能源',   sentimentSensitivity: 0.9 },
  { id: 'BARC', name: '巴克莱',   type: 'stock', basePrice: 220, currentPrice: 220, volatility: 0.0035, countryId: 'uk', sector: '银行',   sentimentSensitivity: 0.9 },

  // 日本(7只)
  { id: '7203', name: '丰田',     type: 'stock', basePrice: 28,  currentPrice: 28,  volatility: 0.0028, countryId: 'japan', sector: '汽车',   sentimentSensitivity: 0.9 },
  { id: '6758', name: '索尼',     type: 'stock', basePrice: 13,  currentPrice: 13,  volatility: 0.0032, countryId: 'japan', sector: '科技',   sentimentSensitivity: 1.0 },
  { id: '9984', name: '软银',     type: 'stock', basePrice: 9,   currentPrice: 9,   volatility: 0.0050, countryId: 'japan', sector: '投资',   sentimentSensitivity: 1.2 },
  { id: '8035', name: '东京电子', type: 'stock', basePrice: 32,  currentPrice: 32,  volatility: 0.0040, countryId: 'japan', sector: '半导体', sentimentSensitivity: 1.1 },
  { id: '8306', name: '三菱UFJ',  type: 'stock', basePrice: 12,  currentPrice: 12,  volatility: 0.0025, countryId: 'japan', sector: '银行',   sentimentSensitivity: 0.7 },
  { id: '4568', name: '第一三共', type: 'stock', basePrice: 45,  currentPrice: 45,  volatility: 0.0030, countryId: 'japan', sector: '医药',   sentimentSensitivity: 0.8 },
  { id: '6501', name: '日立',     type: 'stock', basePrice: 9,   currentPrice: 9,   volatility: 0.0028, countryId: 'japan', sector: '工业',   sentimentSensitivity: 0.8 },

  // 瑞士(5只)
  { id: 'NESN', name: '雀巢',     type: 'stock', basePrice: 95,  currentPrice: 95,  volatility: 0.0020, countryId: 'swiss', sector: '消费',   sentimentSensitivity: 0.6 },
  { id: 'NOVN', name: '诺华',     type: 'stock', basePrice: 95,  currentPrice: 95,  volatility: 0.0022, countryId: 'swiss', sector: '医药',   sentimentSensitivity: 0.7 },
  { id: 'ROG',  name: '罗氏',     type: 'stock', basePrice: 230, currentPrice: 230, volatility: 0.0022, countryId: 'swiss', sector: '医药',   sentimentSensitivity: 0.7 },
  { id: 'UBSG', name: '瑞银',     type: 'stock', basePrice: 28,  currentPrice: 28,  volatility: 0.0035, countryId: 'swiss', sector: '银行',   sentimentSensitivity: 1.0 },
  { id: 'ABBN', name: 'ABB',      type: 'stock', basePrice: 120, currentPrice: 120, volatility: 0.0025, countryId: 'swiss', sector: '工业',   sentimentSensitivity: 0.8 },

  // 沙特(4只)
  { id: '2222', name: '沙特阿美', type: 'stock', basePrice: 32,  currentPrice: 32,  volatility: 0.0025, countryId: 'saudi', sector: '能源',   sentimentSensitivity: 1.0 },
  { id: '1180', name: '萨比克',   type: 'stock', basePrice: 75,  currentPrice: 75,  volatility: 0.0030, countryId: 'saudi', sector: '化工',   sentimentSensitivity: 0.9 },
  { id: '2010', name: '沙特电信', type: 'stock', basePrice: 38,  currentPrice: 38,  volatility: 0.0025, countryId: 'saudi', sector: '电信',   sentimentSensitivity: 0.7 },
  { id: '1020', name: '拉吉希',   type: 'stock', basePrice: 85,  currentPrice: 85,  volatility: 0.0028, countryId: 'saudi', sector: '银行',   sentimentSensitivity: 0.8 },

  // 新加坡(3只)
  { id: 'D05', name: '星展银行', type: 'stock', basePrice: 35,  currentPrice: 35,  volatility: 0.0028, countryId: 'singapore', sector: '银行',   sentimentSensitivity: 0.8 },
  { id: 'Z74', name: '胜科',     type: 'stock', basePrice: 5,   currentPrice: 5,   volatility: 0.0030, countryId: 'singapore', sector: '电信',   sentimentSensitivity: 0.7 },
  { id: 'C6L', name: '新航',     type: 'stock', basePrice: 6,   currentPrice: 6,   volatility: 0.0035, countryId: 'singapore', sector: '航空',   sentimentSensitivity: 0.9 },
]

// ─── 大宗商品(4种) ───────────────────────────────────────────

const COMMODITY_ASSETS: Asset[] = [
  { id: 'OIL',   name: '石油',   type: 'commodity', basePrice: 78.5,  currentPrice: 78.5,  volatility: 0.0030, sentimentSensitivity: 0.8 },
  { id: 'GAS',   name: '天然气', type: 'commodity', basePrice: 3.24,  currentPrice: 3.24,  volatility: 0.0040, sentimentSensitivity: 0.7 },
  { id: 'GRAIN', name: '粮食',   type: 'commodity', basePrice: 245.0, currentPrice: 245.0, volatility: 0.0020, sentimentSensitivity: 0.6 },
  { id: 'REE',   name: '稀土',   type: 'commodity', basePrice: 89.2,  currentPrice: 89.2,  volatility: 0.0035, sentimentSensitivity: 0.7 },
]

// ─── 避险资产(2种) ───────────────────────────────────────────

const SAFEHAVEN_ASSETS: Asset[] = [
  { id: 'DGOLD', name: '黄金', type: 'safehaven', basePrice: 2345.0, currentPrice: 2345.0, volatility: 0.0010, sentimentSensitivity: -0.5 },
  { id: 'ETNL',  name: '永恒', type: 'safehaven', basePrice: 100.0,  currentPrice: 100.0,  volatility: 0.0005, sentimentSensitivity: 0.1 },
]

// ─── 汇总导出 ───────────────────────────────────────────

/** 静态资产（不含每局随机虚拟币） */
export const STATIC_ASSETS: Asset[] = [
  ...CURRENCY_ASSETS,
  ...STOCK_ASSETS,
  ...COMMODITY_ASSETS,
  ...SAFEHAVEN_ASSETS,
]

/** 所有资产（含虚拟币需在游戏初始化时调用 setSessionAssets） */
export let ALL_ASSETS: Asset[] = [...STATIC_ASSETS]

/** 注入每局随机虚拟币 */
export function setSessionAssets(virtualCoins: Asset[]): void {
  ALL_ASSETS = [...STATIC_ASSETS, ...virtualCoins]
}

/** 货币列表（用于快捷选择） */
export const CURRENCY_IDS = CURRENCY_ASSETS.map(a => a.id)

/** 板块列表 */
export const SECTORS = [...new Set(STOCK_ASSETS.map(a => a.sector!).filter(Boolean))]

/** 资产分类（用于UI分组） */
export const ASSET_CATEGORIES = [
  { key: 'currency', label: '货币', ids: CURRENCY_ASSETS.map(a => a.id) },
  { key: 'stock', label: '股票', ids: STOCK_ASSETS.map(a => a.id) },
  { key: 'commodity', label: '商品', ids: COMMODITY_ASSETS.map(a => a.id) },
  { key: 'safehaven', label: '避险', ids: SAFEHAVEN_ASSETS.map(a => a.id) },
  { key: 'crypto', label: '虚拟币', ids: [] as string[] }, // 运行时填充
] as const
