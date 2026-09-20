import { db } from '@/db';
import { trades, botSettings, botLogs, Trade, NewTrade } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { SupportedMarket, PriceActionSignal, MARKET_METADATA } from './types';

/**
 * TRADE MANAGER & STRICT ANTI-OVERLAP STATE CONTROLLER
 * Rule: If an active trade is already open on a market, the bot is STRICTLY FORBIDDEN
 * from generating or sending another overlapping signal until the current active
 * trade hits its Take Profit (TP) or Stop Loss (SL) and completely closes out.
 */

export async function getActiveTrade(market: SupportedMarket): Promise<Trade | null> {
  const active = await db
    .select()
    .from(trades)
    .where(and(eq(trades.market, market), eq(trades.status, 'OPEN')))
    .limit(1);

  return active.length > 0 ? active[0] : null;
}

export async function canGenerateSignal(market: SupportedMarket): Promise<{
  allowed: boolean;
  reason?: string;
  activeTrade?: Trade;
}> {
  const active = await getActiveTrade(market);
  if (active) {
    return {
      allowed: false,
      reason: `Market ${market} is LOCKED. Active Trade #${active.id} (${active.signalType} @ ${active.entryPrice}) is still open. Strict Anti-Overlap protection forbids new signals until TP or SL is reached.`,
      activeTrade: active,
    };
  }
  return { allowed: true };
}

export async function logBotEvent(market: SupportedMarket, level: string, message: string) {
  try {
    await db.insert(botLogs).values({
      market,
      level,
      message,
    });
  } catch (err) {
    console.error('Failed to write bot log:', err);
  }
}

export async function ensureBotSetting(market: SupportedMarket) {
  const existing = await db
    .select()
    .from(botSettings)
    .where(eq(botSettings.market, market))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(botSettings).values({
      market,
      isAutoTrading: true,
      scalperMode: false,
      riskPerTrade: 1.0,
      minRiskReward: 2.0,
      maxOpenTrades: 1,
      activeLock: false,
    });
  }
}

export async function getBotSetting(market: SupportedMarket) {
  await ensureBotSetting(market);
  const rows = await db
    .select()
    .from(botSettings)
    .where(eq(botSettings.market, market))
    .limit(1);
  return rows[0];
}

export async function updateBotSetting(
  market: SupportedMarket,
  updates: Partial<{
    isAutoTrading: boolean;
    scalperMode: boolean;
    riskPerTrade: number;
    minRiskReward: number;
  }>
) {
  await ensureBotSetting(market);
  await db
    .update(botSettings)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(botSettings.market, market));
}

export async function executeSignalAsTrade(signal: PriceActionSignal): Promise<{
  success: boolean;
  trade?: Trade;
  error?: string;
}> {
  // STRICT ANTI-OVERLAP ENFORCEMENT
  const check = await canGenerateSignal(signal.market);
  if (!check.allowed) {
    await logBotEvent(
      signal.market,
      'BLOCKED_ANTI_OVERLAP',
      `ANTI-OVERLAP GUARD: Rejected ${signal.signalType} signal. Active Trade #${check.activeTrade?.id} is still running.`
    );
    return {
      success: false,
      error: check.reason,
    };
  }

  // Calculate position sizing (assuming $10,000 demo equity & 1% risk = $100 risk)
  const equity = 10000;
  const riskAmount = equity * 0.01; // 1% risk = $100
  const priceDistance = Math.abs(signal.entryPrice - signal.stopLoss);
  let lotSize = 1.0;

  if (signal.market === 'BTC/USD') {
    lotSize = Number((riskAmount / (priceDistance || 100)).toFixed(4));
  } else if (signal.market === 'XAU/USD') {
    lotSize = Number((riskAmount / ((priceDistance || 5) * 100)).toFixed(2));
  } else {
    // Forex
    lotSize = Number((riskAmount / ((priceDistance || 0.002) * 100000)).toFixed(2));
  }
  if (lotSize <= 0) lotSize = 0.1;

  const newTrade: NewTrade = {
    market: signal.market,
    signalType: signal.signalType,
    mode: signal.mode,
    timeframe: signal.timeframe,
    entryPrice: signal.entryPrice,
    takeProfit: signal.takeProfit,
    stopLoss: signal.stopLoss,
    riskRewardRatio: signal.riskRewardRatio,
    lotSize,
    status: 'OPEN',
    patternName: signal.patternName,
    patternReason: signal.patternReason,
    mtfConfluence: JSON.stringify(signal.mtfConfluence),
  };

  const inserted = await db.insert(trades).values(newTrade).returning();
  const createdTrade = inserted[0];

  // Lock bot state
  await db
    .update(botSettings)
    .set({
      activeLock: true,
      currentActiveTradeId: createdTrade.id,
      updatedAt: new Date(),
    })
    .where(eq(botSettings.market, signal.market));

  await logBotEvent(
    signal.market,
    'EXECUTION',
    `ORDER EXECUTED: ${signal.signalType} ${signal.market} @ ${signal.entryPrice}. TP: ${signal.takeProfit} | SL: ${signal.stopLoss} (R:R 1:${signal.riskRewardRatio}). Anti-Overlap lock engaged on market.`
  );

  return { success: true, trade: createdTrade };
}

