'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Unlock, ArrowUpRight, ArrowDownRight, XCircle } from 'lucide-react';
import { Trade, SupportedMarket } from '@/lib/types';

interface AntiOverlapGuardProps {
  market: SupportedMarket;
  activeTrade: Trade | null;
  currentPrice: number;
  onCloseTradeManually: (tradeId: number) => Promise<void>;
}

export function AntiOverlapGuard({
  market,
  activeTrade,
  currentPrice,
  onCloseTradeManually,
}: AntiOverlapGuardProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = async () => {
    if (!activeTrade) return;
    setIsClosing(true);
    try {
      await onCloseTradeManually(activeTrade.id);
    } finally {
      setIsClosing(false);
    }
  };

  // If a trade is active on this market
  if (activeTrade) {
    const isBuy = activeTrade.signalType === 'BUY';
    const riskDist = Math.abs(activeTrade.entryPrice - activeTrade.stopLoss);
    const tpDist = Math.abs(activeTrade.takeProfit - activeTrade.entryPrice);

    // Calculate progress between SL (0%) and TP (100%)
    let progressPercent = 50;
    if (isBuy) {
      const fullRange = activeTrade.takeProfit - activeTrade.stopLoss;
      if (fullRange > 0) {
        progressPercent = Math.max(0, Math.min(100, ((currentPrice - activeTrade.stopLoss) / fullRange) * 100));
      }
    } else {
      const fullRange = activeTrade.stopLoss - activeTrade.takeProfit;
      if (fullRange > 0) {
        progressPercent = Math.max(0, Math.min(100, ((activeTrade.stopLoss - currentPrice) / fullRange) * 100));
      }
    }

    // Floating R
    let currentR = 0;
    if (riskDist > 0) {
      currentR = isBuy
        ? (currentPrice - activeTrade.entryPrice) / riskDist
        : (activeTrade.entryPrice - currentPrice) / riskDist;
    }
    const floatingDollar = (currentR * 100).toFixed(2);
    const isProfitable = currentR >= 0;

    return (
      <div className="rounded-xl border border-amber-600/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-800/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 tracking-wide text-sm sm:text-base">
                  ANTI-OVERLAP GUARD ENGAGED
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MARKET LOCKED
                </span>
              </div>
              <p className="text-xs text-amber-200/70">
                Active Trade #{activeTrade.id} is open on {market}. No overlapping signals permitted until trade reaches TP or SL.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isClosing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isClosing ? 'Closing...' : 'Close Trade Early'}</span>
          </button>
        </div>

        {/* Active Trade Details Grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Direction & Setup</span>
            <div className="flex items-center gap-1 mt-0.5 font-bold">
              {isBuy ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
              <span className={isBuy ? 'text-emerald-400' : 'text-rose-400'}>
                {activeTrade.signalType} ({activeTrade.mode === 'SCALPER' ? 'Scalper' : 'Structure'})
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate" title={activeTrade.patternName}>
              {activeTrade.patternName}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Entry Price</span>
            <span className="text-sky-400 font-mono font-bold text-sm block mt-0.5">
              ${activeTrade.entryPrice}
            </span>
            <span className="text-[10px] text-slate-500">Live: ${currentPrice}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Floating P&L</span>
            <div className={`font-mono font-bold text-sm block mt-0.5 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitable ? '+' : ''}${floatingDollar} ({isProfitable ? '+' : ''}{currentR.toFixed(2)}R)
            </div>
            <span className="text-[10px] text-slate-500">Target: +{activeTrade.riskRewardRatio}R</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Exit Thresholds</span>
            <div className="text-[11px] font-mono mt-0.5">
              <span className="text-emerald-400">TP: ${activeTrade.takeProfit}</span>
              <br />
              <span className="text-rose-400">SL: ${activeTrade.stopLoss}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar between SL -> Entry -> TP */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="text-rose-400">SL: ${activeTrade.stopLoss}</span>
            <span className="text-sky-400">Entry: ${activeTrade.entryPrice}</span>
            <span className="text-emerald-400">TP: ${activeTrade.takeProfit}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isProfitable ? 'bg-gradient-to-r from-sky-500 to-emerald-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // If no trade is active
  return (
    <div className="rounded-xl border border-emerald-900/50 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-emerald-950/10 p-3.5 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-300 text-xs sm:text-sm">
                ANTI-OVERLAP STATE: CLEAN (READY)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0 ACTIVE TRADES ON {market}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bot is scanning market structure. Strict Anti-Overlap protection will lock this market the instant a signal is executed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Execution Available</span>
        </div>
      </div>
    </div>
  );
}
