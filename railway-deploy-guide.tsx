'use client';

import React, { useState } from 'react';
import { Rocket, GitBranch, Copy, Check, Terminal, Server, ShieldCheck, Database } from 'lucide-react';

export function RailwayDeployGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = `# 1. Initialize git and commit project
git init
git add .
git commit -m "feat: multi-market price action trading bot"

# 2. Add your GitHub remote repo and push
git remote add origin https://github.com/YOUR_USERNAME/trading-bot.git
git branch -M main
git push -u origin main`;

  const railwayDeploy = `# 1. Install Railway CLI (or deploy via Railway Web Dashboard)
npm i -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link or create project
railway init

# 4. Provision PostgreSQL Database plugin in Railway
railway add --plugin postgresql

# 5. Deploy & Run 24/7!
railway up`;

  const pythonBotCommand = `# If you want to run the companion Python CCXT bot on Railway:
cd python_bot
pip install -r requirements.txt
python main.py`;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-purple-900/50 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-700/50 rounded-full mb-3">
              <Rocket className="w-3.5 h-3.5" />
              1-CLICK GITHUB & RAILWAY DEPLOYMENT READY
            </div>
            <h2 className="text-2xl font-extrabold text-white">Deploy 24/7 to GitHub & Railway</h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              All project files (including <code>railway.json</code>, <code>Dockerfile</code>, <code>Procfile</code>, and a companion <code>python_bot/</code> with CCXT and Binance API) are prepared in the repository. Follow the 2 simple steps below to push to GitHub and activate the bot on Railway.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://railway.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs shadow-lg transition"
            >
              <Server className="w-4 h-4" />
              Open Railway Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Step 1: Push to GitHub */}
      <div className="rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <span>Step 1: Push Project to Your GitHub Repository</span>
          </div>
          <button
            onClick={() => copyToClipboard(gitCommands, 1)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-800 transition"
          >
            {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 1 ? 'Copied!' : 'Copy Commands'}</span>
          </button>
        </div>

        <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-900">
          {gitCommands}
        </pre>
      </div>

      {/* Step 2: Deploy to Railway */}
      <div className="rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Server className="w-4 h-4 text-purple-400" />
            <span>Step 2: Connect GitHub to Railway & Add PostgreSQL</span>
          </div>
          <button
            onClick={() => copyToClipboard(railwayDeploy, 2)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-800 transition"
          >
            {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 2 ? 'Copied!' : 'Copy Commands'}</span>
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <p>
            <strong>Option A (Railway Web UI):</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-400">
            <li>Go to <a href="https://railway.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">railway.com</a> and click <strong>New Project</strong>.</li>
            <li>Select <strong>Deploy from GitHub repo</strong> and choose your repository.</li>
            <li>Click <strong>Add Database</strong> &rarr; <strong>PostgreSQL</strong>. Railway will automatically inject the <code>DATABASE_URL</code> environment variable!</li>
            <li>The bot will automatically build, apply schema migrations, and run 24/7 on your Railway URL!</li>
          </ol>

          <p className="pt-2">
            <strong>Option B (Railway CLI):</strong>
          </p>
          <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-900">
            {railwayDeploy}
          </pre>
        </div>
      </div>

      {/* Companion Python Bot Service */}
      <div className="rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Companion Python CCXT Bot Service (Included in <code>python_bot/</code>)</span>
          </div>
          <button
            onClick={() => copyToClipboard(pythonBotCommand, 3)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-800 transition"
          >
            {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 3 ? 'Copied!' : 'Copy Commands'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          As requested in the tech stack, we have also included a standalone Python bot service with <strong>CCXT, Pandas, and FastAPI</strong> in the <code>python_bot/</code> directory. You can run it standalone or alongside this web dashboard on Railway!
        </p>

        <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-900">
          {pythonBotCommand}
        </pre>
      </div>

      {/* Config Files Included List */}
      <div className="rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Included Production Deployment Configuration Files
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-purple-400 block font-sans">railway.json</strong>
            <span className="text-slate-400 text-[11px]">Railway deployment manifest & healthcheck</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-sky-400 block font-sans">Dockerfile</strong>
            <span className="text-slate-400 text-[11px]">Multi-stage production build</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-amber-400 block font-sans">Procfile</strong>
            <span className="text-slate-400 text-[11px]">Process runner for Railway / Render</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-emerald-400 block font-sans">DEPLOY_TO_RAILWAY.md</strong>
            <span className="text-slate-400 text-[11px]">Complete copy-paste deployment guide</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-indigo-400 block font-sans">python_bot/main.py</strong>
            <span className="text-slate-400 text-[11px]">CCXT Binance + Pure Price Action service</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-pink-400 block font-sans">.env.example</strong>
            <span className="text-slate-400 text-[11px]">Sample environment variables</span>
          </div>
        </div>
      </div>
    </div>
  );
}
