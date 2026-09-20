'use client';

import React, { useState } from 'react';
import {
  Trade,
  SupportedMarket,
  TradeStatus,
} from '@/lib/types';
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RotateCcw,
  Info,
} from 'lucide-react';

interface TradeHistoryTableProps {
  trades: Trade[];
  onRefresh: () => void;
  onResetDatabase: () => Promise<void>;
}

export function TradeHistoryTable({ trades, onRefresh, onResetDatabase }: TradeHistoryTableProps) {
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTradeForModal, setSelectedTradeForModal] = useState<Trade | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const filteredTrades = trades.filter((t) => {
    if (selectedMarket !== 'ALL' && t.market !== selectedMarket) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    return true;
  });

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all trades to initial calibrated sample data?')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetDatabase();
      onRefresh();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-xl">
      {/* Table Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Trade History & Real-Time Lifecycle Log</h3>
          <p className="text-xs text-slate-400">
            Automated monitoring of TP/SL hits and Anti-Overlap state resets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Market Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Markets</option>
              <option value="BTC/USD">BTC/USD</option>
              <option value="XAU/USD">XAU/USD</option>
              <option value="EUR/USD">EUR/USD</option>
              <option value="USD/JPY">USD/JPY</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Outcomes</option>
              <option value="OPEN">Open (Active)</option>
              <option value="TP_HIT">TP Hit (Wins)</option>
              <option value="SL_HIT">SL Hit (Losses)</option>
              <option value="CLOSED_MANUAL">Closed Manual</option>
            </select>
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
            title="Reset to Initial Sample Data"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isResetting ? 'Resetting...' : 'Reset Data'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
              <th className="py-2.5 px-3">Trade #</th>
              <th className="py-2.5 px-3">Market</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Mode</th>
              <th className="py-2.5 px-3">Pattern Setup</th>
              <th className="py-2.5 px-3 text-right">Entry</th>
              <th className="py-2.5 px-3 text-right">TP / SL</th>
              <th className="py-2.5 px-3 text-right">R:R</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">P&L ($)</th>
              <th className="py-2.5 px-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                  No trades found matching current filter.
                </td>
              </tr>
            ) : (
              filteredTrades.map((t) => {
                const isBuy = t.signalType === 'BUY';
                const isWin = t.status === 'TP_HIT' || (t.pnl && t.pnl > 0);
                const isLoss = t.status === 'SL_HIT' || (t.pnl && t.pnl < 0);
                const isOpen = t.status === 'OPEN';

                return (
                  <tr key={t.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-3 text-slate-400">#{t.id}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-white">{t.market}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.signalType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                      {t.mode === 'SCALPER' ? (
                        <span className="text-amber-400 font-semibold">Scalper (M5)</span>
                      ) : (
                        <span className="text-sky-400">Swing (M15)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 max-w-[200px] truncate" title={t.patternName}>
                      {t.patternName}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-400 font-bold">${t.entryPrice}</td>
                    <td className="py-2.5 px-3 text-right text-[11px]">
                      <div className="text-emerald-400">TP: ${t.takeProfit}</div>
                      <div className="text-rose-400">SL: ${t.stopLoss}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">1:{t.riskRewardRatio}</td>
                    <td className="py-2.5 px-3 text-center">
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                          OPEN (LOCKED)
                        </span>
                      ) : isWin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          TP HIT
                        </span>
                      ) : isLoss ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          SL HIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
                          MANUAL
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        isOpen ? 'text-amber-400' : isWin ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isOpen ? 'RUNNING' : `${(t.pnl || 0) >= 0 ? '+' : ''}$${t.pnl?.toFixed(2)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedTradeForModal(t)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="View Setup Details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Trade Setup Detail Modal */}
      {selectedTradeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0c101d] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h4 className="font-bold text-white text-base">
                  Trade #{selectedTradeForModal.id} Details - {selectedTradeForModal.market}
                </h4>
                <span className="text-xs text-slate-400">{selectedTradeForModal.patternName}</span>
              </div>
              <button
                onClick={() => setSelectedTradeForModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[11px] block">Entry Price:</span>
                  <span className="text-sky-400 font-bold">${selectedTradeForModal.entryPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Exit Price:</span>
                  <span className="text-slate-200 font-bold">
                    {selectedTradeForModal.exitPrice ? `$${selectedTradeForModal.exitPrice}` : 'Still Open'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Take Profit:</span>
                  <span className="text-emerald-400 font-bold">${selectedTradeForModal.takeProfit}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Stop Loss:</span>
                  <span className="text-rose-400 font-bold">${selectedTradeForModal.stopLoss}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-1">Price Action Rationale:</span>
                <p className="text-slate-400 leading-relaxed">{selectedTradeForModal.patternReason}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-1">Multi-Timeframe Confluence:</span>
                <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                  {selectedTradeForModal.mtfConfluence}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTradeForModal(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
