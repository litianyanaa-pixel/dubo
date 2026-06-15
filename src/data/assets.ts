/**
 * 完整虚构资产体系
 * 7种货币 + 43只股票 + 4种大宗商品 + 2种避险资产
 * 虚拟币由 virtualCoins.ts 每局随机生成
 */
import type { Asset } from '@/engine/market/types'

// ─── 货币（7种） ───────────────────────────────────────────

const CURRENCY_ASSETS: Asset[] = [
  { id: 'KAL', name: '伽蓝币', type: 'currency', basePrice: 1.0000, currentPrice: 1.0000, volatility: 0.0015, countryId: 'kalan', sentimentSensitivity: 0.6 },
  { id: 'EMK', name: '焰砂元', type: 'currency', basePrice: 0.85, currentPrice: 0.85, volatility: 0.0025, countryId: 'ember', sentimentSensitivity: 0.8 },
  { id: 'FOR', name: '铸链币', type: 'currency', basePrice: 0.12, currentPrice: 0.12, volatility: 0.0020, countryId: 'forge', sentimentSensitivity: 0.7 },
  { id: 'SRD', name: '银脊盾', type: 'currency', basePrice: 1.02, currentPrice: 1.02, volatility: 0.0008, countryId: 'silver', sentimentSensitivity: 0.4 },
  { id: 'DTR', name: '暗棘令', type: 'currency', basePrice: 0.50, currentPrice: 0.50, volatility: 0.0040, countryId: 'darkthorn', sentimentSensitivity: 0.3 },
  { id: 'TDL', name: '汐潮元', type: 'currency', basePrice: 0.35, currentPrice: 0.35, volatility: 0.0030, countryId: 'tidal', sentimentSensitivity: 1.0 },
  { id: 'JDL', name: '碧芒币', type: 'currency', basePrice: 0.22, currentPrice: 0.22, volatility: 0.0018, countryId: 'jade', sentimentSensitivity: 0.5 },
]

// ─── 股票（43只） ───────────────────────────────────────────

