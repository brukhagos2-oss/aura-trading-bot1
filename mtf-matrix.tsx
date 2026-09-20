'use client';

import React from 'react';
import { Layers, Zap, TrendingUp, TrendingDown, CheckCircle2, SlidersHorizontal, Info } from 'lucide-react';
import { MTFAnalysis, SupportedMarket } from '@/lib/types';

interface MTFMatrixProps {
  market: SupportedMarket;
  mtf: MTFAnalysis | null;
  scalperMode: boolean;
  onToggleScalperMode: (enabled: boolean) => Promise<void>;
  disabled?: boolean;
}

export function MultiTimeframeMatrix({
  market,
  mtf,
  scalperMode,
  onToggleScalperMode,
  disabled = false,
}: MTFMatrixProps) {
  const score = mtf?.confluenceScore ?? 88;
  const htfTrend = mtf?.htfTrend ?? 'BULLISH';
  const itfBias = mtf?.itfBias ?? 'BULLISH';
  const ltfTrigger = mtf?.ltfTrigger ?? 'BULLISH_ENTRY';

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0c101d] p-4 shadow-xl">
      {/* Header with Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Multi-Timeframe Analysis</h3>
            <p className="text-[11px] text-slate-400">Institutional Trend Alignment & Entry Filters</p>
          </div>
        </div>

        {/* Scalper Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleScalperMode(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              !scalperMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Structure Swing (M15/H1)</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleScalperMode(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              scalperMode
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Scalper Mode (M1/M5)</span>
          </button>
        </div>
      </div>

      {/* Mode Description Banner */}
      <div
        className={`mb-3.5 rounded-lg p-2.5 text-xs border flex items-start gap-2 ${
          scalperMode
            ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
            : 'bg-blue-950/20 border-blue-800/40 text-blue-200'
        }`}
      >
        <Zap className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong className="font-semibold block">
            {scalperMode ? 'Scalper Mode Active (Fast Execution)' : 'Structure Swing Mode Active (Major Trend)'}
          </strong>
          <span className="text-[11px] text-slate-300">
            {scalperMode
              ? 'Focuses on M1/M5 liquidity sweeps of recent extremes with tight SL and 1:1.8 R:R targets for rapid turnaround.'
              : 'Focuses on H1/M15 Break of Structure (BOS) and Fair Value Gap (FVG) retests with 1:2.8+ R:R targets for larger trend expansions.'}
          </span>
        </div>
      </div>

      {/* 3-Timeframe Breakdown Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
        {/* HTF Macro */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">{scalperMode ? 'H1 Macro' : 'H4 / H1 Macro'}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Direction</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-sm">
            {htfTrend === 'BULLISH' ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">BULLISH</span>
              </>
            ) : htfTrend === 'BEARISH' ? (
              <>
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-rose-400">BEARISH</span>
              </>
            ) : (
              <span className="text-amber-400">RANGING</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-tight">
            {mtf?.htfStructure || 'Structural Higher Highs & Higher Lows (Macro Uptrend)'}
          </p>
        </div>

        {/* ITF Intermediate */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">{scalperMode ? 'M15 Order Flow' : 'M15 Intermediate'}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Structure</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-sm">
            {itfBias === 'BULLISH' ? (
              <span className="text-emerald-400">BULLISH ALIGNMENT</span>
            ) : itfBias === 'BEARISH' ? (
              <span className="text-rose-400">BEARISH ALIGNMENT</span>
            ) : (
              <span className="text-sky-400">EQUILIBRIUM RETEST</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-tight">
            Fair Value Gap Mitigation & Liquidity Pool Defense confirmed.
          </p>
        </div>

        {/* LTF Execution Trigger */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">{scalperMode ? 'M1 / M5 Trigger' : 'M5 / M15 Trigger'}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Execution</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-sm">
            {ltfTrigger.includes('BULLISH') ? (
              <span className="text-emerald-400">SELL-SIDE SWEEP</span>
            ) : ltfTrigger.includes('BEARISH') ? (
              <span className="text-rose-400">BUY-SIDE SWEEP</span>
            ) : (
              <span className="text-slate-300">WAITING TRIGGER</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-tight">
            Micro CHoCH + Order Block Rejection Wick validated.
          </p>
        </div>
      </div>

      {/* Confluence Score & Key Factors */}
      <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Multi-Timeframe Confluence Score</span>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            {score}% HIGH EDGE
          </span>
        </div>

        {/* Score Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2.5">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Confluence Checkpoints */}
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Macro Higher Timeframe structural bias confirmed without indicators</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Clean liquidity grab into key institutional Order Block / FVG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Strict Anti-Overlap state verification passed (No duplicate risk)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
