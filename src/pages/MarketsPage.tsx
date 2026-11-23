/** Market category page template (per reference product pages). */
import { Link, Navigate, useParams } from 'react-router-dom';
import { ScrollReveal, Accordion } from '../components/ui/kit';

const MARKET_DATA: Record<
  string,
  {
    title: string;
    headline: string;
    sub: string;
    grad: string;
    emoji: string;
    points: { title: string; desc: string }[];
    instruments: string[];
  }
> = {
  forex: {
    title: 'Forex',
    headline: 'Trade the world’s most popular currency pairs',
    sub: 'Trade major, minor, and exotic currency pairs with high leverage, tight spreads, and fast execution.',
    grad: 'from-blue-500 to-indigo-600',
    emoji: '💱',
    points: [
      { title: 'Tight spreads', desc: 'Competitive pricing on majors like EUR/USD and GBP/USD.' },
      { title: 'High leverage', desc: 'Flexible leverage to suit your trading style.' },
      { title: 'Fast execution', desc: 'Simulated instant fills in this educational demo.' },
    ],
    instruments: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD'],
  },
  'derived-indices': {
    title: 'Derived Indices',
    headline: 'Exclusive 24/7 Synthetic and Derived Indices',
    sub: 'Trade round the clock on exclusive volatility indices. Choose the volatility level that matches your strategy — including the simulated Volatility 10–100 instruments used across this demo.',
    grad: 'from-deriv-red to-pink-600',
    emoji: '📈',
    points: [
      { title: '24/7 trading', desc: 'Markets available every hour of every day, including weekends.' },
      { title: 'Configurable volatility', desc: 'From steady Volatility 10 to fast-moving Volatility 100.' },
      { title: 'Transparent simulation', desc: 'All Derived Indices in this demo are clearly labelled simulated instruments.' },
    ],
    instruments: ['Volatility 10 Index', 'Volatility 25 Index', 'Volatility 50 Index', 'Volatility 75 Index', 'Volatility 100 Index'],
  },
  stocks: {
    title: 'Stocks',
    headline: 'Trade global market leaders',
    sub: 'Trade CFDs on the world’s leading stocks like Apple, Tesla, and NVIDIA.',
    grad: 'from-emerald-500 to-teal-600',
    emoji: '🏢',
    points: [
      { title: 'Top names', desc: 'Access the most traded global companies.' },
      { title: 'Go long or short', desc: 'Profit from rising and falling markets.' },
      { title: 'Fractional exposure', desc: 'Trade with position sizes that suit you.' },
    ],
    instruments: ['Apple', 'Tesla', 'NVIDIA', 'Microsoft', 'Amazon', 'Meta'],
  },
  commodities: {
    title: 'Commodities',
    headline: 'Gold, silver, oil, natural gas, and more',
    sub: 'Trade commodities with competitive leverage and tight spreads.',
    grad: 'from-amber-500 to-orange-600',
    emoji: '🪙',
    points: [
      { title: 'Metals & energy', desc: 'Gold, silver, crude oil, and natural gas.' },
      { title: 'Agricultural markets', desc: 'Sugar, coffee, and other soft commodities.' },
      { title: 'Hedging opportunities', desc: 'Diversify with uncorrelated assets.' },
    ],
    instruments: ['Gold', 'Silver', 'Crude Oil', 'Natural Gas', 'Sugar', 'Coffee'],
  },
  crypto: {
    title: 'Cryptocurrencies',
    headline: 'Trade round the clock on crypto volatility',
    sub: 'Trade the volatility of cryptocurrencies like Bitcoin and Ethereum — 24/7.',
    grad: 'from-violet-500 to-purple-700',
    emoji: '₿',
    points: [
      { title: 'Always on', desc: 'Crypto markets never close.' },
      { title: 'Major coins', desc: 'Bitcoin, Ethereum, Litecoin, and more.' },
      { title: 'Volatility opportunities', desc: 'Big moves mean big opportunities.' },
    ],
    instruments: ['BTC/USD', 'ETH/USD', 'LTC/USD', 'XRP/USD', 'BCH/USD', 'ADA/USD'],
  },
  'stock-indices': {
    title: 'Stock Indices',
    headline: 'Track the top global stock indices',
    sub: 'Trade offerings that track the performance of the world’s biggest stock markets.',
    grad: 'from-cyan-500 to-sky-600',
    emoji: '🧭',
    points: [
      { title: 'Global coverage', desc: 'US, European, Asian, and Australian indices.' },
      { title: 'Diversified exposure', desc: 'One position, many stocks.' },
      { title: 'Extended hours', desc: 'Trade sessions across time zones.' },
    ],
    instruments: ['US 500', 'US Tech 100', 'Wall Street 30', 'Germany 40', 'UK 100', 'Japan 225'],
  },
};

export function MarketsPage() {
  const { slug } = useParams();
  const data = slug ? MARKET_DATA[slug] : undefined;
  if (!data) return <Navigate to="/" replace />;

  return (
    <div>
      <section className={`bg-gradient-to-br ${data.grad} py-20 text-white`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Link to="/" className="transition-colors hover:text-white">Home</Link>
            <span>/</span>
            <span>Markets</span>
            <span>/</span>
            <span className="text-white">{data.title}</span>
          </div>
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-fade-up">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">{data.headline}</h1>
              <p className="mt-5 max-w-xl text-lg text-white/85">{data.sub}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/signup" className="btn h-12 bg-white px-8 text-deriv-ink hover:bg-gray-100">Open account</Link>
                <Link to="/trader" className="btn h-12 border-2 border-white/60 px-8 text-white hover:bg-white/10">Try the demo trader</Link>
              </div>
            </div>
            <div className="animate-fade-up [animation-delay:120ms]">
              <div className="flex h-64 items-center justify-center rounded-2xl bg-white/15 text-[120px] backdrop-blur-sm">{data.emoji}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {data.points.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 90}>
                <div className="card h-full p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-deriv-red/10 text-xl">✦</div>
                  <h3 className="mt-4 text-lg font-bold text-deriv-ink dark:text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-deriv-body/75 dark:text-white/65">{p.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-deriv-band py-20 dark:bg-deriv-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title">Popular instruments</h2>
            <p className="section-sub">Explore a selection of {data.title.toLowerCase()} instruments (simulated in this demo).</p>
          </ScrollReveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {data.instruments.map((inst, i) => (
              <ScrollReveal key={inst} delay={i * 60}>
                <div className="card p-5 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-2xl">{data.emoji}</div>
                  <div className="mt-2 text-sm font-semibold text-deriv-ink dark:text-white">{inst}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 rounded-card border border-deriv-red/20 bg-deriv-red/5 p-5 text-sm text-deriv-body dark:text-white/70">
            <strong>Simulated instruments:</strong> prices shown in this educational demo are generated by a local
            synthetic market engine. They are not real market feeds.
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-deriv-dark-2">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="section-title text-center">Frequently asked questions</h2>
          <div className="mt-10">
            <Accordion
              items={[
                { q: `How do I start trading ${data.title.toLowerCase()}?`, a: 'Open a demo account, fund it with the virtual balance, and explore the demo trader or the bot builder. Everything is simulated.' },
                { q: 'Are these real markets?', a: 'No. This is an educational reconstruction with synthetic price generation. No real market data or real money is involved.' },
                { q: 'Can I use Deriv Bot on these markets?', a: `Yes — the bot builder supports the simulated Derived Indices. Head to Deriv Bot to build a strategy visually.` },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
