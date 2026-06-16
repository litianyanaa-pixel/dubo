import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** 目标值 */
  value: number
  /** 动画时长(ms),默认 1000 */
  duration?: number
  /** 小数位数,默认 0 */
  decimals?: number
  /** 千分位格式化,默认 true */
  thousandsSeparator?: boolean
  /** 前缀,如 "$" */
  prefix?: string
  /** 后缀,如 "%" */
  suffix?: string
  /** 是否带正负号(用于盈亏) */
  signed?: boolean
  className?: string
}

/**
 * 数字从 0 滚动到目标值的小组件。
 * 用 requestAnimationFrame + easeOutCubic 缓动,挂在卸载时自动取消。
 */
export default function CountUp({
  value,
  duration = 1000,
  decimals = 0,
  thousandsSeparator = true,
  prefix = '',
  suffix = '',
  signed = false,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = value

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: thousandsSeparator,
  })

  const signStr = signed ? (value > 0 ? '+' : value < 0 ? '' : '') : ''

  return (
    <span className={`animate-count-pop inline-block ${className ?? ''}`}>
      {signStr}{prefix}{formatted}{suffix}
    </span>
  )
}
