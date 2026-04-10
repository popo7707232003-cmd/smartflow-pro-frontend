import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useBinancePrices } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const CONDITIONS = [['mtfAligned','MTF'],['bosConfirmed','BOS'],['chochDetected','ChoCH'],['inOrderBlock','OB'],['hasFVG','FVG'],['inSDZone','S/D'],['liquiditySweep','Liq'],['emaAligned','EMA'],['rsiHealthy','RSI'],['macdAligned','MACD'],['vwapBias','VWAP'],['volumeConfirmed','Vol'],['rrAbove2','R:R']];
function fp(p: number) { return p >= 1000 ? '$' + p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : p >= 1 ? '$' + p.toFixed(3) : '$' + p.toFixed(5); }

function calcRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i-1];
    if (d > 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i-1];
    ag = (ag * (period-1) + (d > 0 ? d : 0)) / period;
    al = (al * (period-1) + (d < 0 ? -d : 0)) / period;
  }
  if (al === 0) return 100;
  return +(100 - 100 / (1 + ag / al)).toFixed(1);
}

export default function SignalsPage() {
  const { signals } = useAppStore();
  const { tickers } = useBinancePrices();
  const [rsiData, setRsiData] = useState<Record<string, number | null>>({});
  const [lastScan, setLastScan] = useState<string>(new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }));
  const [countdown, setCountdown] = useState(300);

  // Fetch RSI from Binance klines
  useEffect(() => {
    async function fetchRSI() {
      const syms = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT'];
      const results: Record<string, number | null> = {};
      for (const sym of syms) {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=30`);
          const data = await res.json();
          const closes = data.map((k: any[]) => parseFloat(k[4]));
          results[sym] = calcRSI(closes);
        } catch { results[sym] = null; }
      }
      setRsiData(results);
      setLastScan(new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }));
      setCountdown(300);
    }
    fetchRSI();
    const iv = setInterval(fetchRSI, 300000);
    return () => clearInterval(iv);
  }, []);

  // Countdown timer
  useEffect(() => {
    const iv = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 300), 1000);
    return () => clearInterval(iv);
  }, []);

  const coinRanking = tickers.slice().sort((a, b) => b.changePct - a.changePct);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-white">🎯 訊號引擎</h1>
        <span className="text-xs text-[#5A6080]">ICT/SMC · 13項評分 · R:R ≥ 1.8 · 每5分鐘掃描</span>
      </div>

      {signals.length === 0 ? (
        <div className="space-y-4">
          {/* Scanning status */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4D9FFF]/10 text-[#4D9FFF] text-sm mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4D9FFF] animate-pulse"/>系統掃描中
            </div>
            <p className="text-sm text-[#5A6080]">正在分析 {tickers.length} 個幣種 × 2 方向 = {tickers.length * 2} 個潛在機會</p>
            <p className="text-xs text-[#3D4560] mt-2">需滿足 13 項條件中至少 5 項：BOS · ChoCH · OB · FVG · S/D Zone · Liquidity Sweep · MTF · EMA · RSI · MACD · VWAP · Volume · R:R ≥ 2.0</p>
            <div className="flex justify-center gap-4 mt-3 text-xs" style={M}>
              <span className="text-[#5A6080]">上次掃描: <span className="text-white">{lastScan}</span></span>
              <span className="text-[#5A6080]">下次掃描: <span className="text-[#FFB800]">{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</span></span>
            </div>
          </div>

          {/* RSI Table */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
            <h3 className="text-sm text-[#8B95B0] mb-3">📊 即時 RSI(14) 指標</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {tickers.map(t => {
                const rsi = rsiData[t.symbol];
                const rsiColor = rsi === null ? '#3D4560' : rsi > 70 ? '#FF4D4D' : rsi < 30 ? '#00FFA3' : rsi > 60 ? '#FFB800' : rsi < 40 ? '#4D9FFF' : '#C8CCD8';
                const rsiLabel = rsi === null ? '—' : rsi > 70 ? '超買' : rsi < 30 ? '超賣' : '健康';
                return (
                  <div key={t.symbol} className="bg-[#0A0E1A] rounded-lg p-3 text-center hover:bg-[#1F2937] transition-all">
                    <div className="text-xs text-[#5A6080]">{t.icon} {t.name}</div>
                    <div className="text-xl font-bold mt-1" style={{ ...M, color: rsiColor }}>{rsi ?? '—'}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: rsiColor }}>{rsiLabel}</div>
                    <div className="h-1.5 bg-[#1F2937] rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${rsi || 0}%`, background: rsiColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strength Ranking */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
            <h3 className="text-sm text-[#8B95B0] mb-3">🏆 24H 相對強弱排行</h3>
            <div className="space-y-2">
              {coinRanking.map((t, i) => (
                <div key={t.symbol} className="flex items-center gap-3">
                  <span className="text-xs text-[#3D4560] w-4" style={M}>#{i+1}</span>
                  <span className="text-sm font-bold text-white w-12">{t.icon} {t.name}</span>
                  <div className="flex-1 h-3 bg-[#1F2937] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.abs(t.changePct) * 15)}%`, background: t.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }} />
                  </div>
                  <span className="text-xs font-bold w-16 text-right" style={{ ...M, color: t.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                    {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map(s => {
            const isLong = s.direction === 'long'; const dc = isLong ? '#00FFA3' : '#FF4D4D'; const gc = s.scoreLabel === 'strong' ? '#00FFA3' : '#FFB800';
            return (
              <div key={s.id} className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: dc }}>
                {s.warnings.length > 0 && <div className="bg-[#FFB800]/10 px-4 py-1.5 text-[#FFB800] text-xs">{s.warnings.join(' · ')}</div>}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><span className="text-lg font-bold text-white" style={M}>{s.symbol.replace('USDT','')}/USDT</span><span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:dc,color:'#000'}}>{isLong?'🟢 做多':'🔴 做空'}</span></div>
                    <div className="flex items-center gap-2"><div className="h-2 w-20 bg-[#1F2937] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${(s.score/13)*100}%`,background:gc}}/></div><span className="text-sm font-bold" style={{...M,color:gc}}>⭐ {s.score}/13</span></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5"><div className="text-[10px] text-[#5A6080]">進場</div><div className="text-sm font-bold text-white" style={M}>{fp(s.entry)}</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#00FFA3]"><div className="text-[10px] text-[#00FFA3]">TP1</div><div className="text-sm font-bold text-[#00FFA3]" style={M}>{fp(s.tp1)}</div><div className="text-[10px] text-[#00FFA3]" style={M}>+{s.tp1Pct}%</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#00cc82]"><div className="text-[10px] text-[#00cc82]">TP2</div><div className="text-sm font-bold text-[#00cc82]" style={M}>{fp(s.tp2)}</div><div className="text-[10px] text-[#00cc82]" style={M}>+{s.tp2Pct}%</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#FF4D4D]"><div className="text-[10px] text-[#FF4D4D]">SL</div><div className="text-sm font-bold text-[#FF4D4D]" style={M}>{fp(s.sl)}</div><div className="text-[10px] text-[#FF4D4D]" style={M}>-{s.slPct}%</div></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">{CONDITIONS.map(([k,l])=>{const ok=s.conditions[k];return<span key={k} className="text-[10px] px-1.5 py-0.5 rounded" style={{...M,background:ok?'#00FFA3'+'15':'#1F2937',color:ok?'#00FFA3':'#3D4560'}}>{ok?'✅':'⬜'}{l}</span>;})}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
