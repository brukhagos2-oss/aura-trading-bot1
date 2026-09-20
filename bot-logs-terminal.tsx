'use client';

import React from 'react';
import { Terminal, ShieldAlert, CheckCircle2, AlertTriangle, Zap, Info } from 'lucide-react';
import { BotLog } from '@/db/schema';

interface BotLogsTerminalProps {
  logs: BotLog[];
  onRefresh: () => void;
}

export function BotLogsTerminal({ logs, onRefresh }: BotLogsTerminalProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-[#070b13] p-4 shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <h4 className="font-bold text-white tracking-wide">Automated Bot Engine Logs</h4>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-[11px] text-slate-400 hover:text-white transition underline"
        >
          Refresh Feed
        </button>
      </div>

      <div className="h-64 overflow-y-auto space-y-2 pr-1 font-mono">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-8 font-sans">
            No logs generated yet. Bot engine standing by.
          </div>
        ) : (
          logs.map((log) => {
            const isAntiOverlap = log.level === 'BLOCKED_ANTI_OVERLAP';
            const isTpHit = log.level === 'TP_HIT';
            const isSlHit = log.level === 'SL_HIT';
            const isExecution = log.level === 'EXECUTION';
            const isSignal = log.level === 'SIGNAL';

            const timeString = new Date(log.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={log.id}
                className={`p-2 rounded border text-[11px] transition ${
                  isAntiOverlap
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : isTpHit
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : isSlHit
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : isExecution
                    ? 'bg-sky-950/20 border-sky-800/40 text-sky-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1 font-bold">
                    {isAntiOverlap && <ShieldAlert className="w-3 h-3 text-amber-400" />}
                    {isTpHit && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {isSlHit && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    {isExecution && <Zap className="w-3 h-3 text-sky-400" />}
                    <span>[{log.level}]</span>
                    <span className="text-slate-200">[{log.market}]</span>
                  </span>
                  <span>{timeString}</span>
                </div>
                <div className="leading-relaxed break-words">{log.message}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
