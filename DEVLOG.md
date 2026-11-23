# Development Log

Educational reconstruction of the Deriv platform experience (focus: Deriv Bot). All entries in UTC.

---

## Milestone 1 — Reference research (2026-11-23)

- Inspected public pages: `deriv.com` (homepage, 2 content chunks), `bot.deriv.com` (live app shell), `deriv.com/trading-platforms/deriv-bot`, `home.deriv.com/dashboard/signup`.
- Captured a full reference inventory in `docs/research/REFERENCE.md`: homepage section order, DBot app chrome (Dashboard/Bot Builder/Charts/Tutorials rail), the **verbatim toolbox categories** (Trade parameters, Purchase conditions, Sell conditions (optional), Restart trading conditions, Analysis, Utility) and the actual block inventory (Run once at start, Trade options, Purchase, Sell is available, Trade again…), plus trade-definition fields (Market ▸ Continuous Indices ▸ Volatility 100 (1s) Index, Up/Down ▸ Rise/Fall, ticks duration, AUD stake, restart-on-error toggles).
- Derived design tokens: brand red `#FF444F`, ink `#18262B`, band `#F2F3F4`, teal `#4BB4B3`, green `#22A45D`, IBM Plex Sans.

## Milestone 2 — Architecture & project setup

- Scaffolded Vite + React 18 + TS + Tailwind 3; pinned Blockly 11 (stable API), Lightweight Charts 4, Dexie 4, Zustand 5, decimal.js.
- Built the pure synthetic market engine (`src/market/engine.ts`): seeded mulberry32 PRNG + Box–Muller, geometric walk with mild mean reversion, candle bucket aggregation, warm-up history, deterministic contract settlement, payout table.
- Dexie schema v1 + **v2 migration** (adds `runMetrics`, richer trade index, backfill upgrade hook) with full export/restore bundles.

## Milestone 3 — Bot core

- Blockly block library (`src/bot/blocks/`): 5 section hats + trade/analysis/indicator/utility/tool blocks in DBot style, custom light/dark themes, toolbox mirroring the reference categories plus standard Logic/Loops/Math/Text/Lists/Variables/Functions.
- **Interpreter** (`src/bot/interpreter.ts`): allowlisted value/statement registries, structured compile step (validation issues for unknown blocks, missing trade definition, bad markets), run-once / purchase / sell / restart semantics, loop-iteration and call-depth guards, decimal-safe settlement, early-sell resale model.
- Quick-strategy templates generate real workspace JSON (Martingale with loss-doubling `controls_if`, D'Alembert, Oscar's Grind, Digit Parity, SMA Momentum).
- Strategy serialization: export envelope with magic field, strict import validation (size guard + compile check), content hashing, **immutable versions** with restore-by-copy.

## Milestone 4 — Workers & stores

- `market.worker.ts`: live simulated feed for 5 volatility instruments (ticks + candle updates + history requests).
- `bot.worker.ts`: full run loop (idle→holding→deciding), pause/resume/stop, speed control, error recovery per restart-on-error toggles, structured event stream (status/log/tick/trade/stats/error).
- Zustand stores bridge workers to React and persist sessions, events, logs, trades and run metrics to Dexie. Account balance is derived from persisted trade history (reconciles by construction).

## Milestone 5 — UI: marketing, account, trader

- Homepage rebuilt section-by-section from the reference inventory (hero "Anyone/Anywhere/Anytime", trust band with counters + awards, market cards, 24/7 band, 6 platform cards, payments marquee, support, testimonials, 3 steps, FAQ accordion, CTA band, dark footer with legal anchors).
- Markets/Platform page templates (Deriv Bot page carries the researched 4-step + FAQ content), Learn + About (risk/terms/privacy) pages.
- Auth pages following the signup reference (split brand panel, "Join 3M+ global traders", country select); full account area with 8 tabs incl. sessions, audit, notifications, export/restore.
- Deriv Trader–style demo page: watchlist, live chart, contract ticket (Rise/Fall + digit contracts), open/settled positions, tick-based settlement.

## Milestone 6 — Deriv Bot app (main deliverable)

- App shell per reference: top bar (logo, language, theme toggle, account + balance), left rail (Dashboard, Bot Builder, Charts, Tutorials).
- Dashboard: "Load or build your bot" tiles (My computer import, Google Drive dialog, Bot Builder, Quick strategy), saved bots, recent runs, welcome guide + FAQ accordion.
- Bot Builder: toolbar (name, save state, undo/redo, import/export, versions, centre, delete, block search, quick strategy), status strip (running state, market, live price, balance), Blockly workspace, right drawer (Summary / Transactions / Charts / Journal), run controls with pause/resume/stop and simulation speed.
- Version history modal (immutable, restore creates new version), import validation dialog, per-run version snapshots.

## Milestone 7 — QA

- 44 Vitest tests passing: market engine determinism/OHLC/settlement, decimal maths, interpreter semantics (allowlist rejection, martingale progression, take-profit stop, balance reconciliation, sell-at-price, resale model), serialization import/export, DB versioning + run-version references, UI smoke renders.
- `npm run build` green (both workers bundled); dev server verified: all routes 200, key modules transform cleanly.
- Fixed during QA: restart side-effects must execute generic statements (martingale updates), resale model aligned with payouts, initial workspace load path, per-symbol price digits in settlement.

## Known limitations / future work

- Google Drive import is intentionally simulated (local demo has no OAuth/cloud).
- Blockly minimap and multi-language messages not implemented (EN only).
- Playwright browser binaries can't be downloaded in this sandbox; E2E coverage is provided by Vitest + Testing Library instead.
- Digit-analysis convenience blocks (last-digit stats) could be added; core digit contracts are supported.
