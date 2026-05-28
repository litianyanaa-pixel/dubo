import { useState } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { formatPrice, formatMoney } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'

type TradeAction = 'openLong' | 'closeLong' | 'openShort' | 'closeShort'

const ACTIONS: { key: TradeAction; label: string; color: string }[] = [
  { key: 'openLong', label: '开多', color: 'up' },
  { key: 'closeLong', label: '平多', color: 'text-secondary' },
  { key: 'openShort', label: '开空', color: 'down' },
  { key: 'closeShort', label: '平空', color: 'text-secondary' },
]

export default function RightPanel() {
  const [action, setAction] = useState<TradeAction>('openLong')
  const [quantity, setQuantity] = useState('100')
  const cash = usePlayerStore((s) => s.cash)
  const positions = usePlayerStore((s) => s.positions)
  const shorts = usePlayerStore((s) => s.shorts)
  const prices = useMarketStore((s) => s.prices)
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)
  const asset = ALL_ASSETS.find((a) => a.id === selectedAsset)
  const assetPrice = prices[selectedAsset] ?? asset?.basePrice ?? 1

  const qty = parseFloat(quantity) || 0
  const precision = (asset?.basePrice ?? 1) >= 100 ? 2 : 4

  const longPos = positions[selectedAsset]
  const shortPos = shorts[selectedAsset]

  // Estimate cost/revenue for display
  const estimatedCost = action === 'openLong'
    ? qty * assetPrice
    : action === 'openShort'
      ? qty * assetPrice // full margin
      : action === 'closeLong'
        ? qty * assetPrice // revenue received
        : qty * assetPrice // cost to cover

  const canExecute = (() => {
    if (qty <= 0) return false
    switch (action) {
      case 'openLong': return estimatedCost <= cash
      case 'closeLong': return !!longPos && longPos.amount >= qty
      case 'openShort': return estimatedCost <= cash
      case 'closeShort': return !!shortPos && shortPos.amount >= qty
    }
  })()

  const handleTrade = () => {
    if (!canExecute) return
    const store = usePlayerStore.getState()
    switch (action) {
      case 'openLong': store.openLong(selectedAsset, assetPrice, qty); break
      case 'closeLong': store.closeLong(selectedAsset, assetPrice, qty); break
      case 'openShort': store.openShort(selectedAsset, assetPrice, qty); break
      case 'closeShort': store.closeShort(selectedAsset, assetPrice, qty); break
    }
  }

  // Short P&L: profit when price drops below entry
  const shortPnl = shortPos
    ? (shortPos.avgEntry - assetPrice) * shortPos.amount
    : 0

  return (
    <div className="w-[300px] bg-bg-panel border-l border-border-panel p-3 flex flex-col gap-3 text-sm">
      {/* Wallet summary */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">持仓</h3>
        <div className="bg-bg-primary rounded p-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted">现金</span>
            <span className="text-gold">{formatMoney(cash)}</span>
          </div>
          {longPos && (
            <div className="flex justify-between">
              <span className="text-up">多 {selectedAsset}</span>
              <span className="text-text-primary">
                {longPos.amount.toFixed(2)}
                <span className={`ml-2 text-xs ${(assetPrice - longPos.avgCost) >= 0 ? 'text-up' : 'text-down'}`}>
                  {(assetPrice - longPos.avgCost) >= 0 ? '+' : ''}{formatMoney((assetPrice - longPos.avgCost) * longPos.amount)}
                </span>
              </span>
            </div>
          )}
          {shortPos && (
            <div className="flex justify-between">
              <span className="text-down">空 {selectedAsset}</span>
              <span className="text-text-primary">
                {shortPos.amount.toFixed(2)}
                <span className={`ml-2 text-xs ${shortPnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {shortPnl >= 0 ? '+' : ''}{formatMoney(shortPnl)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trade panel */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">
          交易 {asset?.name ?? selectedAsset}
        </h3>

        {/* 4 action buttons in 2x2 grid */}
        <div className="grid grid-cols-2 gap-1 mb-2">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAction(a.key)}
              className={`py-1.5 rounded text-xs font-bold border ${
                action === a.key
                  ? a.color === 'up'
                    ? 'bg-up/20 text-up border-up/40'
                    : a.color === 'down'
                      ? 'bg-down/20 text-down border-down/40'
                      : 'bg-text-secondary/20 text-text-primary border-text-secondary/30'
                  : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover border-border-panel'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-text-muted text-xs">当前价格</label>
            <div className="text-text-primary font-mono">{formatPrice(assetPrice, precision)}</div>
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
            <span>
              {action === 'openLong' ? '花费' : action === 'closeLong' ? '收入' : action === 'openShort' ? '保证金' : '花费'}
            </span>
            <span className="text-text-primary">{formatMoney(estimatedCost)}</span>
          </div>

          <button
            onClick={handleTrade}
            disabled={!canExecute}
            className={`w-full py-2 rounded font-bold text-sm transition-colors ${
              !canExecute
                ? 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'
                : action === 'openLong'
                  ? 'bg-up/20 text-up border border-up/40 hover:bg-up/30'
                  : action === 'closeLong'
                    ? 'bg-text-secondary/10 text-text-primary border border-text-secondary/20 hover:bg-text-secondary/20'
                    : action === 'openShort'
                      ? 'bg-down/20 text-down border border-down/40 hover:bg-down/30'
                      : 'bg-text-secondary/10 text-text-primary border border-text-secondary/20 hover:bg-text-secondary/20'
            }`}
          >
            {ACTIONS.find((a) => a.key === action)?.label} {selectedAsset}
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
