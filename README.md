# Deriv Platform Reconstruction — Educational Demo

A comprehensive, high-fidelity **visual and functional reconstruction** of the public-facing Deriv platform experience, with the main focus on **Deriv Bot (DBot)** — the drag-and-drop trading automation builder.

> ⚠️ **Educational project only.** This is an independent reconstruction built for learning. It is **not** affiliated with Deriv. All markets are **simulated**, all balances are **virtual**, and there is no real-money functionality anywhere.

## What's inside

| Area | Highlights |
|---|---|
| **Homepage** | Deriv-inspired marketing site: hero, trust stats, market categories, platform cards, payments marquee, testimonials, 3-step onboarding, FAQ, dark footer — responsive with animated dropdowns and scroll reveals |
| **Deriv Bot** | Full **Google Blockly** workspace (drag-drop, snap, nest, zoom, pan, undo/redo, copy/paste, context menus, trashcan, block search), DBot-style toolbox (Trade parameters, Purchase conditions, Sell conditions, Restart trading conditions, Analysis, Utility + Logic/Loops/Math/Text/Lists/Variables/Functions) |
| **Bot execution** | Real strategy interpreter (allowlisted block registry — imported strategies can never execute arbitrary code) running in a **Web Worker**; Run / Pause / Resume / Stop; live Summary, Transactions, Charts and Journal dashboard; execution speed control |
| **Quick strategies** | Martingale, D'Alembert, Oscar's Grind, Digit Parity, SMA Momentum — generate real editable blocks |
| **Trading blocks** | Market selection (simulated Volatility 10/25/50/75/100), Rise/Fall + Even/Odd + Over/Under + Matches/Differs, stake, duration (ticks/minutes), predictions, sell-at-market/price, trade-again & stop conditions, SMA/EMA/Bollinger/RSI/MACD/Stochastic indicators, notifications, debug, risk limits |
| **Synthetic markets** | Seeded geometric random-walk engine with ticks, OHLC candles (1m/5m/15m/1h), deterministic replay — explicitly labelled simulated instruments |
| **Demo trader** | Deriv Trader–style page: watchlist, live candlestick charts (Lightweight Charts), contract ticket with payout math, open/settled positions |
| **Account** | Local demo registration/login, personal & contact info, preferences, security (password change), notifications, session management, activity audit, full data export/restore |
| **Persistence** | IndexedDB via **Dexie.js** with versioned migrations; strategies survive refreshes; **immutable version history**; every bot run references its exact strategy version; import/export with validation |
| **Accounting** | Decimal-safe money arithmetic (decimal.js); balances reconcile from persisted trade history |
| **Tests** | 44 Vitest tests: market engine, contract settlement, interpreter semantics, import validation, DB versioning/migrations, decimal maths, UI smoke tests |

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Google Blockly 11 · Dexie.js (IndexedDB) · Lightweight Charts · Zustand · Web Workers · decimal.js · Vitest + Testing Library

## Running

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # type-check + production build
npm test           # run the test suite
```

## Architecture

```
src/
├── market/          # synthetic market engine (pure, seeded, shared by workers & tests)
├── bot/
│   ├── blocks/      # Blockly block definitions, theme, toolbox
│   ├── interpreter.ts   # allowlisted strategy interpreter
│   ├── serialization.ts # strategy docs, validation, versioning helpers
│   └── templates.ts     # quick-strategy generators
├── workers/         # market feed worker + bot execution worker
├── db/              # Dexie schema (with migrations), strategy CRUD
├── store/           # Zustand stores (auth, market, bot, UI)
├── components/      # UI kit, layout, Blockly wrapper, charts
└── pages/           # homepage, markets, platforms, auth, account, trader, bot app
```

The visual editor is fully decoupled from the execution engine: Blockly produces a serializable workspace document that the worker-side interpreter evaluates against its allowlisted block registry.

## Data & privacy

Everything lives in your browser (IndexedDB). No network calls, no analytics, no cloud. Export or wipe your data from **Account → Data**.
