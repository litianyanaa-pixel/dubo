export type AssetType = 'currency' | 'stock' | 'commodity' | 'safehaven' | 'derivative' | 'crypto' | 'player_token'

export interface Asset {
  id: string
  name: string
  type: AssetType
  basePrice: number
  currentPrice: number
  volatility: number
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
