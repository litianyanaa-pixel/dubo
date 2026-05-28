import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useMarketStore } from '@/stores/marketStore'

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
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

    const series = chart.addAreaSeries({
      lineColor: '#00ff88',
      topColor: 'rgba(0, 255, 136, 0.15)',
      bottomColor: 'rgba(0, 255, 136, 0.01)',
      lineWidth: 2,
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
    const history = useMarketStore.getState().history['KAL']
    if (!history || history.length === 0) return

    const lastPoint = history[history.length - 1]
    seriesRef.current.update({
      time: Math.floor(lastPoint.time / 1000) as unknown as import('lightweight-charts').UTCTimestamp,
      value: lastPoint.price,
    })
  }, [kalPrice])

  return <div ref={containerRef} className="w-full h-full" />
}
