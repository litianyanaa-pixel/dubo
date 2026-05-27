# Phase 1 骨架搭建 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建完整项目骨架，`npm run dev` 能看到深色终端UI，GameLoop跑tick，KAL价格跳动。

**Architecture:** 引擎层纯TS（不依赖React），通过EventBus解耦。Zustand store绑定EventBus事件驱动UI更新。GameLoop用requestAnimationFrame + tick累加器。

**Tech Stack:** Vite, React 18, TypeScript 5, TailwindCSS, Zustand, Lightweight Charts（仅安装）, Howler.js（仅安装）

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: 用Vite创建项目**

```bash
cd E:/project/dubo
npm create vite@latest . -- --template react-ts
```

如果提示目录非空，选择忽略/覆盖。然后安装依赖：

```bash
npm install
```

- [ ] **Step 2: 安装所有项目依赖**

```bash
npm install zustand lightweight-charts howler framer-motion
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 TailwindCSS**

替换 `src/index.css` 内容为：

```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #0a0a0f;
  --color-bg-panel: #12121a;
  --color-bg-panel-hover: #1a1a28;
  --color-border-panel: #1e1e2e;
  --color-border-highlight: #2a2a3e;
  --color-up: #00ff88;
  --color-down: #ff3366;
  --color-warn: #ffaa00;
  --color-danger: #ff0055;
  --color-info: #00bbff;
  --color-gold: #ffd700;
  --color-crypto: #bf5af2;
  --color-darknet: #ff00ff;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #888899;
  --color-text-muted: #555566;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-display: 'Orbitron', 'Rajdhani', sans-serif;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-panel) transparent;
}
```

更新 `vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

更新 `tsconfig.app.json`，在 `compilerOptions` 中添加路径别名（在现有 paths 位置或新增）：

```json
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}
```

- [ ] **Step 4: 清理默认模板文件**

删除 `src/App.css`，替换 `src/App.tsx` 为最小壳子：

```tsx
function App() {
  return (
    <div className="h-screen w-screen bg-bg-primary text-text-primary overflow-hidden">
      <h1 className="text-up font-display text-2xl p-4">运筹帷幄</h1>
    </div>
  )
}

export default App
```

- [ ] **Step 5: 验证开发服务器启动**

```bash
npm run dev
```

Expected: 浏览器打开后看到深色背景+绿色"运筹帷幄"标题，无报错。

- [ ] **Step 6: 初始化git并提交**

```bash
cd E:/project/dubo
git init
```

创建 `.gitignore`：

```
node_modules
dist
*.local
.env
```

```bash
git add -A
git commit -m "chore: init project with Vite + React + TS + TailwindCSS"
```

---

## Task 2: 目录结构 + 空壳接口

**Files:**
- Create: `src/engine/core/types.ts`
- Create: `src/engine/market/types.ts`
- Create: `src/engine/sentiment/types.ts`
- Create: 所有空壳 `index.ts` 文件
- Create: `src/data/assets.ts`
- Create: `src/utils/format.ts`

- [ ] **Step 1: 创建所有目录**

```bash
mkdir -p src/engine/core src/engine/market src/engine/sentiment
mkdir -p src/engine/ai src/engine/news src/engine/event
mkdir -p src/engine/country src/engine/kol src/engine/rugpull
mkdir -p src/engine/player src/engine/meta
mkdir -p src/stores src/components/layout src/components/market
mkdir -p src/hooks src/data src/utils
```

- [ ] **Step 2: 创建全局类型 `src/engine/core/types.ts`**

```ts
export type GameMode = 'flash' | 'standard' | 'marathon' | 'sandbox'
export type SpeedMultiplier = 0 | 1 | 2 | 3

export interface TickContext {
  tick: number
  elapsed: number // ms since game start
  deltaMs: number // ms since last frame
  speed: SpeedMultiplier
}

export type TickLayer = 0 | 1 | 2 | 3 | 4 | 5

export const TICK_INTERVALS: Record<TickLayer, number> = {
  0: 500,   // L0: 价格更新 0.5s
  1: 2000,  // L1: AI决策 2s
  2: 3000,  // L2: 情绪更新 3s
  3: 5000,  // L3: 事件触发 5s
  4: 30000, // L4: 宏观经济 30s
  5: 60000, // L5: 重大事件 60s
}
```

- [ ] **Step 3: 创建市场类型 `src/engine/market/types.ts`**

