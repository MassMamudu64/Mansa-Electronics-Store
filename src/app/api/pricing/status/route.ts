/**
 * GET /api/pricing/status — admin-only. Powers the admin pricing overview.
 *
 * Returns:
 *   - wholesale_sources rows (id, name, status, lastSyncedAt, lastError)
 *     plus per-source listing counts.
 *   - aggregate counts: total listings, in-stock, stale (>X hours old).
 *   - count of price changes in the last 7 days.
 */
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/guard';
import { prisma } from '@/lib/prisma';
import { countPriceChangesSince } from '@/lib/db/priceHistory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STALE_THRESHOLD_HOURS = 24;

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  const staleThresholdMs = STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  const staleCutoff = new Date(Date.now() - staleThresholdMs);

  try {
    const [sources, total, inStock, stale, recentChanges7d] = await Promise.all([
      prisma.wholesaleSource.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { listings: true } } },
      }),
      prisma.wholesaleListing.count(),
      prisma.wholesaleListing.count({ where: { inStock: true } }),
      prisma.wholesaleListing.count({ where: { scrapedAt: { lt: staleCutoff } } }),
      countPriceChangesSince(7),
    ]);

    return NextResponse.json({
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        baseUrl: s.baseUrl,
        status: s.status,
        lastSyncedAt: s.lastSyncedAt ? s.lastSyncedAt.toISOString() : null,
        lastError: s.lastError,
        listingsCount: s._count.listings,
      })),
      counts: {
        total,
        inStock,
        stale,
        recentChanges7d,
      },
      staleThresholdHours: STALE_THRESHOLD_HOURS,
    });
  } catch (err) {
    console.error('[GET /api/pricing/status]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
