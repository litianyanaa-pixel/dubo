import { useEffect, useRef } from 'react'
import { GameLoop } from '@/engine/core/GameLoop'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { AIEngine } from '@/engine/ai/AIEngine'
import { EventEngine } from '@/engine/event/EventEngine'
import { KOLEngine } from '@/engine/kol/KOLEngine'
import { eventBus } from '@/engine/core/EventBus'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { useNewsStore } from '@/stores/newsStore'
import { useKOLStore } from '@/stores/kolStore'
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
    const kol = new KOLEngine()

    // Initialize KOL store
    useKOLStore.getState().setKOLs(kol.getKOLs())

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

    // L2 (3s): sentiment update + AI social posts
    loop.onLayer(2 as TickLayer, () => {
      sentiment.update()

      const socialPost = ai.socialTick(sentiment.getGlobal())
      if (socialPost) {
        useNewsStore.getState().addEntry({
          id: `social_${Date.now()}`,
          title: socialPost.agentName,
          description: socialPost.content,
          type: 'social',
        })
      }
    })

    // L3 (5s): random events + KOL posts
    loop.onLayer(3 as TickLayer, (tick) => {
      const event = events.tick()
      if (event) {
        useNewsStore.getState().addEntry({
          id: event.id,
          title: event.title,
          description: event.description,
          type: 'event',
        })

        if (event.targetAsset) {
          const asset = market.getAsset(event.targetAsset)
          if (asset) asset.currentPrice *= (1 + event.priceImpact)
        } else {
          for (const asset of market.getAllAssets()) {
            asset.currentPrice *= (1 + event.priceImpact)
          }
        }
        sentiment.applyShock(event.sentimentImpact)
      }

      // KOL posts
      kol.tick(tick)
      if (kol.lastKOLImpact) {
        const { asset: kolAsset, sentimentImpact } = kol.lastKOLImpact
        sentiment.applyShock(sentimentImpact)
        kol.lastKOLImpact = null

        // Sync KOL store
        useKOLStore.getState().setKOLs(kol.getKOLs())
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
        const price = useMarketStore.getState().prices[data.assetId] ?? 1
        const lots = Math.round(data.amount / price)
        const isBig = data.amount > 50000
        useNewsStore.getState().addEntry({
          id: `trade_${Date.now()}_${data.agentId}`,
          title: agent.name,
          description: `${data.assetId} ${data.side === 'buy' ? '多' : '空'}${lots}手${isBig ? '（大单）' : ''}`,
          type: 'ai_trade',
          side: data.side,
          assetId: data.assetId,
          lots,
          isBigOrder: isBig,
          agentType: agent.type,
        })
      }
    })

    eventBus.on('ai:kol:post', (data) => {
      useNewsStore.getState().addEntry({
        id: `kol_${Date.now()}`,
        title: 'KOL 喊单',
        description: data.content,
        type: 'kol_post',
      })
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
