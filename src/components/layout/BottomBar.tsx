import { useMarketStore } from '@/stores/marketStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useCountryStore } from '@/stores/countryStore'
import { formatPercent, formatMoney, formatPrice } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'
import { INITIAL_COUNTRIES } from '@/data/countries'

export default function BottomBar() {
  const prices = useMarketStore((s) => s.prices)
  const prevPrices = useMarketStore((s) => s.prevPrices)
  const cash = usePlayerStore((s) => s.cash)
  const positions = usePlayerStore((s) => s.positions)
  const shorts = usePlayerStore((s) => s.shorts)
  const countryData = useCountryStore((s) => s.countries)
  const wars = useCountryStore((s) => s.activeWars)

  const heldAssets = new Set([...Object.keys(positions), ...Object.keys(shorts)])

  // 货币概览（每国一行）
  const currencyAssets = ALL_ASSETS.filter(a => a.type === 'currency')

  return (
    <div className="h-[80px] flex border-t border-border-panel bg-bg-panel">
      {/* 货币概览 */}
      <div className="flex-1 p-2 overflow-y-auto">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-1">
          🌍 全球货币 {wars.length > 0 && <span className="text-down ml-2">⚠ {wars.length}场战争</span>}
        </h4>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {currencyAssets.map((asset) => {
            const price = prices[asset.id] ?? asset.basePrice
            const prev = prevPrices[asset.id] ?? asset.basePrice
            const change = prev !== 0 ? (price - prev) / prev : 0
            const country = INITIAL_COUNTRIES.find(c => c.currencyId === asset.id)
            return (
              <span key={asset.id} className={`text-xs ${change >= 0 ? 'text-up' : 'text-down'}`}>
                {asset.id}({country?.name?.slice(0, 2) ?? ''}) {change >= 0 ? '▲' : '▼'} {formatPercent(change)}
              </span>
            )
          })}
        </div>
      </div>

      {/* 持仓 */}
      <div className="w-[320px] p-2 border-l border-border-panel overflow-y-auto">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-1">持仓</h4>
        {heldAssets.size === 0 ? (
          <p className="text-text-muted text-xs">空仓</p>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {ALL_ASSETS.filter((a) => heldAssets.has(a.id)).map((asset) => {
              const price = prices[asset.id] ?? 0
              const longPos = positions[asset.id]
              const shortPos = shorts[asset.id]
              return (
                <span key={asset.id} className="text-xs">
                  <span className="text-text-muted">{asset.id}</span>
                  {longPos && (
                    <span className="text-up ml-0.5">
                      多{longPos.amount.toFixed(0)}
                      <span className={`ml-0.5 ${(price - longPos.avgCost) >= 0 ? 'text-up' : 'text-down'}`}>
                        {(price - longPos.avgCost) >= 0 ? '+' : ''}{formatMoney((price - longPos.avgCost) * longPos.amount)}
                      </span>
                    </span>
                  )}
                  {shortPos && (
                    <span className="text-down ml-0.5">
                      空{shortPos.amount.toFixed(0)}
                      <span className={`${(shortPos.avgEntry - price) >= 0 ? 'text-up' : 'text-down'} ml-0.5`}>
                        {(shortPos.avgEntry - price) >= 0 ? '+' : ''}{formatMoney((shortPos.avgEntry - price) * shortPos.amount)}
                      </span>
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* 系统状态 */}
      <div className="w-[120px] p-2 border-l border-border-panel">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">系统</h4>
        <p className="text-up text-xs mt-1">● 运行中</p>
        <p className="text-gold text-xs font-mono">{formatMoney(cash)}</p>
      </div>
    </div>
  )
}