/**
 * Check if the active trade on a market has hit TP or SL
 * If concluded, updates status, computes PnL, logs event, and resets the lock!
 */
export async function checkTradeLifecycle(
  market: SupportedMarket,
  currentPrice: number
): Promise<{
  activeTrade: Trade | null;
  concludedTrade: Trade | null;
  event: 'NONE' | 'TP_HIT' | 'SL_HIT';
}> {
  const trade = await getActiveTrade(market);
  if (!trade) {
    return { activeTrade: null, concludedTrade: null, event: 'NONE' };
  }

  let event: 'NONE' | 'TP_HIT' | 'SL_HIT' = 'NONE';
  let exitPrice: number | null = null;
  let pnl = 0;
  let pnlPercent = 0;

  const riskDistance = Math.abs(trade.entryPrice - trade.stopLoss);
  const dollarRisk = 100; // standard $100 risk baseline

  if (trade.signalType === 'BUY') {
    if (currentPrice >= trade.takeProfit) {
      event = 'TP_HIT';
      exitPrice = trade.takeProfit;
      pnl = dollarRisk * trade.riskRewardRatio;
      pnlPercent = ((trade.takeProfit - trade.entryPrice) / trade.entryPrice) * 100;
    } else if (currentPrice <= trade.stopLoss) {
      event = 'SL_HIT';
      exitPrice = trade.stopLoss;
      pnl = -dollarRisk;
      pnlPercent = ((trade.stopLoss - trade.entryPrice) / trade.entryPrice) * 100;
    }
  } else {
    // SELL
    if (currentPrice <= trade.takeProfit) {
      event = 'TP_HIT';
      exitPrice = trade.takeProfit;
      pnl = dollarRisk * trade.riskRewardRatio;
      pnlPercent = ((trade.entryPrice - trade.takeProfit) / trade.entryPrice) * 100;
    } else if (currentPrice >= trade.stopLoss) {
      event = 'SL_HIT';
      exitPrice = trade.stopLoss;
      pnl = -dollarRisk;
      pnlPercent = ((trade.entryPrice - trade.stopLoss) / trade.entryPrice) * 100;
    }
  }

  if (event !== 'NONE' && exitPrice !== null) {
    const updated = await db
      .update(trades)
      .set({
        status: event,
        exitPrice,
        pnl: Number(pnl.toFixed(2)),
        pnlPercent: Number(pnlPercent.toFixed(2)),
        closedAt: new Date(),
      })
      .where(eq(trades.id, trade.id))
      .returning();

    const concludedTrade = updated[0];

    // Release anti-overlap lock
    await db
      .update(botSettings)
      .set({
        activeLock: false,
        currentActiveTradeId: null,
        updatedAt: new Date(),
      })
      .where(eq(botSettings.market, market));

    if (event === 'TP_HIT') {
      await logBotEvent(
        market,
        'TP_HIT',
        `TARGET HIT: Trade #${trade.id} reached Take Profit @ ${exitPrice} (+${trade.riskRewardRatio}R | +$${pnl.toFixed(
          2
        )}). Lock released. State reset for next setup.`
      );
    } else {
      await logBotEvent(
        market,
        'SL_HIT',
        `STOP LOSS HIT: Trade #${trade.id} stopped out @ ${exitPrice} (-1.0R | -$${Math.abs(pnl).toFixed(
          2
        )}). Capital preserved. Lock released. State reset.`
      );
    }

    return { activeTrade: null, concludedTrade, event };
  }

  return { activeTrade: trade, concludedTrade: null, event: 'NONE' };
}

export async function closeTradeManually(tradeId: number, currentPrice: number): Promise<Trade | null> {
  const existing = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  if (existing.length === 0 || existing[0].status !== 'OPEN') return null;

  const trade = existing[0];
  const dollarRisk = 100;
  const riskDist = Math.abs(trade.entryPrice - trade.stopLoss);
  let pnl = 0;
  let pnlPercent = 0;

  if (trade.signalType === 'BUY') {
    const r = (currentPrice - trade.entryPrice) / (riskDist || 1);
    pnl = dollarRisk * r;
    pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
  } else {
    const r = (trade.entryPrice - currentPrice) / (riskDist || 1);
    pnl = dollarRisk * r;
    pnlPercent = ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
  }

  const updated = await db
    .update(trades)
    .set({
      status: 'CLOSED_MANUAL',
      exitPrice: currentPrice,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      closedAt: new Date(),
    })
    .where(eq(trades.id, tradeId))
    .returning();

  // Release lock
  await db
    .update(botSettings)
    .set({
      activeLock: false,
      currentActiveTradeId: null,
      updatedAt: new Date(),
    })
    .where(eq(botSettings.market, trade.market as SupportedMarket));

  await logBotEvent(
    trade.market as SupportedMarket,
    'INFO',
    `MANUAL CLOSE: Trade #${trade.id} closed manually @ ${currentPrice} (PnL: $${pnl.toFixed(2)}). Lock released.`
  );

  return updated[0];
}

/**
 * Seed historical trades if the database is fresh
 */
