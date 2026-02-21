import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/lib/redis';

/* ── GET  /api/stats ── */
export async function GET() {
  if (!redis) {
    return NextResponse.json({
      totalUsers: 0,
      totalSolRecovered: 0,
      totalAccountsClosed: 0,
    });
  }

  const [totalUsers, totalSolRecovered, totalAccountsClosed] = await Promise.all([
    redis.scard(KEYS.uniqueWallets),
    redis.get<number>(KEYS.totalSolRecovered),
    redis.get<number>(KEYS.totalAccountsClosed),
  ]);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    totalSolRecovered: Number(totalSolRecovered ?? 0),
    totalAccountsClosed: totalAccountsClosed ?? 0,
  });
}

/* ── POST  /api/stats ── */
export async function POST(req: NextRequest) {
  if (!redis) {
    return NextResponse.json({ ok: false, reason: 'Redis not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { wallet, solRecovered, accountsClosed } = body as {
      wallet: string;
      solRecovered: number;
      accountsClosed: number;
    };

    if (!wallet || typeof solRecovered !== 'number' || typeof accountsClosed !== 'number') {
      return NextResponse.json({ ok: false, reason: 'Invalid payload' }, { status: 400 });
    }

    // Use a pipeline for atomicity
    const pipe = redis.pipeline();
    pipe.sadd(KEYS.uniqueWallets, wallet);                     // unique wallets set
    pipe.incrbyfloat(KEYS.totalSolRecovered, solRecovered);    // cumulative SOL
    pipe.incrby(KEYS.totalAccountsClosed, accountsClosed);     // cumulative accounts
    await pipe.exec();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('POST /api/stats error:', err);
    return NextResponse.json({ ok: false, reason: err.message }, { status: 500 });
  }
}
