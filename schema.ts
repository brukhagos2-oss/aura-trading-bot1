import { pgTable, serial, text, varchar, doublePrecision, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  market: varchar("market", { length: 32 }).notNull(), // 'BTC/USD' | 'XAU/USD' | 'EUR/USD' | 'USD/JPY'
  signalType: varchar("signal_type", { length: 16 }).notNull(), // 'BUY' | 'SELL'
  mode: varchar("mode", { length: 32 }).notNull().default("STRUCTURE_SWING"), // 'SCALPER' | 'STRUCTURE_SWING'
  timeframe: varchar("timeframe", { length: 16 }).notNull().default("M15"),
  entryPrice: doublePrecision("entry_price").notNull(),
  takeProfit: doublePrecision("take_profit").notNull(),
  stopLoss: doublePrecision("stop_loss").notNull(),
  riskRewardRatio: doublePrecision("risk_reward_ratio").notNull(),
  lotSize: doublePrecision("lot_size").notNull().default(1.0),
  status: varchar("status", { length: 32 }).notNull().default("OPEN"), // 'OPEN' | 'TP_HIT' | 'SL_HIT' | 'CLOSED_MANUAL'
  exitPrice: doublePrecision("exit_price"),
  pnl: doublePrecision("pnl"),
  pnlPercent: doublePrecision("pnl_percent"),
  patternName: varchar("pattern_name", { length: 64 }).notNull(), // 'Liquidity Sweep + CHoCH', 'BOS + FVG Retest', 'Order Block Mitigation', 'Asian Range Sweep'
  patternReason: text("pattern_reason").notNull(),
  mtfConfluence: text("mtf_confluence").notNull(), // JSON summary of MTF alignment
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  market: varchar("market", { length: 32 }).notNull().unique(),
  isAutoTrading: boolean("is_auto_trading").notNull().default(true),
  scalperMode: boolean("scalper_mode").notNull().default(false),
  riskPerTrade: doublePrecision("risk_per_trade").notNull().default(1.0),
  minRiskReward: doublePrecision("min_risk_reward").notNull().default(2.0),
  maxOpenTrades: integer("max_open_trades").notNull().default(1),
  activeLock: boolean("active_lock").notNull().default(false),
  currentActiveTradeId: integer("current_active_trade_id"),
  scanIntervalSeconds: integer("scan_interval_seconds").notNull().default(5),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const botLogs = pgTable("bot_logs", {
  id: serial("id").primaryKey(),
  market: varchar("market", { length: 32 }).notNull(),
  level: varchar("level", { length: 32 }).notNull(), // 'INFO' | 'SIGNAL' | 'EXECUTION' | 'TP_HIT' | 'SL_HIT' | 'BLOCKED_ANTI_OVERLAP'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type BotSetting = typeof botSettings.$inferSelect;
export type BotLog = typeof botLogs.$inferSelect;
