import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { formatPrice, formatPercent, formatTime, formatMoney } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'
import type { SpeedMultiplier } from '@/engine/core/types'

export default function TopBar() {
  const speed = useGameStore((s) => s.speed)
  const elapsed = useGameStore((s) => s.elapsed)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const prices = useMarketStore((s) => s.prices)
  const prevPrices = useMarketStore((s) => s.prevPrices)
  const sentiment = useSentimentStore((s) => s.global)
  const cash = usePlayerStore((s) => s.cash)
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)
  const setSelectedAsset = useSelectionStore((s) => s.setSelectedAsset)

  const sentimentColor = sentiment >= 60 ? 'bg-up' : sentiment <= 40 ? 'bg-down' : 'bg-warn'

  return (
    <div className="h-10 flex items-center gap-3 px-4 bg-bg-panel border-b border-border-panel text-sm">
      <span className="font-display text-up text-base">运筹帷幄</span>

      <div className="w-px h-5 bg-border-panel" />

      {/* Asset tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {ALL_ASSETS.map((asset) => {
          const price = prices[asset.id] ?? asset.basePrice
          const prev = prevPrices[asset.id] ?? asset.basePrice
          const change = prev !== 0 ? (price - prev) / prev : 0
          const isSelected = selectedAsset === asset.id
          return (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset.id)}
              className={`px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap ${
                isSelected
                  ? 'bg-up/15 border border-up/30'
                  : 'hover:bg-bg-panel-hover border border-transparent'
              }`}
            >
              <span className="text-text-muted mr-1">{asset.id}</span>
              <span className={change >= 0 ? 'text-up' : 'text-down'}>
                {formatPrice(price, asset.basePrice >= 100 ? 2 : 4)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="w-px h-5 bg-border-panel" />

      <div className="flex gap-1">
        {([0, 1, 2, 3] as SpeedMultiplier[]).map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs ${
              speed === s
                ? 'bg-up/20 text-up border border-up/40'
                : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover'
            }`}
          >
            {s === 0 ? '⏸' : `${s}x`}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border-panel" />

      <span className="text-text-secondary font-mono">{formatTime(elapsed)}</span>

      <div className="w-px h-5 bg-border-panel" />

      <div className="flex items-center gap-2">
        <span className="text-text-muted text-xs">情绪</span>
        <div className="w-20 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${sentimentColor}`}
            style={{ width: `${sentiment}%` }}
          />
        </div>
        <span className="text-text-secondary text-xs w-6 text-right">{sentiment.toFixed(0)}</span>
      </div>

      <div className="flex-1" />

      <span className="text-gold text-xs font-mono">{formatMoney(cash)}</span>
    </div>
  )
}
