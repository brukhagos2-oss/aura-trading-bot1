export type SupportedMarket = 'BTC/USD' | 'XAU/USD' | 'EUR/USD' | 'USD/JPY';

export type TimeFrame = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export type TradingMode = 'SCALPER' | 'STRUCTURE_SWING';

export type SignalType = 'BUY' | 'SELL';

export type TradeStatus = 'OPEN' | 'TP_HIT' | 'SL_HIT' | 'CLOSED_MANUAL';

export interface Trade {
  id: number;
  market: SupportedMarket;
  signalType: SignalType;
  mode: string;
  timeframe: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: number;
  lotSize: number;
  status: string;
  exitPrice: number | null;
  pnl: number | null;
  pnlPercent: number | null;
  patternName: string;
  patternReason: string;
  mtfConfluence: string;
  openedAt: Date | string;
  closedAt: Date | string | null;
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
}

export interface FairValueGap {
  startIndex: number;
  time: number;
  top: number;
  bottom: number;
  type: 'BULLISH' | 'BEARISH';
  mitigated: boolean;
}

export interface LiquiditySweep {
  index: number;
  time: number;
  level: number;
  type: 'BUY_SIDE' | 'SELL_SIDE'; // Buy side = swept high and rejected down; Sell side = swept low and rejected up
  wickSize: number;
}

export interface BreakOfStructure {
  index: number;
  time: number;
  price: number;
  type: 'BOS_BULLISH' | 'BOS_BEARISH' | 'CHOCH_BULLISH' | 'CHOCH_BEARISH';
  description: string;
}

export interface OrderBlock {
  startIndex: number;
  time: number;
  top: number;
  bottom: number;
  type: 'BULLISH' | 'BEARISH';
  volume: number;
}

export interface MTFAnalysis {
  market: SupportedMarket;
  htfTrend: 'BULLISH' | 'BEARISH' | 'RANGING';
  htfStructure: string;
  itfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ltfTrigger: 'BULLISH_ENTRY' | 'BEARISH_ENTRY' | 'NONE';
  confluenceScore: number; // e.g. 85-98%
  confluenceFactors: string[];
}

export interface PriceActionSignal {
  market: SupportedMarket;
  signalType: SignalType;
  mode: TradingMode;
  timeframe: TimeFrame;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: number;
  patternName: string;
  patternReason: string;
  mtfConfluence: MTFAnalysis;
  keyLevels: {
    swingHigh?: number;
    swingLow?: number;
    fvgTop?: number;
    fvgBottom?: number;
    obLevel?: number;
  };
}

export interface MarketMetadata {
  id: SupportedMarket;
  displayName: string;
  symbol: string;
  category: 'CRYPTO' | 'COMMODITY' | 'FOREX';
  precision: number;
  pipSize: number;
  typicalSpread: number;
  minMove: number;
  quoteCurrency: string;
  description: string;
}

export const MARKET_METADATA: Record<SupportedMarket, MarketMetadata> = {
  'BTC/USD': {
    id: 'BTC/USD',
    displayName: 'Bitcoin / US Dollar',
    symbol: 'BTCUSDT',
    category: 'CRYPTO',
    precision: 2,
    pipSize: 1.0,
    typicalSpread: 5.0,
    minMove: 0.01,
    quoteCurrency: 'USD',
    description: 'High volatility, institutional order flow, 24/7 liquidity sweeps',
  },
  'XAU/USD': {
    id: 'XAU/USD',
    displayName: 'Gold / US Dollar',
    symbol: 'XAUUSD',
    category: 'COMMODITY',
    precision: 2,
    pipSize: 0.1,
    typicalSpread: 0.25,
    minMove: 0.01,
    quoteCurrency: 'USD',
    description: 'Safe haven asset, high respect for session highs/lows and Fair Value Gaps',
  },
  'EUR/USD': {
    id: 'EUR/USD',
    displayName: 'Euro / US Dollar',
    symbol: 'EURUSD',
    category: 'FOREX',
    precision: 5,
    pipSize: 0.0001,
    typicalSpread: 0.00008,
    minMove: 0.00001,
    quoteCurrency: 'USD',
    description: 'Most liquid currency pair, textbook London/NY Open structure breaks',
  },
  'USD/JPY': {
    id: 'USD/JPY',
    displayName: 'US Dollar / Japanese Yen',
    symbol: 'USDJPY',
    category: 'FOREX',
    precision: 3,
    pipSize: 0.01,
    typicalSpread: 0.012,
    minMove: 0.001,
    quoteCurrency: 'JPY',
    description: 'Trending market with strong session continuation & Asian range sweeps',
  },
};
