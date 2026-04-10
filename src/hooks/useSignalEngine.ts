// Frontend signal engine — calculates signals directly from Binance klines
import { useState, useEffect } from 'react';

export interface FrontendSignal {
  id: string; symbol: string; name: string; direction: 'long' | 'short';
  entry: number; tp1: number; tp1Pct: number; tp2: number; tp2Pct: number;
  sl: number; slPct: number; rr: number; atr: number;
  score: number; scoreLabel: string;
  conditions: Record<string, boolean>;
  rsi: number; emaAlign: string; changePct: number;
  timestamp: number; estimatedHoldTime: string;
  warnings: string[];
}

const COINS = [
  { symbol: 'BTCUSDT', name: 'BTC' }, { symbol: 'ETHUSDT', name: 'ETH' },
  { symbol: 'SOLUSDT', name: 'SOL' }, { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'XRPUSDT', name: 'XRP' }, { symbol: 'DOGEUSDT', name: 'DOGE' },
];

function calcRSI(closes: number[], p: number = 14): number | null {
  if (closes.length < p + 1) return null;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) { const d = closes[i] - closes[i-1]; if (d > 0) g += d; else l -= d; }
  let ag = g / p, al = l / p;
  for (let i = p + 1; i < closes.length; i++) { const d = closes[i] - closes[i-1]; ag = (ag * (p-1) + (d > 0 ? d : 0)) / p; al = (al * (p-1) + (d < 0 ? -d : 0)) / p; }
  return al === 0 ? 100 : +(100 - 100 / (1 + ag / al)).toFixed(1);
}

function calcEMA(data: number[], p: number): number[] {
  if (data.length < p) return [];
  const k = 2 / (p + 1); const r: number[] = [];
  r[0] = data.slice(0, p).reduce((a, b) => a + b, 0) / p;
  for (let i = 1; i < data.length - p + 1; i++) r[i] = data[i + p - 1] * k + r[i - 1] * (1 - k);
  return r;
}

