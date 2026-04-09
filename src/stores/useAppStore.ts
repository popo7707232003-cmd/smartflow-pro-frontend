// stores/useAppStore.ts
import { create } from 'zustand';

export interface Signal {
  id: string; symbol: string; direction: 'long' | 'short'; timestamp: number;
  entry: number; tp1: number; tp1Pct: number; tp2: number; tp2Pct: number;
  sl: number; slPct: number; rr: number; atr: number;
  score: number; scoreLabel: 'strong' | 'normal' | 'weak';
  conditions: Record<string, boolean>;
  warnings: string[];
  estimatedHoldTime: string;
  rsiValue?: number; macdHistogram?: number;
  emaAlignment?: string; vwapBiasStr?: string;
  volumeRatio?: number; fundingRate?: number | null;
}

export interface SmartMoneyTx {
  id: string; walletLabel: string; txType: string; txTypeLabel: string;
  token: string; amount: number; usdValue: number; usdFormatted: string;
  fromLabel: string; toLabel: string; direction: string;
  blockchain: string; minutesAgo: number; timestamp: number;
  relatedSymbol?: string | null;
}

export interface Alert {
  id: string; type: string; level: 'A' | 'B' | 'C';
  title: string; message: string;
  affectedSymbols: string[]; actionSuggestion: string;
  source: string; soundEnabled: boolean; fullscreen: boolean;
  timestamp: number; dismissed?: boolean;
}

export interface Consensus {
  direction: 'bullish' | 'bearish' | 'neutral';
  bullishVolume: number; bearishVolume: number;
  confidence: number;
}

export interface PortfolioStats {
  totalTrades: number; wins: number; losses: number;
  winRate: number; profitFactor: number; totalPnl: number;
  maxDrawdown: number; avgHoldTime: string; monthReturn: number;
}

export interface TradeResult {
  symbol: string; direction: string; entry: number;
  exitPrice: number; result: string; pnl: number; pnlPct: number;
  score: number; scoreLabel: string; closedAt: string; holdTime: string;
}

interface AppState {
  // Connection
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;
  btcPrice: number;
  setBtcPrice: (v: number) => void;

  // Signals
  signals: Signal[];
  addSignal: (s: Signal) => void;
  setSignals: (s: Signal[]) => void;

  // Smart Money
  smartMoneyFeed: SmartMoneyTx[];
  addSmartMoneyTx: (tx: SmartMoneyTx) => void;
  consensus: Record<string, Consensus>;
  setConsensus: (c: Record<string, Consensus>) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (a: Alert) => void;
  setAlerts: (a: Alert[]) => void;
  dismissAlert: (id: string) => void;

  // Portfolio
  portfolioStats: PortfolioStats | null;
  setPortfolioStats: (s: PortfolioStats) => void;
  trades: TradeResult[];
  setTrades: (t: TradeResult[]) => void;

  // Settings
  accountBalance: number;
  riskPct: number;
  setAccountBalance: (v: number) => void;
  setRiskPct: (v: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),
  btcPrice: 0,
  setBtcPrice: (v) => set({ btcPrice: v }),

  signals: [],
  addSignal: (s) => set((st) => ({ signals: [s, ...st.signals.filter(x => x.id !== s.id)].slice(0, 100) })),
  setSignals: (s) => set({ signals: s }),

  smartMoneyFeed: [],
  addSmartMoneyTx: (tx) => set((st) => ({ smartMoneyFeed: [tx, ...st.smartMoneyFeed].slice(0, 200) })),
  consensus: {},
  setConsensus: (c) => set({ consensus: c }),

  alerts: [],
  addAlert: (a) => set((st) => ({ alerts: [a, ...st.alerts].slice(0, 300) })),
  setAlerts: (a) => set({ alerts: a }),
  dismissAlert: (id) => set((st) => ({ alerts: st.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a) })),

  portfolioStats: null,
  setPortfolioStats: (s) => set({ portfolioStats: s }),
  trades: [],
  setTrades: (t) => set({ trades: t }),

  accountBalance: 10000,
  riskPct: 1,
  setAccountBalance: (v) => set({ accountBalance: v }),
  setRiskPct: (v) => set({ riskPct: v }),
}));
