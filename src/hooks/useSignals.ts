import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://smartflow-pro-backend-production.up.railway.app';

export interface BackendSignal {
  id: number;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  score: number;
  maxScore: number;
  scoreDetails: Record<string, number>;
  rsi: number;
  atr: number;
  rr: number;
  timeframe: string;
  reason: string;
  status: string;
  tp1Hit: boolean;
  tp2Hit: boolean;
  slHit: boolean;
  pnlPercent: number | null;
  createdAt: string;
  closedAt: string | null;
  source: 'backend' | 'frontend';
}

export function useSignals(pollInterval = 30000) {
  const [signals, setSignals] = useState<BackendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/signals?limit=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setSignals(json.data.map((s: any) => ({ ...s, source: 'backend' as const })));
        setBackendAvailable(true);
        setError(null);
      } else {
        setBackendAvailable(false);
      }
    } catch (err: any) {
      setBackendAvailable(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    timerRef.current = setInterval(fetchSignals, pollInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchSignals, pollInterval]);

  return { signals, loading, error, backendAvailable, refetch: fetchSignals };
}

// ===== Performance Hook =====
export interface PerformanceData {
  summary: {
    totalSignals: number;
    activeSignals: number;
    wins: number;
    losses: number;
    partials: number;
    winRate: number;
    profitFactor: number;
    totalPnl: number;
    avgWin: number;
    avgLoss: number;
  };
  recentTrades: {
    signalId: number;
    symbol: string;
    direction: string;
    entry: number;
    exitPrice: number;
    exitType: string;
    pnlPercent: number;
    result: string;
    score: number;
    closedAt: string;
  }[];
  daily: {
    date: string;
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
  }[];
}

export function usePerformance(pollInterval = 60000) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerf = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/performance`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error('[usePerformance]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerf();
    const timer = setInterval(fetchPerf, pollInterval);
    return () => clearInterval(timer);
  }, [fetchPerf, pollInterval]);

  return { data, loading, refetch: fetchPerf };
}