export async function seedSampleTradesIfEmpty() {
  const count = await db.select().from(trades).limit(1);
  if (count.length > 0) return;

  const initialSeed: NewTrade[] = [
    {
      market: 'BTC/USD',
      signalType: 'BUY',
      mode: 'STRUCTURE_SWING',
      timeframe: 'M15',
      entryPrice: 79240.0,
      takeProfit: 81400.0,
      stopLoss: 78420.0,
      riskRewardRatio: 2.63,
      lotSize: 0.12,
      status: 'TP_HIT',
      exitPrice: 81400.0,
      pnl: 263.0,
      pnlPercent: 2.73,
      patternName: 'Liquidity Sweep + CHoCH Bullish Reversal',
      patternReason: 'Asian low swept with clean 4h bullish order block mitigation. Fast impulse displacement.',
      mtfConfluence: JSON.stringify({ htfTrend: 'BULLISH', confluenceScore: 92 }),
      openedAt: new Date(Date.now() - 36 * 3600 * 1000),
      closedAt: new Date(Date.now() - 28 * 3600 * 1000),
    },
    {
      market: 'XAU/USD',
      signalType: 'SELL',
      mode: 'STRUCTURE_SWING',
      timeframe: 'M15',
      entryPrice: 2758.5,
      takeProfit: 2732.0,
      stopLoss: 2768.5,
      riskRewardRatio: 2.65,
      lotSize: 1.0,
      status: 'TP_HIT',
      exitPrice: 2732.0,
      pnl: 265.0,
      pnlPercent: 0.96,
      patternName: 'Bearish BOS + Fair Value Gap Retest',
      patternReason: 'London Open buy-side liquidity purge into previous day high, followed by 15m bearish BOS and FVG retest.',
      mtfConfluence: JSON.stringify({ htfTrend: 'BEARISH', confluenceScore: 94 }),
      openedAt: new Date(Date.now() - 24 * 3600 * 1000),
      closedAt: new Date(Date.now() - 19 * 3600 * 1000),
    },
    {
      market: 'EUR/USD',
      signalType: 'BUY',
      mode: 'SCALPER',
      timeframe: 'M5',
      entryPrice: 1.0824,
      takeProfit: 1.0858,
      stopLoss: 1.0807,
      riskRewardRatio: 2.0,
      lotSize: 0.58,
      status: 'TP_HIT',
      exitPrice: 1.0858,
      pnl: 200.0,
      pnlPercent: 0.31,
      patternName: 'Asian Range Low Sweep + Micro CHoCH',
      patternReason: 'Frankfurt open purged sell stops below 1.0810, quick V-shape reversal with institutional absorption.',
      mtfConfluence: JSON.stringify({ htfTrend: 'BULLISH', confluenceScore: 88 }),
      openedAt: new Date(Date.now() - 15 * 3600 * 1000),
      closedAt: new Date(Date.now() - 13 * 3600 * 1000),
    },
    {
      market: 'USD/JPY',
      signalType: 'BUY',
      mode: 'STRUCTURE_SWING',
      timeframe: 'M15',
      entryPrice: 153.85,
      takeProfit: 154.25,
      stopLoss: 154.02,
      riskRewardRatio: 2.35,
      lotSize: 0.58,
      status: 'SL_HIT',
      exitPrice: 153.68,
      pnl: -100.0,
      pnlPercent: -0.11,
      patternName: 'Bullish BOS + FVG Mitigation',
      patternReason: 'Attempted continuation of H4 uptrend; stopped out due to sudden Bank of Japan intervention rumors.',
      mtfConfluence: JSON.stringify({ htfTrend: 'BULLISH', confluenceScore: 78 }),
      openedAt: new Date(Date.now() - 10 * 3600 * 1000),
      closedAt: new Date(Date.now() - 8 * 3600 * 1000),
    },
    {
      market: 'BTC/USD',
      signalType: 'SELL',
      mode: 'SCALPER',
      timeframe: 'M5',
      entryPrice: 80850.0,
      takeProfit: 80120.0,
      stopLoss: 81220.0,
      riskRewardRatio: 1.97,
      lotSize: 0.27,
      status: 'TP_HIT',
      exitPrice: 80120.0,
      pnl: 197.0,
      pnlPercent: 0.9,
      patternName: 'Liquidity Sweep + CHoCH Bearish Rejection',
      patternReason: 'Micro sweep of 81k psychological round number; upper wick rejection and fast 5m momentum cascade.',
      mtfConfluence: JSON.stringify({ htfTrend: 'BEARISH', confluenceScore: 90 }),
      openedAt: new Date(Date.now() - 5 * 3600 * 1000),
      closedAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  ];

  for (const item of initialSeed) {
    await db.insert(trades).values(item);
  }

  // Ensure default bot settings exist for all 4 markets
  const markets: SupportedMarket[] = ['BTC/USD', 'XAU/USD', 'EUR/USD', 'USD/JPY'];
  for (const m of markets) {
    await ensureBotSetting(m);
  }

  await logBotEvent('BTC/USD', 'INFO', 'System initialized. 10-Year Historical Price Action Engine ready.');
}
