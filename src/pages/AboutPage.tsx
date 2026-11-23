/** About + legal anchor sections for footer links. */
import { Link } from 'react-router-dom';
import { ScrollReveal } from '../components/ui/kit';

export function AboutPage() {
  return (
    <div className="bg-white dark:bg-deriv-dark-2">
      <section className="hero-gradient py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="animate-fade-up text-4xl font-bold text-deriv-ink dark:text-white md:text-5xl">About this project</h1>
          <p className="animate-fade-up mt-4 max-w-3xl text-lg text-deriv-body/80 dark:text-white/70 [animation-delay:100ms]">
            An independent educational reconstruction of the Deriv platform experience — with a full Deriv Bot-style
            visual strategy builder, simulated markets, and local-first persistence.
          </p>
        </div>
      </section>

      <section id="why" className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="section-title">Why this exists</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-deriv-body/85 dark:text-white/70">
              <p>
                This project was built to study and reproduce the user experience, interface architecture, interactions,
                and functionality of a modern trading platform — with particular focus on Deriv Bot, the drag-and-drop
                trading automation tool.
              </p>
              <p>
                Everything is implemented from scratch with original code: the Blockly-based strategy builder, the
                allowlisted strategy interpreter, the synthetic market engine, the decimal-safe accounting, and the
                marketing site. No proprietary source code or assets were copied.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { t: 'Local-first', d: 'IndexedDB + Dexie.js persistence with versioned migrations and export/restore.' },
              { t: 'Simulated only', d: 'Synthetic Volatility instruments, virtual balances, zero real-money functionality.' },
              { t: 'Open learning', d: 'A structured codebase covering visual programming, workers, and state management.' },
            ].map((c) => (
              <div key={c.t} className="card p-6">
                <h3 className="font-bold text-deriv-ink dark:text-white">{c.t}</h3>
                <p className="mt-2 text-sm text-deriv-body/75 dark:text-white/65">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="risk" className="bg-deriv-band py-16 dark:bg-deriv-dark">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="section-title">Risk disclaimer</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-deriv-body/85 dark:text-white/70">
            <p>
              <strong>Simulated environment.</strong> All prices, charts, trades, payouts, and balances in this project are
              produced by a local synthetic simulation for educational purposes. They do not reflect any real market and
              must not be used for trading decisions.
            </p>
            <p>
              <strong>No financial services.</strong> This project does not offer brokerage, investment, or financial
              services of any kind. It cannot accept deposits, execute real trades, or process withdrawals.
            </p>
            <p>
              <strong>Trading risk.</strong> In real trading, leveraged products carry a high level of risk and can result
              in losses that exceed deposits. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </section>

      <section id="terms" className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="section-title">Terms of use</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-deriv-body/85 dark:text-white/70">
            <p>
              This educational demo is provided as-is for learning and demonstration. You may use it freely for study.
              The demo account system is local to your browser: the credentials you create are stored only on your device
              and are never transmitted anywhere.
            </p>
            <p>
              The visual design is an homage to the public Deriv experience. “Deriv” is a trademark of its respective
              owners; this project is not affiliated with or endorsed by Deriv.
            </p>
          </div>
        </div>
      </section>

      <section id="privacy" className="bg-deriv-band py-16 dark:bg-deriv-dark">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="section-title">Privacy</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-deriv-body/85 dark:text-white/70">
            <p>
              <strong>No tracking, no analytics, no cloud.</strong> This application does not send your data to any server.
              Profiles, strategies, bot sessions, and trade history are stored exclusively in your browser&apos;s IndexedDB.
            </p>
            <p>
              You can export the entire local database as a JSON file and delete it at any time from the account settings
              page.
            </p>
          </div>
          <div className="mt-8">
            <Link to="/account" className="btn-primary h-11 px-6">Go to account settings</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
