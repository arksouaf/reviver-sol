'use client';

import { useEffect, useState } from 'react';

const CACHE_KEY = 'sol_price_cache';
const CACHE_TTL_MS = 60_000; // Re-fetch at most every 60 seconds

interface CachedPrice {
  price: number;
  ts: number;
}

function readCache(): CachedPrice | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedPrice = JSON.parse(raw);
    if (Date.now() - cached.ts < CACHE_TTL_MS) return cached;
  } catch {}
  return null;
}

function writeCache(price: number) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ price, ts: Date.now() }));
  } catch {}
}

/**
 * Fetches the live SOL/USD price from CoinGecko's free API.
 * Falls back to a static estimate if the request fails.
 */
export function useSolPrice(fallback = 180): number {
  const [price, setPrice] = useState<number>(() => {
    const cached = typeof window !== 'undefined' ? readCache() : null;
    return cached?.price ?? fallback;
  });

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setPrice(cached.price);
      return;
    }

    let cancelled = false;

    async function fetchPrice() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const fetched = data?.solana?.usd;
        if (typeof fetched === 'number' && fetched > 0 && !cancelled) {
          setPrice(fetched);
          writeCache(fetched);
        }
      } catch {
        // Silently use fallback — no console noise
      }
    }

    fetchPrice();

    return () => {
      cancelled = true;
    };
  }, [fallback]);

  return price;
}
