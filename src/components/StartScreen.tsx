import { useState } from 'react'
import { CHARACTERS, type Character } from '@/data/characters'
import { formatMoney } from '@/utils/format'

interface Props {
  onStart: (character: Character) => void
}

export default function StartScreen({ onStart }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-display font-bold text-up mb-2">运筹帷幄</h1>
        <p className="text-text-secondary text-sm">全球金融市场操控模拟器</p>
        <p className="text-text-muted text-xs mt-1">操控舆论 · 制造恐慌 · 在崩盘中获利</p>
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-3 gap-3 max-w-3xl w-full mb-6">
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.id
          const isLocked = !char.unlocked
          return (
            <button
              key={char.id}
              onClick={() => !isLocked && setSelected(char.id)}
              disabled={isLocked}
              className={`text-left p-3 rounded-lg border transition-all ${
                isLocked
                  ? 'bg-bg-panel/30 border-border-panel cursor-not-allowed opacity-50'
                  : isSelected
                    ? 'bg-up/10 border-up/40 scale-[1.02] shadow-lg shadow-up/10'
                    : 'bg-bg-panel border-border-panel hover:border-border-highlight hover:bg-bg-panel-hover'
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
                <p className="text-text-muted text-xs">需解锁</p>
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
        className={`px-12 py-3 rounded-lg font-display font-bold text-lg transition-all ${
          selected
            ? 'bg-up/20 text-up border-2 border-up/40 hover:bg-up/30 hover:scale-105 shadow-lg shadow-up/20'
            : 'bg-bg-panel text-text-muted border-2 border-border-panel cursor-not-allowed'
        }`}
      >
        {selected ? '开始操纵' : '选择角色'}
      </button>
    </div>
  )
}
