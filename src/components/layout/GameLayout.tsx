import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import BottomBar from './BottomBar'
import PriceDisplay from '@/components/market/PriceDisplay'
import PriceChart from '@/components/market/PriceChart'
import ScreenEffects from '@/components/effects/ScreenEffects'

export default function GameLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-bg-primary overflow-hidden">
      <ScreenEffects />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <main className="flex-1 flex flex-col border-x border-border-panel">
          <div className="flex-1 min-h-0">
            <PriceChart />
          </div>
          <div className="h-24 flex items-center justify-center border-t border-border-panel">
            <PriceDisplay />
          </div>
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  )
}
