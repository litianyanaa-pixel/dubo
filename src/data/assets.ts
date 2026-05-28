import type { Asset } from '@/engine/market/types'

export const ASSET_KAL: Asset = {
  id: 'KAL',
  name: '伽蓝币',
  type: 'currency',
  basePrice: 1.0,
  currentPrice: 1.0,
  volatility: 0.0015,
}

export const ASSET_EMK: Asset = {
  id: 'EMK',
  name: '焰砂元',
  type: 'currency',
  basePrice: 0.65,
  currentPrice: 0.65,
  volatility: 0.0025,
}

export const ASSET_FOR: Asset = {
  id: 'FOR',
  name: '铸链币',
  type: 'currency',
  basePrice: 1.2,
  currentPrice: 1.2,
  volatility: 0.0012,
}

export const ASSET_SRD: Asset = {
  id: 'SRD',
  name: '银脊盾',
  type: 'safehaven',
  basePrice: 1.5,
  currentPrice: 1.5,
  volatility: 0.0008,
}

export const ASSET_OIL: Asset = {
  id: 'OIL',
  name: '原油',
  type: 'commodity',
  basePrice: 72.5,
  currentPrice: 72.5,
  volatility: 0.003,
}

export const ASSET_GOLD: Asset = {
  id: 'GOLD',
  name: '龙头金',
  type: 'safehaven',
  basePrice: 2650.0,
  currentPrice: 2650.0,
  volatility: 0.001,
}

export const ALL_ASSETS: Asset[] = [
  ASSET_KAL, ASSET_EMK, ASSET_FOR, ASSET_SRD, ASSET_OIL, ASSET_GOLD,
]
