import { useEffect, useRef } from 'react'
import { GameLoop } from '@/engine/core/GameLoop'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { AIEngine } from '@/engine/ai/AIEngine'
import { EventEngine } from '@/engine/event/EventEngine'
import { KOLEngine, type KOLDirection } from '@/engine/kol/KOLEngine'
import { type Prediction } from '@/engine/player/TraitEngine'
import { TraitEngine } from '@/engine/player/TraitEngine'
import { CountryEngine } from '@/engine/country/CountryEngine'
import { RugPullEngine } from '@/engine/rugpull/RugPullEngine'
import { CorrelationMatrix } from '@/engine/market/CorrelationMatrix'
import { eventBus } from '@/engine/core/EventBus'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { useNewsStore } from '@/stores/newsStore'
import { useKOLStore } from '@/stores/kolStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { useCountryStore, type CountrySnapshot, type WarInfo } from '@/stores/countryStore'
import { ALL_ASSETS, setSessionAssets } from '@/data/assets'
import { generateSessionCoins } from '@/data/virtualCoins'
import { SFX } from '@/utils/sound'
import type { TickLayer } from '@/engine/core/types'

export interface EngineRefs {
  loop: GameLoop | null
  market: MarketEngine | null
  sentiment: SentimentEngine | null
  ai: AIEngine | null
  kol: KOLEngine | null
  trait: TraitEngine | null
  country: CountryEngine | null
  rugpull: RugPullEngine | null
  correlation: CorrelationMatrix | null
  currentTick: number
}

const engineRef: EngineRefs = { loop: null, market: null, sentiment: null, ai: null, kol: null, trait: null, country: null, rugpull: null, correlation: null, currentTick: 0 }

export function getEngineRefs(): EngineRefs {
  return engineRef
}

export function commandKOL(kolId: string, direction: KOLDirection): boolean {
  const { kol, sentiment, trait, market, currentTick } = engineRef
  if (!kol || !sentiment) return false

  const cost = trait?.getManipulationCost('kol_command') ?? 0
  if (cost > 0 && !trait?.consumeCredibility(cost)) return false

  const result = kol.command(kolId, direction, currentTick)
  if (!result) return false
  const traitMul = trait?.getKOLImpactMultiplier() ?? 1.0
  sentiment.applyShock(result.sentimentImpact * traitMul)

  const asset = market?.getAsset(result.specialty)
  if (asset) {
    asset.currentPrice *= (1 + result.priceDirection * traitMul)
  }

  useKOLStore.getState().setKOLs(kol.getKOLs())
  SFX.kolPost()
  recordManipulation(3)
  return true
}

export function runPrediction(assetId: string): Prediction | null {
  const { trait, market } = engineRef
  if (!trait || !market) return null
  const asset = market.getAsset(assetId)
  if (!asset) return null
  const candles = useMarketStore.getState().candles[assetId] ?? []
  return trait.predict(assetId, candles, asset.currentPrice)
}

export function getPrediction(): Prediction | null {
  return engineRef.trait?.getPrediction() ?? null
}

export function canPredict(): boolean {
  return engineRef.trait?.canPredict() ?? false
}

export function canManipulate(action: 'fake_news' | 'kol_command' | 'rug_pull'): boolean {
  return engineRef.trait?.canManipulate(engineRef.trait?.getManipulationCost(action) ?? 0) ?? true
}

export function getCredibility(): number | null {
  if (engineRef.trait?.getCharacter()?.id !== 'dove') return null
  return engineRef.trait.getCredibility()
}

export function recordManipulation(level: number): void {
  engineRef.country?.recordManipulation(level)
}

export function launchRugToken() {
  const { rugpull, market, sentiment, trait } = engineRef
  if (!rugpull || !market || !sentiment) return null
  const cost = trait?.getManipulationCost('rug_pull') ?? 0
  if (cost > 0 && !trait?.consumeCredibility(cost)) return null
  const token = rugpull.launch(market, sentiment)
  if (token) recordManipulation(8)
  return token
}

export function pumpRugToken(tokenId: string): boolean {
  const result = engineRef.rugpull?.pump(tokenId) ?? false
  if (result) recordManipulation(2)
  return result
}

export function rugPullToken(tokenId: string) {
  const result = engineRef.rugpull?.rug(tokenId) ?? null
  if (result) {
    recordManipulation(10)
    useNewsStore.getState().addEntry({
      id: `rug_${Date.now()}`,
      title: '💸 币圈崩盘',
      description: `${tokenId} 价格暴跌95%，投资者血本无归`,
      type: 'event',
    })
  }
  return result
}

export function getRugTokens() {
  return engineRef.rugpull?.getTokens() ?? []
}

