import { useMarketStore } from '@/stores/marketStore'
import { useKOLStore } from '@/stores/kolStore'
import { usePlayerStore } from '@/stores/playerStore'
import { formatPercent, formatMoney } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'

export default function BottomBar() {
  const prices = useMarketStore((s) => s.prices)
  const prevPrices = useMarketStore((s) => s.prevPrices)
  const kols = useKOLStore((s) => s.kols)
  const updateKOL = useKOLStore((s) => s.updateKOL)
  const cash = usePlayerStore((s) => s.cash)

  const handleHire = (kol: typeof kols[0]) => {
    if (cash < kol.hireCost || kol.hired) return
    usePlayerStore.getState().buy('COST', kol.hireCost, 1)
    updateKOL(kol.id, { hired: true })
  }

  return (
    <div className="h-[100px] flex border-t border-border-panel bg-bg-panel">
      {/* Asset overview */}
      <div className="flex-1 p-2 border-r border-border-panel overflow-y-auto">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-1">资产概览</h4>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {ALL_ASSETS.map((asset) => {
            const price = prices[asset.id] ?? asset.basePrice
            const prev = prevPrices[asset.id] ?? asset.basePrice
            const change = prev !== 0 ? (price - prev) / prev : 0
            return (
              <span key={asset.id} className={`text-xs ${change >= 0 ? 'text-up' : 'text-down'}`}>
                {asset.id} {change >= 0 ? '▲' : '▼'} {formatPercent(change)}
              </span>
            )
          })}
        </div>
      </div>

      {/* KOL hire panel */}
      <div className="w-[320px] p-2 border-r border-border-panel overflow-y-auto">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-1">KOL 雇佣</h4>
        <div className="flex gap-1.5">
          {kols.map((kol) => (
            <button
              key={kol.id}
              onClick={() => handleHire(kol)}
              disabled={kol.hired || cash < kol.hireCost}
              className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${
                kol.hired
                  ? 'bg-up/10 border border-up/20 text-up'
                  : cash >= kol.hireCost
                    ? 'bg-bg-primary border border-border-panel text-text-secondary hover:border-warn/30'
                    : 'bg-bg-primary border border-border-panel text-text-muted cursor-not-allowed'
              }`}
            >
              {kol.hired ? '✓ ' : ''}{kol.name}
              {!kol.hired && <span className="text-gold ml-1">{formatMoney(kol.hireCost)}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="w-[140px] p-2">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">系统</h4>
        <p className="text-up text-xs mt-1">● 运行中</p>
        <p className="text-text-muted text-xs">AI 活跃 | 事件就绪</p>
        <p className="text-text-muted text-xs">
          KOL: {kols.filter((k) => k.hired).length}/{kols.length}
        </p>
      </div>
    </div>
  )
}
