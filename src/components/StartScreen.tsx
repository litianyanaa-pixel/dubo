import { useState } from 'react'
import { CHARACTERS, type Character } from '@/data/characters'
import { formatMoney } from '@/utils/format'
import { useUnlockStore } from '@/stores/unlockStore'
import { useGameStore } from '@/stores/gameStore'
import type { GameMode } from '@/engine/core/types'

interface Props {
  onStart: (character: Character) => void
}

const MODES: { key: GameMode; label: string; desc: string }[] = [
  { key: 'flash', label: '⚡ 闪电战', desc: '5分钟速战速决' },
  { key: 'standard', label: '📊 标准局', desc: '经典模式，自由交易' },
  { key: 'marathon', label: '🏃 马拉松', desc: '无限时间，持久战' },
  { key: 'sandbox', label: '🏖 沙盒', desc: '无限金钱，自由实验' },
]

export default function StartScreen({ onStart }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const mode = useGameStore((s) => s.mode)
  const setMode = useGameStore((s) => s.setMode)
  const unlockedIds = useUnlockStore((s) => s.unlockedIds)
  const totalFakeNews = useUnlockStore((s) => s.totalFakeNews)
  const totalBankruptcies = useUnlockStore((s) => s.totalBankruptcies)

  // Unlock hints
  const UNLOCK_HINTS: Record<string, string> = {
    anon: `发布假新闻 ${Math.min(totalFakeNews, 10)}/10`,
    dove: '单局盈利100%',
    jack: `破产 ${Math.min(totalBankruptcies, 3)}/3`,
  }

  return (
    <div className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in">
      {/* Title */}
      <div className="text-center mb-8 animate-reveal">
        <h1 className="text-5xl font-display font-bold text-up mb-2 animate-title-glow">运筹帷幄</h1>
        <p className="text-text-secondary text-sm">全球金融市场操控模拟器</p>
        <p className="text-text-muted text-xs mt-1">操控舆论 · 制造恐慌 · 在崩盘中获利</p>
      </div>

      {/* Mode selection */}
      <div className="flex gap-2 mb-6">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-4 py-2 rounded-lg border text-xs transition-all ${
              mode === m.key
                ? 'bg-up/15 border-up/40 text-up'
                : 'bg-bg-panel border-border-panel text-text-secondary hover:border-border-highlight'
            }`}
          >
            <div className="font-bold">{m.label}</div>
            <div className="text-[10px] text-text-muted mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-3 gap-3 max-w-3xl w-full mb-6">
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.id
          const isBaseUnlocked = char.unlocked
          const isUnlockStoreUnlocked = unlockedIds.includes(char.id)
          const isLocked = !isBaseUnlocked && !isUnlockStoreUnlocked
          return (
            <button
              key={char.id}
              onClick={() => !isLocked && setSelected(char.id)}
              disabled={isLocked}
              className={`text-left p-3 rounded-lg border transition-all ${
                isLocked
                  ? 'bg-bg-panel/30 border-border-panel cursor-not-allowed opacity-50'
                  : isSelected
                    ? 'bg-up/10 border-up/40 scale-[1.03] shadow-lg shadow-up/20 animate-pulse'
                    : 'bg-bg-panel border-border-panel hover:border-border-highlight hover:bg-bg-panel-hover hover:-translate-y-0.5 hover:shadow-md hover:shadow-up/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{isLocked ? '🔒' : char.icon}</span>
                <div>
                  <p className="text-text-primary text-sm font-bold">{char.name}</p>
                  <p className="text-text-muted text-[10px]">{char.title}</p>
                </div>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                  char.riskLabel === '稳健' ? 'bg-up/10 text-up'
                  : char.riskLabel === '高风险' ? 'bg-down/10 text-down'
                  : char.riskLabel === '赌狗' ? 'bg-danger/10 text-danger'
                  : char.riskLabel === '巨鲸' ? 'bg-gold/10 text-gold'
                  : 'bg-info/10 text-info'
                }`}>
                  {char.riskLabel}
                </span>
              </div>
              {isLocked ? (
                <p className="text-text-muted text-xs">{UNLOCK_HINTS[char.id] ?? '需解锁'}</p>
              ) : (
                <>
                  <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">{char.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gold text-xs font-mono">{formatMoney(char.cash)}</span>
                    <span className="text-text-muted text-[10px]">{char.startRegion}</span>
                  </div>
                  <p className="text-warn text-[10px] mt-1">{char.trait}</p>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Start button */}
      <button
        onClick={() => {
          const char = CHARACTERS.find((c) => c.id === selected)
          if (char) onStart(char)
        }}
        disabled={!selected}
        className={`relative overflow-hidden px-12 py-3 rounded-lg font-display font-bold text-lg transition-all ${
          selected
            ? 'bg-up/20 text-up border-2 border-up/40 hover:bg-up/30 hover:scale-105 shadow-lg shadow-up/20'
            : 'bg-bg-panel text-text-muted border-2 border-border-panel cursor-not-allowed'
        }`}
      >
        {selected && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-up/30 to-transparent"
            style={{ animation: 'sheen 2.5s ease-in-out infinite' }}
          />
        )}
        <span className="relative">{selected ? '开始操纵' : '选择角色'}</span>
      </button>
    </div>
  )
}
