/** Platform product page template — rich content for Deriv Bot from research. */
import { Link, Navigate, useParams } from 'react-router-dom';
import { Accordion, ScrollReveal } from '../components/ui/kit';

const PLATFORM_DATA: Record<
  string,
  {
    name: string;
    headline: string;
    sub: string;
    cta: { label: string; to: string };
    emoji: string;
    features: { title: string; desc: string }[];
    steps?: { title: string; desc: string }[];
    faqs?: { q: string; a: string }[];
  }
> = {
  'deriv-bot': {
    name: 'Deriv Bot',
    headline: 'Automate your trades with drag-and-drop',
    sub: 'Automate your trades in forex, stock indices, commodities, and 24/7 Derived Indices. Import a bot, customise a preset strategy, or create your own with a simple drag-and-drop interface.',
    cta: { label: 'Try now', to: '/bot' },
    emoji: '🤖',
    features: [
      { title: 'Track your performance', desc: 'See how your bot is performing as it executes each trade, with live summaries and journal logs.' },
      { title: 'Get integrated help', desc: 'Access tutorials, guides, and reference information as you build your bot.' },
      { title: 'Build your strategy visually', desc: 'Simply drag, drop, and configure pre-built blocks and indicators onto a canvas. No coding needed.' },
      { title: 'Start with a popular strategy', desc: "Martingale, D'Alembert, Oscar's Grind, and more — load and customise strategies to fit your trading style." },
      { title: 'Maximise potential profits, limit losses', desc: 'Use analysis tools, indicators, and smart logic such as take profit and stop loss.' },
      { title: 'Import and save your bots', desc: 'Upload bots from your device and save your custom strategies for future use, with full version history.' },
    ],
    steps: [
      { title: 'Select an asset and trade type', desc: 'Set the market, trade type, duration, and stake in the Trade parameters block.' },
      { title: 'Set the purchase conditions', desc: 'Choose when your bot should buy — with Rise/Fall and digit contracts.' },
      { title: 'Set the restart conditions', desc: 'Decide when the bot should trade again, take profit, or stop loss.' },
      { title: 'Run the bot', desc: 'Watch the summary, transactions, charts, and journal as your strategy executes.' },
    ],
    faqs: [
      { q: 'Who can use Deriv Bot?', a: 'Deriv Bot is designed for all levels of traders. You can start with one of the ready-made strategies and customise them to suit your style.' },
      { q: 'What happens if I close my browser while the bot is running?', a: 'Deriv Bot runs in your browser, so it will pause if the browser is closed. To keep it running, simply keep the tab open.' },
      { q: 'Can I test my strategy before trading with real funds?', a: 'Yes. This demo is zero-risk: all strategies run against simulated markets with a virtual balance.' },
      { q: 'How does Deriv Bot help me manage risks?', a: 'Built-in risk management blocks such as stop loss, take profit, and consecutive-loss guards.' },
      { q: 'Can I save and reuse my trading strategies?', a: 'Yes. Strategies persist locally with immutable version history, and you can export/import them as files.' },
    ],
  },
  'deriv-trader': {
    name: 'Deriv Trader',
    headline: 'Optimised payouts, limited downsides',
    sub: "On Deriv Trader, you'll never lose more than you put in. Know your maximum risk upfront when trading global markets and round-the-clock indices.",
    cta: { label: 'Open demo trader', to: '/trader' },
    emoji: '⚡',
    features: [
      { title: 'Defined risk', desc: 'Your maximum loss is always limited to your stake.' },
      { title: 'Flexible contracts', desc: 'Rise/Fall, Even/Odd, Over/Under, Matches/Differs.' },
      { title: 'Live charts', desc: 'Candlestick charts with live simulated ticks.' },
      { title: 'Instant feedback', desc: 'See payouts, open positions, and settled trades in real time.' },
    ],
  },
  'deriv-mt5': {
    name: 'Deriv MT5',
    headline: 'Power of MT5 with exclusive indices',
    sub: 'Deriv MT5 brings you the world’s favourite platform with the widest range of forex, stocks, commodities, cryptocurrencies, and exclusive Derived Indices.',
    cta: { label: 'Explore demo', to: '/trader' },
    emoji: '🖥️',
    features: [
      { title: 'Zero commissions', desc: 'Tight spreads and swap-free trading on many instruments.' },
      { title: 'Advanced charting', desc: 'Multiple timeframes and technical indicators.' },
      { title: 'Exclusive indices', desc: 'Trade Derived Indices unavailable elsewhere.' },
      { title: 'Expert advisors', desc: 'Algorithmic trading support (simulated here).' },
    ],
  },
  'deriv-ctrader': {
    name: 'Deriv cTrader',
    headline: 'Copy expert traders',
    sub: 'On Deriv cTrader, tap into the expertise of seasoned traders. Follow their strategies, and mirror their trades automatically.',
    cta: { label: 'Explore demo', to: '/trader' },
    emoji: '👥',
    features: [
      { title: 'Copy trading', desc: 'Mirror the strategies of experienced traders automatically.' },
      { title: 'Transparent performance', desc: 'Track record, drawdown, and risk metrics.' },
      { title: 'cTrader ecosystem', desc: 'Fast, modern trading tools.' },
      { title: 'Flexible allocation', desc: 'Choose how much virtual capital to allocate.' },
    ],
  },
  tradingview: {
    name: 'TradingView',
    headline: 'World-class charts, 24/7 trading',
    sub: 'Analyse markets with 400+ indicators, 17 chart types, and powerful drawing tools with TradingView.',
    cta: { label: 'See charts', to: '/trader' },
    emoji: '📊',
    features: [
      { title: '400+ indicators', desc: 'From moving averages to advanced oscillators.' },
      { title: '17 chart types', desc: 'Candles, Heikin Ashi, Renko, and more.' },
      { title: 'Drawing tools', desc: 'Trend lines, Fibonacci, and annotations.' },
      { title: 'Community ideas', desc: 'Learn from traders worldwide.' },
    ],
  },
  'deriv-exchange': {
    name: 'Deriv Exchange',
    headline: 'Crypto spot and futures, around the clock',
    sub: 'Trade crypto on spot and futures markets around the clock with 25+ years of trust, transparent fees, and quick withdrawals.',
    cta: { label: 'Explore demo', to: '/trader' },
    emoji: '🔄',
    features: [
      { title: 'Spot & futures', desc: 'Flexible crypto trading products.' },
      { title: 'Transparent fees', desc: 'Clear, competitive fee structure.' },
      { title: '24/7 markets', desc: 'Crypto never sleeps.' },
      { title: 'Deep liquidity', desc: 'Tight spreads on major pairs.' },
    ],
  },
};

