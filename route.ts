import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trades, Trade } from '@/db/schema';
import { desc, eq, and, SQL } from 'drizzle-orm';
import { SupportedMarket } from '@/lib/types';
import { seedSampleTradesIfEmpty } from '@/lib/trade-manager';

export async function GET(request: NextRequest) {
  try {
    await seedSampleTradesIfEmpty();
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') as SupportedMarket | null;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const conditions: SQL[] = [];
    if (market) {
      conditions.push(eq(trades.market, market));
    }
    if (status) {
      conditions.push(eq(trades.status, status));
    }

    let allTrades: Trade[];
    if (conditions.length > 0) {
      allTrades = await db
        .select()
        .from(trades)
        .where(and(...conditions))
        .orderBy(desc(trades.openedAt))
        .limit(limit);
    } else {
      allTrades = await db
        .select()
        .from(trades)
        .orderBy(desc(trades.openedAt))
        .limit(limit);
    }

    return NextResponse.json({
      success: true,
      trades: allTrades,
    });
  } catch (error) {
    console.error('Fetch trades error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trades' }, { status: 500 });
  }
}
