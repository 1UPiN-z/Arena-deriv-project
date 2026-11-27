# Copy-Paste Prompt for ChatGPT — Wallet Manager Builder

Copy everything inside the code block below and paste it into ChatGPT as a new chat.

---

```text
You are a senior full-stack engineer. Your job is to BUILD a working wallet manager, not to describe one.

## FORBIDDEN REPLY STYLE — DO NOT DO THIS

Do NOT reply like this:
- Do NOT give a bullet list of features ("Send and receive assets. Transfer between managed wallets...")
- Do NOT describe a "preview system" or plan without code
- Do NOT say "I'd implement..." / "You could implement..." / "Here's how you would..."
- Do NOT stop after explaining. Do NOT ask me clarifying questions before coding.
- Do NOT give generic security warnings instead of code.
- Do NOT use placeholders like // TODO, // implement later, pseudo-code, or "etc."
- Do NOT end your turn with a plan. Every turn must contain real, runnable code files.

If the project is too large for one reply, output Part 1 with complete files, then immediately continue with Part 2 in the same reply or say "Continue" and keep going — never stop and wait for me to ask.

## WHAT TO BUILD

Build a complete, runnable Wallet Manager app with a Bot Manager (remote control dashboard + Telegram bot) that can control wallets even if I lose my phone.

### 1. Create New Wallets
- Generate new EVM wallets (ethers.js / viem) from a secure random mnemonic
- Encrypt private keys at rest with AES-256-GCM using a MASTER_KEY from .env — never store plaintext, never log keys
- Show address, allow export of encrypted backup file + mnemonic backup (with explicit user confirmation)
- List all managed wallets with balances (native + ERC-20)

### 2. Connect External Wallets WITHOUT Seed Phrases
- Connect via WalletConnect v2, injected provider (MetaMask, Coinbase Wallet, etc.), and read-only address import
- These become "Permitted Wallets" — the manager can view balances, prepare transactions, and request signatures via the WalletConnect session / injected signer
- NEVER ask for or store seed phrases or private keys of external wallets
- Store only: address, chainId, connection type, session topic, label
- If a session expires, show "Reconnect" — do not pretend you have control you don't have

### 3. Sweeping & Transfers (REAL EXECUTION, NOT JUST PREVIEW)
- Sweep: move ALL tokens (native + ERC-20) from a source wallet to a destination wallet
- Transfer between any two managed/permitted wallets
- Send / Receive for any wallet
- Batch sweep: select multiple sources -> one destination
- For each sweep/transfer:
  a. Fetch balances, calculate gas (estimateGas + gasPrice / EIP-1559 fees)
  b. Show a confirmation screen: source, destination, token, amount, estimated fee, resulting balances
  c. Require explicit Confirm button click
  d. Execute the transaction, monitor pending -> confirmed, handle nonce management and stuck transactions
  e. Show tx hash, explorer link, and final balances
- Token approvals + revocations UI
- Transaction simulation (eth_call) before sending, show revert reason if it fails

### 4. Bot Manager — Phone-Loss Recovery
This is the core use case: I lose my phone, but my Bot Manager still has access to my permitted wallets.
- Web dashboard (Next.js) accessible from any browser — no phone wallet needed
- Telegram bot (same backend) with commands: /wallets, /balances, /sweep, /new-wallet, /recover
- Recovery flow, one click:
  1. From Bot Manager, click "Create Recovery Wallet" -> generates a NEW wallet, shows address + encrypted backup
  2. Select all Permitted Wallets -> click "Sweep All to Recovery Wallet"
  3. Bot executes sweeps for every managed wallet it holds keys for, and sends signature requests to external wallets via their active WalletConnect sessions
  4. Shows live progress per wallet until all funds are in the recovery wallet
- Bot Manager must be able to sweep managed wallets autonomously after my confirmation (no phone needed)
- For external wallets, be honest in UI: "Sweep requires this wallet to approve on its device" if no active session exists

### 5. Extra Controls
- Gas estimation, fee selection (slow / standard / fast)
- Pending transaction monitoring + cancel/replace (speed up) where supported
- Activity history per wallet
- Multi-chain: Ethereum mainnet + at least 2 testnets (Sepolia, Arbitrum Sepolia) — make chain config extensible

## TECH STACK (use this unless you have a strong reason not to)
- Frontend + Bot backend: Next.js (App Router) + TypeScript
- Wallet logic: viem (preferred) or ethers.js v6
- WalletConnect: @walletconnect/ethereum-provider v2
- Telegram bot: telegraf or grammy (Node.js)
- DB: SQLite via Prisma or better-sqlite3 (single-file, easy to run)
- Styling: Tailwind CSS
- Env: .env.example with every required variable explained

## OUTPUT FORMAT — FOLLOW EXACTLY

Start your reply with code. No intro paragraph. No "Sure! Here's..."

1. First: exact file tree
2. Then: complete contents of EVERY file, each in its own fenced code block with the full path as the header, e.g.:

### `app/page.tsx`
```tsx
// full runnable code, no placeholders
```

3. Then: install + run commands:
```
npm install
cp .env.example .env   # fill in keys
npm run dev
```

4. Then: a short "How to test the phone-loss flow" section with 5 steps.

## DEFINITION OF DONE
- [ ] `npm install && npm run dev` runs without errors
- [ ] I can create a new wallet from the UI and see its balance
- [ ] I can connect an external wallet via WalletConnect without entering a seed
- [ ] I can sweep a managed wallet to another wallet and see the tx confirmed
- [ ] I can open the Bot Manager in a browser (no phone wallet) and trigger "Sweep All to Recovery Wallet"
- [ ] Telegram bot responds to /wallets and /sweep
- [ ] No TODOs, no placeholders, no "implement later" anywhere

Begin now. Output Part 1 files immediately.
```
