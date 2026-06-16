import { useState } from 'react'
import { useNewsStore, NEWS_TYPES, TRADE_TYPES, SOCIAL_TYPES, type NewsEntry } from '@/stores/newsStore'
import type { ActiveFakeNews } from '@/stores/newsStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { canManipulate, getCredibility, recordManipulation, launchRugToken, pumpRugToken, rugPullToken, getRugTokens } from '@/hooks/useGameLoop'
import { SFX } from '@/utils/sound'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { formatClockTime, formatMoney } from '@/utils/format'
import { getEngineRefs } from '@/hooks/useGameLoop'
import { NEWS_TEMPLATES } from '@/engine/news/NewsEngine'
import { ALL_ASSETS, ASSET_CATEGORIES } from '@/data/assets'
import { eventBus } from '@/engine/core/EventBus'

type Tab = 'news' | 'trades' | 'social' | 'create' | 'rug'

const TABS: { key: Tab; label: string }[] = [
  { key: 'news', label: '新闻' },
  { key: 'trades', label: '交易' },
  { key: 'social', label: '舆论' },
  { key: 'create', label: '造假' },
  { key: 'rug', label: '发币' },
]

const AGENT_ICONS: Record<string, string> = { leek: '🥬', whale: '🐋', scammer: '🎭' }

const CATEGORY_ICON: Record<string, string> = {
  currency: '💱',
  stock: '📈',
  commodity: '🛢',
  crypto: '🪙',
  safehaven: '🛡',
}