const STOCK_ASSETS: Asset[] = [
  // 伽蓝联邦（7只）
  { id: 'QC', name: '量子芯片', type: 'stock', basePrice: 320, currentPrice: 320, volatility: 0.0035, countryId: 'kalan', sector: '科技', sentimentSensitivity: 1.0 },
  { id: 'TAI', name: '天算AI', type: 'stock', basePrice: 580, currentPrice: 580, volatility: 0.0030, countryId: 'kalan', sector: '科技', sentimentSensitivity: 1.1 },
  { id: 'KSP', name: '伽蓝航天', type: 'stock', basePrice: 145, currentPrice: 145, volatility: 0.0040, countryId: 'kalan', sector: '科技', sentimentSensitivity: 0.9 },
  { id: 'BLT', name: '生物突破', type: 'stock', basePrice: 95, currentPrice: 95, volatility: 0.0050, countryId: 'kalan', sector: '生物科技', sentimentSensitivity: 1.2 },
  { id: 'SKG', name: '无人机防务', type: 'stock', basePrice: 210, currentPrice: 210, volatility: 0.0030, countryId: 'kalan', sector: '军工', sentimentSensitivity: 1.0 },
  { id: 'DMP', name: '数据帝国', type: 'stock', basePrice: 430, currentPrice: 430, volatility: 0.0025, countryId: 'kalan', sector: '数据', sentimentSensitivity: 0.8 },
  { id: 'AUF', name: '自动化工厂', type: 'stock', basePrice: 180, currentPrice: 180, volatility: 0.0030, countryId: 'kalan', sector: '制造', sentimentSensitivity: 0.9 },

  // 焰砂汗国（5只）
  { id: 'ROL', name: '汗室石油', type: 'stock', basePrice: 85, currentPrice: 85, volatility: 0.0040, countryId: 'ember', sector: '能源', sentimentSensitivity: 1.0 },
  { id: 'DMT', name: '沙漠矿业', type: 'stock', basePrice: 62, currentPrice: 62, volatility: 0.0045, countryId: 'ember', sector: '矿业', sentimentSensitivity: 0.9 },
  { id: 'GEO', name: '地热能源', type: 'stock', basePrice: 38, currentPrice: 38, volatility: 0.0035, countryId: 'ember', sector: '能源', sentimentSensitivity: 0.7 },
  { id: 'SLG', name: '雇佣军集团', type: 'stock', basePrice: 120, currentPrice: 120, volatility: 0.0030, countryId: 'ember', sector: '军事', sentimentSensitivity: 1.0 },
  { id: 'RSH', name: '汗室航运', type: 'stock', basePrice: 55, currentPrice: 55, volatility: 0.0035, countryId: 'ember', sector: '物流', sentimentSensitivity: 0.8 },

  // 铸链联合体（8只）
  { id: 'CHV', name: '链条重工', type: 'stock', basePrice: 150, currentPrice: 150, volatility: 0.0030, countryId: 'forge', sector: '重工业', sentimentSensitivity: 0.9 },
  { id: 'GRF', name: '新能源设备', type: 'stock', basePrice: 88, currentPrice: 88, volatility: 0.0040, countryId: 'forge', sector: '能源', sentimentSensitivity: 1.0 },
  { id: 'GFB', name: '全球代工', type: 'stock', basePrice: 65, currentPrice: 65, volatility: 0.0030, countryId: 'forge', sector: '制造', sentimentSensitivity: 0.8 },
  { id: 'MGB', name: '基建巨头', type: 'stock', basePrice: 110, currentPrice: 110, volatility: 0.0028, countryId: 'forge', sector: '基建', sentimentSensitivity: 0.8 },
  { id: 'ELM', name: '电动出行', type: 'stock', basePrice: 72, currentPrice: 72, volatility: 0.0040, countryId: 'forge', sector: '汽车', sentimentSensitivity: 1.0 },
  { id: 'CTS', name: '铸链钢铁', type: 'stock', basePrice: 45, currentPrice: 45, volatility: 0.0035, countryId: 'forge', sector: '钢铁', sentimentSensitivity: 0.8 },
  { id: 'PPL', name: '全民芯片', type: 'stock', basePrice: 95, currentPrice: 95, volatility: 0.0040, countryId: 'forge', sector: '半导体', sentimentSensitivity: 1.0 },
  { id: 'CEC', name: '铸链电商', type: 'stock', basePrice: 130, currentPrice: 130, volatility: 0.0030, countryId: 'forge', sector: '电商', sentimentSensitivity: 0.9 },

  // 银脊共和国（6只）
  { id: 'SRB', name: '银脊银行', type: 'stock', basePrice: 280, currentPrice: 280, volatility: 0.0020, countryId: 'silver', sector: '银行', sentimentSensitivity: 0.7 },
  { id: 'FST', name: '堡垒信托', type: 'stock', basePrice: 195, currentPrice: 195, volatility: 0.0025, countryId: 'silver', sector: '信托', sentimentSensitivity: 0.7 },
  { id: 'CRG', name: '隐私保险', type: 'stock', basePrice: 110, currentPrice: 110, volatility: 0.0030, countryId: 'silver', sector: '保险', sentimentSensitivity: 0.8 },
  { id: 'PRT', name: '精密仪器', type: 'stock', basePrice: 165, currentPrice: 165, volatility: 0.0028, countryId: 'silver', sector: '精密制造', sentimentSensitivity: 0.8 },
  { id: 'SRM', name: '银脊矿业', type: 'stock', basePrice: 72, currentPrice: 72, volatility: 0.0035, countryId: 'silver', sector: '矿业', sentimentSensitivity: 0.9 },
  { id: 'DGL', name: '数字黄金', type: 'stock', basePrice: 340, currentPrice: 340, volatility: 0.0020, countryId: 'silver', sector: '金融科技', sentimentSensitivity: 0.7 },

  // 暗棘帝国（5只）
  { id: 'IWA', name: '铁翼军工', type: 'stock', basePrice: 175, currentPrice: 175, volatility: 0.0035, countryId: 'darkthorn', sector: '军工', sentimentSensitivity: 1.2 },
  { id: 'RSH2', name: '红星重工', type: 'stock', basePrice: 88, currentPrice: 88, volatility: 0.0030, countryId: 'darkthorn', sector: '重工业', sentimentSensitivity: 0.9 },
  { id: 'CBT', name: '网络战部队', type: 'stock', basePrice: 220, currentPrice: 220, volatility: 0.0035, countryId: 'darkthorn', sector: '网络安全', sentimentSensitivity: 1.0 },
  { id: 'NUP', name: '核能集团', type: 'stock', basePrice: 95, currentPrice: 95, volatility: 0.0040, countryId: 'darkthorn', sector: '能源', sentimentSensitivity: 1.1 },
  { id: 'DOL', name: '暗棘石油', type: 'stock', basePrice: 55, currentPrice: 55, volatility: 0.0030, countryId: 'darkthorn', sector: '能源', sentimentSensitivity: 0.8 },

  // 汐潮自由邦（6只）
  { id: 'TEX', name: '汐潮交易所', type: 'stock', basePrice: 520, currentPrice: 520, volatility: 0.0035, countryId: 'tidal', sector: '交易所', sentimentSensitivity: 1.2 },
  { id: 'FWS', name: '自由航运', type: 'stock', basePrice: 68, currentPrice: 68, volatility: 0.0040, countryId: 'tidal', sector: '物流', sentimentSensitivity: 0.9 },
  { id: 'OFF', name: '离岸金融', type: 'stock', basePrice: 150, currentPrice: 150, volatility: 0.0030, countryId: 'tidal', sector: '金融', sentimentSensitivity: 0.9 },
  { id: 'OBT', name: '海洋博彩', type: 'stock', basePrice: 95, currentPrice: 95, volatility: 0.0050, countryId: 'tidal', sector: '博彩', sentimentSensitivity: 1.3 },
  { id: 'TDT', name: '汐潮科技', type: 'stock', basePrice: 180, currentPrice: 180, volatility: 0.0035, countryId: 'tidal', sector: '科技', sentimentSensitivity: 1.0 },
  { id: 'FMD', name: '自由传媒', type: 'stock', basePrice: 42, currentPrice: 42, volatility: 0.0045, countryId: 'tidal', sector: '媒体', sentimentSensitivity: 1.1 },

  // 碧芒同盟（6只）
  { id: 'SDG', name: '全球种子', type: 'stock', basePrice: 260, currentPrice: 260, volatility: 0.0025, countryId: 'jade', sector: '农业', sentimentSensitivity: 0.8 },
  { id: 'SLJ', name: '太阳能源', type: 'stock', basePrice: 135, currentPrice: 135, volatility: 0.0035, countryId: 'jade', sector: '能源', sentimentSensitivity: 0.9 },
  { id: 'BJT', name: '碧芒生物', type: 'stock', basePrice: 185, currentPrice: 185, volatility: 0.0030, countryId: 'jade', sector: '生物科技', sentimentSensitivity: 1.0 },
  { id: 'CBN', name: '碳交易', type: 'stock', basePrice: 78, currentPrice: 78, volatility: 0.0040, countryId: 'jade', sector: '碳市场', sentimentSensitivity: 0.9 },
  { id: 'BBL', name: '碧芒物流', type: 'stock', basePrice: 55, currentPrice: 55, volatility: 0.0030, countryId: 'jade', sector: '物流', sentimentSensitivity: 0.7 },
  { id: 'GFD', name: '绿色基金', type: 'stock', basePrice: 210, currentPrice: 210, volatility: 0.0025, countryId: 'jade', sector: '基金', sentimentSensitivity: 0.7 },
]

