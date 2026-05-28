import GameLayout from '@/components/layout/GameLayout'
import { useGameLoop } from '@/hooks/useGameLoop'

function App() {
  useGameLoop()

  return (
    <GameLayout />
  )
}

export default App
