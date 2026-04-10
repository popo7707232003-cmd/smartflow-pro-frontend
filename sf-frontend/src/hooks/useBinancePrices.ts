// hooks/useBinancePrices.ts
import { useState, useEffect, useRef } from 'react';

export interface CoinTicker {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  prevPrice: number;
  change24h: number;
  changePct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

const COINS = [
  { symbol: 'BTCUSDT', name: 'BTC', icon: '₿' },
  { symbol: 'ETHUSDT', name: 'ETH', icon: 'Ξ' },
  { symbol: 'SOLUSDT', name: 'SOL', icon: '◎' },
  { symbol: 'BNBUSDT', name: 'BNB', icon: '◆' },
  { symbol: 'XRPUSDT', name: 'XRP', icon: '✕' },
  { symbol: 'DOGEUSDT', name: 'DOGE', icon: 'Ð' },
];

const BINANCE_API = 'https://api.binance.com/api/v3';

export function useBinancePrices() {
  const [tickers, setTickers] = useState<CoinTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const prevPrices = useRef<Record<string, number>>({});

  // Initial REST fetch
  useEffect(() => {
    async function fetchInitial() {
      try {
        const symbols = COINS.map(c => c.symbol);
        const params = symbols.map(s => `"${s}"`).join(',');
        const res = await fetch(`${BINANCE_API}/ticker/24hr?symbols=[${params}]`);
        const data = await res.json();
        
        const mapped: CoinTicker[] = COINS.map(coin => {
          const d = data.find((t: any) => t.symbol === coin.symbol);
          if (!d) return null;
          const price = parseFloat(d.lastPrice);
          const changePct = parseFloat(d.priceChangePercent);
          prevPrices.current[coin.symbol] = price;
          return {
            symbol: coin.symbol, name: coin.name, icon: coin.icon,
            price, prevPrice: price,
            change24h: parseFloat(d.priceChange),
            changePct,
            high24h: parseFloat(d.highPrice),
            low24h: parseFloat(d.lowPrice),
            volume24h: parseFloat(d.volume),
            quoteVolume: parseFloat(d.quoteVolume),
            bias: changePct > 2 ? 'bullish' : changePct < -2 ? 'bearish' : 'neutral',
            confidence: Math.min(100, Math.round(Math.abs(changePct) * 10)),
          };
        }).filter(Boolean) as CoinTicker[];
        
        setTickers(mapped);
        setLoading(false);
      } catch (e) {
        console.error('[Binance] REST error:', e);
        setLoading(false);
      }
    }
    fetchInitial();
    const interval = setInterval(fetchInitial, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for live updates
  useEffect(() => {
    const streams = COINS.map(c => `${c.symbol.toLowerCase()}@miniTicker`).join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;
    
    function connect() {
      try {
        const ws = new WebSocket(url);
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
              const newPrice = parseFloat(d.c);
              const changePct = ((newPrice - parseFloat(d.o)) / parseFloat(d.o)) * 100;
              return {
                ...t,
                prevPrice: t.price,
                price: newPrice,
                change24h: newPrice - parseFloat(d.o),
                changePct,
                high24h: parseFloat(d.h),
                low24h: parseFloat(d.l),
                volume24h: parseFloat(d.v),
                quoteVolume: parseFloat(d.q),
                bias: changePct > 2 ? 'bullish' : changePct < -2 ? 'bearish' : 'neutral',
                confidence: Math.min(100, Math.round(Math.abs(changePct) * 10)),
              };
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
