import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useGameStore } from '@/stores/gameStore'
import { useNewsStore } from '@/stores/newsStore'
import { useKOLStore } from '@/stores/kolStore'
import { formatPrice, formatMoney } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'
import { getEngineRefs, commandKOL, runPrediction, getPrediction, canPredict, getCredibility, canManipulate } from '@/hooks/useGameLoop'
import type { KOLDirection } from '@/engine/kol/KOLEngine'
import type { Prediction } from '@/engine/player/TraitEngine'
import { SFX } from '@/utils/sound'

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
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
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
    let success = false
    const side = (action === 'openLong' || action === 'closeLong') ? 'buy' : 'sell'
    switch (action) {
      case 'openLong': success = store.openLong(selectedAsset, assetPrice, qty); break
      case 'closeLong': success = store.closeLong(selectedAsset, assetPrice, qty); break
      case 'openShort': success = store.openShort(selectedAsset, assetPrice, qty); break
      case 'closeShort': success = store.closeShort(selectedAsset, assetPrice, qty); break
    }
    if (success) {
      setFlash(side === 'buy' ? 'up' : 'down')
      SFX.tradeSuccess()
      setTimeout(() => setFlash(null), 400)

      // Player trade impacts market
      const flowSide = (action === 'openLong' || action === 'closeShort') ? 'buy' : 'sell'
      getEngineRefs().market?.addTradeFlow(selectedAsset, flowSide, estimatedCost)

      const lots = Math.round(qty)
      useNewsStore.getState().addEntry({
        id: `player_${Date.now()}`,
        title: '你',
        description: `${selectedAsset} ${side === 'buy' ? '多' : '空'}${lots}手`,
        type: 'player_trade',
        side: side as 'buy' | 'sell',
        assetId: selectedAsset,
        lots,
      })
    }
  }

  // Short P&L: profit when price drops below entry
  const shortPnl = shortPos
    ? (shortPos.avgEntry - assetPrice) * shortPos.amount
    : 0

  return (
    <div className="w-[300px] bg-bg-panel border-l border-border-panel p-3 flex flex-col gap-3 text-sm overflow-y-auto">
      {/* Wallet summary */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">持仓</h3>
        <div className={`bg-bg-primary rounded p-2 space-y-1 transition-colors duration-300 ${
          flash === 'up' ? 'ring-1 ring-up/50 bg-up/5' : flash === 'down' ? 'ring-1 ring-down/50 bg-down/5' : ''
        }`}>
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

      {/* Quick position sizing */}
      <div className="flex gap-1">
        {(() => {
          const maxQty = action === 'openLong' || action === 'openShort'
            ? Math.floor(cash / assetPrice)
            : action === 'closeLong' && longPos
              ? Math.floor(longPos.amount)
              : action === 'closeShort' && shortPos
                ? Math.floor(shortPos.amount)
                : 0
          const sizes = [
            { label: '1/4', qty: Math.floor(maxQty * 0.25) },
            { label: '1/2', qty: Math.floor(maxQty * 0.5) },
            { label: '3/4', qty: Math.floor(maxQty * 0.75) },
            { label: '全仓', qty: maxQty },
          ]
          return sizes.map((s) => (
            <button
              key={s.label}
              onClick={() => s.qty > 0 && setQuantity(String(s.qty))}
              className={`flex-1 bg-bg-primary border border-border-panel rounded py-0.5 text-xs ${
                s.qty > 0 ? 'text-text-secondary hover:bg-bg-panel-hover' : 'text-text-muted cursor-not-allowed'
              }`}
            >
              {s.label}
            </button>
          ))
        })()}
      </div>

      {/* KOL Control */}
      <KOLPanel />

      {/* Character skill */}
      <CharacterSkill />
    </div>
  )
}

