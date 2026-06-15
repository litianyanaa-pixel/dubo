import { useGameStore } from '@/stores/gameStore'

export default function HelpOverlay() {
  const showHelp = useGameStore((s) => s.showHelp)
  if (!showHelp) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => useGameStore.setState({ showHelp: false })}>
      <div className="bg-bg-panel border border-border-panel rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-up font-display text-lg">游戏指南</h2>
          <button onClick={() => useGameStore.setState({ showHelp: false })} className="text-text-muted hover:text-text-primary text-lg">✕</button>
        </div>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="text-warn font-bold mb-1">交易</h3>
            <p className="text-text-secondary leading-relaxed">
              顶栏选择资产品种，右侧面板操作交易。<strong className="text-up">开多</strong> = 买入看涨，<strong className="text-down">开空</strong> = 卖出看跌。仓位规模可用 1/4、1/2、全仓快捷键。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">KOL 操控</h3>
            <p className="text-text-secondary leading-relaxed">
              右侧面板展开「KOL 操盘」雇佣意见领袖。雇佣后可发送指令：<strong className="text-up">看多</strong>/<strong className="text-gold">贪婪</strong>推高价格，<strong className="text-down">看空</strong>/<strong className="text-danger">恐慌</strong>打压价格。KOL 有冷却时间，消息会影响对应专长品种的价格和全球情绪。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">假新闻</h3>
            <p className="text-text-secondary leading-relaxed">
              左侧「造假」标签页可花钱发布假新闻操纵市场。选择目标资产和新闻模板，直接冲击价格和情绪。不同角色有不同折扣。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">信息流</h3>
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">新闻</strong> — 随机事件和假新闻<br/>
              <strong className="text-text-primary">交易</strong> — AI 代理和你的交易记录<br/>
              <strong className="text-text-primary">舆论</strong> — AI 社交帖和 KOL 消息
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">角色天赋</h3>
            <p className="text-text-secondary leading-relaxed">
              每个角色有独特被动技能：猎犬·陈有内幕消息，教父·Z操纵KOL和假新闻成本更低，先知·林能预测价格，暗影·无名揭穿新闻效果更强，赌徒·阿杰有运气加成。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">目标</h3>
            <p className="text-text-secondary leading-relaxed">
              通过交易和操纵市场赚取利润。总资产低于 $100 则破产。随时可点击顶栏「结算」结束游戏查看成绩。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
