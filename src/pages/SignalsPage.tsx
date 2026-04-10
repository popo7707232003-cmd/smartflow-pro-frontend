import { useState, useEffect } from 'react';
import { useSignalEngine } from '../hooks/useSignalEngine';
import { useBinancePrices } from '../hooks/useBinancePrices';
import { useAppStore } from '../stores/useAppStore';
import { formatAbsTime, relativeTime, holdDuration, remainingTime } from '../utils/time';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const CL: [string,string][] = [['mtfAligned','MTF'],['bosConfirmed','BOS'],['chochDetected','ChoCH'],['inOrderBlock','OB'],['hasFVG','FVG'],['inSDZone','S/D'],['emaAligned','EMA'],['rsiHealthy','RSI'],['macdAligned','MACD'],['vwapBias','VWAP'],['volumeConfirmed','Vol'],['priceUp','趨勢'],['rrAbove2','R:R']];
function fp(p: number) { return p >= 1000 ? '$'+p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : p >= 1 ? '$'+p.toFixed(3) : '$'+p.toFixed(5); }

export default function SignalsPage() {
  const { signals: feSignals, scanning, lastScan, countdown } = useSignalEngine();
  const { signals: bSignals } = useAppStore();
  const { tickers } = useBinancePrices();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [, setTick] = useState(0);

  // Tick every second for live timers
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(iv); }, []);

  const all = [...bSignals, ...feSignals.filter(f => !bSignals.find(b => b.symbol === f.symbol && b.direction === f.direction))];
  let filtered = filter === 'all' ? all : filter === 'long' ? all.filter(s => s.direction === 'long') : all.filter(s => s.direction === 'short');

  // Sort
  if (sort === 'newest') filtered = filtered.slice().sort((a, b) => b.timestamp - a.timestamp);
  else if (sort === 'score') filtered = filtered.slice().sort((a, b) => b.score - a.score);
  else if (sort === 'hold') filtered = filtered.slice().sort((a, b) => a.timestamp - b.timestamp);

  const coinRanking = tickers.slice().sort((a, b) => b.changePct - a.changePct);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-white">🎯 訊號引擎</h1>
        <div className="flex items-center gap-3 text-xs" style={M}>
          <span className="text-[#5A6080]">掃描: <span className="text-white">{lastScan || '—'}</span></span>
          <span className="text-[#5A6080]">下次: <span className="text-[#FFB800]">{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</span></span>
          {scanning && <span className="text-[#4D9FFF] animate-pulse">● 掃描中</span>}
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex gap-2 flex-wrap items-center">
        {[['all','全部'],['long','🟢 做多'],['short','🔴 做空']].map(([k,v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter===k?'bg-[#4D9FFF]/15 text-[#4D9FFF]':'bg-[#1F2937] text-[#5A6080] hover:text-white'}`}>{v}</button>
        ))}
        <span className="mx-2 text-[#1F2937]">|</span>
        {[['newest','最新'],['score','評分'],['hold','持倉']].map(([k,v]) => (
          <button key={k} onClick={() => setSort(k)} className={`px-2.5 py-1 rounded text-[10px] transition ${sort===k?'bg-[#FFB800]/15 text-[#FFB800]':'text-[#3D4560] hover:text-white'}`}>{v}</button>
        ))}
        <span className="text-[10px] text-[#3D4560] ml-auto">門檻: ≥3/13 · R:R ≥1.0</span>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((s: any) => {
            const isLong = s.direction === 'long';
            const dc = isLong ? '#00FFA3' : '#FF4D4D';
            const gc = s.score >= 8 ? '#00FFA3' : s.score >= 6 ? '#FFB800' : '#4D9FFF';
            const isFE = s.id?.startsWith('fe-');
            const rem = remainingTime(s.timestamp, 48);
            return (
              <div key={s.id} className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#2D3748] transition-all" style={{ borderLeftWidth: 3, borderLeftColor: dc, opacity: rem.expired ? 0.5 : 1 }}>
                {s.warnings?.length > 0 && <div className="bg-[#FFB800]/10 px-4 py-1 text-[#FFB800] text-xs">{s.warnings.join(' · ')}</div>}
                {isFE && <div className="bg-[#4D9FFF]/10 px-4 py-1 text-[#4D9FFF] text-[10px]">⚡ 前端即時計算</div>}
                {rem.expired && <div className="bg-[#FF4D4D]/10 px-4 py-1 text-[#FF4D4D] text-[10px]">⏰ 已過期（超過 48 小時）</div>}
                <div className="p-4">
                  {/* Header with time */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-white" style={M}>{(s.name || s.symbol?.replace('USDT',''))}/USDT</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: dc, color: '#000' }}>{isLong ? '🟢 做多' : '🔴 做空'}</span>
                      {s.rsi && <span className="text-[10px] text-[#5A6080]" style={M}>RSI {s.rsi}</span>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-[#5A6080]" style={M}>{formatAbsTime(s.timestamp)}</div>
                      <div className="text-[10px] text-[#3D4560]">{relativeTime(s.timestamp)}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <div className="h-1.5 w-14 bg-[#1F2937] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(s.score / 13) * 100}%`, background: gc }} /></div>
                        <span className="text-xs font-bold" style={{ ...M, color: gc }}>⭐{s.score}/13</span>
                      </div>
                    </div>
                  </div>

                  {/* Price levels */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5"><div className="text-[10px] text-[#5A6080]">進場</div><div className="text-sm font-bold text-white" style={M}>{fp(s.entry)}</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#00FFA3]"><div className="text-[10px] text-[#00FFA3]">TP1 (50%)</div><div className="text-sm font-bold text-[#00FFA3]" style={M}>{fp(s.tp1)}</div><div className="text-[10px] text-[#00FFA3]" style={M}>+{s.tp1Pct}%</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#00cc82]"><div className="text-[10px] text-[#00cc82]">TP2 (全平)</div><div className="text-sm font-bold text-[#00cc82]" style={M}>{fp(s.tp2)}</div><div className="text-[10px] text-[#00cc82]" style={M}>+{s.tp2Pct}%</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#FF4D4D]"><div className="text-[10px] text-[#FF4D4D]">止損 SL</div><div className="text-sm font-bold text-[#FF4D4D]" style={M}>{fp(s.sl)}</div><div className="text-[10px] text-[#FF4D4D]" style={M}>-{s.slPct}%</div></div>
                  </div>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {CL.map(([k, l]) => { const ok = s.conditions?.[k]; return <span key={k} className="text-[10px] px-1.5 py-0.5 rounded" style={{ ...M, background: ok ? '#00FFA3'+'15' : '#1F2937', color: ok ? '#00FFA3' : '#3D4560' }}>{ok ? '✅' : '⬜'}{l}</span>; })}
                  </div>

                  {/* Bottom: hold timer + expiry + R:R */}
                  <div className="flex items-center justify-between text-xs border-t border-[#1F2937] pt-2 mt-1">
                    <div className="flex items-center gap-4 text-[#5A6080]" style={M}>
                      <span>R:R <strong className="text-[#FFB800]">1:{s.rr}</strong></span>
                      <span>⚡ATR ${s.atr}</span>
                      <span>⏱ {s.estimatedHoldTime}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px]" style={M}>
                      {!rem.expired && <span className="text-[#4D9FFF]">⏱ 已持倉 {holdDuration(s.timestamp)}</span>}
                      <span className={rem.expired ? 'text-[#FF4D4D]' : 'text-[#3D4560]'}>
                        {rem.expired ? '已過期' : `有效：${rem.text}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4D9FFF]/10 text-[#4D9FFF] text-sm mb-4"><span className="w-2.5 h-2.5 rounded-full bg-[#4D9FFF] animate-pulse" />掃描中</div>
            <p className="text-sm text-[#5A6080]">目前市場條件不足以產生高品質訊號</p>
            <p className="text-xs text-[#3D4560] mt-2">需滿足 13 項條件中至少 3 項 · R:R ≥ 1.0</p>
          </div>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
            <h3 className="text-sm text-[#8B95B0] mb-3">🏆 24H 強弱排行</h3>
            <div className="space-y-2">{coinRanking.map((t, i) => (
              <div key={t.symbol} className="flex items-center gap-3">
                <span className="text-xs text-[#3D4560] w-4" style={M}>#{i+1}</span>
                <span className="text-sm font-bold text-white w-12">{t.icon} {t.name}</span>
                <div className="flex-1 h-3 bg-[#1F2937] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(100,Math.abs(t.changePct)*15)}%`,background:t.changePct>=0?'#00FFA3':'#FF4D4D'}}/></div>
                <span className="text-xs font-bold w-16 text-right" style={{...M,color:t.changePct>=0?'#00FFA3':'#FF4D4D'}}>{t.changePct>=0?'+':''}{t.changePct.toFixed(2)}%</span>
              </div>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
