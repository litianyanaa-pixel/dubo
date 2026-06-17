export type AssetType = 'currency' | 'stock' | 'commodity' | 'safehaven' | 'crypto'

export interface Asset {
  id: string
  name: string
  type: AssetType
  basePrice: number
  currentPrice: number
  volatility: number
  /** 所属国家ID（货币/股票有，商品/避险/虚拟币无） */
  countryId?: string
  /** 板块分类（科技/军工/金融/农业/能源/矿业/数据等） */
  sector?: string
  /** 情绪敏感度：避险~0.3，货币~0.6，股票~1.0，虚拟币~2.0，DGOLD负数表示反向 */
  sentimentSensitivity: number
}

export interface PriceUpdate {
  assetId: string
  price: number
  prevPrice: number
  change: number
  timestamp: number
}

export interface OHLCV {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
