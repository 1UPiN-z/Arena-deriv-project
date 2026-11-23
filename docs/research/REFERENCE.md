# Reference Research Inventory — Deriv Platform Reconstruction

> Educational reconstruction. All code original. No proprietary assets copied.
> Research captured 2026-11-23 from public pages: deriv.com, bot.deriv.com, deriv.com/trading-platforms/deriv-bot, home.deriv.com/dashboard/signup.

---

## 1. Main homepage (https://deriv.com/)

**Title:** "Online broker for trading anytime, anywhere | Deriv"

### Page structure (top → bottom)
1. **Header** — Deriv wordmark (red), primary navigation, language selector, Log in link, red **Open account** CTA.
2. **Hero** — Large media background, headline `Trading for **Anyone Anywhere Anytime**` (anyone/anywhere/anytime emphasised), subline "Widest range of products, markets, platforms with 24/7 customer support.", primary CTA **Open account**, Trustpilot rating strip ("Deriv scores 4.3 out of 5 based on 71,887 reviews" + stars).
3. **"Trade with confidence"** — trust band: award badges (Best Trade Execution Award (MEA) — Ultimate Fintech 2026, Best Trading Experience - Global — Ultimate Fintech 2025, Best Broker - Africa — Global Forex Awards 2025, Best Trading Conditions - Global — Finance Magnates 2025) + stat counters: `168M+ Monthly deals`, `3M+ Customers worldwide`, `$700B+ Monthly volume`, `1999 Established since`.
4. **"All your markets in one place"** — category cards (carousel on mobile): **Forex**, **Derived Indices**, **Stocks**, **Commodities**, **Crypto**, **Stock Indices** — each with short copy + "Learn more" link.
5. **"Trade all day / Trade all night"** — split section, "Cryptocurrencies and our unique Synthetic Indices are available 24/7." + CTA.
6. **"Trade the way you want"** — platform cards: **TradingView** (400+ indicators, 17 chart types), **Deriv Exchange**, **Deriv MT5**, **Deriv cTrader** (copy traders), **Deriv Trader** (limited downside), **Deriv Bot** (automate, no coding) — each with "Explore …" link.
7. **Payments strip** — Mastercard, Tether USDT, Volet, Airtm, Bitcoin, Tron, e-wallet, credit/debit card, eUSDT, Skrill, USD Coin, Ethereum, instant bank transfer, Jeton Bank. Headline: **"Your money, your way"** — "Quick deposits, easy withdrawals, and local payment options…"
8. **"Get answers when you need"** — 24/7 support section (Ask Amy live chat reference).
9. **"What our customers say"** — testimonial cards (Trustpilot quotes + names).
10. **"Get started in 3 simple steps"** — Sign up / Deposit / Trade cards with media.
11. **Closing CTA** — "Join 3M+ global traders" + Open account.
12. **Footer** — dark, link columns, payment icons, legal/regulatory disclaimers, language, socials (WhatsApp etc.).

### Design observations
- Brand red **#FF444F** for CTAs/wordmark; generous white space; light grey page band alternation (#F2F3F4).
- Rounded CTA buttons (pill-ish radius ~6-8px, generous padding), dark slate headings.
- Cards: white, rounded ~12-16px, subtle shadow, image-led.
- Stat counters animate on scroll; carousels auto-advance.
- Typography: modern geometric sans (IBM Plex Sans family in Deriv design system).

---

## 2. Deriv Bot — https://bot.deriv.com/ (THE PRIORITY)

**Title:** "Automate Your Trades | Deriv Bot"

### App shell (verbatim structure from live app)
- **Top bar:** Home (Deriv logo), **Language** picker, **Theme** toggle (light/dark), account switcher.
- **Left icon rail / nav:** `Dashboard`, `Bot Builder`, `Charts`, `Tutorials`.
- **Dashboard page:** "Load or build your bot" — 4 tiles: **My computer** (import), **Google Drive**, **Bot Builder**, **Quick strategy**. Below: "Welcome to Deriv Bot!" guide cards + FAQ accordion ("What is Deriv Bot?", "Where do I find the blocks I need?", "How do I remove blocks from the workspace?").
- **Run panel:** big **Run** button (green, play icon), status text `Bot is not running`.

