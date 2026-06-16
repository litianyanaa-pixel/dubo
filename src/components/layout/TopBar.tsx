import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { formatPrice, formatPercent, formatMoney, formatTime } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'
import type { SpeedMultiplier } from '@/engine/core/types'
import { useState, useEffect, useRef } from 'react'
import type { AssetType } from '@/engine/market/types'
import { getEngineRefs } from '@/hooks/useGameLoop'
import { runPrediction, canPredict } from '@/hooks/useGameLoop'
import { useSelectionStore as useSel } from '@/stores/selectionStore'

const CATEGORY_ORDER: { key: string; label: string; icon: string }[] = [
  { key: 'currency', label: '货币', icon: '💱' },
  { key: 'stock', label: '股票', icon: '📈' },
  { key: 'commodity', label: '商品', icon: '🛢' },
  { key: 'crypto', label: '虚拟币', icon: '🪙' },
  { key: 'safehaven', label: '避险', icon: '🛡' },
]

// 角色主题色映射(用于天赋条描边/发光)
const CHAR_THEME: Record<string, { border: string; glow: string; text: string }> = {
  chen:  { border: 'border-up/40',     glow: 'shadow-[0_0_12px_rgba(0,255,136,0.15)]',     text: 'text-up' },
  z:     { border: 'border-danger/40', glow: 'shadow-[0_0_12px_rgba(255,0,85,0.15)]',      text: 'text-danger' },
  lin:   { border: 'border-info/40',   glow: 'shadow-[0_0_12px_rgba(0,187,255,0.15)]',     text: 'text-info' },
  anon:  { border: 'border-darknet/40',glow: 'shadow-[0_0_12px_rgba(255,0,255,0.15)]',     text: 'text-darknet' },
  dove:  { border: 'border-gold/40',   glow: 'shadow-[0_0_12px_rgba(255,215,0,0.15)]',     text: 'text-gold' },
  jack:  { border: 'border-warn/40',   glow: 'shadow-[0_0_12px_rgba(255,170,0,0.15)]',     text: 'text-warn' },
}

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
    <div className="flex flex-col shrink-0 border-b border-border-panel bg-bg-panel">
      {/* ===== 上段:信息行(原有内容) ===== */}
      <div className="h-10 flex items-center gap-2 px-3 text-sm overflow-hidden">
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

          <div className="flex gap-0.5 overflow-x-auto min-w-0">
            {filteredAssets.map((asset) => {
              const price = prices[asset.id] ?? asset.basePrice
              const prev = prevPrices[asset.id] ?? asset.basePrice
              const change = prev !== 0 ? (price - prev) / prev : 0
              const isSelected = selectedAsset === asset.id
              const flashCls = change > 0.0001 ? 'animate-price-up' : change < -0.0001 ? 'animate-price-down' : ''
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className={`px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap shrink-0 ${flashCls} ${
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

      {/* ===== 下段:常驻天赋条 ===== */}
      {character && <TraitBar characterId={character.id} />}
    </div>
  )
}

// ========== 天赋条 ==========
function TraitBar({ characterId }: { characterId: string }) {
  const character = useGameStore((s) => s.character)
  // 每秒刷新一次实时指标(倒计时、公信力恢复等)
  const [, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [])

  if (!character) return null
  const theme = CHAR_THEME[characterId] ?? { border: 'border-info/40', glow: '', text: 'text-info' }
  const trait = getEngineRefs().trait

  return (
    <div className={`h-7 flex items-center gap-3 px-3 bg-bg-primary/60 border-t ${theme.border} ${theme.glow}`}>
      {/* 左:角色标识 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-base leading-none">{character.icon}</span>
        <span className={`font-display text-xs font-bold ${theme.text}`}>{character.trait}</span>
      </div>

      <div className="w-px h-4 bg-border-panel shrink-0" />

      {/* 中:角色专属实时指标 */}
      <div className="flex items-center gap-3 flex-1 min-w-0 text-xs overflow-hidden">
        {characterId === 'chen' && trait && (
          <span className="text-text-secondary shrink-0">
            <span className="text-text-muted">📨 内幕消息</span>
            <span className={`ml-1.5 font-mono ${theme.text}`}>⏱ {Math.max(0, trait.getInsiderCountdown() * 5)}s</span>
          </span>
        )}
        {characterId === 'z' && (
          <>
            <span className="text-text-secondary shrink-0">
              <span className="text-text-muted">假新闻成本</span>
              <span className={`ml-1.5 font-mono ${theme.text}`}>×0.7</span>
            </span>
            <span className="text-text-secondary shrink-0">
              <span className="text-text-muted">KOL影响</span>
              <span className={`ml-1.5 font-mono ${theme.text}`}>×1.5</span>
            </span>
          </>
        )}
        {characterId === 'lin' && trait && (
          <span className="text-text-secondary shrink-0">
            <span className="text-text-muted">🔮 AI预测</span>
            {canPredict() ? (
              <span className={`ml-1.5 ${theme.text}`}>● 就绪</span>
            ) : (
              <span className="ml-1.5 text-text-muted font-mono">
                ◯ 冷却 {trait.getPredictionCooldown() * 5}s
              </span>
            )}
          </span>
        )}
        {characterId === 'anon' && (
          <span className="text-text-secondary shrink-0">
            <span className="text-text-muted">🕵 揭穿抗性</span>
            <span className={`ml-1.5 font-mono ${theme.text}`}>×0.5</span>
          </span>
        )}
        {characterId === 'dove' && trait && (() => {
          const cred = trait.getCredibility()
          const fakeCost = trait.getManipulationCost('fake_news')
          const kolCost = trait.getManipulationCost('kol_command')
          return (
            <>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="text-text-muted">🕊 公信力</span>
                <div className="w-16 h-1.5 bg-bg-panel rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cred > 30 ? 'bg-gold' : 'bg-warn'}`}
                    style={{ width: `${cred}%` }}
                  />
                </div>
                <span className={`font-mono ${cred > 30 ? 'text-gold' : 'text-warn'}`}>{cred}</span>
              </span>
              <span className="text-text-muted shrink-0">
                可造假 <span className={cred >= fakeCost ? 'text-text-secondary' : 'text-down'}>{Math.floor(cred / fakeCost)}</span>次
                · 可喊单 <span className={cred >= kolCost ? 'text-text-secondary' : 'text-down'}>{Math.floor(cred / kolCost)}</span>次
              </span>
            </>
          )
        })()}
        {characterId === 'jack' && (
          <span className="text-text-secondary shrink-0">
            <span className="text-text-muted">🎲 赌神附体</span>
            <span className={`ml-1.5 font-mono ${theme.text}`}>65% 胜率</span>
          </span>
        )}
      </div>

      {/* 右:快捷操作(仅 lin 显示预测按钮) */}
      {characterId === 'lin' && <LinPredictButton />}
    </div>
  )
}

function LinPredictButton() {
  const selectedAsset = useSel((s) => s.selectedAsset)
  const [, force] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const ready = canPredict()

  const handlePredict = () => {
    runPrediction(selectedAsset)
    force((t) => t + 1)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => force((t) => t + 1), 16000)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <button
      onClick={handlePredict}
      disabled={!ready}
      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
        ready
          ? 'bg-info/15 text-info border-info/30 hover:bg-info/25'
          : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
      }`}
    >
      🔮 预测 {selectedAsset}
    </button>
  )
}
