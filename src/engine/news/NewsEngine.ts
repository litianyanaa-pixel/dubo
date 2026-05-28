export interface NewsTemplate {
  id: string
  title: string
  description: string
  credibility: number // 0-100
  targetAsset?: string
  priceDirection: 'up' | 'down'
  priceMagnitude: number // 0.005 - 0.03
  sentimentMagnitude: number // 5-20
  cost: number
}

export const NEWS_TEMPLATES: NewsTemplate[] = [
  { id: 'n01', title: '央行意外加息', description: '{target}央行宣布紧急加息50个基点', credibility: 70, priceDirection: 'down', priceMagnitude: 0.015, sentimentMagnitude: -10, cost: 8000 },
  { id: 'n02', title: '央行意外降息', description: '{target}央行宣布降息刺激经济', credibility: 70, priceDirection: 'up', priceMagnitude: 0.015, sentimentMagnitude: 8, cost: 8000 },
  { id: 'n03', title: 'GDP数据超预期', description: '{target}公布GDP增速远超预期', credibility: 65, priceDirection: 'up', priceMagnitude: 0.01, sentimentMagnitude: 8, cost: 8000 },
  { id: 'n04', title: '经济衰退警告', description: '权威机构下调{target}经济评级', credibility: 60, priceDirection: 'down', priceMagnitude: 0.012, sentimentMagnitude: -12, cost: 8000 },
  { id: 'n05', title: '重大矿藏发现', description: '{target}宣布发现超大型稀有矿藏', credibility: 55, priceDirection: 'up', priceMagnitude: 0.02, sentimentMagnitude: 10, cost: 12000 },
  { id: 'n06', title: '恐怖袭击事件', description: '{target}首都发生严重恐怖袭击', credibility: 50, priceDirection: 'down', priceMagnitude: 0.018, sentimentMagnitude: -15, cost: 12000 },
  { id: 'n07', title: '贸易协定签署', description: '{target}与多国达成零关税协议', credibility: 65, priceDirection: 'up', priceMagnitude: 0.01, sentimentMagnitude: 10, cost: 8000 },
  { id: 'n08', title: '银行挤兑潮', description: '{target}多家大型银行出现挤兑', credibility: 60, priceDirection: 'down', priceMagnitude: 0.02, sentimentMagnitude: -18, cost: 15000 },
  { id: 'n09', title: '科技重大突破', description: '{target}科研机构宣布革命性技术', credibility: 50, priceDirection: 'up', priceMagnitude: 0.012, sentimentMagnitude: 12, cost: 10000 },
  { id: 'n10', title: '政治丑闻曝光', description: '{target}最高层爆出惊天贪腐丑闻', credibility: 55, priceDirection: 'down', priceMagnitude: 0.015, sentimentMagnitude: -14, cost: 10000 },
  { id: 'n11', title: '原油管道破裂', description: '主要输油管道发生严重泄漏', targetAsset: 'OIL', credibility: 60, priceDirection: 'up', priceMagnitude: 0.025, sentimentMagnitude: -8, cost: 8000 },
  { id: 'n12', title: '黄金矿脉枯竭', description: '全球最大金矿宣布储量下调40%', targetAsset: 'GOLD', credibility: 55, priceDirection: 'up', priceMagnitude: 0.02, sentimentMagnitude: -8, cost: 10000 },
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
