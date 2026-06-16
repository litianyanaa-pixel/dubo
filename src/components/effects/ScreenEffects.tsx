import { useEffect, useState, useRef } from 'react'
import { eventBus } from '@/engine/core/EventBus'
import { SFX } from '@/utils/sound'

type EffectKind =
  | 'flash-up'
  | 'flash-down'
  | 'shake-red'
  | 'amber-pulse'
  | 'purple-pulse'
  | 'gray-overlay'
  | 'banner-halt'
  | 'banner-war'
  | 'banner-arrest'
  | 'banner-debunk'
  | 'banner-rug'
  | 'banner-blackswan'

interface ActiveEffect {
  id: number
  kind: EffectKind
  text?: string
  sub?: string
}

let effectId = 0

/**
 * 全局事件动效层。监听 EventBus 关键事件,触发全屏边缘闪/震屏/横幅。
 * 挂在 GameLayout 根节点,pointer-events-none,不阻挡交互。
 */
export default function ScreenEffects() {
  const [effects, setEffects] = useState<ActiveEffect[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const pushEffect = (kind: EffectKind, text?: string, sub?: string, duration = 2000) => {
    const id = ++effectId
    setEffects((prev) => [...prev, { id, kind, text, sub }])
    const timer = setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id))
      timers.current.delete(id)
    }, duration)
    timers.current.set(id, timer)
  }

  useEffect(() => {
    const unsubs: Array<() => void> = []

    // 假新闻发布 → 琥珀色边缘脉冲
    unsubs.push(
      eventBus.on('news:published', () => {
        pushEffect('amber-pulse', undefined, undefined, 700)
      }),
    )

    // 突发事件 tier 3 → 涨跌全屏闪
    unsubs.push(
      eventBus.on('event:triggered', (payload) => {
        const tier = payload?.tier ?? 0
        if (tier >= 4) {
          // 黑天鹅
          pushEffect('shake-red', '⚠ 黑天鹅事件', '市场剧烈震荡', 2500)
          SFX.blackSwan()
        } else if (tier >= 3) {
          pushEffect('flash-down', undefined, undefined, 900)
          SFX.event()
        }
      }),
    )

    // 熔断 → 全屏横幅
    unsubs.push(
      eventBus.on('market:halt', () => {
        pushEffect('banner-halt', '⚠ 熔断暂停', '价格波动超限,市场临时冻结', 3000)
        SFX.circuitBreaker()
      }),
    )

    // 假新闻被揭穿
    unsubs.push(
      eventBus.on('news:debunked', () => {
        pushEffect('banner-debunk', '🕵 假新闻被揭穿', '操纵行为被监管识破', 2500)
        SFX.debunked()
      }),
    )

    // 战争开始
    unsubs.push(
      eventBus.on('war:started', () => {
        pushEffect('banner-war', '⚔ 战争爆发', '地缘冲突升级,避险资产飙升', 3000)
        SFX.warStart()
      }),
    )

    // 玩家被捕
    unsubs.push(
      eventBus.on('player:arrested', () => {
        pushEffect('banner-arrest', '🚔 你被捕了', '操纵市场被监管机构查处', 3000)
        SFX.bankruptcy()
      }),
    )

    // Rug-pull 启动
    unsubs.push(
      eventBus.on('rug:launched', () => {
        pushEffect('banner-rug', '💸 Rug Pull', '代币正在被项目方抽干', 3000)
        pushEffect('purple-pulse', undefined, undefined, 800)
        SFX.rugPull()
      }),
    )

    // Rug-pull 完成
    unsubs.push(
      eventBus.on('rug:completed', () => {
        pushEffect('flash-down', '归零', undefined, 1000)
      }),
    )

    return () => {
      unsubs.forEach((u) => u())
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
    }
  }, [])

  // 分层渲染:全屏闪/震屏底层,横幅顶层
  const ambientEffects = effects.filter((e) =>
    ['flash-up', 'flash-down', 'shake-red', 'amber-pulse', 'purple-pulse', 'gray-overlay'].includes(e.kind),
  )
  const bannerEffects = effects.filter((e) =>
    ['banner-halt', 'banner-war', 'banner-arrest', 'banner-debunk', 'banner-rug', 'banner-blackswan'].includes(e.kind),
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* 全屏氛围层 */}
      {ambientEffects.map((e) => {
        let cls = ''
        if (e.kind === 'flash-up') cls = 'animate-flash-up'
        else if (e.kind === 'flash-down') cls = 'animate-flash-down'
        else if (e.kind === 'amber-pulse') cls = 'animate-flash-up'
        else if (e.kind === 'purple-pulse') cls = 'animate-flash-down'
        if (e.kind === 'shake-red') {
          return (
            <div key={e.id} className="absolute inset-0 animate-shake animate-flash-down" />
          )
        }
        if (e.kind === 'gray-overlay') {
          return <div key={e.id} className="absolute inset-0 bg-black/40 animate-fade-in" />
        }
        return <div key={e.id} className={`absolute inset-0 ${cls}`} />
      })}

      {/* 横幅层 */}
      {bannerEffects.map((e, idx) => {
        const colorMap: Record<string, string> = {
          'banner-halt': 'bg-warn/15 border-warn/50 text-warn',
          'banner-war': 'bg-down/15 border-down/50 text-down',
          'banner-arrest': 'bg-danger/15 border-danger/50 text-danger',
          'banner-debunk': 'bg-info/15 border-info/50 text-info',
          'banner-rug': 'bg-crypto/15 border-crypto/50 text-crypto',
          'banner-blackswan': 'bg-danger/20 border-danger/60 text-danger',
        }
        const cls = colorMap[e.kind] ?? 'bg-warn/15 border-warn/50 text-warn'
        return (
          <div
            key={e.id}
            className="absolute left-1/2 -translate-x-1/2 animate-slide-in"
            style={{ top: `${80 + idx * 64}px` }}
          >
            <div className={`px-6 py-2.5 rounded-lg border-2 backdrop-blur-sm ${cls}`}>
              <div className="font-display font-bold text-lg text-center drop-shadow-lg">
                {e.text}
              </div>
              {e.sub && <div className="text-xs text-text-secondary text-center mt-0.5">{e.sub}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
