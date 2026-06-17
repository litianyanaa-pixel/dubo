import { useState } from 'react'
import { useNewsStore, NEWS_TYPES, TRADE_TYPES, SOCIAL_TYPES, type NewsEntry } from '@/stores/newsStore'
import type { ActiveFakeNews } from '@/stores/newsStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { canManipulate, getCredibility, recordManipulation, launchRugToken, pumpRugToken, rugPullToken, getRugTokens, bidAuctionInsider, getAuctionPending, buyIntel, getIntelAvailable, depositOffshore, withdrawOffshore, openCarryTrade, closeCarryTrade, getOffshoreState } from '@/hooks/useGameLoop'
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
import { useAuctionStore } from '@/stores/auctionStore'
import { useIntelStore } from '@/stores/intelStore'
import { useOffshoreStore } from '@/stores/offshoreStore'
import { INITIAL_COUNTRIES } from '@/data/countries'

type Tab = 'news' | 'trades' | 'social' | 'create' | 'rug' | 'auction' | 'intel' | 'offshore'

const TABS: { key: Tab; label: string; group: 'info' | 'action' }[] = [
  { key: 'news', label: '新闻', group: 'info' },
  { key: 'trades', label: '交易', group: 'info' },
  { key: 'social', label: '舆论', group: 'info' },
  { key: 'create', label: '造假', group: 'action' },
  { key: 'rug', label: '发币', group: 'action' },
  { key: 'auction', label: '拍卖', group: 'action' },
  { key: 'intel', label: '情报', group: 'action' },
  { key: 'offshore', label: '离岸', group: 'action' },
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
      {/* Tabs - 两行: 信息类 / 操作类 */}
      <div className="mb-2 space-y-0.5">
        <div className="flex gap-0.5 bg-bg-primary rounded p-0.5">
          {TABS.filter(t => t.group === 'info').map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                tab === t.key ? 'bg-up/15 text-up' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-bg-primary rounded p-0.5">
          {TABS.filter(t => t.group === 'action').map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                tab === t.key
                  ? t.key === 'create' ? 'bg-danger/20 text-danger'
                  : t.key === 'rug' ? 'bg-gold/20 text-gold'
                  : t.key === 'auction' ? 'bg-warn/20 text-warn'
                  : t.key === 'intel' ? 'bg-info/20 text-info'
                  : t.key === 'offshore' ? 'bg-crypto/20 text-crypto'
                  : 'bg-up/15 text-up'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'create' ? (
        <CreateTab />
      ) : tab === 'rug' ? (
        <RugPullTab />
      ) : tab === 'auction' ? (
        <AuctionTab />
      ) : tab === 'intel' ? (
        <IntelTab />
      ) : tab === 'offshore' ? (
        <OffshoreTab />
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
  const [targetAsset, setTargetAsset] = useState('USD')
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

// --- Auction tab: 沙特资源拍卖 ---
function AuctionTab() {
  const pending = useAuctionStore((s) => s.pending)
  const history = useAuctionStore((s) => s.history)
  const cash = usePlayerStore((s) => s.cash)
  const [, force] = useState(0)

  const handleBid = (pkgId: string, cost: number) => {
    if (cash < cost) return
    bidAuctionInsider(pkgId)
    force((n) => n + 1)
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">沙特定期拍卖大宗商品,竞标内幕可提前获知涨跌方向</p>

      {pending.length === 0 && (
        <p className="text-text-muted text-xs animate-pulse mt-4 text-center">等待下一轮拍卖...</p>
      )}

      {pending.map((pkg) => (
        <div key={pkg.id} className="bg-bg-primary rounded p-2 border border-warn/20 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-warn text-xs font-bold">🛢 {pkg.assetName}</span>
            <span className="text-text-muted text-[10px]">{pkg.revealInTicks} 轮后揭晓</span>
          </div>
          {pkg.insiderKnown ? (
            <div className={`text-xs font-bold ${pkg.direction === 'up' ? 'text-up' : 'text-down'}`}>
              内幕: {pkg.direction === 'up' ? '▲ 将上涨' : '▼ 将下跌'} ({(pkg.magnitude * 100).toFixed(1)}%)
            </div>
          ) : (
            <button
              onClick={() => handleBid(pkg.id, pkg.insiderCost)}
              disabled={cash < pkg.insiderCost}
              className={`w-full py-1 rounded text-[10px] font-bold border ${
                cash >= pkg.insiderCost
                  ? 'bg-warn/10 text-warn border-warn/30 hover:bg-warn/20'
                  : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
              }`}
            >
              🕵 竞标内幕 (-{formatMoney(pkg.insiderCost)})
            </button>
          )}
        </div>
      ))}

      {history.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-text-muted text-[10px] uppercase">已揭晓</h4>
          {history.slice(-5).reverse().map((pkg) => (
            <div key={pkg.id} className="text-[10px] flex justify-between bg-bg-panel rounded px-2 py-1">
              <span className="text-text-secondary">{pkg.assetName}</span>
              <span className={pkg.direction === 'up' ? 'text-up' : 'text-down'}>
                {pkg.direction === 'up' ? '▲' : '▼'} {(pkg.magnitude * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Intel tab: 瑞士情报拍卖 ---
function IntelTab() {
  const available = useIntelStore((s) => s.available)
  const owned = useIntelStore((s) => s.owned)
  const cash = usePlayerStore((s) => s.cash)
  const [, force] = useState(0)

  const handleBuy = (pkgId: string, cost: number) => {
    if (cash < cost) return
    buyIntel(pkgId)
    force((n) => n + 1)
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">瑞士保密法情报包,购买后获知权贵动向(限时兑现)</p>

      {available.length === 0 && (
        <p className="text-text-muted text-xs animate-pulse mt-4 text-center">暂无待售情报...</p>
      )}

      {available.map((pkg) => (
        <div key={pkg.id} className="bg-bg-primary rounded p-2 border border-info/20 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-info text-xs font-bold">🕵 {pkg.assetName}</span>
            <span className="text-text-muted text-[10px]">方向未知</span>
          </div>
          <p className="text-text-secondary text-[10px]">{pkg.title}</p>
          <button
            onClick={() => handleBuy(pkg.id, pkg.cost)}
            disabled={cash < pkg.cost}
            className={`w-full py-1 rounded text-[10px] font-bold border ${
              cash >= pkg.cost
                ? 'bg-info/10 text-info border-info/30 hover:bg-info/20'
                : 'bg-bg-panel text-text-muted border-border-panel cursor-not-allowed'
            }`}
          >
            购买情报 (-{formatMoney(pkg.cost)})
          </button>
        </div>
      ))}

      {owned.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-text-muted text-[10px] uppercase">已购(等待兑现)</h4>
          {owned.map((pkg) => (
            <div key={pkg.id} className="bg-info/5 border border-info/20 rounded p-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">{pkg.assetName}</span>
                <span className={pkg.direction === 'up' ? 'text-up' : 'text-down'}>
                  {pkg.direction === 'up' ? '▲' : '▼'} {pkg.expireInTicks} 轮后兑现
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Offshore tab: 新加坡离岸账户 + 利差套利 ---
function OffshoreTab() {
  const state = useOffshoreStore((s) => s)
  const cash = usePlayerStore((s) => s.cash)
  const [depositAmount, setDepositAmount] = useState('100000')
  const [funding, setFunding] = useState('JPY')
  const [target, setTarget] = useState('SAR')
  const [carryNotional, setCarryNotional] = useState('100000')
  const [, force] = useState(0)

  // 可用于 carry trade 的货币(低息做融资,高息做标的)
  const currencies = INITIAL_COUNTRIES.map((c) => ({ id: c.currencyId, rate: c.interestRate }))

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount) || 0
    if (amt <= 0 || amt > cash) return
    depositOffshore(amt)
    force((n) => n + 1)
  }
  const handleWithdraw = () => {
    const amt = parseFloat(depositAmount) || 0
    if (amt <= 0) return
    withdrawOffshore(amt)
    force((n) => n + 1)
  }
  const handleOpenCarry = () => {
    const amt = parseFloat(carryNotional) || 0
    if (amt <= 0) return
    openCarryTrade(funding, target, amt)
    force((n) => n + 1)
  }
  const handleCloseCarry = (id: string) => {
    closeCarryTrade(id)
    force((n) => n + 1)
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">新加坡离岸账户:降低监管热度 + 利差套利</p>

      {/* 余额 + 监管抵消 */}
      <div className="bg-bg-primary rounded p-2 border border-crypto/20 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">离岸余额</span>
          <span className="text-crypto font-mono">{formatMoney(state.balance)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-muted">监管抵消</span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-bg-panel rounded-full overflow-hidden">
              <div className="h-full bg-crypto rounded-full transition-all" style={{ width: `${state.shieldStrength}%` }} />
            </div>
            <span className="text-crypto font-mono text-[10px]">{state.shieldStrength.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 存取款 */}
      <div className="space-y-1">
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="w-full bg-bg-primary border border-border-panel rounded px-2 py-1 text-text-primary font-mono text-xs"
        />
        <div className="flex gap-1">
          <button onClick={handleDeposit} disabled={cash < parseFloat(depositAmount)}
            className="flex-1 py-1 rounded text-[10px] font-bold border bg-crypto/10 text-crypto border-crypto/30 hover:bg-crypto/20 disabled:opacity-50">
            存入
          </button>
          <button onClick={handleWithdraw}
            className="flex-1 py-1 rounded text-[10px] font-bold border bg-bg-primary text-text-secondary border-border-panel hover:bg-bg-panel-hover">
            取出
          </button>
        </div>
      </div>

      {/* 利差套利 */}
      <div className="bg-bg-primary rounded p-2 border border-border-panel space-y-1.5">
        <p className="text-text-muted text-[10px] uppercase">利差套利 (carry trade)</p>
        <div className="flex gap-1 items-center text-[10px]">
          <select value={funding} onChange={(e) => setFunding(e.target.value)} className="bg-bg-panel border border-border-panel rounded px-1 py-0.5 text-text-primary">
            {currencies.map((c) => <option key={c.id} value={c.id}>借 {c.id} ({c.rate}%)</option>)}
          </select>
          <span className="text-text-muted">→</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="bg-bg-panel border border-border-panel rounded px-1 py-0.5 text-text-primary">
            {currencies.map((c) => <option key={c.id} value={c.id}>投 {c.id} ({c.rate}%)</option>)}
          </select>
        </div>
        <input
          type="number"
          value={carryNotional}
          onChange={(e) => setCarryNotional(e.target.value)}
          className="w-full bg-bg-panel border border-border-panel rounded px-2 py-1 text-text-primary font-mono text-xs"
        />
        <button onClick={handleOpenCarry}
          className="w-full py-1 rounded text-[10px] font-bold border bg-up/10 text-up border-up/30 hover:bg-up/20">
          建仓套利
        </button>
      </div>

      {/* 活跃套利头寸 */}
      {state.carryTrades.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-text-muted text-[10px] uppercase">活跃套利</h4>
          {state.carryTrades.map((t) => (
            <div key={t.id} className="bg-up/5 border border-up/20 rounded p-1.5 text-[10px] flex justify-between items-center">
              <span className="text-text-secondary">{t.fundingCurrency}→{t.targetCurrency} <span className="text-up">+{t.rateSpread.toFixed(2)}%</span></span>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">{formatMoney(t.notional)}</span>
                <button onClick={() => handleCloseCarry(t.id)} className="text-down hover:text-danger">平仓</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