export function PlatformPage() {
  const { slug } = useParams();
  const data = slug ? PLATFORM_DATA[slug] : undefined;
  if (!data) return <Navigate to="/" replace />;

  return (
    <div>
      <section className="hero-gradient py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-3 text-sm text-deriv-muted">
            <Link to="/" className="transition-colors hover:text-deriv-red">Home</Link>
            <span>/</span>
            <span>Platforms</span>
            <span>/</span>
            <span className="text-deriv-ink dark:text-white">{data.name}</span>
          </div>
          <div className="mt-8 grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <div className="badge bg-deriv-red/10 text-deriv-red">{data.name}</div>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-deriv-ink dark:text-white md:text-5xl">{data.headline}</h1>
              <p className="mt-5 max-w-xl text-lg text-deriv-body/80 dark:text-white/70">{data.sub}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to={data.cta.to} className="btn-primary h-12 px-8 text-base">{data.cta.label}</Link>
                <Link to="/signup" className="btn-secondary h-12 px-8 text-base">Open account</Link>
              </div>
            </div>
            <div className="animate-fade-up [animation-delay:120ms]">
              {(slug === 'deriv-bot' || slug === 'deriv-trader') ? (
                <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card dark:border-white/10 dark:bg-deriv-dark-2">
                  <img
                    src={slug === 'deriv-bot' ? '/images/bot-preview.jpg' : '/images/trader-preview.jpg'}
                    alt={`${data.name} preview`}
                    className="h-72 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl border border-black/5 bg-white text-[120px] shadow-card dark:border-white/10 dark:bg-deriv-dark-2">
                  {data.emoji}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title">{slug === 'deriv-bot' ? 'Why trade with Deriv Bot' : `Why ${data.name}`}</h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 70}>
                <div className="card h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-deriv-red/10 text-xl">✦</div>
                  <h3 className="mt-4 text-lg font-bold text-deriv-ink dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-deriv-body/75 dark:text-white/65">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {data.steps && (
        <section className="bg-deriv-band py-20 dark:bg-deriv-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal>
              <h2 className="section-title text-center">Build a trading robot in 4 steps</h2>
            </ScrollReveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {data.steps.map((s, i) => (
                <ScrollReveal key={s.title} delay={i * 90}>
                  <div className="card h-full p-7">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-deriv-red text-lg font-bold text-white"> {i + 1}</div>
                    <h3 className="mt-4 font-bold text-deriv-ink dark:text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-deriv-body/75 dark:text-white/65">{s.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/bot" className="btn-primary h-12 px-8 text-base">Open the bot builder</Link>
            </div>
          </div>
        </section>
      )}

      {data.faqs && (
        <section className="bg-white py-20 dark:bg-deriv-dark-2">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="section-title text-center">Your questions answered</h2>
            <div className="mt-10">
              <Accordion items={data.faqs} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