/** 同步国家数据到 store */
function syncCountryData(country: CountryEngine): void {
  const snapshots: CountrySnapshot[] = country.getAllCountries().map(c => ({
    id: c.id,
    name: c.name,
    currencyId: c.currencyId,
    gdpGrowth: c.gdpGrowth,
    interestRate: c.interestRate,
    inflation: c.inflation,
    satisfaction: c.satisfaction,
    stability: c.stability,
    capitalFlow: c.capitalFlow,
    bondYield: c.bondYield,
  }))
  useCountryStore.getState().setCountries(snapshots)

  const wars: WarInfo[] = country.getActiveWars().map(w => ({
    attacker: w.attacker,
    defender: w.defender,
    phase: w.phase,
    scoreA: w.scoreA,
    scoreD: w.scoreD,
  }))
  useCountryStore.getState().setWars(wars)

  const relations: Record<string, Record<string, number>> = {}
  for (const c of country.getAllCountries()) {
    relations[c.id] = { ...c.relations }
  }
  useCountryStore.getState().setRelations(relations)
}

export function useGameLoop() {
  const loopRef = useRef<GameLoop | null>(null)

  useEffect(() => {
    const loop = new GameLoop()
    const correlation = new CorrelationMatrix()
    const country = new CountryEngine()
    const market = new MarketEngine(correlation, (id) => country.getCountry(id))
    const sentiment = new SentimentEngine()
    const ai = new AIEngine(20, 4, 2)
    const events = new EventEngine()
    const kol = new KOLEngine()
    const trait = new TraitEngine()
    const rugpull = new RugPullEngine()

    engineRef.loop = loop
    engineRef.market = market
    engineRef.sentiment = sentiment
    engineRef.ai = ai
    engineRef.kol = kol
    engineRef.trait = trait
    engineRef.country = country
    engineRef.rugpull = rugpull
    engineRef.correlation = correlation

    // 初始化KOL
    useKOLStore.getState().setKOLs(kol.getKOLs())

    // 设置角色天赋
    const character = useGameStore.getState().character
    if (character) trait.setCharacter(character)

    // 生成每局虚拟币并注册所有资产
    const virtualCoins = generateSessionCoins(4)
    setSessionAssets(virtualCoins)
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    // 初始同步国家数据
    syncCountryData(country)

    // L0 (500ms): 价格更新
    loop.onLayer(0 as TickLayer, (tick) => {
      market.updatePrices(tick, {
        global: sentiment.getGlobal(),
        countrySentiment: (countryId) => sentiment.getCountry(countryId),
        assetSentiment: (assetId) => sentiment.getAsset(assetId),
      })
    })

    // L1 (2s): AI决策
    loop.onLayer(1 as TickLayer, () => {
      ai.tick(market, sentiment.getGlobal())
    })

    // L2 (3s): 情绪更新 + AI社交 + 资本流动 + 破产检测
    loop.onLayer(2 as TickLayer, () => {
      sentiment.update(country, market)
      country.updateCapitalFlows()

      const socialPost = ai.socialTick(sentiment.getGlobal())
      if (socialPost) {
        useNewsStore.getState().addEntry({
          id: `social_${Date.now()}`,
          title: socialPost.agentName,
          description: socialPost.content,
          type: 'social',
        })
      }

      // 破产检测
      const playerState = usePlayerStore.getState()
      const mktPrices = useMarketStore.getState().prices
      const longValue = Object.entries(playerState.positions).reduce((sum, [id, pos]) => {
        return sum + pos.amount * (mktPrices[id] ?? 0)
      }, 0)
      const shortPnl = Object.entries(playerState.shorts).reduce((sum, [id, pos]) => {
        const price = mktPrices[id] ?? pos.avgEntry
        return sum + pos.amount * pos.avgEntry + (pos.avgEntry - price) * pos.amount
      }, 0)
      const total = playerState.cash + longValue + shortPnl
      if (total < 100 && playerState.cash >= 0) {
        SFX.bankruptcy()
        useUnlockStore.getState().recordBankruptcy()
        useGameStore.setState({ phase: 'gameover' })
      }

      // 闪电模式倒计时
      const mode = useGameStore.getState().mode
      if (mode === 'flash' && loop.getElapsed() >= 300000) {
        useGameStore.setState({ phase: 'gameover' })
      }

      // 沙盒补钱
      if (mode === 'sandbox' && playerState.cash < 100000) {
        usePlayerStore.setState({ cash: 999_999_999 })
      }

      // 同步国家数据
      syncCountryData(country)
    })

    // L3 (5s): 随机事件 + KOL冷却 + 天赋 + Rug Pull
    loop.onLayer(3 as TickLayer, (tick) => {
      engineRef.currentTick = tick
      const event = events.tick()
      if (event) {
        if (event.tier === 4) SFX.blackSwan()
        else SFX.event()
        useNewsStore.getState().addEntry({
          id: event.id,
          title: event.title,
          description: event.description,
          type: 'event',
        })

        const luckyMul = trait?.isLucky() ? (event.priceImpact > 0 ? 1.3 : 0.5) : 1.0
        if (event.targetAsset) {
          const asset = market.getAsset(event.targetAsset)
          if (asset) asset.currentPrice *= (1 + event.priceImpact * luckyMul)
          const flowSide = event.priceImpact > 0 ? 'buy' : 'sell'
          const flowAmount = Math.abs(event.priceImpact) * 2_000_000
          market.addTradeFlow(event.targetAsset, flowSide, flowAmount)
        } else {
          for (const asset of market.getAllAssets()) {
            asset.currentPrice *= (1 + event.priceImpact * luckyMul)
          }
        }
        sentiment.applyShock(event.sentimentImpact)
      }

      kol.tick(tick)
      useKOLStore.getState().setKOLs(kol.getKOLs())
      trait.tick()
      rugpull.tick(sentiment.getGlobal())
    })

    // L4 (30s): 经济指标演化 + 假新闻揭穿
    loop.onLayer(4 as TickLayer, () => {
      // 国家经济更新
      const ecoEvent = country.updateEconomics()
      if (ecoEvent) {
        useNewsStore.getState().addEntry({
          id: ecoEvent.id,
          title: ecoEvent.title,
          description: ecoEvent.description,
          type: 'event',
        })
        sentiment.applyCountryShock(ecoEvent.countryId, ecoEvent.sentimentImpact)
      }

      // 假新闻揭穿
      const luckyMod = trait?.isLucky() ? 0.5 : 1.0
      const debunked = useNewsStore.getState().tickFakeNews(luckyMod)
      for (const news of debunked) {
        const asset = market.getAsset(news.assetId)
        if (asset) {
          const reverseImpact = news.priceDirection === 'up'
            ? -news.priceMagnitude
            : news.priceMagnitude
          asset.currentPrice *= (1 + reverseImpact * 0.5)
        }
        sentiment.applyShock(-news.sentimentMagnitude * 0.5)

        useNewsStore.getState().addEntry({
          id: `debunk_${Date.now()}_${news.id}`,
          title: '🔍 假新闻被揭穿',
          description: `之前关于${news.assetId}的假新闻被证实为虚假信息，市场回调`,
          type: 'debunked',
        })

        SFX.debunked()
        eventBus.emit('news:debunked', { id: news.id })
      }

      syncCountryData(country)
    })

    // L5 (60s): 地缘事件
    loop.onLayer(5 as TickLayer, () => {
      const geoEvent = country.tick(market, sentiment)
      if (geoEvent) {
        if (geoEvent.targetAsset) {
          const asset = market.getAsset(geoEvent.targetAsset)
          if (asset && geoEvent.volatilityMultiplier) {
            const shock = (Math.random() - 0.5) * 0.02 * geoEvent.volatilityMultiplier
            asset.currentPrice *= (1 + shock)
          }
        }
        // 地缘事件影响对应国家情绪
        if (geoEvent.targetCountry) {
          sentiment.applyCountryShock(geoEvent.targetCountry, geoEvent.sentimentImpact * 0.5)
        }
        sentiment.applyShock(geoEvent.sentimentImpact)

        country.recordManipulation(0)

        useNewsStore.getState().addEntry({
          id: geoEvent.id,
          title: geoEvent.title,
          description: geoEvent.description,
          type: 'event',
        })

        if (geoEvent.type === 'war_start') {
          SFX.warStart()
          eventBus.emit('war:started', { participants: [geoEvent.targetAsset ?? 'unknown'] })
        } else if (geoEvent.type === 'war_end') {
          eventBus.emit('war:ended', { winner: geoEvent.targetAsset ?? 'unknown', loser: 'unknown' })
        } else if (geoEvent.type === 'arrest_risk') {
          eventBus.emit('player:arrested', { country: '监管机构' })
        }
      }

      syncCountryData(country)
    })

    // ─── EventBus → Store 桥接 ─────────────────────────────

    eventBus.on('price:updated', (data) => {
      useMarketStore.getState().updatePrice(data.assetId, data.price)
    })

    eventBus.on('sentiment:changed', (data: { global: number; countries?: Record<string, number>; assets?: Record<string, number> }) => {
      if (data.countries && data.assets) {
        useSentimentStore.getState().setLayer({ global: data.global, countries: data.countries, assets: data.assets })
      } else {
        useSentimentStore.getState().setGlobal(data.global)
      }
    })

    eventBus.on('market:halt', () => {
      SFX.circuitBreaker()
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
        title: '📢 KOL 喊单',
        description: data.content,
        type: 'kol_post',
      })
    })

    const interval = setInterval(() => {
      if (loop.isRunning() && loop.getSpeed() > 0) {
        useGameStore.getState().setElapsed(loop.getElapsed())
      }
    }, 100)

    const unsubSpeed = useGameStore.subscribe((state) => {
      if (loop.getSpeed() !== state.speed) {
        loop.setSpeed(state.speed)
      }
    })

    loop.start()
    loopRef.current = loop

    return () => {
      unsubSpeed()
      loop.stop()
      clearInterval(interval)
      eventBus.removeAll()
      engineRef.loop = null
      engineRef.market = null
      engineRef.sentiment = null
      engineRef.ai = null
      engineRef.kol = null
      engineRef.trait = null
      engineRef.country = null
      engineRef.rugpull = null
      engineRef.correlation = null
    }
  }, [])

  return {}
}
