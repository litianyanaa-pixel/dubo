import { describe, it, expect } from 'vitest'
import { formatPrice, formatPercent, formatMoney, formatTime } from '@/utils/format'

describe('formatPrice', () => {
  it('formats with default 4 decimals', () => {
    expect(formatPrice(1.2345)).toBe('1.2345')
  })

  it('formats with custom decimals', () => {
    expect(formatPrice(1.23, 2)).toBe('1.23')
  })

  it('pads zeros', () => {
    expect(formatPrice(1, 4)).toBe('1.0000')
  })
})

describe('formatPercent', () => {
  it('positive adds + sign', () => {
    expect(formatPercent(0.05)).toBe('+5.00%')
  })

  it('negative has no + sign', () => {
    expect(formatPercent(-0.03)).toBe('-3.00%')
  })

  it('zero shows +', () => {
    expect(formatPercent(0)).toBe('+0.00%')
  })
})

describe('formatMoney', () => {
  it('millions', () => {
    expect(formatMoney(1_500_000)).toBe('$1.50M')
  })

  it('thousands', () => {
    expect(formatMoney(25000)).toBe('$25.0K')
  })

  it('small amounts', () => {
    expect(formatMoney(123.45)).toBe('$123.45')
  })

  it('negative amounts', () => {
    expect(formatMoney(-5000)).toBe('$-5.0K')
  })
})

describe('formatTime', () => {
  it('formats seconds', () => {
    expect(formatTime(30000)).toBe('00:30')
  })

  it('formats minutes:seconds', () => {
    expect(formatTime(125000)).toBe('02:05')
  })

  it('pads single digits', () => {
    expect(formatTime(5000)).toBe('00:05')
  })

  it('zero', () => {
    expect(formatTime(0)).toBe('00:00')
  })
})
