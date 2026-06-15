import { eventBus } from '@/engine/core/EventBus'
import type { MarketEngine } from '@/engine/market/MarketEngine'
import type { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { usePlayerStore } from '@/stores/playerStore'

export interface RugToken {
  id: string
  name: string
  launchPrice: number
  currentPrice: number
  totalSupply: number
  playerHolding: number
  aiHolding: number
  hypeLevel: number // 0-100, drives AI buying
  tickAge: number
  rugged: boolean
}

const TOKEN_NAMES = [
  'MoonCoin', 'SafeYield', 'ElonDoge', 'TrumpBucks',
  'CryptoBanana', 'RocketPump', 'DiamondFist', 'LamboCoin',
]

let rugCounter = 0

export class RugPullEngine {
  private tokens: RugToken[] = []

  /** Launch a new token. Cost: $50K from player. */
  launch(market: MarketEngine, sentiment: SentimentEngine): RugToken | null {
    const cash = usePlayerStore.getState().cash
    const launchCost = 50000
    if (cash < launchCost) return null

    usePlayerStore.setState({ cash: usePlayerStore.getState().cash - launchCost })

    const token: RugToken = {
      id: `rug_${rugCounter++}`,
      name: TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)] + Math.floor(Math.random() * 100),
      launchPrice: 0.01,
      currentPrice: 0.01,
      totalSupply: 10000000,
      playerHolding: 5000000, // player gets 50%
      aiHolding: 0,
      hypeLevel: Math.min(80, sentiment.getGlobal() + 10),
      tickAge: 0,
      rugged: false,
    }

    this.tokens.push(token)
    eventBus.emit('rug:launched', { tokenId: token.id })
    return token
  }

  /** Called on L3 tick. AI buys based on hype, price appreciates. */
  tick(sentiment: number): void {
    for (const token of this.tokens) {
      if (token.rugged) continue

      token.tickAge++

      // Hype decays over time
      token.hypeLevel = Math.max(0, token.hypeLevel - 2)

      // AI buying pressure based on hype
      if (token.hypeLevel > 20 && Math.random() < token.hypeLevel / 100) {
        const buyAmount = Math.floor(token.totalSupply * 0.01 * (token.hypeLevel / 100))
        const canBuy = token.totalSupply - token.playerHolding - token.aiHolding
        const actualBuy = Math.min(buyAmount, canBuy)
        if (actualBuy > 0) {
          token.aiHolding += actualBuy
          // Price goes up proportional to demand
          const demandPressure = actualBuy / token.totalSupply
          token.currentPrice *= (1 + demandPressure * 5)
        }
      }

      // Small random price drift
      token.currentPrice *= (1 + (Math.random() - 0.4) * 0.02)
      token.currentPrice = Math.max(0.001, token.currentPrice)
    }
  }

  /** Player pumps hype (costs $10K). Returns false if can't afford. */
  pump(tokenId: string): boolean {
    const token = this.tokens.find(t => t.id === tokenId && !t.rugged)
    if (!token) return false

    const cost = 10000
    if (usePlayerStore.getState().cash < cost) return false
    usePlayerStore.setState({ cash: usePlayerStore.getState().cash - cost })

    token.hypeLevel = Math.min(100, token.hypeLevel + 25)
    token.currentPrice *= 1.1 // instant 10% pump
    return true
  }

  /** Player dumps all holdings (the rug pull). */
  rug(tokenId: string): { revenue: number; profit: number } | null {
    const token = this.tokens.find(t => t.id === tokenId && !t.rugged)
    if (!token || token.playerHolding <= 0) return null

    const revenue = token.playerHolding * token.currentPrice
    usePlayerStore.setState({ cash: usePlayerStore.getState().cash + revenue })

    const cost = token.playerHolding * token.launchPrice
    const profit = revenue - cost

    // Price crashes 80-95%
    token.currentPrice *= (0.05 + Math.random() * 0.15)
    token.playerHolding = 0
    token.rugged = true

    eventBus.emit('rug:completed', { tokenId: token.id })
    return { revenue, profit }
  }

  getTokens(): RugToken[] { return this.tokens }
  getActiveTokens(): RugToken[] { return this.tokens.filter(t => !t.rugged) }
}
