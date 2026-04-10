import { create } from 'zustand';

export interface Signal {
  id: string; symbol: string; direction: string; timestamp: number;
  entry: number; tp1: number; tp1Pct: number; tp2: number; tp2Pct: number;
  sl: number; slPct: number; rr: number; atr: number;
  score: number; scoreLabel: string;
  conditions: Record<string, boolean>;
  warnings: string[]; estimatedHoldTime: string;
}

export interface SmartMoneyTx {
  id: string; walletLabel: string; txType: string; token: string;
  usdValue: number; usdFormatted: string; direction: string;
  fromLabel: string; toLabel: string; minutesAgo: number; timestamp: number;
}

export interface Alert {
  id: string; type: string; level: string; title: string; message: string;
  affectedSymbols: string[]; actionSuggestion: string; source: string;
  soundEnabled: boolean; fullscreen: boolean; timestamp: number; dismissed?: boolean;
}

interface AppState {
  wsConnected: boolean; setWsConnected: (v: boolean) => void;
  signals: Signal[]; addSignal: (s: Signal) => void;
  smartMoneyFeed: SmartMoneyTx[]; addSmartMoneyTx: (tx: SmartMoneyTx) => void;
  alerts: Alert[]; addAlert: (a: Alert) => void; dismissAlert: (id: string) => void;
  backendStatus: { pg: boolean; redis: boolean; binance: boolean; scanner: boolean; news: boolean };
  setBackendStatus: (s: Partial<AppState['backendStatus']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  wsConnected: false, setWsConnected: (v) => set({ wsConnected: v }),
  signals: [], addSignal: (s) => set((st) => ({ signals: [s, ...st.signals].slice(0, 100) })),
  smartMoneyFeed: [], addSmartMoneyTx: (tx) => set((st) => ({ smartMoneyFeed: [tx, ...st.smartMoneyFeed].slice(0, 200) })),
  alerts: [], addAlert: (a) => set((st) => ({ alerts: [a, ...st.alerts].slice(0, 300) })),
  dismissAlert: (id) => set((st) => ({ alerts: st.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a) })),
  backendStatus: { pg: false, redis: false, binance: false, scanner: false, news: false },
  setBackendStatus: (s) => set((st) => ({ backendStatus: { ...st.backendStatus, ...s } })),
}));
