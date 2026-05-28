import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import BottomBar from './BottomBar'
import PriceDisplay from '@/components/market/PriceDisplay'

export default function GameLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-bg-primary overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <main className="flex-1 flex items-center justify-center border-x border-border-panel">
          <PriceDisplay />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  )
}
