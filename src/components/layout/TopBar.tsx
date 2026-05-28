import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { formatPrice, formatPercent, formatTime } from '@/utils/format'
import type { SpeedMultiplier } from '@/engine/core/types'

export default function TopBar() {
  const speed = useGameStore((s) => s.speed)
  const elapsed = useGameStore((s) => s.elapsed)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const kalPrice = useMarketStore((s) => s.prices['KAL'] ?? 1)
  const kalPrev = useMarketStore((s) => s.prevPrices['KAL'] ?? 1)
  const change = kalPrev !== 0 ? (kalPrice - kalPrev) / kalPrev : 0

  return (
    <div className="h-10 flex items-center gap-4 px-4 bg-bg-panel border-b border-border-panel text-sm">
      <span className="font-display text-up text-base">运筹帷幄</span>

      <div className="w-px h-5 bg-border-panel" />

      <span className={change >= 0 ? 'text-up' : 'text-down'}>
        KAL {formatPrice(kalPrice)}
        <span className="ml-1 text-xs">{formatPercent(change)}</span>
      </span>

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

      <div className="flex-1" />

      <span className="text-text-muted text-xs">Phase 1 骨架</span>
    </div>
  )
}
