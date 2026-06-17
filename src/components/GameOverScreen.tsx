import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { formatMoney, formatPercent } from '@/utils/format'
import { SFX } from '@/utils/sound'
import CountUp from '@/components/CountUp'

export default function GameOverScreen() {
  const character = useGameStore((s) => s.character)
  const startCash = useGameStore((s) => s.startCash)
  const elapsed = useGameStore((s) => s.elapsed)
  const setPhase = useGameStore((s) => s.setPhase)
  const cash = usePlayerStore((s) => s.cash)
  const totalTrades = usePlayerStore((s) => s.totalTrades)
  const positions = usePlayerStore((s) => s.positions)
  const shorts = usePlayerStore((s) => s.shorts)
  const prices = useMarketStore((s) => s.prices)

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
  const isBankrupt = totalValue <= 0

  // Performance rank
  const rank = (() => {
    const pct = pnlPct * 100
    if (isBankrupt) return { title: '💀 彻底破产', desc: '金融市场又多了一具尸体', color: 'text-down' }
    if (pct >= 500) return { title: '🐉 金融巨鳄', desc: '华尔街看到你都要绕道走', color: 'text-gold' }
    if (pct >= 200) return { title: '🐋 市场巨鲸', desc: '你的每一笔交易都能掀起波澜', color: 'text-up' }
    if (pct >= 100) return { title: '🏆 操盘高手', desc: '稳定盈利，值得尊敬', color: 'text-up' }
    if (pct >= 50) return { title: '📈 小有所成', desc: '有天赋，但还需要磨练', color: 'text-warn' }
    if (pct >= 0) return { title: '😐 勉强保本', desc: '至少没亏...对吧？', color: 'text-text-secondary' }
    if (pct >= -50) return { title: '📉 小亏出场', desc: '市场不是每个人都能赢的', color: 'text-down' }
    if (pct >= -80) return { title: '🩸 大出血', desc: '也许该考虑找个正经工作了', color: 'text-down' }
    return { title: '☠️ 灰飞烟灭', desc: '你的资产几乎归零', color: 'text-danger' }
  })()

  const gameDays = Math.floor(elapsed / 60000) + 1
  const gameMinutes = Math.floor(elapsed / 1000 / 60)
  const gameSeconds = Math.floor(elapsed / 1000) % 60

  // ✅ 修复:把渲染期的副作用移到 useEffect,只执行一次
  useEffect(() => {
    SFX.settlement()
    useUnlockStore.getState().recordPnlPercent(pnlPct)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRestart = () => {
    // 重置玩家状态:仓位清空,frozenUntil 清零;cash 用角色初始资金(与 App.handleStart 一致)
    usePlayerStore.setState({
      cash: character?.cash ?? 100000,
      positions: {},
      shorts: {},
      totalTrades: 0,
      frozenUntil: 0,
    })
    useGameStore.setState({ phase: 'menu', character: null, elapsed: 0, speed: 1, showHelp: false, mode: 'standard' })
  }

  // 全屏色调:盈利金/绿光晕,破产红/灰暗角
  const ambientGlow = isBankrupt
    ? 'radial-gradient(ellipse at 50% 40%, rgba(255, 51, 102, 0.12), transparent 65%)'
    : totalPnl >= 0
      ? 'radial-gradient(ellipse at 50% 40%, rgba(255, 215, 0, 0.1), transparent 65%)'
      : 'radial-gradient(ellipse at 50% 40%, rgba(255, 51, 102, 0.08), transparent 65%)'

  return (
    <div
      className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center p-8 animate-fade-in"
      style={{ backgroundImage: ambientGlow }}
    >
      <div className="text-center mb-8 animate-reveal">
        <h1 className={`text-4xl font-display font-bold mb-2 ${isBankrupt ? 'text-down animate-pulse-gold' : 'text-up'}`}>
          {isBankrupt ? '破产清算' : '结算离场'}
        </h1>
        <p className="text-text-secondary text-sm">
          {isBankrupt ? '你的资产已归零，游戏结束' : `Day ${gameDays} · 游戏时长 ${gameMinutes}:${gameSeconds.toString().padStart(2, '0')}`}
        </p>
        <div className={`mt-3 text-xl font-display font-bold animate-count-pop ${rank.color} ${!isBankrupt && totalPnl >= 0 ? 'animate-pulse-gold' : ''}`}>
          {rank.title}
        </div>
        <p className="text-text-muted text-xs mt-1">{rank.desc}</p>
      </div>

      <div className="bg-bg-panel rounded-lg border border-border-panel p-6 w-80 space-y-3 animate-reveal" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{character?.icon}</span>
          <span className="text-text-primary font-bold">{character?.name}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">初始资金</span>
            <span className="text-text-secondary font-mono">{formatMoney(startCash)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">现金余额</span>
            <span className="text-gold font-mono">{formatMoney(cash)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">持仓市值</span>
            <span className="text-text-secondary font-mono">{formatMoney(longValue + shortPnl)}</span>
          </div>

          <div className="border-t border-border-panel pt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-text-muted">总资产</span>
              <span className="text-text-primary font-mono font-bold">
                <CountUp value={totalValue} duration={1200} />
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-text-muted">盈亏</span>
              <span className={`font-mono font-bold ${totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
                <CountUp
                  value={totalPnl}
                  duration={1200}
                  signed
                />
                <span className="ml-1">({formatPercent(pnlPct)})</span>
              </span>
            </div>
          </div>

          <div className="border-t border-border-panel pt-2">
            <div className="flex justify-between">
              <span className="text-text-muted">交易次数</span>
              <span className="text-text-secondary font-mono">{totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">游戏天数</span>
              <span className="text-text-secondary font-mono">{gameDays}天</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleRestart}
        className="relative overflow-hidden mt-6 px-8 py-3 rounded-lg font-display font-bold text-lg bg-up/20 text-up border-2 border-up/40 hover:bg-up/30 hover:scale-105 transition-all shadow-lg shadow-up/20 animate-reveal"
        style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-up/30 to-transparent"
          style={{ animation: 'sheen 2.5s ease-in-out infinite' }}
        />
        <span className="relative">重新开始</span>
      </button>
    </div>
  )
}