function CharacterSkill() {
  const character = useGameStore((s) => s.character)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)

  if (!character) return null

  const handlePredict = () => {
    const result = runPrediction(selectedAsset)
    setPrediction(result)
  }

  return (
    <div className="mt-auto">
      <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-1">角色天赋</h3>
      <div className="bg-bg-primary rounded p-2 border border-border-panel">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{character.icon}</span>
          <span className="text-text-primary text-xs font-bold">{character.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            character.riskLabel === '稳健' ? 'bg-up/10 text-up'
            : character.riskLabel === '高风险' ? 'bg-danger/10 text-danger'
            : character.riskLabel === '技术流' ? 'bg-info/10 text-info'
            : character.riskLabel === '阴暗' ? 'bg-darknet/10 text-darknet'
            : character.riskLabel === '巨鲸' ? 'bg-gold/10 text-gold'
            : 'bg-warn/10 text-warn'
          }`}>{character.riskLabel}</span>
        </div>
        <p className="text-crypto text-xs">{character.trait}</p>

        {/* 白鸽: 公信力条 */}
        {character.id === 'dove' && (() => {
          const cred = getCredibility()
          if (cred === null) return null
          return (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-text-muted">公信力</span>
                <span className={cred > 30 ? 'text-up' : 'text-warn'}>{cred}/100</span>
              </div>
              <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cred > 30 ? 'bg-up' : 'bg-warn'}`}
                  style={{ width: `${cred}%` }}
                />
              </div>
            </div>
          )
        })()}

        {/* 先知·林: Prediction button */}
        {character.id === 'lin' && (
          <div className="mt-2">
            <button
              onClick={handlePredict}
              disabled={!canPredict()}
              className={`w-full py-1.5 rounded text-xs font-bold border transition-colors ${
                canPredict()
                  ? 'bg-info/15 text-info border-info/30 hover:bg-info/25'
                  : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
              }`}
            >
              🔮 AI 预测 {selectedAsset}
            </button>
            {prediction && prediction.assetId === selectedAsset && (
              <div className={`mt-1.5 rounded p-1.5 text-xs border ${
                prediction.direction === 'up' ? 'bg-up/5 border-up/20' : 'bg-down/5 border-down/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={prediction.direction === 'up' ? 'text-up' : 'text-down'}>
                    {prediction.direction === 'up' ? '▲ 看涨' : '▼ 看跌'}
                  </span>
                  <span className="text-text-muted">
                    置信度 {(prediction.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-text-secondary mt-0.5 font-mono text-[10px]">
                  目标: {prediction.targetPrice.toFixed(prediction.currentPrice >= 100 ? 2 : 4)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const DIRECTIONS: { key: KOLDirection; label: string; color: string }[] = [
  { key: 'bullish', label: '看多', color: 'bg-up/20 text-up border-up/40 hover:bg-up/30' },
  { key: 'bearish', label: '看空', color: 'bg-down/20 text-down border-down/40 hover:bg-down/30' },
  { key: 'panic', label: '恐慌', color: 'bg-danger/20 text-danger border-danger/40 hover:bg-danger/30' },
  { key: 'greed', label: '贪婪', color: 'bg-gold/20 text-gold border-gold/40 hover:bg-gold/30' },
]

function KOLPanel() {
  const [expanded, setExpanded] = useState(false)
  const kols = useKOLStore((s) => s.kols)
  const cash = usePlayerStore((s) => s.cash)

  const handleHire = (kolId: string, cost: number) => {
    if (cash < cost) return
    usePlayerStore.setState({ cash: usePlayerStore.getState().cash - cost })
    getEngineRefs().kol?.hire(kolId)
    const updated = getEngineRefs().kol?.getKOLs()
    if (updated) useKOLStore.getState().setKOLs(updated)
  }

  const handleCommand = (kolId: string, direction: KOLDirection) => {
    commandKOL(kolId, direction)
  }

  const hired = kols.filter((k) => k.hired)
  const available = kols.filter((k) => !k.hired)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <h3 className="text-text-secondary text-xs uppercase tracking-wider">KOL 操盘</h3>
        <div className="flex items-center gap-2">
          {hired.length > 0 && (
            <span className="text-up text-[10px]">{hired.length}已雇佣</span>
          )}
          <span className="text-text-muted text-xs">{expanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 mt-2">
          {hired.map((kol) => {
            const onCooldown = kol.cooldown > 0
            return (
              <div key={kol.id} className="bg-bg-primary rounded p-2 border border-border-panel">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-text-primary text-xs font-bold">{kol.name}</span>
                    <span className="text-text-muted text-[10px] ml-1">{kol.specialty}</span>
                  </div>
                  {onCooldown && (
                    <span className="text-warn text-[10px]">冷却 {kol.cooldown * 5}s</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d.key}
                      disabled={onCooldown || !canManipulate('kol_command')}
                      onClick={() => handleCommand(kol.id, d.key)}
                      className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                        onCooldown || !canManipulate('kol_command')
                          ? 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
                          : d.color
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {available.map((kol) => (
            <div key={kol.id} className="bg-bg-primary rounded p-2 border border-border-panel flex items-center justify-between">
              <div>
                <span className="text-text-secondary text-xs">{kol.name}</span>
                <span className="text-text-muted text-[10px] ml-1">{kol.specialty}</span>
              </div>
              <button
                onClick={() => handleHire(kol.id, kol.hireCost)}
                disabled={cash < kol.hireCost}
                className={`text-[10px] px-2 py-1 rounded font-bold border ${
                  cash >= kol.hireCost
                    ? 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20'
                    : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
                }`}
              >
                雇佣 {formatMoney(kol.hireCost)}
              </button>
            </div>
          ))}

          {kols.length === 0 && (
            <p className="text-text-muted text-xs text-center py-2">暂无 KOL</p>
          )}
        </div>
      )}
    </div>
  )
}