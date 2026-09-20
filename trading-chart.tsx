'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineStyle,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  createSeriesMarkers,
  Time,
} from 'lightweight-charts';
import { Candle, SupportedMarket, TimeFrame, Trade } from '@/lib/types';
import { Maximize2, RefreshCw, Eye, EyeOff, Activity, ShieldCheck } from 'lucide-react';

interface TradingChartProps {
  market: SupportedMarket;
  timeframe: TimeFrame;
  candles: Candle[];
  activeTrade: Trade | null;
  currentPrice: number;
  priceAction?: {
    structure?: any;
    swings?: any[];
    fairValueGaps?: any[];
    liquiditySweeps?: any[];
  };
  onTimeframeChange: (tf: TimeFrame) => void;
  onRefresh: () => void;
}

export function TradingChart({
  market,
  timeframe,
  candles,
  activeTrade,
  currentPrice,
  priceAction,
  onTimeframeChange,
  onRefresh,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const tpLineRef = useRef<IPriceLine | null>(null);
  const slLineRef = useRef<IPriceLine | null>(null);
  const markersRef = useRef<any>(null);

  const [showPALevels, setShowPALevels] = useState(true);
  const [showExecutionLines, setShowExecutionLines] = useState(true);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 480,
      layout: {
        background: { color: '#090d16' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        mode: 1, // Normal
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dotted,
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dotted,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle responsive resize
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Update candlestick data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const formattedData = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(formattedData);

    // Auto-fit on first data load
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Update Execution Lines (Entry, TP, SL)
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    // Remove existing lines
    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (tpLineRef.current) {
      series.removePriceLine(tpLineRef.current);
      tpLineRef.current = null;
    }
    if (slLineRef.current) {
      series.removePriceLine(slLineRef.current);
      slLineRef.current = null;
    }

    if (!showExecutionLines || !activeTrade || activeTrade.market !== market) {
      return;
    }

    // Add Entry line
    entryLineRef.current = series.createPriceLine({
      price: activeTrade.entryPrice,
      color: '#0284c7', // Sky Blue
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `ENTRY (${activeTrade.signalType}) $${activeTrade.entryPrice}`,
    });

    // Add Take Profit line
    tpLineRef.current = series.createPriceLine({
      price: activeTrade.takeProfit,
      color: '#10b981', // Green
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `TP (TARGET) $${activeTrade.takeProfit} [+${activeTrade.riskRewardRatio}R]`,
    });

    // Add Stop Loss line
    slLineRef.current = series.createPriceLine({
      price: activeTrade.stopLoss,
      color: '#ef4444', // Red
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `SL (RISK) $${activeTrade.stopLoss} [-1.0R]`,
    });
  }, [activeTrade, market, showExecutionLines]);

  // Update Visual Price Action Markers
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || candles.length === 0) return;

    const markers: any[] = [];

    // Active trade entry marker
    if (activeTrade && activeTrade.market === market) {
      const isBuy = activeTrade.signalType === 'BUY';
      markers.push({
        time: (candles[candles.length - 1].time) as Time,
        position: isBuy ? 'belowBar' : 'aboveBar',
        color: isBuy ? '#10b981' : '#ef4444',
        shape: isBuy ? 'arrowUp' : 'arrowDown',
        text: `BOT ENTRY: ${activeTrade.signalType} @ $${activeTrade.entryPrice}`,
        size: 2,
      });
    }

    // Price action structural annotations
    if (showPALevels && priceAction) {
      // Swings
      if (priceAction.swings) {
        priceAction.swings.slice(-6).forEach((s: any) => {
          markers.push({
            time: s.time as Time,
            position: s.type === 'SWING_HIGH' ? 'aboveBar' : 'belowBar',
            color: s.type === 'SWING_HIGH' ? '#f59e0b' : '#38bdf8',
            shape: s.type === 'SWING_HIGH' ? 'circle' : 'circle',
            text: s.type === 'SWING_HIGH' ? 'SH' : 'SL',
            size: 0.8,
          });
        });
      }

      // Liquidity Sweeps
      if (priceAction.liquiditySweeps) {
        priceAction.liquiditySweeps.slice(-3).forEach((sw: any) => {
          markers.push({
            time: sw.time as Time,
            position: sw.type === 'BUY_SIDE' ? 'aboveBar' : 'belowBar',
            color: '#a855f7',
            shape: 'square',
            text: sw.type === 'BUY_SIDE' ? 'Buy-Side Sweep' : 'Sell-Side Sweep',
            size: 1.2,
          });
        });
      }
    }

    // Sort markers by time
    markers.sort((a, b) => Number(a.time) - Number(b.time));

    try {
      if (!markersRef.current) {
        markersRef.current = createSeriesMarkers(series, markers);
      } else {
        markersRef.current.setMarkers(markers);
      }
    } catch {
      // Ignore markers error if timescale not ready
    }
  }, [candles, activeTrade, market, showPALevels, priceAction]);

  const timeframes: TimeFrame[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

  return (
    <div className="relative flex flex-col w-full rounded-xl border border-slate-800 bg-[#090d16] p-4 shadow-2xl">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white tracking-wide text-lg">{market}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Price Action Philosophy Tag */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-full">
            <Activity className="w-3 h-3" />
            Pure Price Action (0 Indicators)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExecutionLines(!showExecutionLines)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition ${
              showExecutionLines
                ? 'bg-sky-950/50 border-sky-600/50 text-sky-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Entry, TP, and SL lines"
          >
            {showExecutionLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Entry/TP/SL</span>
          </button>

          <button
            onClick={() => setShowPALevels(!showPALevels)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition ${
              showPALevels
                ? 'bg-purple-950/50 border-purple-600/50 text-purple-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Structural Swing & Liquidity Sweep markers"
          >
            {showPALevels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Structure / Sweeps</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
            title="Refresh Candlesticks"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => chartInstanceRef.current?.timeScale().fitContent()}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
            title="Fit Chart"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Execution Legend Overlay */}
      {activeTrade && activeTrade.market === market && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                activeTrade.signalType === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              ACTIVE {activeTrade.signalType} TRADE #{activeTrade.id}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Entry: <span className="text-sky-400 font-bold">${activeTrade.entryPrice}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              TP: <span className="text-emerald-400 font-bold">${activeTrade.takeProfit}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SL: <span className="text-rose-400 font-bold">${activeTrade.stopLoss}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Overlap Guard Locked</span>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full relative min-h-[480px] rounded-lg overflow-hidden" />

      {/* Chart Footer Info */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-2">
        <div className="flex items-center gap-4">
          <span>
            Current Rate:{' '}
            <strong className="text-white font-mono text-sm">
              ${currentPrice > 1000 ? currentPrice.toLocaleString() : currentPrice}
            </strong>
          </span>
          <span className="hidden sm:inline">
            Candles: <strong className="text-slate-300">{candles.length}</strong>
          </span>
          <span className="hidden sm:inline">
            Feed: <strong className="text-slate-300">{market === 'BTC/USD' ? 'Binance API + Engine' : 'Institutional PA Feed'}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span> Entry
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Take Profit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> Stop Loss
          </span>
        </div>
      </div>
    </div>
  );
}
