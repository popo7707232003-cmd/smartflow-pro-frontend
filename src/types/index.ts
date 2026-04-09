// src/types/index.ts
// Shared types for SmartFlow Pro frontend

export type Direction = 'long' | 'short';
export type SignalGrade = 'strong' | 'medium' | 'weak';
export type SignalStatus = 'pending' | 'tp1' | 'tp2' | 'sl' | 'timeout' | 'manual';
export type NewsLevel = 'A' | 'B' | 'C';
export type NewsSentiment = 'positive' | 'negative' | 'neutral';
export type SmartMoneyTxType = 'sell_pressure' | 'accumulation' | 'transfer';
export type AlertType = 'NEWS_ALERT_A' | 'NEWS_ALERT_B' | 'NEWS_ALERT_C' | 'EVENT_WARNING' | 'SMART_MONEY_ALERT' | 'RISK_WARNING' | 'SIGNAL_NEW';
export type WSEventType = 'SIGNAL_UPDATE' | 'SMART_MONEY_ALERT' | 'NEWS_ALERT' | 'RISK_WARNING' | 'PRICE_UPDATE' | 'CONNECTED';

export interface Signal {
  id: string;
  symbol: string;
  direction: Direction;
  entry: number;
  tp1: number;
  tp1Pct: number;
  tp2: number;
  tp2Pct: number;
  sl: number;
  slPct: number;
  rr: number;
  atr: number;
  score: number;
  scoreLabel: SignalGrade;
  conditions: SignalConditions;
  warnings: string[];
  status: SignalStatus;
  createdAt: string;
}

export interface SignalConditions {
  mtfAligned: boolean;
  bosConfirmed: boolean;
  chochDetected: boolean;
  inOrderBlock: boolean;
  hasFVG: boolean;
  liquiditySweep: boolean;
  rsiHealthy: boolean;
  macdAligned: boolean;
  volumeConfirmed: boolean;
  rrAbove2: boolean;
}

export interface SmartMoneyTx {
  id: string;
  walletAddress: string;
  walletLabel: string;
  txHash: string;
  type: SmartMoneyTxType;
  token: string;
  amount: number;
  usdValue: number;
  blockchain: string;
  fromLabel: string;
  toLabel: string;
  timestamp: number;
  minutesAgo: number;
}

export interface SmartMoneyConsensus {
  direction: 'bullish' | 'bearish' | 'neutral';
  bullishVolume: number;
  bearishVolume: number;
  confidence: number;
  periodHours: number;
}

export interface NewsEvent {
  id: string;
  title: string;
  source: string;
  url: string;
  level: NewsLevel;
  sentiment: NewsSentiment;
  affectedSymbols: string[];
  estimatedImpact: 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  level: NewsLevel;
  title: string;
  message: string;
  affectedSymbols: string[];
  actionSuggestion: string;
  source: string;
  soundEnabled: boolean;
  fullscreen: boolean;
  timestamp: number;
}

export interface PortfolioStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  openPositions: number;
}

export interface WSMessage {
  type: WSEventType;
  data: unknown;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
