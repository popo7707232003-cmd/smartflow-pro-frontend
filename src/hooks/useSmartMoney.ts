import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://smartflow-pro-backend-production.up.railway.app';

// ===== Smart Money =====
export interface WhaleTransaction {
  id: string;
  hash: string;
  fromLabel: string;
  toLabel: string;
  valueUsd: number;
  token: string;
  timestamp: string;
  direction: 'exchange_inflow' | 'exchange_outflow' | 'institution_move' | 'unknown';
  sentiment: 'bearish' | 'bullish' | 'neutral';
  significance: 'high' | 'medium' | 'low';
}

export interface SmartMoneyBias {
  bias: string;
  score: number;
  inflow: number;
  outflow: number;
  updatedAt: string;
}

export function useSmartMoney(pollInterval = 60000) {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [bias, setBias] = useState<SmartMoneyBias | null>(null);
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [noApiKey, setNoApiKey] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/smart-money`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.transactions || []);
        setBias(json.data.bias || null);
        setSource(json.data.source || 'https://smartflow-pro-backend-production.up.railway.app');
        setNoApiKey(json.data.transactions?.length === 0 && json.data.message?.includes('No API key'));
      }
    } catch (err: any) {
      console.error('[useSmartMoney]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const timer = setInterval(fetch_, pollInterval);
    return () => clearInterval(timer);
  }, [fetch_, pollInterval]);

  return { transactions, bias, source, loading, noApiKey, refetch: fetch_ };
}

// ===== Alerts =====
export interface AlertItem {
  id: number;
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  symbol?: string;
  value?: number;
  source?: string;
  read: boolean;
  createdAt: string;
}

export function useAlerts(pollInterval = 30000) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data.alerts || []);
        setCounts(json.data.counts || { high: 0, medium: 0, low: 0 });
      }
    } catch (err: any) {
      console.error('[useAlerts]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: number) => {
    try {
      await fetch(`${API_URL}/api/alerts/${id}/read`, { method: 'POST' });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch {}
  }, []);

  useEffect(() => {
    fetch_();
    const timer = setInterval(fetch_, pollInterval);
    return () => clearInterval(timer);
  }, [fetch_, pollInterval]);

  return { alerts, counts, loading, markRead, refetch: fetch_ };
}

// ===== Economic Calendar =====
export interface EconomicEvent {
  name: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  daysUntil: number;
  isPast: boolean;
}

export function useEconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/economic-calendar`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success) setEvents(json.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return { events, loading };
}

