export interface Character {
  id: string
  name: string
  title: string
  description: string
  cash: number
  startRegion: string
  trait: string
  riskLabel: string
  icon: string
  unlocked: boolean
}

export const CHARACTERS: Character[] = [
  {
    id: 'chen',
    name: '猎犬·陈',
    title: '华尔街猎犬',
    description: '前对冲基金经理，人脉通天，内幕消息源源不断。大资金玩家的最佳选择。',
    cash: 5_000_000,
    startRegion: '美国',
    trait: '内幕消息：每45秒获知一条未公开信息',
    riskLabel: '稳健',
    icon: '🐕',
    unlocked: true,
  },
  {
    id: 'z',
    name: '教父·Z',
    title: '舆论教父',
    description: '社交媒体操纵大师，50,000铁粉随时待命。一句话就能让市场翻天。',
    cash: 200_000,
    startRegion: '英国',
    trait: '舆论操控：假新闻成本-30%，KOL影响力×1.5',
    riskLabel: '高风险',
    icon: '👑',
    unlocked: true,
  },
  {
    id: 'lin',
    name: '先知·林',
    title: '量化先知',
    description: 'AI量化分析师，算法预测准确率60%。用数据碾压市场。',
    cash: 150_000,
    startRegion: '新加坡',
    trait: '数据挖掘：AI预测市场走势，精准操作',
    riskLabel: '技术流',
    icon: '🔮',
    unlocked: true,
  },
  {
    id: 'anon',
    name: '暗影·无名',
    title: '暗影操盘手',
    description: '暗网常客，多身份伪装大师。在离岸金融中心如鱼得水。',
    cash: 1_000_000,
    startRegion: '开曼群岛',
    trait: '不留痕迹：假新闻揭穿概率-50%',
    riskLabel: '阴暗',
    icon: '🎭',
    unlocked: false,
  },
  {
    id: 'dove',
    name: '白鸽',
    title: '国家意志',
    description: '主权基金代理人，50M启动资金。但每笔交易都有政治后果。',
    cash: 50_000_000,
    startRegion: '瑞士',
    trait: '国家信用：初始公信力80，但行动受约束',
    riskLabel: '巨鲸',
    icon: '🕊',
    unlocked: false,
  },
  {
    id: 'jack',
    name: '赌徒·阿杰',
    title: '疯狂赌徒',
    description: '纯赌狗，运气是核心资源。50/50事件实际胜率65%。要么暴富要么归零。',
    cash: 10_000,
    startRegion: '拉斯维加斯',
    trait: '赌神附体：50/50概率实际胜率65%',
    riskLabel: '赌狗',
    icon: '🎲',
    unlocked: false,
  },
]