// ─── 大宗商品（4种） ───────────────────────────────────────────

const COMMODITY_ASSETS: Asset[] = [
  { id: 'OIL', name: '石油', type: 'commodity', basePrice: 78.5, currentPrice: 78.5, volatility: 0.0030, sentimentSensitivity: 0.8 },
  { id: 'GAS', name: '天然气', type: 'commodity', basePrice: 3.24, currentPrice: 3.24, volatility: 0.0040, sentimentSensitivity: 0.7 },
  { id: 'GRAIN', name: '粮食', type: 'commodity', basePrice: 245.0, currentPrice: 245.0, volatility: 0.0020, sentimentSensitivity: 0.6 },
  { id: 'REE', name: '稀土', type: 'commodity', basePrice: 89.2, currentPrice: 89.2, volatility: 0.0035, sentimentSensitivity: 0.7 },
]

// ─── 避险资产（2种） ───────────────────────────────────────────

const SAFEHAVEN_ASSETS: Asset[] = [
  { id: 'DGOLD', name: '龙头金', type: 'safehaven', basePrice: 2345.0, currentPrice: 2345.0, volatility: 0.0010, sentimentSensitivity: -0.5 },
  { id: 'ETNL', name: '永恒', type: 'safehaven', basePrice: 100.0, currentPrice: 100.0, volatility: 0.0005, sentimentSensitivity: 0.1 },
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
