import { useMarketStore } from '@/stores/marketStore'
import { formatPercent } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'

export default function BottomBar() {
  const prices = useMarketStore((s) => s.prices)
  const prevPrices = useMarketStore((s) => s.prevPrices)

  return (
    <div className="h-[100px] flex border-t border-border-panel bg-bg-panel">
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
      <div className="flex-1 p-2 border-r border-border-panel">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">市场状态</h4>
        <p className="text-text-muted text-xs mt-1">AI 交易者活跃中</p>
        <p className="text-text-muted text-xs">事件系统就绪</p>
      </div>
      <div className="flex-1 p-2">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">系统</h4>
        <p className="text-text-muted text-xs mt-1">引擎运行中</p>
        <p className="text-up text-xs">● 正常</p>
      </div>
    </div>
  )
}