export default function LeftPanel() {
  const [tab, setTab] = useState<Tab>('news')
  const entries = useNewsStore((s) => s.entries)
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)

  const filtered = entries.filter((e) => {
    switch (tab) {
      case 'news': return NEWS_TYPES.includes(e.type)
      case 'trades': return TRADE_TYPES.includes(e.type) && (!e.assetId || e.assetId === selectedAsset)
      case 'social': return SOCIAL_TYPES.includes(e.type)
      default: return false
    }
  })

  // Newest on top
  const reversed = [...filtered].reverse()

  return (
    <div className="w-[280px] bg-bg-panel border-r border-border-panel p-3 flex flex-col">
      {/* Tabs */}
      <div className="flex gap-0.5 mb-2 bg-bg-primary rounded p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
              tab === t.key
                ? t.key === 'create'
                  ? 'bg-danger/20 text-danger'
                : t.key === 'rug'
                  ? 'bg-gold/20 text-gold'
                  : 'bg-up/15 text-up'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <CreateTab />
      ) : tab === 'rug' ? (
        <RugPullTab />
      ) : tab === 'trades' ? (
        <TradeFeed entries={reversed} selectedAsset={selectedAsset} />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {reversed.length === 0 && (
            <p className="text-text-muted text-xs animate-pulse mt-4 text-center">
              {tab === 'news' ? '等待新闻...' : '等待舆论...'}
            </p>
          )}
          {reversed.map((entry, i) => (
            <div
              key={`${entry.id}_${i}`}
              className={`rounded px-2 py-1.5 text-xs border animate-slide-in ${
                entry.type === 'event' ? 'bg-warn/5 border-warn/20'
                : entry.type === 'fake_news' ? 'bg-danger/5 border-danger/20'
                : entry.type === 'kol_post' ? 'bg-crypto/5 border-crypto/20'
                : 'bg-bg-panel-hover border-border-highlight'
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <span className={
                  entry.type === 'event' ? 'text-warn'
                  : entry.type === 'fake_news' ? 'text-danger'
                  : entry.type === 'kol_post' ? 'text-crypto'
                  : 'text-text-primary'
                }>
                  {entry.type === 'event' ? '⚡' : entry.type === 'fake_news' ? '🎭' : entry.type === 'kol_post' ? '📢' : '💬'} {entry.title}
                </span>
                <span className="text-text-muted whitespace-nowrap text-[10px]">{formatClockTime(entry.time)}</span>
              </div>
              {entry.description && <p className="text-text-muted mt-0.5">{entry.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Trade feed: stock software style ---
const TradeFeed = ({ entries, selectedAsset }: { entries: NewsEntry[]; selectedAsset: string }) => {
  return (
    <div className="flex-1 overflow-y-auto font-mono text-[11px]">
      {/* Header */}
      <div className="flex items-center px-1 py-1 border-b border-border-panel text-text-muted text-[10px] sticky top-0 bg-bg-panel z-10">
        <span className="w-[72px]">时间</span>
        <span className="w-[56px]">交易者</span>
        <span className="w-[36px] text-center">方向</span>
        <span className="w-[40px] text-right">手数</span>
        <span className="flex-1 text-right">品种</span>
      </div>

      {entries.length === 0 && (
        <p className="text-text-muted text-xs animate-pulse mt-4 text-center">等待 {selectedAsset} 交易...</p>
      )}

      <div className="divide-y divide-border-panel/50">
        {entries.map((entry, i) => {
          const isBuy = entry.side === 'buy'
          const dirColor = isBuy ? 'text-up' : 'text-down'
          const bgColor = isBuy ? 'bg-up/[0.03]' : 'bg-down/[0.03]'
          const icon = entry.agentType ? AGENT_ICONS[entry.agentType] ?? '' : entry.type === 'player_trade' ? '💰' : '📊'
          const bigTag = entry.isBigOrder ? <span className="text-warn text-[9px] ml-0.5">大单</span> : null

          return (
            <div
              key={`${entry.id}_${i}`}
              className={`flex items-center px-1 py-0.5 ${bgColor}`}
            >
              <span className="w-[72px] text-text-muted">{formatClockTime(entry.time)}</span>
              <span className="w-[56px] truncate text-text-secondary">
                {icon} {entry.title.length > 5 ? entry.title.slice(0, 5) : entry.title}
              </span>
              <span className={`w-[36px] text-center font-bold ${dirColor}`}>
                {isBuy ? '▲ 多' : '▼ 空'}
              </span>
              <span className={`w-[40px] text-right ${dirColor}`}>
                {entry.lots ?? '-'}手{bigTag}
              </span>
              <span className="flex-1 text-right text-text-muted">
                {entry.assetId ?? ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Create tab (fake news) ---
function CreateTab() {
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [targetAsset, setTargetAsset] = useState('KAL')
  const [published, setPublished] = useState(false)
  const cash = usePlayerStore((s) => s.cash)
  const addEntry = useNewsStore((s) => s.addEntry)

  const template = NEWS_TEMPLATES[selectedTemplate]
  const costMultiplier = getEngineRefs().trait?.getFakeNewsCostMultiplier() ?? 1.0
  const actualCost = Math.round(template.cost * costMultiplier)
  const canAfford = cash >= actualCost
  const credibilityBlocked = !canManipulate('fake_news')

  const handlePublish = () => {
    if (!canAfford || credibilityBlocked) return
    usePlayerStore.setState({ cash: usePlayerStore.getState().cash - actualCost })

    const asset = targetAsset
    const priceImpact = template.priceDirection === 'up' ? template.priceMagnitude : -template.priceMagnitude
    const sentimentImpact = template.sentimentMagnitude

    // Apply price shock directly on engine asset (persists across ticks)
    const engineAsset = getEngineRefs().market?.getAsset(asset)
    if (engineAsset) {
      engineAsset.currentPrice *= (1 + priceImpact * 3)
    }

    // Apply sentiment shock through engine (proper regression instead of instant override)
    getEngineRefs().sentiment?.applyShock(sentimentImpact * 3)

    // Also inject AI trade flow in the fake news direction to amplify
    const flowAmount = template.priceDirection === 'up' ? 500_000 : -500_000
    if (flowAmount > 0) {
      getEngineRefs().market?.addTradeFlow(asset, 'buy', Math.abs(flowAmount))
    } else {
      getEngineRefs().market?.addTradeFlow(asset, 'sell', Math.abs(flowAmount))
    }

    addEntry({
      id: `fake_${Date.now()}`,
      title: template.title,
      description: template.description.replace('{target}', asset),
      type: 'fake_news',
    })

    // Register active fake news for debunk tracking + consume dove credibility
    getEngineRefs().trait?.consumeCredibility(getEngineRefs().trait?.getManipulationCost('fake_news') ?? 0)
    const debunkMod = getEngineRefs().trait?.getDebunkModifier() ?? 1.0
    useNewsStore.getState().addFakeNews({
      id: `fake_${Date.now()}`,
      assetId: asset,
      priceDirection: template.priceDirection,
      priceMagnitude: template.priceMagnitude * 3, // match the 3x applied above
      sentimentMagnitude: sentimentImpact * 3,
      credibility: template.credibility * debunkMod, // 暗影·无名 reduces credibility check
      tickAge: 0,
    })

    eventBus.emit('news:published', { id: `fake_${Date.now()}`, templateId: template.id, targetCountry: asset })
    useUnlockStore.getState().recordFakeNews()
    recordManipulation(5)
    SFX.fakeNews()
    setPublished(true)
    setTimeout(() => setPublished(false), 1500)
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">花钱制造假新闻操纵市场</p>

      <div>
        <label className="text-text-muted text-xs">目标资产</label>
        <div className="mt-1 max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
          {ASSET_CATEGORIES.map((cat) => {
            const groupAssets = ALL_ASSETS.filter((a) => a.type === cat.key)
            if (groupAssets.length === 0) return null
            return (
              <div key={cat.key}>
                <div className="flex items-center gap-1 mb-0.5 pb-0.5 border-b border-border-panel">
                  <span className="text-[10px]">{CATEGORY_ICON[cat.key]}</span>
                  <span className="text-text-muted text-[10px] font-bold tracking-wide">{cat.label}</span>
                  <span className="text-text-muted text-[9px]">({groupAssets.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {groupAssets.map((a) => (
                    <button key={a.id} onClick={() => setTargetAsset(a.id)}
                      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                        targetAsset === a.id
                          ? cat.key === 'crypto'
                            ? 'bg-crypto/20 text-crypto border border-crypto/40'
                            : 'bg-warn/20 text-warn border border-warn/30'
                          : 'bg-bg-primary text-text-secondary border border-transparent hover:bg-bg-panel-hover'
                      }`}
                    >{a.id}</button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-text-muted text-xs">新闻模板</label>
        <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
          {NEWS_TEMPLATES.map((t, i) => (
            <button key={t.id} onClick={() => setSelectedTemplate(i)}
              className={`w-full text-left px-2 py-1 rounded text-xs ${selectedTemplate === i ? 'bg-warn/10 border border-warn/30 text-text-primary' : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover'}`}
            >
              <div className="flex justify-between">
                <span>{t.title}</span>
                <span className={t.priceDirection === 'up' ? 'text-up' : 'text-down'}>{t.priceDirection === 'up' ? '▲' : '▼'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-bg-primary rounded p-2 border border-border-panel">
        <p className="text-text-primary text-xs font-bold">{template.title}</p>
        <p className="text-text-muted text-xs mt-1">{template.description.replace('{target}', targetAsset)}</p>
        <div className="flex gap-3 mt-2 text-[10px]">
          <span className={template.priceDirection === 'up' ? 'text-up' : 'text-down'}>冲击: {(template.priceMagnitude * 100).toFixed(1)}%</span>
          <span className={template.sentimentMagnitude > 0 ? 'text-up' : 'text-down'}>情绪: {template.sentimentMagnitude > 0 ? '+' : ''}{template.sentimentMagnitude}</span>
        </div>
        <p className="text-gold text-xs mt-1">成本: {formatMoney(actualCost)}{costMultiplier < 1 ? ' (天赋折扣!)' : ''}</p>
      </div>

      <button onClick={handlePublish} disabled={!canAfford || published || credibilityBlocked}
        className={`w-full py-2 rounded font-bold text-sm ${published ? 'bg-up/20 text-up border border-up/40' : credibilityBlocked ? 'bg-warn/10 text-warn border border-warn/30 cursor-not-allowed' : canAfford ? 'bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30' : 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'}`}
      >
        {published ? '已发布！' : credibilityBlocked ? '公信力不足，无法操纵' : canAfford ? `发布假新闻 (-${formatMoney(actualCost)})` : '资金不足'}
      </button>
    </div>
  )
}

// --- Rug Pull tab ---
function RugPullTab() {
  const cash = usePlayerStore((s) => s.cash)
  const [lastResult, setLastResult] = useState<{ revenue: number; profit: number } | null>(null)
  const tokens = getRugTokens()
  const launchCost = 50000

  const handleLaunch = () => {
    const token = launchRugToken()
    if (token) {
      useNewsStore.getState().addEntry({
        id: `rug_launch_${Date.now()}`,
        title: '🪙 新币上线',
        description: `${token.name} 正式上线！初始价格 $${token.currentPrice.toFixed(4)}`,
        type: 'social',
      })
    }
  }

  const handlePump = (tokenId: string) => {
    pumpRugToken(tokenId)
  }

  const handleRug = (tokenId: string) => {
    const result = rugPullToken(tokenId)
    if (result) {
      SFX.rugPull()
      setLastResult(result)
    }
  }

  const activeTokens = tokens.filter(t => !t.rugged)
  const ruggedTokens = tokens.filter(t => t.rugged)

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">发行空气币，炒作拉盘，然后砸盘收割</p>

      <button
        onClick={handleLaunch}
        disabled={cash < launchCost || !canManipulate('rug_pull')}
        className={`w-full py-2 rounded font-bold text-sm ${
          cash >= launchCost && canManipulate('rug_pull')
            ? 'bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30'
            : 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'
        }`}
      >
        🪙 发行新币 (-$50K)
      </button>

      {lastResult && (
        <div className="bg-up/10 border border-up/20 rounded p-2 text-xs">
          <span className="text-up font-bold">收割完成！</span> 收入 {formatMoney(lastResult.revenue)}，利润 {formatMoney(lastResult.profit)}
        </div>
      )}

      {activeTokens.map((token) => (
        <div key={token.id} className="bg-bg-primary rounded p-2 border border-gold/20 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gold text-xs font-bold">🪙 {token.name}</span>
            <span className="text-text-primary font-mono text-xs">${token.currentPrice.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>炒作度 {token.hypeLevel.toFixed(0)}%</span>
            <span>AI持仓 {((token.aiHolding / token.totalSupply) * 100).toFixed(1)}%</span>
            <span>你的 {((token.playerHolding / token.totalSupply) * 100).toFixed(1)}%</span>
          </div>
          {/* Hype bar */}
          <div className="w-full h-1 bg-bg-panel rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${token.hypeLevel > 60 ? 'bg-gold' : token.hypeLevel > 30 ? 'bg-warn' : 'bg-text-muted'}`}
              style={{ width: `${token.hypeLevel}%` }}
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePump(token.id)}
              disabled={cash < 10000}
              className="flex-1 py-1 rounded text-[10px] font-bold border bg-gold/10 text-gold border-gold/30 hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              拉盘 (-$10K)
            </button>
            <button
              onClick={() => handleRug(token.id)}
              className="flex-1 py-1 rounded text-[10px] font-bold border bg-danger/20 text-danger border-danger/40 hover:bg-danger/30"
            >
              💀 砸盘跑路
            </button>
          </div>
        </div>
      ))}

      {ruggedTokens.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-text-muted text-[10px] uppercase">已崩盘</h4>
          {ruggedTokens.map((token) => (
            <div key={token.id} className="text-[10px] text-down flex justify-between">
              <span>💀 {token.name}</span>
              <span className="font-mono">${token.currentPrice.toFixed(6)}</span>
            </div>
          ))}
        </div>
      )}

      {tokens.length === 0 && (
        <p className="text-text-muted text-xs text-center mt-4">还没有发行任何代币</p>
      )}
    </div>
  )
}
