export interface NewsTemplate {
  id: string
  title: string
  description: string
  credibility: number // 0-100
  targetAsset?: string
  priceDirection: 'up' | 'down'
  priceMagnitude: number // 0.005 - 0.03
  sentimentMagnitude: number // doubled for stronger impact
  cost: number
}

export const NEWS_TEMPLATES: NewsTemplate[] = [
  { id: 'n01', title: '央行意外加息', description: '{target}央行宣布紧急加息50个基点', credibility: 70, priceDirection: 'down', priceMagnitude: 0.015, sentimentMagnitude: -15, cost: 8000 },
  { id: 'n02', title: '央行意外降息', description: '{target}央行宣布降息刺激经济', credibility: 70, priceDirection: 'up', priceMagnitude: 0.015, sentimentMagnitude: 12, cost: 8000 },
  { id: 'n03', title: 'GDP数据超预期', description: '{target}公布GDP增速远超预期', credibility: 65, priceDirection: 'up', priceMagnitude: 0.01, sentimentMagnitude: 12, cost: 8000 },
  { id: 'n04', title: '经济衰退警告', description: '权威机构下调{target}经济评级', credibility: 60, priceDirection: 'down', priceMagnitude: 0.012, sentimentMagnitude: -18, cost: 8000 },
  { id: 'n05', title: '重大矿藏发现', description: '{target}宣布发现超大型稀有矿藏', credibility: 55, priceDirection: 'up', priceMagnitude: 0.02, sentimentMagnitude: 15, cost: 12000 },
  { id: 'n06', title: '恐怖袭击事件', description: '{target}首都发生严重恐怖袭击', credibility: 50, priceDirection: 'down', priceMagnitude: 0.018, sentimentMagnitude: -22, cost: 12000 },
  { id: 'n07', title: '贸易协定签署', description: '{target}与多国达成零关税协议', credibility: 65, priceDirection: 'up', priceMagnitude: 0.01, sentimentMagnitude: 15, cost: 8000 },
  { id: 'n08', title: '银行挤兑潮', description: '{target}多家大型银行出现挤兑', credibility: 60, priceDirection: 'down', priceMagnitude: 0.02, sentimentMagnitude: -25, cost: 15000 },
  { id: 'n09', title: '科技重大突破', description: '{target}科研机构宣布革命性技术', credibility: 50, priceDirection: 'up', priceMagnitude: 0.012, sentimentMagnitude: 18, cost: 10000 },
  { id: 'n10', title: '政治丑闻曝光', description: '{target}最高层爆出惊天贪腐丑闻', credibility: 55, priceDirection: 'down', priceMagnitude: 0.015, sentimentMagnitude: -20, cost: 10000 },
  { id: 'n11', title: '原油管道破裂', description: '主要输油管道发生严重泄漏', targetAsset: 'OIL', credibility: 60, priceDirection: 'up', priceMagnitude: 0.025, sentimentMagnitude: -12, cost: 8000 },
  { id: 'n12', title: '黄金矿脉枯竭', description: '全球最大金矿宣布储量下调40%', targetAsset: 'DGOLD', credibility: 55, priceDirection: 'up', priceMagnitude: 0.02, sentimentMagnitude: -12, cost: 10000 },
  { id: 'n13', title: '主权基金入场', description: '{target}主权基金宣布千亿级投资计划', credibility: 75, priceDirection: 'up', priceMagnitude: 0.015, sentimentMagnitude: 15, cost: 15000 },
  { id: 'n14', title: '金融监管风暴', description: '{target}宣布全面加强金融监管', credibility: 65, priceDirection: 'down', priceMagnitude: 0.01, sentimentMagnitude: -10, cost: 8000 },
  { id: 'n15', title: '军事冲突升级', description: '{target}边境军事对峙全面升级', credibility: 55, priceDirection: 'down', priceMagnitude: 0.02, sentimentMagnitude: -25, cost: 12000 },
  { id: 'n16', title: '疫苗重大突破', description: '{target}宣布攻克某种重大疾病', credibility: 50, priceDirection: 'up', priceMagnitude: 0.008, sentimentMagnitude: 20, cost: 10000 },
  { id: 'n17', title: '大规模黑客攻击', description: '{target}金融系统遭国家级黑客攻击', credibility: 60, priceDirection: 'down', priceMagnitude: 0.015, sentimentMagnitude: -18, cost: 10000 },
  { id: 'n18', title: '能源革命宣言', description: '{target}宣布全面转向可再生能源', credibility: 55, priceDirection: 'up', priceMagnitude: 0.008, sentimentMagnitude: 10, cost: 8000 },
]

export class NewsEngine {
  publish(template: NewsTemplate, targetAsset: string): {
    title: string
    description: string
    assetId: string
    priceImpact: number
    sentimentImpact: number
  } {
    const assetId = template.targetAsset ?? targetAsset
    const priceImpact = template.priceDirection === 'up'
      ? template.priceMagnitude
      : -template.priceMagnitude

    return {
      title: template.title,
      description: template.description.replace('{target}', assetId),
      assetId,
      priceImpact,
      sentimentImpact: template.sentimentMagnitude,
    }
  }
}
