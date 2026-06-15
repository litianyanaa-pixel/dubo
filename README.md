# dubo

一个基于 React 的金融市场模拟交易游戏。玩家在虚拟的加密货币 / 股票市场中做多做空，同时要应对 AI 交易者、KOL 喊单、突发事件、假新闻操纵乃至 rug-pull 风险——尽可能活得更久、赚得更多。

## ✨ 特性

- **多资产市场**：虚拟币、股票等资产，带实时 K 线（Lightweight Charts）与瀑布流价格推送
- **做多 / 做空**：开仓 / 平仓完整仓位管理
- **AI 交易者引擎**：模拟其他市场参与者，产生真实的买卖盘与价格冲击
- **KOL 系统**：意见领袖发布喊单内容，影响市场情绪
- **新闻 & 事件引擎**：新闻流、突发事件驱动行情
- **假新闻操纵**：玩家可以制造假新闻干预市场
- **情绪引擎**：综合新闻、KOL、AI 行为计算市场情绪
- **国家 / 资产系统**：不同国家、不同资产的联动与相关性矩阵
- **Rug-Pull 引擎**：随机黑天鹅事件（项目方跑路等）
- **角色 & 天赋系统**：不同起始角色，影响玩法
- **完整游戏循环**：开始界面 → 交易日推进 → 游戏结束结算

## 🛠 技术栈

- **React 19** + **TypeScript 6**
- **Vite 8** 构建
- **Zustand** 状态管理
- **Tailwind CSS v4** 样式
- **Framer Motion** 动画
- **Lightweight Charts** K 线图表
- **Howler** 音效
- **Vitest** + **Testing Library** 单元测试

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# 测试监听模式
npm run test:watch

# 代码检查
npm run lint
```

## 📁 目录结构

```
src/
├── components/          # UI 组件
│   ├── layout/          # 顶栏 / 底栏 / 左右面板等布局
│   ├── market/          # 价格图表、价格展示
│   ├── ErrorBoundary.tsx
│   ├── GameOverScreen.tsx
│   ├── HelpOverlay.tsx
│   ├── StartScreen.tsx
│   └── Toast.tsx
├── engine/              # 游戏核心引擎（纯逻辑，与 UI 解耦）
│   ├── ai/              # AI 交易者引擎
│   ├── core/            # EventBus / GameLoop 等基础设施
│   ├── country/         # 国家系统
│   ├── event/           # 突发事件
│   ├── kol/             # KOL 喊单系统
│   ├── market/          # 市场撮合、相关性矩阵
│   ├── news/            # 新闻引擎
│   ├── player/          # 玩家天赋 / 特质
│   ├── rugpull/         # Rug-Pull 黑天鹅
│   └── sentiment/       # 情绪引擎
├── stores/              # Zustand 状态仓库
├── data/                # 静态数据（资产、角色、国家、虚拟币）
├── hooks/               # React Hooks（如 useGameLoop）
├── utils/               # 工具函数（格式化、音效等）
└── test/                # 单元测试
```

## 🧪 测试

引擎层（`src/engine/**`）与状态层（`src/stores/**`）均配有 Vitest 单元测试，覆盖市场撮合、AI 决策、事件系统、KOL、新闻、特质引擎等核心模块。

```bash
npm test
```

## 📄 许可证

私有项目，未开源。
