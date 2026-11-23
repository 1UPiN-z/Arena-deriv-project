/** Learn page — guides + FAQ + contact (anchored for footer links). */
import { Link } from 'react-router-dom';
import { Accordion, ScrollReveal } from '../components/ui/kit';

export function LearnPage() {
  return (
    <div className="bg-white dark:bg-deriv-dark-2">
      <section className="hero-gradient py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="animate-fade-up text-4xl font-bold text-deriv-ink dark:text-white md:text-5xl">Learn</h1>
          <p className="animate-fade-up mt-4 max-w-2xl text-lg text-deriv-body/80 dark:text-white/70 [animation-delay:100ms]">
            Guides, concepts, and answers to help you explore this simulated trading platform.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="section-title">Getting started guides</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { to: '/bot/tutorials', emoji: '🤖', title: 'Deriv Bot guide', desc: 'Learn the visual builder, blocks, and bot execution from scratch.' },
              { to: '/trader', emoji: '📈', title: 'Demo trader guide', desc: 'Understand contracts, payouts, stakes, and durations on the demo trader.' },
              { to: '/markets/derived-indices', emoji: '🧪', title: 'Simulated markets', desc: 'How the synthetic Volatility indices work in this educational demo.' },
            ].map((g) => (
              <ScrollReveal key={g.title}>
                <Link to={g.to} className="group card block h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-4xl">{g.emoji}</div>
                  <h3 className="mt-4 text-lg font-bold text-deriv-ink group-hover:text-deriv-red dark:text-white">{g.title}</h3>
                  <p className="mt-2 text-sm text-deriv-body/75 dark:text-white/65">{g.desc}</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faqs" className="bg-deriv-band py-16 dark:bg-deriv-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="section-title text-center">Frequently asked questions</h2>
          <div className="mt-10">
            <Accordion
              items={[
                { q: 'Is this the real Deriv platform?', a: 'No. This is an independent educational reconstruction built to reproduce the look and feel of Deriv’s public experience. It is unaffiliated with Deriv, uses simulated markets, and never handles real money.' },
                { q: 'How do I create a demo account?', a: 'Click “Open account”, fill in the fictional details form, and a local demo profile is created in your browser. No emails are sent anywhere.' },
                { q: 'How are prices generated?', a: 'A seeded geometric random-walk engine generates ticks and OHLC candles for the simulated Volatility indices. The same engine drives the charts, the trader, and the bot.' },
                { q: 'How does the bot interpret my blocks?', a: 'Your workspace is serialised to JSON and interpreted by an allowlisted block evaluator inside a Web Worker. Unknown block types are rejected at validation time.' },
                { q: 'Where is my data stored?', a: 'Everything persists locally in your browser with IndexedDB (Dexie.js). You can export and restore the full database at any time from the account page.' },
                { q: 'Can I lose real money?', a: 'No. There are no deposits, withdrawals, or real execution anywhere in this demo. All balances are virtual.' },
              ]}
            />
          </div>
        </div>
      </section>

      <section id="contact" className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="section-title">Contact</h2>
          <p className="section-sub">
            This is a self-contained educational project. For questions about the real Deriv platform, please visit the
            official website. For this demo, everything you need is in the app — try the bot tutorials or the FAQ above.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/bot" className="btn-primary h-11 px-6">Open Deriv Bot</Link>
            <Link to="/about" className="btn-secondary h-11 px-6">About this project</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
