import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn(
    '⚠️  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set – global stats will be unavailable.'
  );
}

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/* ── Key names ── */
export const KEYS = {
  totalUsers: 'stats:total_users',
  totalSolRecovered: 'stats:total_sol_recovered',
  totalAccountsClosed: 'stats:total_accounts_closed',
  uniqueWallets: 'stats:unique_wallets',
} as const;
