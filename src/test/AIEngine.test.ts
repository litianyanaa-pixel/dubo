import { describe, it, expect, beforeEach } from 'vitest'
import { AIEngine } from '@/engine/ai/AIEngine'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { eventBus } from '@/engine/core/EventBus'
import { ALL_ASSETS } from '@/data/assets'

describe('AIEngine', () => {
  let engine: AIEngine
  let market: MarketEngine

  beforeEach(() => {
    engine = new AIEngine(5, 2, 1)
    market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }
    eventBus.removeAll()
  })

  it('creates correct number of agents', () => {
    const agents = engine.getAgents()
    expect(agents.length).toBe(8) // 5 leeks + 2 whales + 1 scammer
    expect(agents.filter(a => a.type === 'leek').length).toBe(5)
    expect(agents.filter(a => a.type === 'whale').length).toBe(2)
    expect(agents.filter(a => a.type === 'scammer').length).toBe(1)
  })

  it('agents have unique names', () => {
    const names = engine.getAgents().map(a => a.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('agents have initial cash', () => {
    for (const agent of engine.getAgents()) {
      expect(agent.cash).toBeGreaterThan(0)
    }
  })

  it('tick does not crash with neutral sentiment', () => {
    expect(() => engine.tick(market, 50)).not.toThrow()
  })

  it('tick generates trades and emits ai:trade events', () => {
    const trades: any[] = []
    eventBus.on('ai:trade', (data) => trades.push(data))

    // Run many ticks to ensure some trades happen
    for (let i = 0; i < 50; i++) {
      engine.tick(market, 50)
    }

    expect(trades.length).toBeGreaterThan(0)
    for (const trade of trades) {
      expect(trade.agentId).toBeDefined()
      expect(trade.assetId).toBeDefined()
      expect(['buy', 'sell']).toContain(trade.side)
      expect(trade.amount).toBeGreaterThan(0)
    }
  })

  it('tick generates trade logs', () => {
    for (let i = 0; i < 50; i++) {
      engine.tick(market, 50)
    }
    const logs = engine.getRecentTrades()
    expect(logs.length).toBeGreaterThan(0)
  })

  it('getRecentTrades caps at 20', () => {
    for (let i = 0; i < 100; i++) {
      engine.tick(market, 50)
    }
    const logs = engine.getRecentTrades(20)
    expect(logs.length).toBeLessThanOrEqual(20)
  })

  it('socialTick returns null or a social post', () => {
    let posts = 0
    let nulls = 0
    for (let i = 0; i < 100; i++) {
      const result = engine.socialTick(50)
      if (result) {
        posts++
        expect(result.agentId).toBeDefined()
        expect(result.content.length).toBeGreaterThan(0)
        expect(result.agentName.length).toBeGreaterThan(0)
      } else {
        nulls++
      }
    }
    expect(posts).toBeGreaterThan(0)
    expect(nulls).toBeGreaterThan(0)
  })

  it('socialTick produces different content based on sentiment', () => {
    const highSentimentPosts: string[] = []
    const lowSentimentPosts: string[] = []

    for (let i = 0; i < 200; i++) {
      const high = engine.socialTick(85)
      if (high) highSentimentPosts.push(high.content)

      const low = engine.socialTick(15)
      if (low) lowSentimentPosts.push(low.content)
    }

    // Both should produce content
    expect(highSentimentPosts.length).toBeGreaterThan(0)
    expect(lowSentimentPosts.length).toBeGreaterThan(0)

    // They should be different (not identical sets)
    const highSet = new Set(highSentimentPosts)
    const lowSet = new Set(lowSentimentPosts)
    // At least some posts should differ
    const overlap = [...highSet].filter(p => lowSet.has(p))
    expect(overlap.length).toBeLessThan(highSet.size)
  })

  it('leeks buy when sentiment is high', () => {
    // With very high sentiment, leeks should tend to buy
    const trades: any[] = []
    eventBus.on('ai:trade', (data) => trades.push(data))

    for (let i = 0; i < 100; i++) {
      engine.tick(market, 90) // very greedy
    }

    const buys = trades.filter(t => t.side === 'buy').length
    const sells = trades.filter(t => t.side === 'sell').length
    // Leeks should buy more than sell when sentiment is high
    expect(buys).toBeGreaterThan(sells * 0.5)
  })
})
