'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SupportedMarket,
  TimeFrame,
  Candle,
  Trade,
  MTFAnalysis,
  MARKET_METADATA,
} from '@/lib/types';
import { BotLog } from '@/db/schema';
import { TradingChart } from '@/components/trading-chart';
import { AntiOverlapGuard } from '@/components/anti-overlap-guard';
import { MultiTimeframeMatrix } from '@/components/mtf-matrix';
import { HistoricalEdgePanel } from '@/components/historical-edge-panel';
import { TradeHistoryTable } from '@/components/trade-history-table';
import { BotLogsTerminal } from '@/components/bot-logs-terminal';
import { RailwayDeployGuide } from '@/components/railway-deploy-guide';
import {
  Activity,
  Play,
  Pause,
  Scan,
  RefreshCw,
  Wallet,
  TrendingUp,
  History,
  Layers,
  Terminal,
  Rocket,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function TradingBotDashboard() {
  const [activeTab, setActiveTab] = useState<
    'terminal' | 'historical_edge' | 'trade_history' | 'logs' | 'railway'
  >('terminal');

  const [selectedMarket, setSelectedMarket] = useState<SupportedMarket>('BTC/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('M15');

  // Bot & Market States
  const [marketStatuses, setMarketStatuses] = useState<Record<string, any>>({});
  const [currentPrice, setCurrentPrice] = useState<number>(80395.0);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [priceActionData, setPriceActionData] = useState<any>(null);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [tradesHistory, setTradesHistory] = useState<Trade[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [mtfAnalysis, setMtfAnalysis] = useState<MTFAnalysis | null>(null);

  // Settings
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(true);
  const [scalperMode, setScalperMode] = useState<boolean>(false);
  const [autoTickInterval, setAutoTickInterval] = useState<boolean>(true);

  // Loading flags
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTicking, setIsTicking] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warn' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch bot global status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.markets) {
          setMarketStatuses(data.markets);
          const currentMarketInfo = data.markets[selectedMarket];
          if (currentMarketInfo) {
            setCurrentPrice(currentMarketInfo.currentPrice);
            setActiveTrade(currentMarketInfo.activeTrade);
            if (currentMarketInfo.setting) {
              setIsAutoTrading(currentMarketInfo.setting.isAutoTrading);
              setScalperMode(currentMarketInfo.setting.scalperMode);
            }
          }
        }
      }
    } catch (e) {
      console.error('Fetch status error:', e);
    }
  }, [selectedMarket]);

  // Fetch candlestick data for selected market and timeframe
  const fetchCandles = useCallback(async () => {
    setIsLoadingCandles(true);
    try {
      const res = await fetch(`/api/market/candles?market=${encodeURIComponent(selectedMarket)}&timeframe=${selectedTimeframe}&count=120`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.candles) {
          setCandles(data.candles);
          setPriceActionData(data.priceAction);
          if (data.candles.length > 0) {
            setCurrentPrice(data.candles[data.candles.length - 1].close);
          }
        }
      }
    } catch (e) {
      console.error('Fetch candles error:', e);
    } finally {
      setIsLoadingCandles(false);
    }
  }, [selectedMarket, selectedTimeframe]);

  // Fetch trades history
  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/trades?limit=60');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.trades) {
          setTradesHistory(data.trades);
        }
      }
    } catch (e) {
      console.error('Fetch trades error:', e);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs?limit=40');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setBotLogs(data.logs);
        }
      }
    } catch (e) {
      console.error('Fetch logs error:', e);
    }
  }, []);

  // Fetch analytics stats
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data);
        }
      }
    } catch (e) {
      console.error('Fetch analytics error:', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchCandles();
    fetchTrades();
    fetchLogs();
    fetchAnalytics();
  }, [fetchStatus, fetchCandles, fetchTrades, fetchLogs, fetchAnalytics]);

  // Advance tick function
  const triggerTick = useCallback(async () => {
    if (isTicking) return;
    setIsTicking(true);
    try {
      const res = await fetch('/api/market/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: selectedMarket }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentPrice(data.currentPrice);
          setActiveTrade(data.activeTrade);

          // Update latest candle in state
          if (data.updatedCandle) {
            setCandles((prev) => {
              if (prev.length === 0) return [data.updatedCandle];
              const last = prev[prev.length - 1];
              if (last.time === data.updatedCandle.time) {
                return [...prev.slice(0, -1), data.updatedCandle];
              } else {
                return [...prev.slice(-119), data.updatedCandle];
              }
            });
          }

          // Trade lifecycle events
          if (data.event === 'TP_HIT') {
            showNotification(
              `🎯 TAKE PROFIT HIT on ${selectedMarket}! Trade #${data.concludedTrade?.id} closed in profit. Anti-Overlap lock released.`,
              'success'
            );
            fetchTrades();
            fetchAnalytics();
            fetchLogs();
          } else if (data.event === 'SL_HIT') {
            showNotification(
              `🛑 STOP LOSS HIT on ${selectedMarket}. Capital protected. Anti-Overlap lock released.`,
              'warn'
            );
            fetchTrades();
            fetchAnalytics();
            fetchLogs();
          }

          // New trade triggered automatically
          if (data.newTradeTriggered) {
            showNotification(
              `⚡ NEW TRADE EXECUTED: ${data.newTradeTriggered.signalType} ${selectedMarket} @ $${data.newTradeTriggered.entryPrice}. Anti-Overlap Lock Engaged!`,
              'info'
            );
            fetchTrades();
            fetchLogs();
          }
        }
      }
    } catch (e) {
      console.error('Tick error:', e);
    } finally {
      setIsTicking(false);
    }
  }, [selectedMarket, isTicking, fetchTrades, fetchAnalytics, fetchLogs]);

  // Periodic tick simulator (every 5 seconds)
  useEffect(() => {
    if (!autoTickInterval) return;

    const interval = setInterval(() => {
      triggerTick();
    }, 4500);

    return () => clearInterval(interval);
  }, [autoTickInterval, triggerTick]);

  // Toggle Auto-Trading
  const handleToggleAutoTrading = async () => {
    const nextState = !isAutoTrading;
    setIsAutoTrading(nextState);
    try {
      const res = await fetch('/api/bot/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: selectedMarket, isAutoTrading: nextState }),
      });
      if (res.ok) {
        showNotification(
          `Automated Bot for ${selectedMarket} is now ${nextState ? 'ACTIVE' : 'PAUSED'}`,
          nextState ? 'success' : 'warn'
        );
        fetchStatus();
        fetchLogs();
      }
    } catch (e) {
      console.error('Toggle error:', e);
    }
  };

  // Toggle Scalper Mode
  const handleToggleScalperMode = async (enabled: boolean) => {
    setScalperMode(enabled);
    setSelectedTimeframe(enabled ? 'M5' : 'M15');
    try {
      const res = await fetch('/api/bot/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: selectedMarket, scalperMode: enabled }),
      });
      if (res.ok) {
        showNotification(
          `Trading mode updated to: ${enabled ? 'SCALPER MODE (M1/M5)' : 'STRUCTURE SWING (M15/H1)'}`,
          'info'
        );
        fetchStatus();
        fetchCandles();
        fetchLogs();
      }
    } catch (e) {
      console.error('Toggle scalper error:', e);
    }
  };

  // Manual Scan button
  const handleScanNow = async (forceExecute = true) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/bot/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: selectedMarket,
          mode: scalperMode ? 'SCALPER' : 'STRUCTURE_SWING',
          forceSetup: true,
          execute: forceExecute,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.blocked) {
          showNotification(
            `⚠️ ANTI-OVERLAP BLOCKED: Trade #${data.activeTrade?.id} is currently active on ${selectedMarket}. Duplicate signals are strictly forbidden until TP or SL is reached.`,
            'warn'
          );
        } else if (data.executedTrade) {
          showNotification(
            `✅ SIGNAL DETECTED & EXECUTED: ${data.executedTrade.signalType} @ $${data.executedTrade.entryPrice} (TP: $${data.executedTrade.takeProfit} | SL: $${data.executedTrade.stopLoss}). Market locked.`,
            'success'
          );
          setActiveTrade(data.executedTrade);
          fetchTrades();
          fetchCandles();
          fetchLogs();
        } else if (data.signal) {
          setMtfAnalysis(data.mtf);
          showNotification(
            `Price Action Setup identified: ${data.signal.patternName}. Ready to execute.`,
            'info'
          );
        }
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Manual Close Trade early
  const handleCloseTradeEarly = async (tradeId: number) => {
    try {
      const res = await fetch('/api/bot/close-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, market: selectedMarket, currentPrice }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Trade #${tradeId} manually closed at $${currentPrice}. Lock released.`, 'info');
        setActiveTrade(null);
        fetchTrades();
        fetchAnalytics();
        fetchLogs();
        fetchStatus();
      }
    } catch (e) {
      console.error('Close trade error:', e);
    }
  };

  // Reset database handler
  const handleResetDatabase = async () => {
    try {
      const res = await fetch('/api/bot/reset', { method: 'POST' });
      if (res.ok) {
        showNotification('Database reset to initial sample state.', 'success');
        fetchStatus();
        fetchTrades();
        fetchCandles();
        fetchLogs();
        fetchAnalytics();
      }
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const marketsList: SupportedMarket[] = ['BTC/USD', 'XAU/USD', 'EUR/USD', 'USD/JPY'];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium transition-all duration-300 max-w-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200 shadow-emerald-950/50'
              : notification.type === 'warn'
              ? 'bg-amber-950/90 border-amber-700/60 text-amber-200 shadow-amber-950/50'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/60 text-rose-200 shadow-rose-950/50'
              : 'bg-sky-950/90 border-sky-700/60 text-sky-200 shadow-sky-950/50'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="border-b border-slate-800 bg-[#080d19]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Philosophy Tag */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-400 text-white font-black text-xl shadow-lg shadow-sky-900/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  AURA <span className="text-sky-400 font-bold">TRADING BOT</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PURE PRICE ACTION (0 INDICATORS)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                10-Year Historical Edge • Strict Anti-Overlap Engine • Multi-Market Automated
              </p>
            </div>
          </div>

          {/* Quick Header Ticker Stats */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Account Equity Badge */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Simulated Capital</span>
                <span className="font-bold text-white">
                  ${analytics?.stats?.accountBalance?.toLocaleString() || '10,825.00'}
                </span>
              </div>
              <span className="ml-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                +{(analytics?.stats?.winRate || 68.4).toFixed(1)}% WR
              </span>
            </div>

            {/* Auto Trading Switcher */}
            <button
              onClick={handleToggleAutoTrading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-sm ${
                isAutoTrading
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {isAutoTrading ? (
                <>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Bot: ACTIVE</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bot: PAUSED</span>
                </>
              )}
            </button>

            {/* Scan Market Button */}
            <button
              onClick={() => handleScanNow(true)}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md transition disabled:opacity-50"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>{isScanning ? 'Evaluating PA...' : 'Scan Market Now'}</span>
            </button>

            {/* Live Tick Simulator */}
            <button
              onClick={triggerTick}
              disabled={isTicking}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Simulate Next Live Tick & Check TP/SL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Market Switcher Ribbon */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {marketsList.map((m) => {
            const meta = MARKET_METADATA[m];
            const isSelected = selectedMarket === m;
            const marketInfo = marketStatuses[m];
            const price = marketInfo?.currentPrice || (m === 'BTC/USD' ? 80395.0 : m === 'XAU/USD' ? 2742.5 : m === 'EUR/USD' ? 1.0845 : 154.65);
            const isLocked = marketInfo?.isLocked;

            return (
              <button
                key={m}
                onClick={() => {
                  setSelectedMarket(m);
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition shrink-0 ${
                  isSelected
                    ? 'bg-slate-800 border-sky-500/60 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{m}</span>
                    {isLocked ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" title="Anti-Overlap Lock Active" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Ready to scan" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ${price > 1000 ? price.toLocaleString() : price}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-800 bg-[#080d19]/40 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'terminal'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Terminal & Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('historical_edge')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'historical_edge'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>10-Year Historical Edge & Strategy</span>
          </button>

          <button
            onClick={() => setActiveTab('trade_history')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'trade_history'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Trade History & Lifecycle</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {tradesHistory.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Bot Engine Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('railway')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'railway'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4 text-purple-400" />
            <span>Deploy to Railway & GitHub</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-5">
        {/* TAB 1: LIVE TERMINAL & CHART */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            {/* Anti-Overlap State Banner */}
            <AntiOverlapGuard
              market={selectedMarket}
              activeTrade={activeTrade}
              currentPrice={currentPrice}
              onCloseTradeManually={handleCloseTradeEarly}
            />

            {/* Split View: Chart (left 68%) + MTF & PA Controls (right 32%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Chart Section */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <TradingChart
                  market={selectedMarket}
                  timeframe={selectedTimeframe}
                  candles={candles}
                  activeTrade={activeTrade}
                  currentPrice={currentPrice}
                  priceAction={priceActionData}
                  onTimeframeChange={(tf) => {
                    setSelectedTimeframe(tf);
                  }}
                  onRefresh={fetchCandles}
                />
              </div>

              {/* Multi-Timeframe & Decision Matrix */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* MTF Matrix & Scalper Mode Switcher */}
                <MultiTimeframeMatrix
                  market={selectedMarket}
                  mtf={mtfAnalysis}
                  scalperMode={scalperMode}
                  onToggleScalperMode={handleToggleScalperMode}
                  disabled={isScanning}
                />

                {/* Price Action Pattern Scanner Card */}
                <div className="rounded-xl border border-slate-800 bg-[#0c101d] p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <h4 className="text-sm font-bold text-white">Active Price Action Footprint</h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Edge: 10-Yr Calibrated
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 text-[11px] block">Current Market Structure:</span>
                      <strong className="text-white text-xs block mt-0.5">
                        {priceActionData?.structure?.summary || 'Bullish Structure (Higher Highs & Higher Lows)'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 text-[11px] block">Anti-Overlap State Management:</span>
                      <span className="text-emerald-400 font-semibold block mt-0.5">
                        {activeTrade ? `Locked by Trade #${activeTrade.id}` : 'Clean - Ready to Execute Next Setup'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 text-[11px] block">Automated Tick Frequency:</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-200">Checking TP/SL every 4.5s</span>
                        <button
                          onClick={() => setAutoTickInterval(!autoTickInterval)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            autoTickInterval
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {autoTickInterval ? 'STREAMING' : 'PAUSED'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => handleScanNow(true)}
                      disabled={isScanning || !!activeTrade}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>
                        {activeTrade
                          ? 'Locked (Active Trade Open)'
                          : isScanning
                          ? 'Scanning...'
                          : `Execute ${scalperMode ? 'Scalper' : 'Structure'} Setup`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Logs Snippet */}
                <div className="rounded-xl border border-slate-800 bg-[#070b13] p-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-white">Live Decision Stream</span>
                    <button onClick={() => setActiveTab('logs')} className="text-sky-400 hover:underline text-[11px]">
                      View All
                    </button>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {botLogs.slice(0, 3).map((l) => (
                      <div key={l.id} className="text-slate-400 truncate">
                        <span className="text-sky-400">[{l.level}]</span> {l.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 10-YEAR HISTORICAL EDGE & STRATEGY */}
        {activeTab === 'historical_edge' && <HistoricalEdgePanel />}

        {/* TAB 3: TRADE HISTORY & LIFECYCLE */}
        {activeTab === 'trade_history' && (
          <TradeHistoryTable
            trades={tradesHistory}
            onRefresh={fetchTrades}
            onResetDatabase={handleResetDatabase}
          />
        )}

        {/* TAB 4: BOT LOGS */}
        {activeTab === 'logs' && <BotLogsTerminal logs={botLogs} onRefresh={fetchLogs} />}

        {/* TAB 5: DEPLOY TO RAILWAY & GITHUB */}
        {activeTab === 'railway' && <RailwayDeployGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#060911] py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Web-Based Multi-Market Automated Trading Bot • Zero Indicators • Pure Price Action Mechanics</span>
          <span>Deployable to Railway & GitHub • PostgreSQL State Managed</span>
        </div>
      </footer>
    </div>
  );
}