### Toolbox categories (verbatim)
1. **Trade parameters**
2. **Purchase conditions**
3. **Sell conditions (optional)**
4. **Restart trading conditions**
5. **Analysis**
6. **Utility**
(+ standard Blockly categories used inside: Logic, Math, Variables, Loops, Functions, Text, Lists — via Utility/standard toolbox.)

### Block inventory (verbatim from workspace dump)
- **Trade parameters** hat block ("1. Trade parameters") containing:
  - `Run once at start:` statement section
  - `Trade options:` statement section
  - Trade definition fields: **Market** `Derived > Continuous Indices > Volatility 100 (1s) Index`, **Trade Type** `Up/Down > Rise/Fall`, **Contract Type** `Both`, **Default Candle Interval** `1 minute`, **Duration** `Ticks`, **Stake** `AUD`, amount `1`
  - Toggles: `Restart last trade on error (bot ignores the unsuccessful trade): ✓`, `Restart buy/sell on error (disable for better performance): ✓`
- **Purchase conditions** hat ("2. Purchase conditions") with `Purchase` block + `Rise` contract dropdown.
- **Sell conditions (optional)** hat ("3. Sell conditions") with `if … then …` + `Sell is available` block.
- **Restart trading conditions** hat ("4. Restart trading conditions") with `Trade again` block.

### Execution panel facts
- Status: `Bot is not running` / running / stopped.
- Run button label `Run`.
- Bot runs client-side in the browser (FAQ: "Deriv Bot runs in your browser").

---

## 3. Deriv Bot product page (https://deriv.com/trading-platforms/deriv-bot)

- Hero: "Automate your trades in forex, stock indices, commodities, and 24/7 Derived Indices. Import a bot, customise a preset strategy, or create your own with a simple drag-and-drop interface." CTA **Try now**.
- "Why trade with Deriv Bot": Track your performance (Telegram notifications), Get integrated help (tutorials/guides), Build your strategy visually (drag-drop blocks + indicators).
- Feature cards: Start with a popular strategy (Martingale, D'Alembert, Oscar's Grind…), Maximise potential profits/limit losses (take profit, stop loss), Import and save your bots (device/Google Drive).
- "Build a trading robot in 4 steps": 1 Select an asset and trade type → 2 Set the purchase conditions → 3 Set the restart conditions → 4 Run the bot.
- FAQ: who can use it; browser-based execution; demo testing; risk management; save/reuse strategies.

---

## 4. Signup (https://home.deriv.com/dashboard/signup)

- Split/left panel: Deriv logo, "Trading for anyone. Anywhere. Anytime.", language, Ask Amy chat widget.
- Card: "Join 3M+ global traders" — "Tell us where you live. We'll show you the products and services available in your region." — **Country/region select**, **Sign up** button, "Already have an account? **Log in**".

---

## 5. app.deriv.com

Unauthenticated visits resolve to the public homepage. Trader app is auth-gated → reproduce observable Deriv Trader design as clearly simulated local version (labels "Simulated — educational demo").

---

## Derived implementation constants

| Token | Value |
|---|---|
| Brand red | `#FF444F` (hover `#E8323E`, active `#CC2E39`) |
| Ink / headings | `#18262B` |
| Body text | `#333333` |
| Page band | `#F2F3F4` |
| Accent teal | `#4BB4B3` |
| Positive / Rise / profit | `#22A45D` |
| Negative / Fall / loss | `#FF444F` |
| Font | IBM Plex Sans (400/500/600/700) |
| CTA radius | 6px (marketing), buttons 6–8px |
| Card radius | 12–16px |
| Header height | 72px desktop |

### Synthetic markets (simulated instruments)
Volatility 10 Index, Volatility 25 Index, Volatility 50 Index, Volatility 75 Index, Volatility 100 Index — explicitly labelled **simulated**.

### Contract types (simulated equivalents)
Rise/Fall (full), Even/Odd, Over/Under, Matches/Differs (last-digit) — payout ratios modelled on binary-style returns (~1.90–1.95× stake, documented in engine).
