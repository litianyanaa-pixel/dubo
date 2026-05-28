import StartScreen from '@/components/StartScreen'
import GameLayout from '@/components/layout/GameLayout'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import type { Character } from '@/data/characters'

function GameView() {
  useGameLoop()
  return <GameLayout />
}

function App() {
  const phase = useGameStore((s) => s.phase)
  const setPhase = useGameStore((s) => s.setPhase)
  const setCharacter = useGameStore((s) => s.setCharacter)

  const handleStart = (char: Character) => {
    setCharacter(char)
    usePlayerStore.setState({ cash: char.cash, positions: {}, totalTrades: 0 })
    setPhase('playing')
  }

  if (phase === 'menu') {
    return <StartScreen onStart={handleStart} />
  }

  return <GameView />
}

export default App
