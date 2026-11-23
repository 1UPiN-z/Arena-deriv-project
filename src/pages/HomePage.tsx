/** Deriv-inspired homepage — structure mirrors the reference inventory. */
import { Link } from 'react-router-dom';
import { Accordion, CountUp, ScrollReveal, Stars } from '../components/ui/kit';

const MARKETS = [
  {
    slug: 'forex',
    title: 'Forex',
    desc: 'Trade the most popular currency pairs with high leverage, tight spreads, and fast execution.',
    grad: 'from-blue-500 to-indigo-600',
    emoji: '💱',
  },
  {
    slug: 'derived-indices',
    title: 'Derived Indices',
    desc: 'Trade 24/7 on exclusive Synthetic and Derived Indices. Choose volatility levels that match your strategy.',
    grad: 'from-deriv-red to-pink-600',
    emoji: '📈',
  },
  {
    slug: 'stocks',
    title: 'Stocks',
    desc: 'Trade global market leaders like Apple, Tesla, and NVIDIA.',
    grad: 'from-emerald-500 to-teal-600',
    emoji: '🏢',
  },
  {
    slug: 'commodities',
    title: 'Commodities',
    desc: 'Trade gold, silver, oil, natural gas, sugar, and more with competitive leverage and tight spreads.',
    grad: 'from-amber-500 to-orange-600',
    emoji: '🪙',
  },
  {
    slug: 'crypto',
    title: 'Crypto',
    desc: 'Trade round the clock on the volatility of cryptocurrencies like Bitcoin and Ethereum.',
    grad: 'from-violet-500 to-purple-700',
    emoji: '₿',
  },
  {
    slug: 'stock-indices',
    title: 'Stock Indices',
    desc: 'Trade offerings that track the top global stock indices.',
    grad: 'from-cyan-500 to-sky-600',
    emoji: '🧭',
  },
];

const PLATFORMS = [
  {
    slug: 'tradingview',
    title: 'World-class charts, 24/7 trading',
    desc: 'Analyse markets with 400+ indicators, 17 chart types, and powerful drawing tools with TradingView.',
  },
  {
    slug: 'deriv-exchange',
    title: 'Deriv Exchange',
    desc: 'Trade crypto on spot and futures markets around the clock with 25+ years of trust and transparent fees.',
  },
  {
    slug: 'deriv-mt5',
    title: 'Power of MT5 with exclusive indices',
    desc: 'Deriv MT5 brings you the world’s favourite platform with the widest range of markets and zero commissions.',
  },
  {
    slug: 'deriv-ctrader',
    title: 'Copy expert traders',
    desc: 'On Deriv cTrader, tap into the expertise of seasoned traders and mirror their trades automatically.',
  },
  {
    slug: 'deriv-trader',
    title: 'Optimised payouts, limited downsides',
    desc: 'On Deriv Trader, you’ll never lose more than you put in. Know your maximum risk upfront.',
  },
  {
    slug: 'deriv-bot',
    title: 'Automate your trades',
    desc: 'Deriv Bot keeps your strategies running on 24/7 exclusive indices and traditional markets. No coding required.',
  },
];

const TESTIMONIALS = [
  { name: 'Tshepang Israel Phake', text: 'Trading with Deriv has been great. It has beautiful low spreads and there are options where you can choose the best or suitable trading account.' },
  { name: 'tinashe kurebwaseka', text: 'Deriv is an easy and smooth trading experience, better than any other platform. I find it revolutionary and the best for us traders.' },
  { name: 'ezra hutabarat', text: 'Deriv is the best trading platform. I never had difficulty in trading for more than 5 years. Thank you Deriv for your present in trading world.' },
  { name: 'Wandile S\'busiso Ninela', text: 'I\'m happy with the service provided. Deriv always updates me on what\'s happening and gives daily statements of accounts.' },
  { name: 'Jolin Jantjies', text: 'Superb support. No hassle at all with withdrawals. Perfect trading conditions. Everything a trader could look for!' },
  { name: 'Loide Simaneka', text: 'I have been trading with Deriv for some years and I haven\'t encountered any problems with it. Deposits and withdrawals are smooth.' },
];

