import { useMarketStore } from '@/stores/marketStore'
import { formatPrice, formatPercent } from '@/utils/format'

export default function PriceDisplay() {
  const price = useMarketStore((s) => s.prices['KAL'] ?? 1)
  const prev = useMarketStore((s) => s.prevPrices['KAL'] ?? 1)
  const change = prev !== 0 ? (price - prev) / prev : 0
  const isUp = change >= 0

  return (
    <div className="text-center">
      <p className="text-text-secondary text-sm mb-1">伽蓝币 KAL</p>
      <p className={`text-6xl font-display font-bold ${isUp ? 'text-up' : 'text-down'}`}>
        {formatPrice(price, 4)}
      </p>
      <p className={`text-lg mt-2 ${isUp ? 'text-up' : 'text-down'}`}>
        {formatPercent(change)}
      </p>
    </div>
  )
}
