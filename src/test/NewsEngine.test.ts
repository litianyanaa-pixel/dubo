import { describe, it, expect } from 'vitest'
import { NewsEngine, NEWS_TEMPLATES } from '@/engine/news/NewsEngine'

describe('NewsEngine', () => {
  it('has 18 news templates', () => {
    expect(NEWS_TEMPLATES.length).toBe(18)
  })

  it('all templates have required fields', () => {
    for (const t of NEWS_TEMPLATES) {
      expect(t.id.length).toBeGreaterThan(0)
      expect(t.title.length).toBeGreaterThan(0)
      expect(t.description.length).toBeGreaterThan(0)
      // Templates either have {target} placeholder or a fixed targetAsset
      expect(t.description.includes('{target}') || t.targetAsset !== undefined).toBe(true)
      expect(['up', 'down']).toContain(t.priceDirection)
      expect(t.priceMagnitude).toBeGreaterThan(0)
      expect(t.cost).toBeGreaterThan(0)
      expect(t.credibility).toBeGreaterThan(0)
      expect(t.credibility).toBeLessThanOrEqual(100)
    }
  })

  it('publish resolves template against target', () => {
    const engine = new NewsEngine()
    const template = NEWS_TEMPLATES[0]
    const result = engine.publish(template, 'USD')

    expect(result.title).toBe(template.title)
    expect(result.description).toContain('USD')
    expect(result.description).not.toContain('{target}')
    expect(result.assetId).toBe('USD')
  })

  it('publish with template that has targetAsset uses that instead', () => {
    const engine = new NewsEngine()
    const oilTemplate = NEWS_TEMPLATES.find(t => t.targetAsset === 'OIL')!
    const result = engine.publish(oilTemplate, 'USD')

    expect(result.assetId).toBe('OIL')
    // Template without {target} won't have OIL in description, but assetId is correct
    expect(result.priceImpact).toBeDefined()
  })

  it('publish returns positive priceImpact for up direction', () => {
    const engine = new NewsEngine()
    const upTemplate = NEWS_TEMPLATES.find(t => t.priceDirection === 'up')!
    const result = engine.publish(upTemplate, 'USD')
    expect(result.priceImpact).toBeGreaterThan(0)
  })

  it('publish returns negative priceImpact for down direction', () => {
    const engine = new NewsEngine()
    const downTemplate = NEWS_TEMPLATES.find(t => t.priceDirection === 'down')!
    const result = engine.publish(downTemplate, 'USD')
    expect(result.priceImpact).toBeLessThan(0)
  })

  it('templates have a range of costs', () => {
    const costs = NEWS_TEMPLATES.map(t => t.cost)
    const minCost = Math.min(...costs)
    const maxCost = Math.max(...costs)
    expect(minCost).toBeGreaterThan(0)
    expect(maxCost).toBeGreaterThan(minCost)
  })

  it('templates have both up and down directions', () => {
    const ups = NEWS_TEMPLATES.filter(t => t.priceDirection === 'up')
    const downs = NEWS_TEMPLATES.filter(t => t.priceDirection === 'down')
    expect(ups.length).toBeGreaterThan(0)
    expect(downs.length).toBeGreaterThan(0)
  })
})
