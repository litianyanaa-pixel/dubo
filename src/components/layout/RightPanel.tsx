import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useGameStore } from '@/stores/gameStore'
import { useNewsStore } from '@/stores/newsStore'
import { useKOLStore } from '@/stores/kolStore'
import { formatPrice, formatMoney } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'
import { getEngineRefs, commandKOL, runPrediction, getPrediction, canPredict, getCredibility, canManipulate, manipulatePrice, canManipulatePrice, getManipulateCooldownRemaining } from '@/hooks/useGameLoop'
import type { KOLDirection } from '@/engine/kol/KOLEngine'
import type { Prediction } from '@/engine/player/TraitEngine'
import { SFX } from '@/utils/sound'
import { useObjectiveStore } from '@/stores/objectiveStore'
import { useToastStore } from '@/components/Toast'

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
  const startCash = useGameStore((s) => s.startCash)
  const asset = ALL_ASSETS.find((a) => a.id === selectedAsset)
  const assetPrice = prices[selectedAsset] ?? asset?.basePrice ?? 1

  // 总净值(供目标系统显示进度)
  const longValue = Object.values(positions).reduce((s, p) => s + p.amount * (prices[p.assetId] ?? 0), 0)
  const shortVal = Object.values(shorts).reduce((s, p) => {
    const price = prices[p.assetId] ?? p.avgEntry
    return s + p.amount * p.avgEntry + (p.avgEntry - price) * p.amount
  }, 0)
  const totalValue = cash + longValue + shortVal

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

      // 平仓时显示实现盈亏 toast
      if (action === 'closeLong' && longPos) {
        const pnl = (assetPrice - longPos.avgCost) * qty
        useToastStore.getState().addToast(
          `${selectedAsset} 平多 ${pnl >= 0 ? '获利' : '亏损'} ${pnl >= 0 ? '+' : ''}${(pnl / 1000).toFixed(1)}K`,
          pnl >= 0 ? 'success' : 'danger'
        )
      } else if (action === 'closeShort' && shortPos) {
        const pnl = (shortPos.avgEntry - assetPrice) * qty
        useToastStore.getState().addToast(
          `${selectedAsset} 平空 ${pnl >= 0 ? '获利' : '亏损'} ${pnl >= 0 ? '+' : ''}${(pnl / 1000).toFixed(1)}K`,
          pnl >= 0 ? 'success' : 'danger'
        )
      }

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
      {/* 冻结警告 + 操纵热度 */}
      <StatusBar />

      {/* 目标系统 */}
      <ObjectiveBar totalNetWorth={totalValue} startCash={startCash} />

      {/* Wallet summary - 全部持仓总览 */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">全部持仓</h3>
        <div className={`bg-bg-primary rounded p-2 space-y-1 transition-colors duration-300 ${
          flash === 'up' ? 'ring-1 ring-up/50 bg-up/5' : flash === 'down' ? 'ring-1 ring-down/50 bg-down/5' : ''
        }`}>
          <div className="flex justify-between">
            <span className="text-text-muted">现金</span>
            <span className="text-gold">{formatMoney(cash)}</span>
          </div>
          {/* 所有多头仓位 */}
          {Object.entries(positions).map(([id, pos]) => {
            const p = prices[id] ?? 0
            const pnl = (p - pos.avgCost) * pos.amount
            const isSelected = id === selectedAsset
            return (
              <button
                key={id}
                onClick={() => useSelectionStore.getState().setSelectedAsset(id)}
                className={`flex justify-between w-full text-left px-0.5 rounded ${isSelected ? 'bg-up/5' : 'hover:bg-bg-panel-hover'}`}
              >
                <span className="text-up">多 {id} <span className="text-text-muted text-[10px]">{pos.amount.toFixed(2)}</span></span>
                <span className={`text-xs ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                </span>
              </button>
            )
          })}
          {/* 所有空头仓位 */}
          {Object.entries(shorts).map(([id, pos]) => {
            const p = prices[id] ?? pos.avgEntry
            const pnl = (pos.avgEntry - p) * pos.amount
            const isSelected = id === selectedAsset
            return (
              <button
                key={id}
                onClick={() => useSelectionStore.getState().setSelectedAsset(id)}
                className={`flex justify-between w-full text-left px-0.5 rounded ${isSelected ? 'bg-down/5' : 'hover:bg-bg-panel-hover'}`}
              >
                <span className="text-down">空 {id} <span className="text-text-muted text-[10px]">{pos.amount.toFixed(2)}</span></span>
                <span className={`text-xs ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                </span>
              </button>
            )
          })}
          {Object.keys(positions).length === 0 && Object.keys(shorts).length === 0 && (
            <p className="text-text-muted text-[10px] text-center py-1">暂无持仓</p>
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

      {/* 主动操纵: 砸盘/拉升 */}
      <ManipulatePanel assetId={selectedAsset} cash={cash} />

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

// --- 目标系统: 阶段进度 + 限时任务 ---
function ObjectiveBar({ totalNetWorth, startCash }: { totalNetWorth: number; startCash: number }) {
  const milestones = useObjectiveStore((s) => s.milestones)
  const currentObjective = useObjectiveStore((s) => s.currentObjective)
  // 每秒刷新(任务倒计时)
  const [, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [])

  // 找到下一个未达成的里程碑
  const nextMilestone = milestones.find((m) => !m.achieved)
  const stageProgress = nextMilestone && startCash > 0
    ? Math.min(100, ((totalNetWorth - startCash) / (nextMilestone.target - startCash)) * 100)
    : 100

  return (
    <div className="bg-bg-primary rounded p-2 border border-border-panel space-y-2">
      {/* 阶段进度 */}
      {nextMilestone ? (
        <div>
          <div className="flex justify-between items-center text-[10px] mb-0.5">
            <span className="text-text-muted">🎯 阶段 {nextMilestone.stage}</span>
            <span className="text-text-secondary">{nextMilestone.label}</span>
          </div>
          <div className="w-full h-1.5 bg-bg-panel rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, stageProgress)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] mt-0.5">
            <span className="text-text-muted">{Math.max(0, stageProgress).toFixed(0)}%</span>
            <span className="text-text-muted">目标 {nextMilestone.target >= 1e6 ? `${(nextMilestone.target / 1e6).toFixed(1)}M` : `${(nextMilestone.target / 1e3).toFixed(0)}K`}</span>
          </div>
        </div>
      ) : (
        <p className="text-gold text-[10px] text-center font-bold">🏆 已达成所有阶段!</p>
      )}

      {/* 限时任务 */}
      {currentObjective ? (
        <div className="border-t border-border-panel pt-1.5">
          <div className="flex justify-between items-center text-[10px] mb-0.5">
            <span className="text-info">⚡ 限时任务</span>
            <span className="text-warn font-mono">{Math.ceil(currentObjective.remainTicks * 3)}s</span>
          </div>
          <p className="text-text-secondary text-[10px] leading-tight">{currentObjective.description}</p>
          <div className="w-full h-1 bg-bg-panel rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${currentObjective.progress >= currentObjective.target ? 'bg-up' : 'bg-info'}`}
              style={{ width: `${Math.min(100, (currentObjective.progress / currentObjective.target) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] mt-0.5">
            <span className="text-text-muted">{currentObjective.progress.toFixed(0)}/{currentObjective.target}</span>
            <span className="text-gold">+{(currentObjective.reward / 1000).toFixed(0)}K</span>
          </div>
        </div>
      ) : (
        <p className="text-text-muted text-[9px] text-center border-t border-border-panel pt-1.5">等待新任务...</p>
      )}
    </div>
  )
}

// --- 主动操纵: 砸盘/拉升 ---
function ManipulatePanel({ assetId, cash }: { assetId: string; cash: number }) {
  const [amount, setAmount] = useState(100000)
  const [result, setResult] = useState<{ ok: boolean; reason?: string } | null>(null)
  const [, force] = useState(0)

  const cooldownReady = canManipulatePrice()
  const cooldownRemain = getManipulateCooldownRemaining()

  const doManipulate = (direction: 'up' | 'down') => {
    const r = manipulatePrice(assetId, direction, amount)
    setResult(r)
    force((n) => n + 1)
  }

  const tiers = [50000, 100000, 500000, 1000000]

  return (
    <div className="bg-bg-primary rounded p-2 border border-border-panel">
      <div className="flex justify-between items-center mb-1.5">
        <h4 className="text-text-secondary text-[10px] uppercase tracking-wider">主动操纵 · {assetId}</h4>
        <span className={`text-[10px] ${cooldownReady ? 'text-up' : 'text-warn'}`}>
          {cooldownReady ? '就绪' : `冷却 ${cooldownRemain}s`}
        </span>
      </div>

      {/* 金额档位 */}
      <div className="flex gap-0.5 mb-1.5">
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setAmount(t)}
            className={`flex-1 py-0.5 rounded text-[9px] border ${
              amount === t
                ? 'bg-warn/15 text-warn border-warn/30'
                : 'bg-bg-panel text-text-muted border-border-panel hover:text-text-secondary'
            }`}
          >
            {t >= 1000000 ? `${t / 1000000}M` : `${t / 1000}K`}
          </button>
        ))}
      </div>

      {/* 砸盘 / 拉升 按钮 */}
      <div className="flex gap-1">
        <button
          onClick={() => doManipulate('up')}
          disabled={!cooldownReady || cash < amount}
          className={`flex-1 py-1.5 rounded text-xs font-bold border ${
            cooldownReady && cash >= amount
              ? 'bg-up/15 text-up border-up/40 hover:bg-up/25'
              : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
          }`}
        >
          🚀 拉升
        </button>
        <button
          onClick={() => doManipulate('down')}
          disabled={!cooldownReady || cash < amount}
          className={`flex-1 py-1.5 rounded text-xs font-bold border ${
            cooldownReady && cash >= amount
              ? 'bg-down/15 text-down border-down/40 hover:bg-down/25'
              : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
          }`}
        >
          💥 砸盘
        </button>
      </div>

      {result && !result.ok && (
        <p className="text-down text-[10px] mt-1 text-center">{result.reason}</p>
      )}
      <p className="text-text-muted text-[9px] mt-1 text-center">
        消耗资金,直接推动价格 ±1-8%,累积操纵热度,8 秒冷却
      </p>
    </div>
  )
}

// --- 状态栏: 冻结警告 + 操纵热度 ---
function StatusBar() {
  const frozenUntil = usePlayerStore((s) => s.frozenUntil)
  const manipulationScore = getEngineRefs().country?.getManipulationScore() ?? 0
  const arrestThreshold = 15
  // 每秒刷新(冻结倒计时实时更新)
  const [, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [])

  const now = Date.now()
  const frozenRemaining = Math.max(0, Math.ceil((frozenUntil - now) / 1000))
  const isFrozen = frozenRemaining > 0
  // 热度占比(0-100,超过 threshold 进入危险区)
  const heatPct = Math.min(100, (manipulationScore / (arrestThreshold * 2)) * 100)
  const heatColor = manipulationScore >= arrestThreshold ? 'text-danger' : manipulationScore >= arrestThreshold * 0.7 ? 'text-warn' : 'text-text-muted'
  const heatBarColor = manipulationScore >= arrestThreshold ? 'bg-danger' : manipulationScore >= arrestThreshold * 0.7 ? 'bg-warn' : 'bg-up'

  return (
    <div className="space-y-1">
      {isFrozen && (
        <div className="bg-danger/15 border border-danger/40 rounded px-2 py-1 text-xs text-danger font-bold flex justify-between items-center animate-pulse">
          <span>🚔 交易冻结中</span>
          <span className="font-mono">{frozenRemaining}s</span>
        </div>
      )}
      <div className="bg-bg-primary rounded px-2 py-1">
        <div className="flex justify-between items-center text-[10px] mb-0.5">
          <span className="text-text-muted">🔍 操纵热度</span>
          <span className={`font-mono ${heatColor}`}>
            {manipulationScore.toFixed(0)}{manipulationScore >= arrestThreshold ? ' ⚠危险' : ''}
          </span>
        </div>
        <div className="w-full h-1 bg-bg-panel rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${heatBarColor}`}
            style={{ width: `${heatPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}