import { useState, useEffect, useRef } from 'react'
import { useNewsStore, NEWS_TYPES, TRADE_TYPES, SOCIAL_TYPES, type FeedType, type NewsEntry } from '@/stores/newsStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { formatTime, formatMoney } from '@/utils/format'
import { NEWS_TEMPLATES } from '@/engine/news/NewsEngine'
import { ALL_ASSETS } from '@/data/assets'
import { eventBus } from '@/engine/core/EventBus'

type Tab = 'news' | 'trades' | 'social' | 'create'

const TABS: { key: Tab; label: string }[] = [
  { key: 'news', label: '新闻' },
  { key: 'trades', label: '交易' },
  { key: 'social', label: '舆论' },
  { key: 'create', label: '造假' },
]

const AGENT_ICONS: Record<string, string> = { leek: '🥬', whale: '🐋', scammer: '🎭' }

export default function LeftPanel() {
  const [tab, setTab] = useState<Tab>('news')
  const entries = useNewsStore((s) => s.entries)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (entries.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
    prevCountRef.current = entries.length
  }, [entries.length])

  const filtered = entries.filter((e) => {
    switch (tab) {
      case 'news': return NEWS_TYPES.includes(e.type)
      case 'trades': return TRADE_TYPES.includes(e.type)
      case 'social': return SOCIAL_TYPES.includes(e.type)
      default: return false
    }
  })

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
      ) : tab === 'trades' ? (
        <TradeFeed listRef={listRef} entries={filtered} />
      ) : (
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-1.5 scroll-smooth">
          {filtered.length === 0 && (
            <p className="text-text-muted text-xs animate-pulse mt-4 text-center">
              {tab === 'news' ? '等待新闻...' : '等待舆论...'}
            </p>
          )}
          {filtered.map((entry, i) => (
            <div
              key={`${entry.id}_${i}`}
              className={`rounded px-2 py-1.5 text-xs border animate-[slideIn_0.3s_ease-out] ${
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
                <span className="text-text-muted whitespace-nowrap text-[10px]">{formatTime(entry.time)}</span>
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
const TradeFeed = ({ listRef, entries }: { listRef: React.RefObject<HTMLDivElement | null>; entries: NewsEntry[] }) => {
  return (
    <div ref={listRef} className="flex-1 overflow-y-auto scroll-smooth font-mono text-[11px]">
      {/* Header */}
      <div className="flex items-center px-1 py-1 border-b border-border-panel text-text-muted text-[10px] sticky top-0 bg-bg-panel">
        <span className="w-[72px]">时间</span>
        <span className="w-[56px]">交易者</span>
        <span className="w-[36px] text-center">方向</span>
        <span className="w-[40px] text-right">手数</span>
        <span className="flex-1 text-right">品种</span>
      </div>

      {entries.length === 0 && (
        <p className="text-text-muted text-xs animate-pulse mt-4 text-center">等待交易...</p>
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
              className={`flex items-center px-1 py-0.5 animate-[slideIn_0.2s_ease-out] ${bgColor}`}
            >
              <span className="w-[72px] text-text-muted">{formatTime(entry.time)}</span>
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
  const canAfford = cash >= template.cost

  const handlePublish = () => {
    if (!canAfford) return
    usePlayerStore.setState({ cash: usePlayerStore.getState().cash - template.cost })

    const asset = targetAsset
    const priceImpact = template.priceDirection === 'up' ? template.priceMagnitude : -template.priceMagnitude

    const marketStore = useMarketStore.getState()
    const currentPrice = marketStore.prices[asset] ?? 1
    marketStore.updatePrice(asset, currentPrice * (1 + priceImpact))

    const sentimentStore = useSentimentStore.getState()
    sentimentStore.setGlobal(Math.max(0, Math.min(100, sentimentStore.global + template.sentimentMagnitude)))

    addEntry({
      id: `fake_${Date.now()}`,
      title: template.title,
      description: template.description.replace('{target}', asset),
      type: 'fake_news',
    })

    eventBus.emit('news:published', { id: `fake_${Date.now()}`, templateId: template.id, targetCountry: asset })
    setPublished(true)
    setTimeout(() => setPublished(false), 1500)
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">花钱制造假新闻操纵市场</p>

      <div>
        <label className="text-text-muted text-xs">目标资产</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {ALL_ASSETS.map((a) => (
            <button key={a.id} onClick={() => setTargetAsset(a.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${targetAsset === a.id ? 'bg-warn/20 text-warn border border-warn/30' : 'bg-bg-primary text-text-secondary'}`}
            >{a.id}</button>
          ))}
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
        <p className="text-gold text-xs mt-1">成本: {formatMoney(template.cost)}</p>
      </div>

      <button onClick={handlePublish} disabled={!canAfford || published}
        className={`w-full py-2 rounded font-bold text-sm ${published ? 'bg-up/20 text-up border border-up/40' : canAfford ? 'bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30' : 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'}`}
      >
        {published ? '已发布！' : canAfford ? `发布假新闻 (-${formatMoney(template.cost)})` : '资金不足'}
      </button>
    </div>
  )
}
