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
              顶栏选择资产品种，右侧面板操作交易。<strong className="text-up">开多</strong> = 买入看涨，<strong className="text-down">开空</strong> = 卖出看跌。仓位规模可用 1/4、1/2、全仓快捷键。右侧「全部持仓」面板显示所有仓位和实时盈亏，点击仓位可切换到该资产。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">操纵热度 与 逮捕</h3>
            <p className="text-text-secondary leading-relaxed">
              右侧顶部显示<strong className="text-warn">操纵热度</strong>条。造假、喊单、rug-pull 等操纵行为会累积热度；热度过高（≥15）有概率被监管<strong className="text-danger">逮捕</strong>：交易冻结 30 秒 + 现金罚款 10%。热度会随时间衰减，把钱存入<strong className="text-crypto">新加坡离岸账户</strong>可抵消热度。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">左侧操作面板（8 个标签）</h3>
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">信息类：</strong>新闻 / 交易 / 舆论<br/>
              <strong className="text-text-primary">操作类：</strong>
            </p>
            <ul className="text-text-secondary leading-relaxed mt-1 space-y-1 text-xs ml-2">
              <li><strong className="text-danger">造假</strong> — 花钱发布假新闻，直接冲击价格和情绪（可能被揭穿回调）</li>
              <li><strong className="text-gold">发币</strong> — 发行空气币，拉盘炒作后砸盘收割（$50K 发行 / $10K 拉盘）</li>
              <li><strong className="text-warn">拍卖</strong> — 🇸🇦 沙特定期拍卖大宗商品，竞标内幕可提前获知涨跌方向</li>
              <li><strong className="text-info">情报</strong> — 🇨🇭 瑞士保密法情报包，购买后获知权贵动向（方向未知，限时兑现）</li>
              <li><strong className="text-crypto">离岸</strong> — 🇸🇬 新加坡离岸账户：存款降操纵热度 + 利差套利（借低息投高息）</li>
            </ul>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">KOL 操控</h3>
            <p className="text-text-secondary leading-relaxed">
              右侧面板展开「KOL 操盘」雇佣意见领袖。雇佣后可发送指令：<strong className="text-up">看多</strong>/<strong className="text-gold">贪婪</strong>推高价格，<strong className="text-down">看空</strong>/<strong className="text-danger">恐慌</strong>打压价格。KOL 有冷却时间，消息会影响对应专长品种的价格和全球情绪。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">角色天赋</h3>
            <p className="text-text-secondary leading-relaxed">
              每个角色有独特被动技能：猎犬·陈每 45 秒收到内幕消息（含方向和幅度提示）；教父·Z 假新闻成本 -30%、KOL 影响力 ×1.5；先知·林能 AI 预测价格；暗影·无名假新闻揭穿概率减半；白鸽有国家信用（公信力门槛）；赌徒·阿杰运气加成。
            </p>
          </section>

          <section>
            <h3 className="text-warn font-bold mb-1">目标</h3>
            <p className="text-text-secondary leading-relaxed">
              通过交易和操纵市场赚取利润。总资产低于 $100 则破产。随时可点击顶栏「结算」结束游戏查看成绩和段位。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
