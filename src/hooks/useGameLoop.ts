import { useEffect, useRef } from 'react'
import { GameLoop } from '@/engine/core/GameLoop'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { eventBus } from '@/engine/core/EventBus'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { ASSET_KAL } from '@/data/assets'
import type { TickLayer } from '@/engine/core/types'

export function useGameLoop() {
  const loopRef = useRef<GameLoop | null>(null)

  useEffect(() => {
    const loop = new GameLoop()
    const market = new MarketEngine()
    const sentiment = new SentimentEngine()

    market.registerAsset(ASSET_KAL)

    loop.onLayer(0 as TickLayer, (tick) => {
      market.updatePrices(tick)
    })

    loop.onLayer(2 as TickLayer, () => {
      sentiment.update()
    })

    eventBus.on('price:updated', (data) => {
      useMarketStore.getState().updatePrice(data.assetId, data.price)
    })

    eventBus.on('speed:changed', (data) => {
      useGameStore.getState().setSpeed(data.speed)
    })

    eventBus.on('sentiment:changed', (data) => {
      useSentimentStore.getState().setGlobal(data.global)
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
