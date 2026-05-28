import { useState, useEffect, useRef } from 'react'
import { useNewsStore } from '@/stores/newsStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useSentimentStore } from '@/stores/sentimentStore'
import { formatTime, formatMoney } from '@/utils/format'
import { NEWS_TEMPLATES } from '@/engine/news/NewsEngine'
import { ALL_ASSETS } from '@/data/assets'
import { eventBus } from '@/engine/core/EventBus'

type Tab = 'feed' | 'create'

export default function LeftPanel() {
  const [tab, setTab] = useState<Tab>('feed')
  const entries = useNewsStore((s) => s.entries)
  const cash = usePlayerStore((s) => s.cash)
  const addEntry = useNewsStore((s) => s.addEntry)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (entries.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
    prevCountRef.current = entries.length
  }, [entries.length])

  return (
    <div className="w-[280px] bg-bg-panel border-r border-border-panel p-3 flex flex-col">
      {/* Tab selector */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => setTab('feed')}
          className={`flex-1 py-1 rounded text-xs font-bold ${tab === 'feed' ? 'bg-up/20 text-up border border-up/30' : 'text-text-secondary hover:bg-bg-panel-hover'}`}
        >
          新闻流
        </button>
        <button
          onClick={() => setTab('create')}
          className={`flex-1 py-1 rounded text-xs font-bold ${tab === 'create' ? 'bg-warn/20 text-warn border border-warn/30' : 'text-text-secondary hover:bg-bg-panel-hover'}`}
        >
          造假新闻
        </button>
      </div>

      {tab === 'feed' ? (
        <FeedTab entries={entries} listRef={listRef} />
      ) : (
        <CreateTab cash={cash} addEntry={addEntry} />
      )}
    </div>
  )
}

function FeedTab({ entries, listRef }: { entries: ReturnType<typeof useNewsStore.getState>['entries']; listRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={listRef} className="flex-1 overflow-y-auto space-y-1.5 scroll-smooth">
      {entries.length === 0 && (
        <p className="text-text-muted text-xs animate-pulse">等待事件...</p>
      )}
      {entries.map((entry, i) => (
        <div
          key={`${entry.id}_${i}`}
          className={`rounded px-2 py-1.5 text-xs border animate-[slideIn_0.3s_ease-out] ${
            entry.type === 'event'
              ? 'bg-warn/5 border-warn/20'
              : entry.type === 'ai_trade'
                ? 'bg-info/5 border-info/20'
                : entry.type === 'fake_news'
                  ? 'bg-danger/5 border-danger/20'
                  : 'bg-up/5 border-up/20'
          }`}
        >
          <div className="flex justify-between items-start gap-1">
            <span className={
              entry.type === 'event' ? 'text-warn'
              : entry.type === 'fake_news' ? 'text-danger'
              : 'text-text-primary'
            }>
              {entry.type === 'event' ? '⚡ ' : entry.type === 'ai_trade' ? '📊 ' : entry.type === 'fake_news' ? '🎭 ' : '💰 '}
              {entry.title}
            </span>
            <span className="text-text-muted whitespace-nowrap text-[10px]">
              {formatTime(entry.time)}
            </span>
          </div>
          {entry.description && (
            <p className="text-text-muted mt-0.5">{entry.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function CreateTab({ cash, addEntry }: { cash: number; addEntry: ReturnType<typeof useNewsStore.getState>['addEntry'] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [targetAsset, setTargetAsset] = useState('KAL')
  const [published, setPublished] = useState(false)

  const template = NEWS_TEMPLATES[selectedTemplate]
  const canAfford = cash >= template.cost

  const handlePublish = () => {
    if (!canAfford) return

    const playerStore = usePlayerStore.getState()
    playerStore.buy('COST', template.cost, 1) // Deduct cost

    const asset = targetAsset
    const priceImpact = template.priceDirection === 'up' ? template.priceMagnitude : -template.priceMagnitude

    // Impact market
    const marketStore = useMarketStore.getState()
    const currentPrice = marketStore.prices[asset] ?? 1
    marketStore.updatePrice(asset, currentPrice * (1 + priceImpact))

    // Impact sentiment
    const sentimentStore = useSentimentStore.getState()
    sentimentStore.setGlobal(Math.max(0, Math.min(100, sentimentStore.global + template.sentimentMagnitude)))

    addEntry({
      id: `fake_${Date.now()}`,
      title: `[假] ${template.title}`,
      description: template.description.replace('{target}', asset),
      type: 'fake_news',
    })

    eventBus.emit('news:published', {
      id: `fake_${Date.now()}`,
      templateId: template.id,
      targetCountry: asset,
    })

    setPublished(true)
    setTimeout(() => setPublished(false), 1500)
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <p className="text-text-muted text-xs">花费金钱制造假新闻操纵市场</p>

      {/* Target asset */}
      <div>
        <label className="text-text-muted text-xs">目标资产</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {ALL_ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => setTargetAsset(a.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${targetAsset === a.id ? 'bg-warn/20 text-warn border border-warn/30' : 'bg-bg-primary text-text-secondary'}`}
            >
              {a.id}
            </button>
          ))}
        </div>
      </div>

      {/* Template selection */}
      <div>
        <label className="text-text-muted text-xs">新闻模板</label>
        <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
          {NEWS_TEMPLATES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(i)}
              className={`w-full text-left px-2 py-1 rounded text-xs ${
                selectedTemplate === i
                  ? 'bg-warn/10 border border-warn/30 text-text-primary'
                  : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover'
              }`}
            >
              <div className="flex justify-between">
                <span>{t.title}</span>
                <span className={t.priceDirection === 'up' ? 'text-up' : 'text-down'}>
                  {t.priceDirection === 'up' ? '▲' : '▼'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-bg-primary rounded p-2 border border-border-panel">
        <p className="text-text-primary text-xs font-bold">{template.title}</p>
        <p className="text-text-muted text-xs mt-1">{template.description.replace('{target}', targetAsset)}</p>
        <div className="flex gap-3 mt-2 text-[10px]">
          <span className={template.priceDirection === 'up' ? 'text-up' : 'text-down'}>
            价格冲击: {(template.priceMagnitude * 100).toFixed(1)}%
          </span>
          <span className={template.sentimentMagnitude > 0 ? 'text-up' : 'text-down'}>
            情绪: {template.sentimentMagnitude > 0 ? '+' : ''}{template.sentimentMagnitude}
          </span>
        </div>
        <p className="text-gold text-xs mt-1">成本: {formatMoney(template.cost)}</p>
      </div>

      <button
        onClick={handlePublish}
        disabled={!canAfford || published}
        className={`w-full py-2 rounded font-bold text-sm ${
          published
            ? 'bg-up/20 text-up border border-up/40'
            : canAfford
              ? 'bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30'
              : 'bg-bg-primary text-text-muted border border-border-panel cursor-not-allowed'
        }`}
      >
        {published ? '已发布！' : canAfford ? `发布假新闻 (-${formatMoney(template.cost)})` : '资金不足'}
      </button>
    </div>
  )
}
