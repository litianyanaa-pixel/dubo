import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { formatPrice, formatPercent, formatMoney, formatTime } from '@/utils/format'
import { ALL_ASSETS, ASSET_CATEGORIES } from '@/data/assets'
import type { SpeedMultiplier } from '@/engine/core/types'
import { useState } from 'react'
import type { AssetType } from '@/engine/market/types'

const CATEGORY_ORDER: { key: string; label: string; icon: string }[] = [
  { key: 'currency', label: '货币', icon: '💱' },
  { key: 'stock', label: '股票', icon: '📈' },
  { key: 'commodity', label: '商品', icon: '🛢' },
  { key: 'crypto', label: '虚拟币', icon: '🪙' },
  { key: 'safehaven', label: '避险', icon: '🛡' },
]

export default function TopBar() {
  const speed = useGameStore((s) => s.speed)
  const elapsed = useGameStore((s) => s.elapsed)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const character = useGameStore((s) => s.character)
  const startCash = useGameStore((s) => s.startCash)
  const mode = useGameStore((s) => s.mode)
  const prices = useMarketStore((s) => s.prices)
  const prevPrices = useMarketStore((s) => s.prevPrices)
  const sentiment = useSentimentStore((s) => s.global)
  const cash = usePlayerStore((s) => s.cash)
  const positions = usePlayerStore((s) => s.positions)
  const shorts = usePlayerStore((s) => s.shorts)
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)
  const setSelectedAsset = useSelectionStore((s) => s.setSelectedAsset)

  const [activeCategory, setActiveCategory] = useState<string>('currency')

  const longValue = Object.entries(positions).reduce((sum, [id, pos]) => {
    return sum + pos.amount * (prices[id] ?? 0)
  }, 0)
  const shortPnl = Object.entries(shorts).reduce((sum, [id, pos]) => {
    const price = prices[id] ?? pos.avgEntry
    return sum + pos.amount * pos.avgEntry + (pos.avgEntry - price) * pos.amount
  }, 0)
  const totalValue = cash + longValue + shortPnl
  const totalPnl = totalValue - startCash
  const pnlPct = startCash > 0 ? totalPnl / startCash : 0

  const gameDay = Math.floor(elapsed / 60000) + 1
  const sentimentColor = sentiment >= 60 ? 'bg-up' : sentiment <= 40 ? 'bg-down' : 'bg-warn'

  // 按当前分类过滤资产
  const filteredAssets = ALL_ASSETS.filter((a) => a.type === activeCategory)

  return (
    <div className="h-10 flex items-center gap-2 px-3 bg-bg-panel border-b border-border-panel text-sm overflow-hidden">
      {/* Character */}
      <span className="font-display text-up text-base shrink-0">
        {character?.icon} {character?.name ?? '???'}
      </span>

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Net worth */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-text-muted text-xs">净值</span>
        <span className="text-gold font-mono text-xs">{formatMoney(totalValue)}</span>
        <span className={`text-xs font-mono ${totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
          {totalPnl >= 0 ? '+' : ''}{formatMoney(totalPnl)} ({formatPercent(pnlPct)})
        </span>
      </div>

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Day + mode */}
      <span className="text-text-secondary text-xs shrink-0">Day {gameDay}</span>
      {mode === 'flash' && (
        <span className={`text-xs font-mono ${300000 - elapsed < 60000 ? 'text-down animate-pulse' : 'text-warn'}`}>
          ⚡ {formatTime(Math.max(0, 300000 - elapsed))}
        </span>
      )}
      {mode === 'sandbox' && <span className="text-gold text-xs shrink-0">🏖 沙盒</span>}

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Asset category tabs + asset list */}
      <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
        {/* Category selector */}
        <div className="flex gap-0.5 shrink-0">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'bg-info/15 text-info border border-info/30'
                  : 'text-text-muted hover:bg-bg-panel-hover border border-transparent'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border-panel shrink-0" />

        {/* Asset list for active category */}
        <div className="flex gap-0.5 overflow-x-auto min-w-0">
          {filteredAssets.map((asset) => {
            const price = prices[asset.id] ?? asset.basePrice
            const prev = prevPrices[asset.id] ?? asset.basePrice
            const change = prev !== 0 ? (price - prev) / prev : 0
            const isSelected = selectedAsset === asset.id
            return (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap shrink-0 ${
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
      </div>

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Speed */}
      <div className="flex gap-0.5 shrink-0">
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

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Sentiment */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-text-muted text-xs">情绪</span>
        <div className="w-16 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${sentimentColor}`}
            style={{ width: `${sentiment}%` }}
          />
        </div>
        <span className="text-text-secondary text-xs w-6 text-right">{sentiment.toFixed(0)}</span>
      </div>

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Cash */}
      <span className="text-gold text-xs font-mono shrink-0">{formatMoney(cash)}</span>

      <div className="w-px h-5 bg-border-panel shrink-0" />

      {/* Actions */}
      <button
        onClick={() => useGameStore.getState().setPhase('gameover')}
        className="px-2 py-0.5 rounded text-xs bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 shrink-0"
      >
        结算
      </button>
      <button
        onClick={() => useGameStore.setState({ showHelp: true })}
        className="px-2 py-0.5 rounded text-xs bg-info/10 text-info border border-info/20 hover:bg-info/20 shrink-0"
      >
        ?
      </button>
    </div>
  )
}
