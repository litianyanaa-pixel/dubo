export type AIType = 'leek' | 'whale' | 'scammer'

export interface AIAgent {
  id: string
  name: string
  type: AIType
  cash: number
  holdings: Record<string, number>
  riskTolerance: number // 0-1
}

export interface AITradeLog {
  agentId: string
  agentName: string
  agentType: AIType
  assetId: string
  side: 'buy' | 'sell'
  amount: number
  price: number
}