const AWARDS = [
  { title: 'Best Trade Execution Award (MEA)', org: 'Ultimate Fintech 2026' },
  { title: 'Best Trading Experience - Global', org: 'Ultimate Fintech 2025' },
  { title: 'Best Broker - Africa', org: 'Global Forex Awards 2025' },
  { title: 'Best Trading Conditions - Global', org: 'Finance Magnates 2025' },
];

export function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ================= HERO ================= */}
      <section className="hero-gradient relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-24">
          <div className="animate-fade-up">
            <p className="mb-4 text-lg font-medium text-deriv-muted">Trading for</p>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-deriv-ink dark:text-white md:text-6xl lg:text-[64px]">
              <span className="text-deriv-red">Anyone</span>
              <br />
              <span className="text-deriv-red">Anywhere</span>
              <br />
              <span className="text-deriv-red">Anytime</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-deriv-body/80 dark:text-white/70 md:text-xl">
              Widest range of products, markets, platforms with 24/7 customer support.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/signup" className="btn-primary h-12 px-8 text-base">
                Open account
              </Link>
              <Link to="/bot" className="btn-secondary h-12 px-8 text-base">
                Try Deriv Bot →
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <Stars filled={4} />
              <p className="text-sm text-deriv-muted">
                Deriv scores <strong className="text-deriv-ink dark:text-white">4.3 out of 5</strong> based on 71,887 reviews
              </p>
            </div>
            <p className="mt-3 text-xs text-deriv-muted/70">
              Educational reconstruction · Simulated markets only · No real money
            </p>
          </div>

          <div className="relative animate-fade-up [animation-delay:150ms]">
            <div className="float-slow relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card dark:border-white/10 dark:bg-deriv-dark-2">
              <img src="/images/hero.jpg" alt="Trading platform preview" className="h-[380px] w-full object-cover" loading="eager" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-card bg-white/95 px-5 py-4 shadow-dropdown dark:bg-deriv-dark-3/95">
                <div>
                  <div className="text-xs text-deriv-muted">Volatility 100 Index</div>
                  <div className="text-xl font-bold text-deriv-ink dark:text-white">1,257.38</div>
                </div>
                <div className="badge bg-green-100 text-green-700">▲ +1.24%</div>
              </div>
            </div>
            <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-deriv-red/10 blur-2xl" />
            <div className="absolute -bottom-8 -right-4 h-36 w-36 rounded-full bg-deriv-teal/15 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ================= TRUST BAND ================= */}
      <section className="border-y border-black/5 bg-white py-16 dark:border-white/10 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">Trade with confidence</h2>
            <p className="section-sub mx-auto max-w-2xl text-center">
              For over 25 years, Deriv Group has been a trusted partner of traders worldwide.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { value: 168, suffix: 'M+', label: 'Monthly deals' },
              { value: 3, suffix: 'M+', label: 'Customers worldwide' },
              { value: 700, prefix: '$', suffix: 'B+', label: 'Monthly volume' },
              { value: 1999, label: 'Established since', plain: true },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 90}>
                <div className="card p-7 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-4xl font-bold text-deriv-red">
                    {stat.plain ? (
                      '1999'
                    ) : (
                      <CountUp to={stat.value} prefix={stat.prefix ?? ''} suffix={stat.suffix ?? ''} />
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-deriv-muted">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AWARDS.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 80}>
                <div className="flex items-center gap-3 rounded-card border border-gray-100 bg-deriv-band px-5 py-4 dark:border-white/10 dark:bg-white/5">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-sm font-semibold text-deriv-ink dark:text-white">{a.title}</div>
                    <div className="text-xs text-deriv-muted">{a.org}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MARKETS ================= */}
      <section className="bg-deriv-band py-20 dark:bg-deriv-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">All your markets in one place</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MARKETS.map((m, i) => (
              <ScrollReveal key={m.slug} delay={i * 70}>
                <Link
                  to={`/markets/${m.slug}`}
                  className="group block h-full overflow-hidden rounded-card border border-black/5 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover dark:border-white/10 dark:bg-deriv-dark-2"
                >
                  <div className={`relative h-40 bg-gradient-to-br ${m.grad} overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-90 transition-transform duration-500 group-hover:scale-110">
                      {m.emoji}
                    </div>
                    <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-deriv-ink dark:text-white">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-deriv-body/75 dark:text-white/65">{m.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-deriv-red">
                      Learn more
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRADE ALL DAY / NIGHT ================= */}
      <section className="relative overflow-hidden bg-deriv-ink py-20 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-deriv-red/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-deriv-teal/25 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl font-bold leading-tight md:text-5xl">
                  Trade all day
                  <br />
                  <span className="text-deriv-teal">Trade all night</span>
                </h2>
                <p className="mt-6 max-w-lg text-lg text-white/75">
                  Cryptocurrencies and our unique Synthetic Indices are available 24/7 — including the simulated Volatility
                  instruments in this demo.
                </p>
                <Link to="/signup" className="btn-primary mt-8 h-12 px-8 text-base">
                  Open account
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { t: '24/7 markets', d: 'Trade weekends and holidays' },
                  { t: '1s ticks', d: 'Volatility 100 (1s) style simulation' },
                  { t: 'Instant execution', d: 'Simulated, latency-free fills' },
                  { t: 'Demo balance', d: 'Practise with zero risk' },
                ].map((f) => (
                  <div key={f.t} className="rounded-card border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="font-semibold text-white">{f.t}</div>
                    <div className="mt-1 text-sm text-white/60">{f.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= PLATFORMS ================= */}
      <section className="bg-white py-20 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">Trade the way you want</h2>
            <p className="section-sub mx-auto max-w-2xl text-center">
              Six platforms, one experience. Charts, automation, copy trading, and more.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p, i) => (
              <ScrollReveal key={p.slug} delay={i * 70}>
                <Link
                  to={`/platforms/${p.slug}`}
                  className="group flex h-full flex-col rounded-card border border-gray-100 bg-deriv-band p-7 transition-all duration-300 hover:-translate-y-1 hover:border-deriv-red/30 hover:shadow-card-hover dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-deriv-red text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                    {p.slug === 'deriv-bot' ? '🤖' : p.slug === 'tradingview' ? '📊' : p.slug === 'deriv-trader' ? '⚡' : p.slug === 'deriv-mt5' ? '🖥️' : p.slug === 'deriv-ctrader' ? '👥' : '🔄'}
                  </div>
                  <h3 className="text-lg font-bold text-deriv-ink dark:text-white">{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-deriv-body/75 dark:text-white/65">{p.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-deriv-red">
                    Explore
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PAYMENTS ================= */}
      <section className="overflow-hidden border-y border-black/5 bg-deriv-band py-16 dark:border-white/10 dark:bg-deriv-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">Your money, your way</h2>
            <p className="section-sub mx-auto max-w-2xl text-center">
              Quick deposits, easy withdrawals, and local payment options mean your money is always accessible.
            </p>
          </ScrollReveal>
        </div>
        <div className="relative mt-10">
          <div className="flex w-max animate-marquee gap-4">
            {[...Array(2)].map((_, row) => (
              <div key={row} className="flex gap-4">
                {['Mastercard', 'Tether USDT', 'Volet', 'Airtm', 'Bitcoin', 'Tron', 'Skrill', 'Neteller', 'Ethereum', 'USD Coin', 'Bank transfer', 'Jeton', 'Visa', 'PaySafe'].map(
                  (p) => (
                    <div
                      key={`${row}-${p}`}
                      className="flex h-16 w-40 flex-shrink-0 items-center justify-center rounded-card border border-gray-200 bg-white text-sm font-semibold text-deriv-ink shadow-sm dark:border-white/10 dark:bg-deriv-dark-2 dark:text-white"
                    >
                      {p}
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SUPPORT ================= */}
      <section className="bg-white py-20 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <h2 className="section-title">Get answers when you need</h2>
              <p className="section-sub">
                We don’t have opening or closing hours. That means you can speak to our Support whenever you need, wherever
                you are.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/learn#faqs" className="btn-primary h-11 px-6">
                  Visit help centre
                </Link>
                <Link to="/bot/tutorials" className="btn-secondary h-11 px-6">
                  Bot tutorials
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <div className="rounded-card border border-gray-100 bg-deriv-band p-8 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deriv-teal text-white">💬</div>
                  <div>
                    <div className="font-semibold text-deriv-ink dark:text-white">Ask Amy — 24/7 live chat</div>
                    <p className="mt-1 text-sm text-deriv-muted">
                      Instant answers to common questions, plus a full guide and FAQ library in this demo.
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {['How do I open a demo account?', 'How does Deriv Bot work?', 'Are the markets real?'].map((q) => (
                    <div key={q} className="rounded-btn border border-gray-200 bg-white px-4 py-3 text-sm text-deriv-body dark:border-white/10 dark:bg-deriv-dark-2 dark:text-white/80">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="bg-deriv-band py-20 dark:bg-deriv-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">What our customers say</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 70}>
                <figure className="flex h-full flex-col rounded-card border border-black/5 bg-white p-6 shadow-card dark:border-white/10 dark:bg-deriv-dark-2">
                  <Stars />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-deriv-body/85 dark:text-white/70">
                    “{t.text}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-deriv-red/10 font-bold text-deriv-red">
                      {t.name[0].toUpperCase()}
                    </div>
                    <div className="text-sm font-semibold text-deriv-ink dark:text-white">{t.name}</div>
                  </figcaption>
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3 STEPS ================= */}
      <section className="bg-white py-20 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">Get started in 3 simple steps</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Sign up', desc: 'Sign up in minutes. Practise with a zero-risk demo account.', emoji: '📝' },
              { step: '2', title: 'Explore', desc: 'Try the demo trader, the bot builder, and the simulated markets.', emoji: '🧭' },
              { step: '3', title: 'Trade', desc: 'Start your simulated trading journey — no real money involved.', emoji: '🚀' },
            ].map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 100}>
                <div className="relative rounded-card border border-gray-100 bg-deriv-band p-8 dark:border-white/10 dark:bg-white/5">
                  <div className="absolute -top-4 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-deriv-red text-lg font-bold text-white shadow-md">
                    {s.step}
                  </div>
                  <div className="text-5xl">{s.emoji}</div>
                  <h3 className="mt-4 text-xl font-bold text-deriv-ink dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-deriv-body/75 dark:text-white/65">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="bg-deriv-band py-20 dark:bg-deriv-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title text-center">Your questions answered</h2>
          </ScrollReveal>
          <div className="mt-10">
            <Accordion
              items={[
                {
                  q: 'What is this site?',
                  a: 'This is an educational, independent reconstruction of the Deriv platform experience — including a full Deriv Bot-style visual strategy builder. All markets are simulated and all balances are virtual.',
                },
                {
                  q: 'What is Deriv Bot?',
                  a: 'Deriv Bot lets you automate trading strategies with a drag-and-drop visual programming interface. This demo includes a genuine block-based workspace, a working bot interpreter, and simulated markets.',
                },
                {
                  q: 'Can I test a strategy before trading?',
                  a: 'Yes — everything here runs on a zero-risk demo balance with clearly-labelled simulated Volatility instruments.',
                },
                {
                  q: 'How does the bot execution work?',
                  a: 'Your visual strategy is compiled into a serializable document and interpreted by a sandboxed allowlisted engine running in a Web Worker. Unknown blocks are rejected and no arbitrary code can run.',
                },
                {
                  q: 'Can I save and reuse my strategies?',
                  a: 'Yes. Strategies persist in your browser via IndexedDB, with immutable version history, import and export.',
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-deriv-red py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Join 3M+ global traders</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">
              Open an account in minutes and start exploring the world's markets — simulated for learning, in a safe
              environment.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn h-12 bg-white px-8 text-base text-deriv-red shadow-md hover:bg-gray-100">
                Open account
              </Link>
              <Link to="/bot" className="btn h-12 border-2 border-white/60 px-8 text-base text-white hover:bg-white/10">
                Explore Deriv Bot
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
