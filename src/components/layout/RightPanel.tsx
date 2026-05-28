import { useState } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { formatPrice, formatMoney } from '@/utils/format'

type TradeSide = 'buy' | 'sell'

export default function RightPanel() {
  const [side, setSide] = useState<TradeSide>('buy')
  const [quantity, setQuantity] = useState('100')
  const cash = usePlayerStore((s) => s.cash)
  const positions = usePlayerStore((s) => s.positions)
  const buy = usePlayerStore((s) => s.buy)
  const sell = usePlayerStore((s) => s.sell)
  const kalPrice = useMarketStore((s) => s.prices['KAL'] ?? 1)

  const qty = parseFloat(quantity) || 0
  const cost = qty * kalPrice
  const kalPosition = positions['KAL']
  const canBuy = side === 'buy' && qty > 0 && cost <= cash
  const canSell = side === 'sell' && qty > 0 && kalPosition && kalPosition.amount >= qty

  const handleTrade = () => {
    if (qty <= 0) return
    if (side === 'buy') {
      buy('KAL', kalPrice, qty)
    } else {
      sell('KAL', kalPrice, qty)
    }
  }

  const pnl = kalPosition
    ? (kalPrice - kalPosition.avgCost) * kalPosition.amount
    : 0

  return (
    <div className="w-[300px] bg-bg-panel border-l border-border-panel p-3 flex flex-col gap-3 text-sm">
      {/* Wallet */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">钱包</h3>
        <div className="bg-bg-primary rounded p-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted">现金</span>
            <span className="text-text-primary">{formatMoney(cash)}</span>
          </div>
          {kalPosition && (
            <div className="flex justify-between">
              <span className="text-text-muted">KAL 持仓</span>
              <span className="text-text-primary">
                {kalPosition.amount.toFixed(2)}
                <span className={`ml-2 text-xs ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trade Panel */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">交易 KAL</h3>

        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-1 rounded text-xs font-bold ${
              side === 'buy'
                ? 'bg-up/20 text-up border border-up/40'
                : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover'
            }`}
          >
            买入
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-1 rounded text-xs font-bold ${
              side === 'sell'
                ? 'bg-down/20 text-down border border-down/40'
                : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover'
            }`}
          >
            卖出
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-text-muted text-xs">当前价格</label>
            <div className="text-text-primary font-mono">{formatPrice(kalPrice)}</div>
          </div>

          <div>
            <label className="text-text-muted text-xs">数量</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="10"
              className="w-full bg-bg-primary border border-border-panel rounded px-2 py-1 text-text-primary font-mono text-sm focus:outline-none focus:border-border-highlight"
            />
          </div>

          <div className="flex justify-between text-xs text-text-muted">
            <span>预估花费</span>
            <span className="text-text-primary">{formatMoney(cost)}</span>
          </div>

          <button
            onClick={handleTrade}
            disabled={side === 'buy' ? !canBuy : !canSell}
            className={`w-full py-2 rounded font-bold text-sm transition-colors ${
              side === 'buy'
                ? canBuy
                  ? 'bg-up/20 text-up border border-up/40 hover:bg-up/30'
                  : 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'
                : canSell
                  ? 'bg-down/20 text-down border border-down/40 hover:bg-down/30'
                  : 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'
            }`}
          >
            {side === 'buy' ? '买入 KAL' : '卖出 KAL'}
          </button>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1">
        {[10, 100, 1000, 10000].map((amt) => (
          <button
            key={amt}
            onClick={() => setQuantity(String(amt))}
            className="flex-1 bg-bg-primary border border-border-panel rounded py-0.5 text-xs text-text-secondary hover:bg-bg-panel-hover"
          >
            {amt >= 1000 ? `${amt / 1000}K` : amt}
          </button>
        ))}
      </div>
    </div>
  )
}