```ts
export type AssetType = 'currency' | 'stock' | 'commodity' | 'safehaven' | 'derivative' | 'crypto' | 'player_token'

export interface Asset {
  id: string
  name: string
  type: AssetType
  basePrice: number
  currentPrice: number
  volatility: number // base volatility per tick, e.g. 0.0015 = 0.15%
}

export interface PriceUpdate {
  assetId: string
  price: number
  prevPrice: number
  change: number // percentage
  timestamp: number
}

export interface OHLCV {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
```

- [ ] **Step 4: 创建情绪类型 `src/engine/sentiment/types.ts`**

```ts
export interface SentimentState {
  global: number // 0-100, 50 = neutral
}

export const EXTREME_HIGH = 90
export const EXTREME_LOW = 10
export const NEUTRAL = 50
export const REGRESSION_SPEED = 0.5 // per tick toward 50
```

- [ ] **Step 5: 创建资产初始数据 `src/data/assets.ts`**

```ts
import type { Asset } from '@/engine/market/types'

export const ASSET_KAL: Asset = {
  id: 'KAL',
  name: '伽蓝币',
  type: 'currency',
  basePrice: 1.0,
  currentPrice: 1.0,
  volatility: 0.0015, // 0.15% base
}
```

- [ ] **Step 6: 创建格式化工具 `src/utils/format.ts`**

```ts
export function formatPrice(price: number, decimals = 4): string {
  return price.toFixed(decimals)
}

export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${(pct * 100).toFixed(2)}%`
}

export function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(2)}`
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}
```

- [ ] **Step 7: 创建空壳引擎 index.ts**

每个空引擎目录创建 `index.ts` 导出空对象/接口。执行：

```bash
for dir in ai news event country kol rugpull player meta; do
  echo '// Phase 2 placeholder' > "src/engine/$dir/index.ts"
done
```

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: add directory structure, types, and data layer"
```

---

## Task 3: EventBus 实现

**Files:**
- Create: `src/engine/core/EventBus.ts`

- [ ] **Step 1: 实现 EventBus**

创建 `src/engine/core/EventBus.ts`：

```ts
type Listener<T = unknown> = (data: T) => void

export interface EventMap {
  'game:start': void
  'game:pause': void
  'game:resume': void
  'game:tick': { tick: number; elapsed: number; layer: number }
  'game:end': { reason: string }
  'price:updated': { assetId: string; price: number; prevPrice: number; change: number }
  'sentiment:changed': { global: number }
  'speed:changed': { speed: number }
  // Phase 2 events (stubs)
  'ai:trade': { agentId: string; assetId: string; amount: number }
  'ai:kol:post': { agentId: string; content: string }
  'news:published': { id: string; templateId: string; targetCountry: string }
  'news:debunked': { id: string }
  'event:triggered': { id: string; tier: number }
  'event:chain': { eventId: string; node: string }
  'war:started': { participants: string[] }
  'war:ended': { winner: string; loser: string }
  'player:trade': { assetId: string; side: 'buy' | 'sell'; amount: number }
  'player:arrested': { country: string }
  'kol:duel:start': { participants: string[] }
  'kol:duel:end': { winner: string; loser: string }
  'kol:follower:change': { delta: number }
  'rug:launched': { tokenId: string }
  'rug:completed': { tokenId: string }
  'market:halt': { reason: string }
  'market:resume': void
  'achievement:unlocked': { id: string }
  'meta:earned': { amount: number }
  'tutorial:unlock': { feature: string }
}

type EventKey = keyof EventMap

class EventBus {
  private listeners = new Map<string, Set<Listener>>()

  on<K extends EventKey>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(listener as Listener)

