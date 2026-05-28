import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useMarketStore } from '@/stores/marketStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { ALL_ASSETS } from '@/data/assets'

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<typeof CandlestickSeries> | null>(null)
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)
  const prices = useMarketStore((s) => s.prices)
  const currentPrice = prices[selectedAsset] ?? 1

  // Rebuild chart when selected asset changes
  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      seriesRef.current = null
    }

    const asset = ALL_ASSETS.find((a) => a.id === selectedAsset)
    const precision = (asset?.basePrice ?? 1) >= 100 ? 2 : 4

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#888899',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
        attributionLogo: false,
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
      priceFormat: { type: 'price', precision, minMove: 1 / Math.pow(10, precision) },
    })

    // Load existing candle history
    const candles = useMarketStore.getState().candles[selectedAsset]
    if (candles && candles.length > 0) {
      series.setData(candles.map((c) => ({
        time: c.time as never,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })))
    }

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
    }
  }, [selectedAsset])

  // Update with new candle data
  useEffect(() => {
    if (!seriesRef.current) return
    const candles = useMarketStore.getState().candles[selectedAsset]
    if (!candles || candles.length === 0) return

    const last = candles[candles.length - 1]
    seriesRef.current.update({
      time: last.time as never,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    })
  }, [currentPrice, selectedAsset])

  return <div ref={containerRef} className="w-full h-full" />
}
