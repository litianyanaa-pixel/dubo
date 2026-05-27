# Phase 1 骨架搭建设计

## 目标

搭完全部目录和核心接口后，`npm run dev` 能看到深色终端风格的空壳 UI，GameLoop 在后台跑 tick，EventBus 收发事件，KAL 价格数字在变动。

## 技术选型

- Vite + React 18 + TypeScript 5
- TailwindCSS + Framer Motion
- Zustand（状态管理）
- Lightweight Charts（K线图，先装依赖不接入）
- Howler.js（音效，先装依赖不接入）
- 不加 Tauri，纯 Web 开发

## 交付内容

### 1. 项目初始化
- `npm create vite` React + TS 模板
- 安装所有依赖
- 配置 TailwindCSS（深色主题，赛博终端风格）
- 配置路径别名 `@/` → `src/`

### 2. 目录结构
```
src/
├── engine/
│   ├── core/
│   │   ├── EventBus.ts        # 完整实现
│   │   ├── GameLoop.ts         # 完整实现
│   │   └── types.ts            # 全局类型定义
│   ├── market/
│   │   ├── MarketEngine.ts     # 骨架：价格公式 + KAL 随机波动
│   │   ├── PriceModel.ts       # 骨架：6因子公式框架
│   │   └── types.ts            # 资产/价格类型
│   ├── sentiment/
│   │   ├── SentimentEngine.ts  # 骨架：三层情绪，向50回归
│   │   └── types.ts
│   ├── ai/                     # 空壳接口
│   ├── news/                   # 空壳接口
│   ├── event/                  # 空壳接口
│   ├── country/                # 空壳接口
│   ├── kol/                    # 空壳接口
│   ├── rugpull/                # 空壳接口
│   ├── player/                 # 空壳接口
│   └── meta/                   # 空壳接口
├── stores/
│   ├── gameStore.ts            # 游戏状态（速度、模式、时间）
│   └── marketStore.ts          # 市场状态（绑定EventBus）
├── components/
│   ├── layout/
│   │   ├── GameLayout.tsx      # 主布局框架
│   │   ├── TopBar.tsx          # 顶部状态栏
│   │   ├── LeftPanel.tsx       # 新闻流（空壳）
│   │   ├── RightPanel.tsx      # 钱包/交易（空壳）
│   │   └── BottomBar.tsx       # 底部日志（空壳）
│   └── market/
│       └── PriceDisplay.tsx    # 价格数字显示（实时跳动）
├── hooks/
│   └── useGameLoop.ts          # React↔引擎连接
├── data/
│   └── assets.ts               # 资产初始数据（KAL定义）
└── utils/
    └── format.ts               # 数字格式化
```

### 3. EventBus 完整实现
- 类型化事件映射（覆盖所有已设计事件）
- `on/off/emit` 方法
- 支持通配符监听

### 4. GameLoop 完整实现
- Tick 分层系统：L0(500ms) L1(2s) L2(3s) L3(5s) L4(30s) L5(60s)
- 速度控制：暂停/1x/2x/3x
- requestAnimationFrame 驱动
- tick 累加器模式

### 5. MarketEngine 骨架
- 1 个资产：KAL（伽蓝币），初始价格 1.0000
- 价格每 tick 随机波动 ±0.1%~0.3%
- 通过 EventBus 发布 `price:updated` 事件

### 6. SentimentEngine 骨架
- 全局情绪值（0-100），初始50
- 每 tick 向50回归（速率0.5）
- 通过 EventBus 发布 `sentiment:changed` 事件

### 7. Zustand Stores
- `useGameStore`: 速度倍率、游戏时间、暂停状态
- `useMarketStore`: KAL 当前价格、价格历史
- 通过 `bindEngineToStores()` 连接 EventBus

### 8. UI 壳子
- 深色主题（#0a0a0f 背景，#00ff88 涨、#ff3366 跌）
- 主布局：顶栏(40px) + 左面板(280px) + 中间 + 右面板(300px) + 底栏(100px)
- 顶栏显示：游戏时间、速度控制按钮、全局情绪条、KAL 价格
- 中间区域：KAL 价格大字显示（实时跳动）
- 其余面板为空壳占位

## 不做的事

- AI 引擎、假新闻、事件系统 → Phase 2
- 交易功能 → Phase 1 尾声再加
- K线图 → 骨架稳定后接入 Lightweight Charts
- 音效、动画、存档 → 后续 Phase

## 成功标准

`npm run dev` 打开后：
1. 看到深色终端风格 UI
2. KAL 价格数字每秒变动
3. 全局情绪条缓慢摆动
4. 速度按钮可切换（1x/2x/3x/暂停）
5. 游戏时间在走动
