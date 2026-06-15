import { useMemo } from 'react'
import { useMarketStore } from '@/stores/marketStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { formatPrice, formatPercent } from '@/utils/format'
import { getEngineRefs } from '@/hooks/useGameLoop'
import { ALL_ASSETS } from '@/data/assets'
import { INITIAL_COUNTRIES } from '@/data/countries'

const EMPTY_CANDLES: never[] = []

export default function PriceDisplay() {
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)
  const price = useMarketStore((s) => s.prices[selectedAsset]) ?? 1
  const prev = useMarketStore((s) => s.prevPrices[selectedAsset]) ?? price
  const sentiment = useSentimentStore((s) => s.global)
  const assetSentiment = useSentimentStore((s) => s.assets[selectedAsset]) ?? 50
  const asset = ALL_ASSETS.find((a) => a.id === selectedAsset)
  const precision = (asset?.basePrice ?? 1) >= 100 ? 2 : 4
  const candles = useMarketStore((s) => s.candles[selectedAsset]) ?? EMPTY_CANDLES

  const change = prev !== 0 && prev !== price ? (price - prev) / prev : 0
  const isUp = change >= 0

  // 所属国家/板块信息
  const country = asset?.countryId ? INITIAL_COUNTRIES.find(c => c.id === asset.countryId) : null
  const sector = asset?.sector

  const stats = useMemo(() => {
    if (candles.length === 0) {
      return { open: price, high: price, low: price, change: 0, amplitude: '0.00%' }
    }
    const openPrice = candles[0].open
    let high = -Infinity, low = Infinity
    for (let i = 0; i < candles.length; i++) {
      if (candles[i].high > high) high = candles[i].high
      if (candles[i].low < low) low = candles[i].low
    }
    const sessionChange = openPrice !== 0 ? (price - openPrice) / openPrice : 0
    const amplitude = openPrice > 0 ? ((high - low) / openPrice * 100).toFixed(2) + '%' : '0.00%'
    return { open: openPrice, high, low, change: sessionChange, amplitude }
  }, [candles, price])

  const sentimentLabel = assetSentiment >= 70 ? '贪婪' : assetSentiment <= 30 ? '恐慌' : '中性'
  const sentimentColor = assetSentiment >= 60 ? 'text-up' : assetSentiment <= 40 ? 'text-down' : 'text-warn'

  const pressure = getEngineRefs().market?.getFlowPressure(selectedAsset) ?? 0.5
  const isHalted = getEngineRefs().market?.isHalted(selectedAsset) ?? false

  if (isHalted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-warn text-2xl font-display font-bold animate-pulse">⚠️ 熔断暂停</p>
          <p className="text-text-muted text-sm mt-1">{selectedAsset} 交易暂停中</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center gap-8 px-4">
      {/* Main price */}
      <div className="text-center">
        <p className="text-text-secondary text-xs mb-0.5">
          {asset?.name ?? selectedAsset} · {selectedAsset}
          {country && <span className="text-info ml-1">{country.name}</span>}
          {sector && <span className="text-text-muted ml-1">({sector})</span>}
        </p>
        <p className={`text-4xl font-display font-bold ${isUp ? 'text-up' : 'text-down'}`}>
          {formatPrice(price, precision)}
        </p>
        <p className={`text-sm mt-0.5 ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '▲' : '▼'} {formatPercent(change)}
        </p>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div>
          <span className="text-text-muted">开盘</span>
          <span className="text-text-primary ml-2 font-mono">{formatPrice(stats.open, precision)}</span>
        </div>
        <div>
          <span className="text-text-muted">涨跌</span>
          <span className={`ml-2 font-mono ${stats.change >= 0 ? 'text-up' : 'text-down'}`}>
            {formatPercent(stats.change)}
          </span>
        </div>
        <div>
          <span className="text-text-muted">最高</span>
          <span className="text-up ml-2 font-mono">{formatPrice(stats.high, precision)}</span>
        </div>
        <div>
          <span className="text-text-muted">最低</span>
          <span className="text-down ml-2 font-mono">{formatPrice(stats.low, precision)}</span>
        </div>
        <div>
          <span className="text-text-muted">振幅</span>
          <span className="text-text-secondary ml-2 font-mono">{stats.amplitude}</span>
        </div>
        <div>
          <span className="text-text-muted">情绪</span>
          <span className={`${sentimentColor} ml-2 font-mono`}>{assetSentiment.toFixed(0)} {sentimentLabel}</span>
        </div>
        <div>
          <span className="text-text-muted">买卖比</span>
          <span className="ml-2 inline-flex items-center gap-1">
            <span className="w-16 h-1.5 bg-bg-primary rounded-full overflow-hidden inline-block">
              <span
                className={`h-full rounded-full transition-all duration-500 ${pressure > 0.55 ? 'bg-up' : pressure < 0.45 ? 'bg-down' : 'bg-warn'}`}
                style={{ width: `${pressure * 100}%` }}
              />
            </span>
            <span className={`font-mono text-[10px] ${pressure > 0.55 ? 'text-up' : pressure < 0.45 ? 'text-down' : 'text-text-muted'}`}>
              {(pressure * 100).toFixed(0)}%
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
