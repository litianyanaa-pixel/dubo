/**
 * 新加坡离岸账户引擎
 *
 * 玩法: 新加坡作为法外离岸金融中心,玩家可将现金转入"离岸账户":
 * 1. 降低被逮捕概率(操纵监管热度的抵消项)
 * 2. 支持利差套利(carry trade):借低息货币投高息货币,赚取利差
 *
 * 利差套利: 每次操作,根据借入货币与投资货币的利率差计算收益。
 * 低息货币(融资货币): JPY(0.1%) / CHF(1.75%)
 * 高息货币(投资货币): SAR(6.0%) / USD(5.25%) / GBP(5.0%)
 *
 * 离岸账户不挂在主 tick(它是玩家主动操作驱动),但提供一个 L4 tick 方法用于:
 * - 每周期结算已建立的套利头寸的浮动盈亏
 * - 缓慢衰减离岸账户对监管的抵消效果(持续维护成本)
 */
import { INITIAL_COUNTRIES } from '@/data/countries'

export interface CarryTrade {
  id: string
  /** 借入(融资)货币 id,低息 */
  fundingCurrency: string
  /** 投资(标的)货币 id,高息 */
  targetCurrency: string
  /** 借入金额 */
  notional: number
  /** 建仓时的利差(年化百分比) */
  rateSpread: number
  /** 已持有的 tick 数(用于计算利差收益) */
  ageTicks: number
}

export interface OffshoreState {
  /** 离岸账户余额 */
  balance: number
  /** 当前监管抵消强度(0-100,随时间衰减),越高越能降低逮捕概率 */
  shieldStrength: number
  /** 活跃的利差套利头寸 */
  carryTrades: CarryTrade[]
}

let tradeCounter = 0

export class OffshoreEngine {
  private state: OffshoreState = {
    balance: 0,
    shieldStrength: 0,
    carryTrades: [],
  }

  /** L4 tick 结算: 套利头寸累积利差收益 + 监管抵消衰减 */
  tick(): { carryIncome: number } {
    let carryIncome = 0
    for (const trade of this.state.carryTrades) {
      trade.ageTicks++
      // 利差收益 = 名义本金 × 年化利差 × (tick 时长占比)
      // 一个 L4 tick = 30s,游戏内 1 分钟 ≈ 1 模拟日,简化:每 tick 产出 spread/365 的日利差
      const dailySpread = trade.rateSpread / 100 / 365
      const income = trade.notional * dailySpread
      carryIncome += income
      this.state.balance += income
    }

    // 监管抵消强度缓慢衰减(每 tick -2),需要持续转入资金维持
    this.state.shieldStrength = Math.max(0, this.state.shieldStrength - 2)

    return { carryIncome }
  }

  /** 从主账户转入现金到离岸账户。shieldStrength 按转入金额比例提升 */
  deposit(amount: number): boolean {
    if (amount <= 0) return false
    this.state.balance += amount
    // 每 $50k 转入提升 10 点抵消强度,上限 100
    const boost = Math.min(100 - this.state.shieldStrength, (amount / 50000) * 10)
    this.state.shieldStrength = Math.min(100, this.state.shieldStrength + boost)
    return true
  }

  /** 从离岸账户转出现金回主账户 */
  withdraw(amount: number): number {
    const actual = Math.min(amount, this.state.balance)
    this.state.balance -= actual
    return actual
  }

  /** 建立利差套利头寸: 借融资货币,投标的货币。资金从离岸账户扣除 */
  openCarryTrade(fundingCurrency: string, targetCurrency: string, notional: number): CarryTrade | null {
    if (notional <= 0 || notional > this.state.balance) return null
    const funding = INITIAL_COUNTRIES.find(c => c.currencyId === fundingCurrency)
    const target = INITIAL_COUNTRIES.find(c => c.currencyId === targetCurrency)
    if (!funding || !target) return null
    // 必须是正利差(借低投高)
    const spread = target.interestRate - funding.interestRate
    if (spread <= 0) return null

    this.state.balance -= notional
    const trade: CarryTrade = {
      id: `carry_${tradeCounter++}`,
      fundingCurrency,
      targetCurrency,
      notional,
      rateSpread: spread,
      ageTicks: 0,
    }
    this.state.carryTrades.push(trade)
    return trade
  }

  /** 平仓一个套利头寸,本金归还离岸账户 */
  closeCarryTrade(tradeId: string): CarryTrade | null {
    const idx = this.state.carryTrades.findIndex(t => t.id === tradeId)
    if (idx < 0) return null
    const trade = this.state.carryTrades.splice(idx, 1)[0]
    this.state.balance += trade.notional
    return trade
  }

  getState(): OffshoreState {
    return {
      balance: this.state.balance,
      shieldStrength: this.state.shieldStrength,
      carryTrades: [...this.state.carryTrades],
    }
  }

  /** 提供给 CountryEngine 的监管抵消查询: 返回当前抵消强度 */
  getShieldStrength(): number {
    return this.state.shieldStrength
  }
}
