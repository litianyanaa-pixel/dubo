/**
 * 每局随机生成3-5种虚拟币
 * 数据来源：补充设计文档"十六、虚拟币体系"
 */
import type { Asset } from '@/engine/market/types'

const PREFIXES = ['Moon', 'Doge', 'Safe', 'Rocket', 'Elon', 'AI', 'Meta', 'Cyber', 'Neo', 'Quantum', 'HODL', 'Degen', 'Pump', 'Yield']
const SUFFIXES = ['Coin', 'Token', 'Swap', 'Finance', 'Moon', 'AI', 'Chain', 'Protocol', 'Inu', 'Cat']

let sessionCoins: string[] = []

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateName(): string {
  const prefix = pickRandom(PREFIXES)
  const suffix = pickRandom(SUFFIXES)
  return prefix + suffix
}

function generateUniqueName(): string {
  let name: string
  let attempts = 0
  do {
    name = generateName()
    attempts++
  } while (sessionCoins.includes(name) && attempts < 50)
  sessionCoins.push(name)
  return name
}

export function generateSessionCoins(count: number = 4): Asset[] {
  sessionCoins = []
  const coins: Asset[] = []

  for (let i = 0; i < count; i++) {
    const basePrice = 0.001 + Math.random() * 5.0
    const vol = 0.02 + Math.random() * 0.03 // 2-5% 波动率
    const name = generateUniqueName()

    coins.push({
      id: `VCOIN_${i}`,
      name,
      type: 'crypto',
      basePrice,
      currentPrice: basePrice,
      volatility: vol,
      sentimentSensitivity: 2.0,
    })
  }

  return coins
}
