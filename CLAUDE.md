# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**运筹帷幾 (Dubo)** — a browser-based global financial market manipulation simulator. The player trades assets while manipulating markets through fake news, KOL influence, and rug-pull crypto schemes. Entire UI is in Chinese.

**Stack**: React 19 + TypeScript + Vite 8 + Zustand 5 + Tailwind CSS 4. Charts via `lightweight-charts` (TradingView). Sound via Web Audio API (synthesized, no audio files).

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run test         # vitest run (single run)
npm run test:watch   # vitest (watch mode)
```

Run a single test file:
```bash
npx vitest run src/test/MarketEngine.test.ts
```

## Architecture

### Engine → EventBus → Store → React

The app follows a strict layered architecture:

1. **Engines** (`src/engine/`) — Pure TypeScript classes with zero React dependency. Hold authoritative game state and simulation logic.
2. **EventBus** (`src/engine/core/EventBus.ts`) — Typed pub/sub singleton. 30+ event types. All cross-engine and engine-to-UI communication flows through this.
3. **Zustand Stores** (`src/stores/`) — React-consumable mirrors of engine state. Updated by the `useGameLoop` hook bridging EventBus events to store setters.
4. **React Components** (`src/components/`) — Subscribe to stores via selectors.

**Engines are the source of truth, not stores.** For example, `MarketEngine` holds authoritative prices; `marketStore` is a React-consumable snapshot.

### GameLoop Tick Layers

`GameLoop` (`src/engine/core/GameLoop.ts`) runs `requestAnimationFrame` with 6 tick layers at different intervals. Speed multiplier (0=pause, 1/2/3x) scales delta time for all layers:

| Layer | Interval | Runs |
|-------|----------|------|
| L0 | 500ms | MarketEngine price updates |
| L1 | 2000ms | AI agent decisions |
| L2 | 3000ms | Sentiment regression, AI social posts, bankruptcy check |
| L3 | 5000ms | Random events, KOL cooldowns, character traits, rug pull tokens |
| L4 | 30000ms | Fake news debunk checks |
| L5 | 60000ms | Geopolitical events |

### useGameLoop — The Central Orchestrator

`src/hooks/useGameLoop.ts` is the most critical file. It:
- Instantiates all engines and stores them in a module-level `engineRef` object (service locator pattern)
- Registers all tick layer callbacks on GameLoop
- Bridges EventBus events into Zustand store updates
- Exports helper functions (`commandKOL`, `runPrediction`, `launchRugToken`, etc.) that access engines via `getEngineRefs()`

### Player → Engine Feedback Loop

When the player trades in `RightPanel`, the component calls `getEngineRefs().market?.addTradeFlow()` to inject buy/sell pressure directly into the simulation. This is how player actions affect prices.

### News Feed Staggering

`newsStore` uses a module-level `pending` array with a 300ms flush interval, creating a "typing" effect rather than dumping all entries at once.

### Game Modes

Four modes alter mechanics: Standard (baseline), Flash (5-min timer), Sandbox (cash replenishes to $999M), Marathon (no time limit).

## Testing

- Vitest with jsdom, globals enabled, setup at `src/test/setup.ts`
- Pattern: one test file per engine in `src/test/`
- Engine tests instantiate directly, call methods, assert state
- Store tests reset in `beforeEach`, call actions, assert via `getState()`
- Always `eventBus.removeAll()` in `beforeEach` for tests using EventBus

## Path Alias

`@/` maps to `src/` (configured in both `tsconfig.app.json` and `vite.config.ts`).

## Design Docs (Chinese)

- `技术架构.md` — Technical architecture
- `数值与细节设计.md` — Numerical design
- `游戏设计进度.md` — Design progress tracking
- `补充设计文档.md` — Supplementary design