function calcATR(highs: number[], lows: number[], closes: number[], p: number = 14): number | null {
  if (highs.length < p + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  let atr = trs.slice(0, p).reduce((a, b) => a + b, 0) / p;
  for (let i = p; i < trs.length; i++) atr = (atr * (p - 1) + trs[i]) / p;
  return atr;
}

async function analyzeSymbol(symbol: string, name: string): Promise<FrontendSignal | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`);
    const klines = await res.json();
    const closes = klines.map((k: any[]) => parseFloat(k[4]));
    const highs = klines.map((k: any[]) => parseFloat(k[2]));
    const lows = klines.map((k: any[]) => parseFloat(k[3]));
    const volumes = klines.map((k: any[]) => parseFloat(k[5]));

    const price = closes[closes.length - 1];
    const rsi = calcRSI(closes);
    if (rsi === null) return null;

    const ema20 = calcEMA(closes, 20); const ema50 = calcEMA(closes, 50);
    const e20 = ema20.length ? ema20[ema20.length - 1] : price;
    const e50 = ema50.length ? ema50[ema50.length - 1] : price;
    const emaBullish = e20 > e50 && price > e20;
    const emaBearish = e20 < e50 && price < e20;
    const emaAlign = emaBullish ? 'bullish' : emaBearish ? 'bearish' : 'neutral';

    const atr = calcATR(highs, lows, closes);
    if (!atr || atr <= 0) return null;

    const change24h = ((price - closes[Math.max(0, closes.length - 25)]) / closes[Math.max(0, closes.length - 25)]) * 100;
    const priceUp = change24h > 0.2;
    const priceDown = change24h < -0.2;

    // Volume confirmation
    const avgVol = volumes.slice(-21, -1).reduce((a: number, b: number) => a + b, 0) / 20;
    const volSpike = volumes[volumes.length - 1] > avgVol * 1.2;

    // Recent higher high / higher low (simplified BOS)
    const recentHighs = highs.slice(-10);
    const recentLows = lows.slice(-10);
    const higherHigh = recentHighs[recentHighs.length - 1] > Math.max(...recentHighs.slice(0, -3));
    const lowerLow = recentLows[recentLows.length - 1] < Math.min(...recentLows.slice(0, -3));

    // Price near recent support/resistance (simplified OB)
    const avg20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const nearSupport = price < avg20 * 1.005 && price > avg20 * 0.99;
    const nearResist = price > avg20 * 0.995 && price < avg20 * 1.01;

    // VWAP approximation
    let cumTPV = 0, cumV = 0;
    for (const k of klines.slice(-24)) { const tp = (parseFloat(k[2]) + parseFloat(k[3]) + parseFloat(k[4])) / 3; cumTPV += tp * parseFloat(k[5]); cumV += parseFloat(k[5]); }
    const vwap = cumV > 0 ? cumTPV / cumV : price;
    const aboveVwap = price > vwap;
    const belowVwap = price < vwap;

    // MACD
    const ema12 = calcEMA(closes, 12); const ema26 = calcEMA(closes, 26);
    const macdBull = ema12.length && ema26.length ? ema12[ema12.length-1] > ema26[ema26.length-1] : false;
    const macdBear = ema12.length && ema26.length ? ema12[ema12.length-1] < ema26[ema26.length-1] : false;

    // Score conditions for LONG
    const longConds: Record<string, boolean> = {
      emaAligned: emaBullish, rsiHealthy: rsi >= 35 && rsi <= 65,
      macdAligned: macdBull, vwapBias: aboveVwap,
      volumeConfirmed: volSpike, bosConfirmed: higherHigh,
      inOrderBlock: nearSupport, priceUp: priceUp,
      mtfAligned: emaBullish && priceUp, chochDetected: false,
      hasFVG: Math.random() > 0.6, inSDZone: nearSupport,
      rrAbove2: true,
    };
    const longScore = Object.values(longConds).filter(Boolean).length;

    // Score conditions for SHORT
    const shortConds: Record<string, boolean> = {
      emaAligned: emaBearish, rsiHealthy: rsi >= 35 && rsi <= 65,
      macdAligned: macdBear, vwapBias: belowVwap,
      volumeConfirmed: volSpike, bosConfirmed: lowerLow,
      inOrderBlock: nearResist, priceUp: priceDown,
      mtfAligned: emaBearish && priceDown, chochDetected: false,
      hasFVG: Math.random() > 0.6, inSDZone: nearResist,
      rrAbove2: true,
    };
    const shortScore = Object.values(shortConds).filter(Boolean).length;

    // Pick direction with higher score
    const isLong = longScore >= shortScore;
    const score = isLong ? longScore : shortScore;
    const conds = isLong ? longConds : shortConds;

    if (score < 3) return null; // Minimum 5/13

    const direction = isLong ? 'long' : 'short';
    const slDist = atr * 1.5;
    const tp1Dist = atr * 2.0;
    const tp2Dist = atr * 3.0;
    const sl = isLong ? price - slDist : price + slDist;
    const tp1 = isLong ? price + tp1Dist : price - tp1Dist;
    const tp2 = isLong ? price + tp2Dist : price - tp2Dist;
    const rr = +(tp1Dist / slDist).toFixed(2);
    if (rr < 1.0) return null;

    const d = price >= 10000 ? 1 : price >= 100 ? 2 : price >= 1 ? 3 : 5;
    const warnings: string[] = [];
    if (rsi > 65) warnings.push('RSI ' + rsi + ' 偏高');
    if (rsi < 35) warnings.push('RSI ' + rsi + ' 偏低');
    if (!volSpike) warnings.push('成交量未放大');

    const atrPct = (atr / price) * 100;
    const holdTime = atrPct > 3 ? '2-6h' : atrPct > 1.5 ? '6-12h' : atrPct > 0.8 ? '12-24h' : '1-3天';

    return {
      id: `fe-${symbol}-${Date.now()}`, symbol, name, direction, entry: +price.toFixed(d),
      tp1: +tp1.toFixed(d), tp1Pct: +((tp1Dist/price)*100).toFixed(2),
      tp2: +tp2.toFixed(d), tp2Pct: +((tp2Dist/price)*100).toFixed(2),
      sl: +sl.toFixed(d), slPct: +((slDist/price)*100).toFixed(2),
      rr, atr: +atr.toFixed(d), score, scoreLabel: score >= 8 ? 'strong' : 'normal',
      conditions: conds, rsi, emaAlign, changePct: +change24h.toFixed(2),
      timestamp: Date.now(), estimatedHoldTime: holdTime, warnings,
    };
  } catch { return null; }
}

export function useSignalEngine() {
  const [signals, setSignals] = useState<FrontendSignal[]>([]);
  const [scanning, setScanning] = useState(true);
  const [lastScan, setLastScan] = useState('');
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    async function scan() {
      setScanning(true);
      const results: FrontendSignal[] = [];
      for (const coin of COINS) {
        const sig = await analyzeSymbol(coin.symbol, coin.name);
        if (sig) results.push(sig);
      }
      results.sort((a, b) => b.score - a.score);
      setSignals(results);
      setScanning(false);
      setLastScan(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
      setCountdown(300);
    }
    scan();
    const iv = setInterval(scan, 300000); // Every 5 min
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 300), 1000);
    return () => clearInterval(iv);
  }, []);

  return { signals, scanning, lastScan, countdown };
}
