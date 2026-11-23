/** Tutorials page — step-by-step guides + FAQ for the bot builder. */
import { Link } from 'react-router-dom';
import { Accordion, ScrollReveal } from '../../components/ui/kit';

const GUIDES = [
  {
    icon: '🧩',
    title: 'The visual workspace',
    body: 'The Bot Builder is a full drag-and-drop programming environment. Blocks snap together vertically and nest inside condition and loop blocks. Use the mouse wheel to zoom, drag the canvas to pan, and the trashcan to delete. Undo/redo, copy/paste, and context menus all work like a native IDE.',
  },
  {
    icon: '1️⃣',
    title: 'Step 1 — Select an asset and trade type',
    body: 'Drop the "Trade options" block from Trade parameters onto the workspace. Choose a market (Volatility 10–100 Index), trade type (Up/Down or Digits), duration in ticks or minutes, and your stake. All markets in this demo are simulated instruments.',
  },
  {
    icon: '2️⃣',
    title: 'Step 2 — Set the purchase conditions',
    body: 'Open "Purchase conditions" and add a Purchase block. Pick the contract (Rise, Fall, Even, Odd, Over, Under, Matches, Differs) and wire up the "when" condition using analysis and indicator blocks — for example buy Rise when price is above the SMA(10).',
  },
  {
    icon: '3️⃣',
    title: 'Step 3 — Set the restart conditions',
    body: 'In "Restart trading conditions", add Trade again to keep trading after each contract, and Stop trading for take-profit or stop-loss limits. Use the profit blocks (Utility ▸ Tools) to compare against your thresholds.',
  },
  {
    icon: '▶️',
    title: 'Step 4 — Run the bot',
    body: 'Press the green Run button. The bot compiles your strategy, validates every block against an allowlist, and starts executing in a Web Worker against the synthetic market. Watch the Summary, Transactions, Charts, and Journal tabs as it trades. Pause, resume, or stop at any time.',
  },
  {
    icon: '⚡',
    title: 'Quick strategies',
    body: 'The Quick strategy dialog loads complete, ready-to-run strategies: Martingale, D\'Alembert, Oscar\'s Grind, Digit Parity, and SMA Momentum. Each generates real blocks on your workspace that you can inspect and edit.',
  },
  {
    icon: '💾',
    title: 'Saving, versions, import/export',
    body: 'Your workspace autosaves locally. The version history keeps immutable snapshots — every bot run references the exact version it executed. Export your strategy to a JSON file and import it back at any time; imports are validated before they are accepted.',
  },
];

export function BotTutorialsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Tutorials</h1>
        <p className="mt-1.5 text-sm text-deriv-muted">
          Everything you need to build, run, and refine automated strategies — no coding required.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {GUIDES.map((g, i) => (
          <ScrollReveal key={g.title} delay={i * 60}>
            <div className="rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 transition-shadow hover:shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-deriv-red/10 text-xl">{g.icon}</div>
                <div>
                  <h2 className="font-bold text-[var(--text-main)]">{g.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-deriv-muted">{g.body}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-bold text-[var(--text-main)]">Frequently asked questions</h2>
        <div className="mt-4">
          <Accordion
            items={[
              { q: 'What is Deriv Bot?', a: 'A visual tool for automating trading strategies with pre-built blocks and indicators. This demo reconstructs the experience with a genuine block workspace and a working interpreter.' },
              { q: 'Where do I find the blocks I need?', a: 'The toolbox categorises every block: Trade parameters, Purchase conditions, Sell conditions, Restart trading conditions, Analysis (candles + indicators), Utility (notifications, debug, tools), plus Logic, Loops, Math, Text, Lists, Variables, and Functions.' },
              { q: 'How do I remove blocks from the workspace?', a: 'Drag blocks to the trashcan, right-click and Delete, or select and press the Delete key. Ctrl+Z undoes any mistake.' },
              { q: 'Can I test my strategy before trading with real funds?', a: 'Everything here is a zero-risk simulation — there are no real funds anywhere in this demo.' },
              { q: 'How does the bot stay responsive?', a: 'Strategy execution runs in a Web Worker, separate from the UI thread, with structured events streamed back to the interface.' },
            ]}
          />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <Link to="/bot/builder" className="btn-primary h-11 px-6">Open the Bot Builder</Link>
        <Link to="/bot" className="btn-secondary h-11 px-6">Back to dashboard</Link>
      </div>
    </div>
  );
}
