export default function BottomBar() {
  return (
    <div className="h-[100px] flex border-t border-border-panel bg-bg-panel">
      <div className="flex-1 p-2 border-r border-border-panel">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">事件日志</h4>
        <p className="text-text-muted text-xs mt-1">Phase 2</p>
      </div>
      <div className="flex-1 p-2 border-r border-border-panel">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">预警</h4>
        <p className="text-text-muted text-xs mt-1">Phase 2</p>
      </div>
      <div className="flex-1 p-2">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">AI 监控</h4>
        <p className="text-text-muted text-xs mt-1">Phase 2</p>
      </div>
    </div>
  )
}
