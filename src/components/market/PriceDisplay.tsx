import { useMarketStore } from '@/stores/marketStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { formatPrice, formatPercent } from '@/utils/format'
import { ALL_ASSETS } from '@/data/assets'

export default function PriceDisplay() {
  const selectedAsset = useSelectionStore((s) => s.selectedAsset)
  const price = useMarketStore((s) => s.prices[selectedAsset] ?? 1)
  const prev = useMarketStore((s) => s.prevPrices[selectedAsset] ?? 1)
  const change = prev !== 0 ? (price - prev) / prev : 0
  const isUp = change >= 0
  const asset = ALL_ASSETS.find((a) => a.id === selectedAsset)

  return (
    <div className="text-center">
      <p className="text-text-secondary text-sm mb-1">{asset?.name ?? selectedAsset} {selectedAsset}</p>
      <p className={`text-5xl font-display font-bold ${isUp ? 'text-up' : 'text-down'}`}>
        {formatPrice(price, (asset?.basePrice ?? 1) >= 100 ? 2 : 4)}
      </p>
      <p className={`text-lg mt-1 ${isUp ? 'text-up' : 'text-down'}`}>
        {formatPercent(change)}
      </p>
    </div>
  )
}
