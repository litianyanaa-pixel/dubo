import StartScreen from '@/components/StartScreen'
import GameOverScreen from '@/components/GameOverScreen'
import ErrorBoundary from '@/components/ErrorBoundary'
import HelpOverlay from '@/components/HelpOverlay'
import ToastContainer from '@/components/Toast'
import GameLayout from '@/components/layout/GameLayout'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import type { Character } from '@/data/characters'

type AppPhase = 'menu' | 'playing' | 'gameover'

function GameView() {
  useGameLoop()
  return <GameLayout />
}

function App() {
  const phase = useGameStore((s) => s.phase as AppPhase)
  const setPhase = useGameStore((s) => s.setPhase)
  const setCharacter = useGameStore((s) => s.setCharacter)

  const handleStart = (char: Character) => {
    const mode = useGameStore.getState().mode
    setCharacter(char)
    const startingCash = mode === 'sandbox' ? 999_999_999 : char.cash
    usePlayerStore.setState({ cash: startingCash, positions: {}, shorts: {}, totalTrades: 0 })
    setPhase('playing')
  }

  if (phase === 'menu') {
    return <StartScreen onStart={handleStart} />
  }

  if (phase === 'gameover') {
    return <GameOverScreen />
  }

  return (
    <ErrorBoundary fallback={
      <div className="h-screen w-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-down text-xl font-bold mb-2">渲染错误</p>
          <p className="text-text-muted text-sm mb-4">游戏界面加载失败，请尝试刷新</p>
          <button onClick={() => useGameStore.setState({ phase: 'menu' })}
            className="px-6 py-2 bg-up/20 text-up rounded">返回主菜单</button>
        </div>
      </div>
    }>
      <GameView />
      <HelpOverlay />
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App
