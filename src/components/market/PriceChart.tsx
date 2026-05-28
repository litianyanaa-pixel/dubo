import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useMarketStore } from '@/stores/marketStore'

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<typeof CandlestickSeries> | null>(null)
  const prices = useMarketStore((s) => s.prices)
  const kalPrice = prices['KAL'] ?? 1

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#888899',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e1e2e' },
        horzLines: { color: '#1e1e2e' },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        borderColor: '#1e1e2e',
      },
      rightPriceScale: {
        borderColor: '#1e1e2e',
      },
      crosshair: {
        horzLine: { color: '#2a2a3e', labelBackgroundColor: '#2a2a3e' },
        vertLine: { color: '#2a2a3e', labelBackgroundColor: '#2a2a3e' },
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3366',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff3366',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3366',
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    })

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current) return
    const candles = useMarketStore.getState().candles['KAL']
    if (!candles || candles.length === 0) return

    const last = candles[candles.length - 1]
    seriesRef.current.update({
      time: last.time as never,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    })
  }, [kalPrice])

  return <div ref={containerRef} className="w-full h-full" />
}
