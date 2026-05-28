import { useEffect, useRef } from 'react'
import { GameLoop } from '@/engine/core/GameLoop'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { AIEngine } from '@/engine/ai/AIEngine'
import { EventEngine } from '@/engine/event/EventEngine'
import { eventBus } from '@/engine/core/EventBus'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { useNewsStore } from '@/stores/newsStore'
import { ALL_ASSETS } from '@/data/assets'
import type { TickLayer } from '@/engine/core/types'

export function useGameLoop() {
  const loopRef = useRef<GameLoop | null>(null)

  useEffect(() => {
    const loop = new GameLoop()
    const market = new MarketEngine()
    const sentiment = new SentimentEngine()
    const ai = new AIEngine(20, 4, 2)
    const events = new EventEngine()

    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    // L0 (500ms): price updates
    loop.onLayer(0 as TickLayer, (tick) => {
      market.updatePrices(tick, sentiment.getGlobal())
    })

    // L1 (2s): AI decisions
    loop.onLayer(1 as TickLayer, () => {
      ai.tick(market, sentiment.getGlobal())
    })

    // L2 (3s): sentiment update
    loop.onLayer(2 as TickLayer, () => {
      sentiment.update()
    })

    // L3 (5s): random events
    loop.onLayer(3 as TickLayer, () => {
      const event = events.tick()
      if (event) {
        useNewsStore.getState().addEntry({
          id: event.id,
          title: event.title,
          description: event.description,
          type: 'event',
        })

        // Apply event price impact
        if (event.targetAsset) {
          const asset = market.getAsset(event.targetAsset)
          if (asset) {
            asset.currentPrice *= (1 + event.priceImpact)
          }
        } else {
          for (const asset of market.getAllAssets()) {
            asset.currentPrice *= (1 + event.priceImpact)
          }
        }

        // Apply sentiment impact
        sentiment.applyShock(event.sentimentImpact)
      }
    })

    // Bind EventBus -> stores
    eventBus.on('price:updated', (data) => {
      useMarketStore.getState().updatePrice(data.assetId, data.price)
    })

    eventBus.on('speed:changed', (data) => {
      useGameStore.getState().setSpeed(data.speed)
    })

    eventBus.on('sentiment:changed', (data) => {
      useSentimentStore.getState().setGlobal(data.global)
    })

    eventBus.on('ai:trade', (data) => {
      const agent = ai.getAgents().find((a) => a.id === data.agentId)
      if (agent) {
        useNewsStore.getState().addEntry({
          id: `trade_${Date.now()}_${data.agentId}`,
          title: `${agent.name} ${data.amount > 50000 ? '大额' : ''}${data.amount > 10000 && data.amount <= 50000 ? '中额' : '小额'}交易`,
          description: `${agent.type === 'whale' ? '🐋' : agent.type === 'scammer' ? '🎭' : '🥬'} ${agent.name} 交易了 ${data.assetId}`,
          type: 'ai_trade',
        })
      }
    })

    const interval = setInterval(() => {
      if (loop.isRunning() && loop.getSpeed() > 0) {
        useGameStore.getState().setElapsed(loop.getElapsed())
      }
    }, 100)

    loop.start()
    loopRef.current = loop

    return () => {
      loop.stop()
      clearInterval(interval)
      eventBus.removeAll()
    }
  }, [])

  const setSpeed = (speed: 0 | 1 | 2 | 3) => {
    loopRef.current?.setSpeed(speed)
  }

  return { setSpeed }
}
