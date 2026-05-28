import { useEffect, useRef } from 'react'
import { useNewsStore } from '@/stores/newsStore'
import { formatTime } from '@/utils/format'

export default function LeftPanel() {
  const entries = useNewsStore((s) => s.entries)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (entries.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
    prevCountRef.current = entries.length
  }, [entries.length])

  return (
    <div className="w-[280px] bg-bg-panel border-r border-border-panel p-3 flex flex-col">
      <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">新闻 / 舆论流</h3>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-1.5 scroll-smooth"
      >
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
                  : 'bg-up/5 border-up/20'
            }`}
          >
            <div className="flex justify-between items-start gap-1">
              <span className={entry.type === 'event' ? 'text-warn' : 'text-text-primary'}>
                {entry.type === 'event' ? '⚡ ' : entry.type === 'ai_trade' ? '📊 ' : '💰 '}
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
    </div>
  )
}
