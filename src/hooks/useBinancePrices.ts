import { useState, useEffect, useRef } from 'react';

export interface CoinTicker {
  symbol: string; name: string; icon: string;
  price: number; prevPrice: number;
  change24h: number; changePct: number;
  high24h: number; low24h: number;
  volume24h: number; quoteVolume: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  biasLabel: string; confidence: number;
}

const COINS = [
  { symbol: 'BTCUSDT', name: 'BTC', icon: '₿' },
  { symbol: 'ETHUSDT', name: 'ETH', icon: 'Ξ' },
  { symbol: 'SOLUSDT', name: 'SOL', icon: '◎' },
  { symbol: 'BNBUSDT', name: 'BNB', icon: '◆' },
  { symbol: 'XRPUSDT', name: 'XRP', icon: '✕' },
  { symbol: 'DOGEUSDT', name: 'DOGE', icon: 'Ð' },
];

function calcBias(pct: number): { bias: 'bullish'|'bearish'|'neutral'; label: string; conf: number } {
  if (pct > 1.5) return { bias: 'bullish', label: 'LONG', conf: Math.min(100, Math.round(Math.abs(pct) * 20)) };
  if (pct < -1.5) return { bias: 'bearish', label: 'SHORT', conf: Math.min(100, Math.round(Math.abs(pct) * 20)) };
  return { bias: 'neutral', label: 'WAIT', conf: Math.min(100, Math.round(Math.abs(pct) * 20)) };
}

export function useBinancePrices() {
  const [tickers, setTickers] = useState<CoinTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const syms = COINS.map(c => `"${c.symbol}"`).join(',');
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${syms}]`);
        const data = await res.json();
        setTickers(COINS.map(coin => {
          const d = data.find((t: any) => t.symbol === coin.symbol);
          if (!d) return null;
          const price = parseFloat(d.lastPrice);
          const pct = parseFloat(d.priceChangePercent);
          const b = calcBias(pct);
          return { symbol: coin.symbol, name: coin.name, icon: coin.icon, price, prevPrice: price, change24h: parseFloat(d.priceChange), changePct: pct, high24h: parseFloat(d.highPrice), low24h: parseFloat(d.lowPrice), volume24h: parseFloat(d.volume), quoteVolume: parseFloat(d.quoteVolume), bias: b.bias, biasLabel: b.label, confidence: b.conf };
        }).filter(Boolean) as CoinTicker[]);
        setLoading(false);
      } catch { setLoading(false); }
    }
    fetchInitial();
    const iv = setInterval(fetchInitial, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const streams = COINS.map(c => `${c.symbol.toLowerCase()}@miniTicker`).join('/');
    function connect() {
      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (!d.s) return;
            setTickers(prev => prev.map(t => {
              if (t.symbol !== d.s) return t;
              const p = parseFloat(d.c);
              const pct = ((p - parseFloat(d.o)) / parseFloat(d.o)) * 100;
              const b = calcBias(pct);
              return { ...t, prevPrice: t.price, price: p, change24h: p - parseFloat(d.o), changePct: pct, high24h: parseFloat(d.h), low24h: parseFloat(d.l), volume24h: parseFloat(d.v), quoteVolume: parseFloat(d.q), bias: b.bias, biasLabel: b.label, confidence: b.conf };
            }));
          } catch {}
        };
      } catch { setTimeout(connect, 3000); }
    }
    connect();
    return () => { wsRef.current?.close(); };
  }, []);

  return { tickers, loading, connected };
}
