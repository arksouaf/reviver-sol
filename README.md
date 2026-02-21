# Reviver SOL

Reviver SOL is a powerful, open-source tool designed to help Solana users clean up their wallets and reclaim trapped SOL from empty or unwanted token accounts.

When you receive tokens on Solana, a small amount of SOL (~0.002 SOL) is allocated as "rent" to keep that token account alive on the blockchain. Even after you sell or transfer all the tokens, the empty account remains, locking up your SOL. Reviver SOL scans your wallet for these accounts and safely closes them, returning the rent directly to your balance.

## Features

- **Scan & Reclaim**: Automatically detects empty SPL and Token-2022 accounts.
- **Burn & Close (Optional)**: A toggleable "Include accounts with tokens" mode allows you to permanently burn remaining tokens (like worthless meme coins or airdrops) and close the accounts to reclaim the rent.
- **Smart Batching**: Groups up to 20 accounts per transaction to minimize network fees and maximize efficiency.
- **Single-Click Approval**: Uses `signAllTransactions` to let you approve all batches in a single wallet popup.
- **Safety First**: Automatically detects and skips frozen accounts or Token-2022 accounts with withheld transfer fees that cannot be closed.
- **Live SOL Price**: Fetches real-time SOL/USD prices to show you exactly how much value you're reclaiming.

## Project Structure

The repository is split into two independent parts:

- `/frontend`: A modern Next.js 16 web application with a beautiful UI, built with React, Tailwind CSS, and shadcn/ui. It uses `@solana/wallet-adapter` for seamless wallet integration.
- `/backend`: The original Node.js CLI script (`src/closeEmptyAccounts.ts`) that can be run from the terminal using a private key.

## Getting Started (Frontend)

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up your RPC URL:
   Create a `.env.local` file in the `frontend` directory and add your dedicated Solana RPC endpoint (e.g., Helius, Alchemy, QuickNode). Public endpoints often block the `getParsedTokenAccountsByOwner` method required for scanning.
   ```env
   NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Connect Wallet**: Connect your Phantom, Solflare, or other Solana wallet.
2. **Scan**: The app queries the blockchain for all token accounts owned by your wallet.
3. **Review**: See exactly how many accounts can be closed and how much SOL you will get back.
4. **Reclaim**: Click "Reclaim All". The app builds the necessary `CloseAccount` (and optionally `Burn`) instructions, batches them, and asks for your signature.
5. **Profit**: The reclaimed rent SOL is deposited directly into your wallet.

*Note: A small developer fee of 0.0001 SOL per closed account is collected to support the maintenance of this tool.*

## Disclaimer

The "Include accounts with tokens" feature permanently burns tokens. This action is irreversible. Tokens with real monetary value will be permanently lost if you choose to burn them. Always review the list of accounts carefully before proceeding.

## License

MIT License