    return () => {
      set.delete(listener as Listener)
      if (set.size === 0) this.listeners.delete(event)
    }
  }

  emit<K extends EventKey>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of set) {
      listener(data)
    }
  }

  removeAll(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement typed EventBus with all game events"
```

---

## Task 4: GameLoop 实现

**Files:**
- Create: `src/engine/core/GameLoop.ts`

- [ ] **Step 1: 实现 GameLoop**

创建 `src/engine/core/GameLoop.ts`：

```ts
import { eventBus } from './EventBus'
import { TICK_INTERVALS, type SpeedMultiplier, type TickLayer } from './types'

export class GameLoop {
  private lastTime = 0
  private running = false
  private rafId = 0
  private speed: SpeedMultiplier = 1
  private elapsed = 0
  private tick = 0
  private accumulators: Record<TickLayer, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  }

  private layerCallbacks = new Map<TickLayer, Set<(tick: number, elapsed: number) => void>>()

  onLayer(layer: TickLayer, cb: (tick: number, elapsed: number) => void): () => void {
    if (!this.layerCallbacks.has(layer)) {
      this.layerCallbacks.set(layer, new Set())
    }
    const set = this.layerCallbacks.get(layer)!
    set.add(cb)
    return () => set.delete(cb)
  }

  setSpeed(speed: SpeedMultiplier): void {
    const prev = this.speed
    this.speed = speed
    if (prev === 0 && speed > 0) {
      this.lastTime = performance.now()
    }
    eventBus.emit('speed:changed', { speed })
    if (speed === 0) {
      eventBus.emit('game:pause', undefined as never)
    } else if (prev === 0) {
      eventBus.emit('game:resume', undefined as never)
    }
  }

  getSpeed(): SpeedMultiplier { return this.speed }
  getTick(): number { return this.tick }
  getElapsed(): number { return this.elapsed }
  isRunning(): boolean { return this.running }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  private loop = (now: number): void => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.loop)

    if (this.speed === 0) return

    const rawDelta = now - this.lastTime
    this.lastTime = now
    const delta = rawDelta * this.speed
    this.elapsed += delta

    // Process each tick layer
    for (let layer = 0; layer <= 5; layer++) {
      this.accumulators[layer as TickLayer] += delta
      const interval = TICK_INTERVALS[layer as TickLayer]
      while (this.accumulators[layer as TickLayer] >= interval) {
        this.accumulators[layer as TickLayer] -= interval
        this.tick++
        const callbacks = this.layerCallbacks.get(layer as TickLayer)
        if (callbacks) {
          for (const cb of callbacks) {
            cb(this.tick, this.elapsed)
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement GameLoop with layered tick system and speed control"
```

---

## Task 5: MarketEngine 骨架

**Files:**
- Create: `src/engine/market/MarketEngine.ts`

- [ ] **Step 1: 实现 MarketEngine**

创建 `src/engine/market/MarketEngine.ts`：

```ts
import { eventBus } from '@/engine/core/EventBus'
import type { Asset, PriceUpdate } from './types'

export class MarketEngine {
  private assets = new Map<string, Asset>()

  registerAsset(asset: Asset): void {
    this.assets.set(asset.id, { ...asset })
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id)
  }

  /** Called on L0 tick (every 500ms base). Simulates price movement. */
  updatePrices(tick: number): void {
    for (const asset of this.assets.values()) {
      const prevPrice = asset.currentPrice

      // Random walk: ± volatility range
      const change = (Math.random() - 0.5) * 2 * asset.volatility
      asset.currentPrice = Math.max(0.0001, asset.currentPrice * (1 + change))

      const pctChange = (asset.currentPrice - prevPrice) / prevPrice

      eventBus.emit('price:updated', {
        assetId: asset.id,
        price: asset.currentPrice,
        prevPrice,
        change: pctChange,
      })
    }
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement MarketEngine with random walk price updates"
```

---

## Task 6: SentimentEngine 骨架

**Files:**
- Create: `src/engine/sentiment/SentimentEngine.ts`

- [ ] **Step 1: 实现 SentimentEngine**

创建 `src/engine/sentiment/SentimentEngine.ts`：

```ts
import { eventBus } from '@/engine/core/EventBus'
import { NEUTRAL, REGRESSION_SPEED } from './types'

export class SentimentEngine {
  private global = NEUTRAL

  getGlobal(): number {
    return this.global
  }

  /** Called on L2 tick (every 3s base). Regresses toward neutral + small noise. */
  update(): void {
    // Regression toward 50
    const diff = NEUTRAL - this.global
    this.global += diff * 0.02 // slow regression

    // Small random noise
    this.global += (Math.random() - 0.5) * 1.0

    // Clamp to 0-100
    this.global = Math.max(0, Math.min(100, this.global))

    eventBus.emit('sentiment:changed', { global: this.global })
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement SentimentEngine with regression toward neutral"
```

---

## Task 7: Zustand Stores

**Files:**
- Create: `src/stores/gameStore.ts`
- Create: `src/stores/marketStore.ts`

- [ ] **Step 1: 实现 gameStore**

创建 `src/stores/gameStore.ts`：

```ts
import { create } from 'zustand'
import type { SpeedMultiplier } from '@/engine/core/types'

interface GameState {
  speed: SpeedMultiplier
  elapsed: number
  paused: boolean
  setSpeed: (speed: SpeedMultiplier) => void
  setElapsed: (ms: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  speed: 1,
  elapsed: 0,
  paused: false,
  setSpeed: (speed) => set({ speed, paused: speed === 0 }),
  setElapsed: (elapsed) => set({ elapsed }),
}))
```

- [ ] **Step 2: 实现 marketStore**

创建 `src/stores/marketStore.ts`：

```ts
import { create } from 'zustand'

interface PricePoint {
  price: number
  time: number
}

interface MarketState {
  prices: Record<string, number>         // assetId -> current price
  prevPrices: Record<string, number>     // assetId -> previous price
  history: Record<string, PricePoint[]>  // assetId -> recent price points (for chart)
  updatePrice: (assetId: string, price: number) => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},
  prevPrices: {},
  history: {},
  updatePrice: (assetId, price) => {
    const prev = get().prices[assetId] ?? price
    const hist = get().history[assetId] ?? []
    set({
      prices: { ...get().prices, [assetId]: price },
      prevPrices: { ...get().prevPrices, [assetId]: prev },
      history: {
        ...get().history,
        [assetId]: [...hist.slice(-199), { price, time: Date.now() }],
      },
    })
  },
}))
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement gameStore and marketStore with Zustand"
```

---

## Task 8: React↔引擎连接 + 绑定

**Files:**
- Create: `src/hooks/useGameLoop.ts`

- [ ] **Step 1: 实现 useGameLoop hook**

创建 `src/hooks/useGameLoop.ts`：

```tsx
import { useEffect, useRef } from 'react'
import { GameLoop } from '@/engine/core/GameLoop'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { eventBus } from '@/engine/core/EventBus'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { ASSET_KAL } from '@/data/assets'
import type { TickLayer } from '@/engine/core/types'

export function useGameLoop() {
  const loopRef = useRef<GameLoop | null>(null)

  useEffect(() => {
    const loop = new GameLoop()
    const market = new MarketEngine()
    const sentiment = new SentimentEngine()

    // Register KAL
    market.registerAsset(ASSET_KAL)

    // Bind L0 -> market price update
    loop.onLayer(0 as TickLayer, (tick) => {
      market.updatePrices(tick)
    })

    // Bind L2 -> sentiment update
    loop.onLayer(2 as TickLayer, () => {
      sentiment.update()
    })

    // Bind EventBus -> stores
    eventBus.on('price:updated', (data) => {
      useMarketStore.getState().updatePrice(data.assetId, data.price)
    })

    eventBus.on('speed:changed', (data) => {
      useGameStore.getState().setSpeed(data.speed)
    })

    // Update elapsed on every animation frame
    const interval = setInterval(() => {
      if (loop.isRunning() && loop.getSpeed() > 0) {
        useGameStore.getState().setElapsed(loop.getElapsed())
      }
    }, 100)

    loop.start()
    loopRef.current = loop

    return () => {
      loop.stop()
      clearInterval(interval)
      eventBus.removeAll()
    }
  }, [])

  const setSpeed = (speed: 0 | 1 | 2 | 3) => {
    loopRef.current?.setSpeed(speed)
  }

  return { setSpeed }
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement useGameLoop hook binding engines to stores"
```

---

## Task 9: UI 壳子

**Files:**
- Create: `src/components/layout/GameLayout.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/LeftPanel.tsx`
- Create: `src/components/layout/RightPanel.tsx`
- Create: `src/components/layout/BottomBar.tsx`
- Create: `src/components/market/PriceDisplay.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 GameLayout**

创建 `src/components/layout/GameLayout.tsx`：

```tsx
import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import BottomBar from './BottomBar'
import PriceDisplay from '@/components/market/PriceDisplay'

export default function GameLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-bg-primary overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <main className="flex-1 flex items-center justify-center border-x border-border-panel">
          <PriceDisplay />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  )
}
```

- [ ] **Step 2: 实现 TopBar**

创建 `src/components/layout/TopBar.tsx`：

```tsx
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { formatPrice, formatPercent, formatTime } from '@/utils/format'
import type { SpeedMultiplier } from '@/engine/core/types'

export default function TopBar() {
  const speed = useGameStore((s) => s.speed)
  const elapsed = useGameStore((s) => s.elapsed)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const kalPrice = useMarketStore((s) => s.prices['KAL'] ?? 1)
  const kalPrev = useMarketStore((s) => s.prevPrices['KAL'] ?? 1)
  const change = (kalPrice - kalPrev) / kalPrev

  return (
    <div className="h-10 flex items-center gap-4 px-4 bg-bg-panel border-b border-border-panel text-sm">
      <span className="font-display text-up text-base">运筹帷幄</span>

      <div className="w-px h-5 bg-border-panel" />

      <span className={change >= 0 ? 'text-up' : 'text-down'}>
        KAL {formatPrice(kalPrice)}
        <span className="ml-1 text-xs">{formatPercent(change)}</span>
      </span>

      <div className="w-px h-5 bg-border-panel" />

      <div className="flex gap-1">
        {([0, 1, 2, 3] as SpeedMultiplier[]).map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs ${
              speed === s
                ? 'bg-up/20 text-up border border-up/40'
                : 'bg-bg-primary text-text-secondary hover:bg-bg-panel-hover'
            }`}
          >
            {s === 0 ? '⏸' : `${s}x`}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border-panel" />

      <span className="text-text-secondary font-mono">{formatTime(elapsed)}</span>

      <div className="flex-1" />

      <span className="text-text-muted text-xs">Phase 1 骨架</span>
    </div>
  )
}
```

- [ ] **Step 3: 实现 LeftPanel**

创建 `src/components/layout/LeftPanel.tsx`：

```tsx
export default function LeftPanel() {
  return (
    <div className="w-[280px] bg-bg-panel border-r border-border-panel p-3 flex flex-col">
      <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">新闻 / 舆论流</h3>
      <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
        Phase 2
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 实现 RightPanel**

创建 `src/components/layout/RightPanel.tsx`：

```tsx
export default function RightPanel() {
  return (
    <div className="w-[300px] bg-bg-panel border-l border-border-panel p-3 flex flex-col">
      <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">钱包 / 交易</h3>
      <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
        Phase 2
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 实现 BottomBar**

创建 `src/components/layout/BottomBar.tsx`：

```tsx
export default function BottomBar() {
  return (
    <div className="h-[100px] flex border-t border-border-panel bg-bg-panel">
      <div className="flex-1 p-2 border-r border-border-panel">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">事件日志</h4>
        <p className="text-text-muted text-xs mt-1">Phase 2</p>
      </div>
      <div className="flex-1 p-2 border-r border-border-panel">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">预警</h4>
        <p className="text-text-muted text-xs mt-1">Phase 2</p>
      </div>
      <div className="flex-1 p-2">
        <h4 className="text-text-secondary text-xs uppercase tracking-wider">AI 监控</h4>
        <p className="text-text-muted text-xs mt-1">Phase 2</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 实现 PriceDisplay（中间大字）**

创建 `src/components/market/PriceDisplay.tsx`：

```tsx
import { useMarketStore } from '@/stores/marketStore'
import { formatPrice, formatPercent } from '@/utils/format'

export default function PriceDisplay() {
  const price = useMarketStore((s) => s.prices['KAL'] ?? 1)
  const prev = useMarketStore((s) => s.prevPrices['KAL'] ?? 1)
  const change = (price - prev) / prev
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
```

- [ ] **Step 7: 更新 App.tsx 连接一切**

替换 `src/App.tsx`：

```tsx
import GameLayout from '@/components/layout/GameLayout'
import { useGameLoop } from '@/hooks/useGameLoop'

function App() {
  const { setSpeed } = useGameLoop()

  return (
    <GameLayout />
  )
}

export default App
```

注意：`setSpeed` 暂不直接调用——TopBar 通过 `useGameStore().setSpeed()` 间接控制。`useGameLoop` 的职责是初始化引擎。

- [ ] **Step 8: 验证运行**

```bash
npm run dev
```

Expected:
1. 深色背景，顶栏绿色"运筹帷幄"
2. KAL 价格每 0.5 秒跳动
3. 中间大字显示实时价格（绿涨红跌）
4. 速度按钮（⏸/1x/2x/3x）可切换，⏸ 暂停价格跳动
5. 游戏时间在走
6. 左右面板和底栏显示 "Phase 2" 占位

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "feat: implement UI shell with live KAL price display and speed controls"
```

---

## 自检清单

**Spec 覆盖率：**
| Spec 要求 | 覆盖任务 |
|-----------|---------|
| 项目初始化+依赖 | Task 1 |
| 目录结构+空壳 | Task 2 |
| EventBus 完整实现 | Task 3 |
| GameLoop 完整实现 | Task 4 |
| MarketEngine 骨架 | Task 5 |
| SentimentEngine 骨架 | Task 6 |
| Zustand Stores | Task 7 |
| UI 壳子 | Task 9 |
| React↔引擎连接 | Task 8 |

**占位符扫描：** 无 TBD/TODO。

**类型一致性：** `SpeedMultiplier`、`TickLayer`、`Asset`、`EventMap` 在所有任务中一致引用。
