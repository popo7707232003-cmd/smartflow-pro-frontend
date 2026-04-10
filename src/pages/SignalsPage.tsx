// pages/SignalsPage.tsx
import { useAppStore } from '../stores/useAppStore';
import { useBinancePrices } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const CONDITIONS = [['mtfAligned','MTF'],['bosConfirmed','BOS'],['chochDetected','ChoCH'],['inOrderBlock','OB'],['hasFVG','FVG'],['inSDZone','S/D'],['liquiditySweep','Liq'],['emaAligned','EMA'],['rsiHealthy','RSI'],['macdAligned','MACD'],['vwapBias','VWAP'],['volumeConfirmed','Vol'],['rrAbove2','R:R']];

function fp(p: number) { return p >= 1000 ? '$' + p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p >= 1 ? '$' + p.toFixed(3) : '$' + p.toFixed(5); }

export default function SignalsPage() {
  const { signals } = useAppStore();
  const { tickers } = useBinancePrices();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">🎯 訊號引擎</h1>
        <span className="text-xs text-[#5A6080]">ICT/SMC · 13項評分 · R:R ≥ 1.8 · 每5分鐘掃描</span>
      </div>

      {signals.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4D9FFF]/10 text-[#4D9FFF] text-sm mb-4">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4D9FFF] animate-pulse" />
            系統掃描中
          </div>
          <p className="text-sm text-[#5A6080] mt-3">正在分析 {tickers.length} 個幣種 × 2 方向 = {tickers.length * 2} 個潛在機會</p>
          <p className="text-xs text-[#3D4560] mt-2">訊號需要通過 13 項嚴格條件中至少 5 項才會出現</p>
          <p className="text-xs text-[#3D4560]">包括：BOS確認 · FVG缺口 · Order Block · RSI健康 · R:R ≥ 2.0</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {tickers.slice(0, 6).map(t => (
              <div key={t.symbol} className="bg-[#0A0E1A] rounded-lg px-3 py-1.5 text-xs" style={M}>
                <span className="text-white">{t.name}</span>
                <span className="ml-1.5" style={{ color: t.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                  {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map(s => {
            const isLong = s.direction === 'long';
            const dc = isLong ? '#00FFA3' : '#FF4D4D';
            const gc = s.scoreLabel === 'strong' ? '#00FFA3' : '#FFB800';
            return (
              <div key={s.id} className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#2D3748] transition-all" style={{ borderLeftWidth: 3, borderLeftColor: dc }}>
                {s.warnings.length > 0 && <div className="bg-[#FFB800]/10 px-4 py-1.5 text-[#FFB800] text-xs">{s.warnings.join(' · ')}</div>}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white" style={M}>{s.symbol.replace('USDT', '')}/USDT</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: dc, color: '#000' }}>{isLong ? '🟢 做多' : '🔴 做空'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 bg-[#1F2937] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(s.score / 13) * 100}%`, background: gc }} /></div>
                      <span className="text-sm font-bold" style={{ ...M, color: gc }}>⭐ {s.score}/13</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5"><div className="text-[10px] text-[#5A6080]">進場</div><div className="text-sm font-bold text-white" style={M}>{fp(s.entry)}</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#00FFA3]"><div className="text-[10px] text-[#00FFA3]">TP1 →</div><div className="text-sm font-bold text-[#00FFA3]" style={M}>{fp(s.tp1)}</div><div className="text-[10px] text-[#00FFA3]" style={M}>+{s.tp1Pct}%</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#00cc82]"><div className="text-[10px] text-[#00cc82]">TP2 →</div><div className="text-sm font-bold text-[#00cc82]" style={M}>{fp(s.tp2)}</div><div className="text-[10px] text-[#00cc82]" style={M}>+{s.tp2Pct}%</div></div>
                    <div className="bg-[#0A0E1A] rounded-lg p-2.5 border-l-2 border-[#FF4D4D]"><div className="text-[10px] text-[#FF4D4D]">SL ✕</div><div className="text-sm font-bold text-[#FF4D4D]" style={M}>{fp(s.sl)}</div><div className="text-[10px] text-[#FF4D4D]" style={M}>-{s.slPct}%</div></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5A6080] mb-2" style={M}>
                    <span>R:R <strong className="text-[#FFB800]">1:{s.rr}</strong></span>
                    <span>⚡ ATR: ${s.atr} · ⏱ {s.estimatedHoldTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CONDITIONS.map(([key, label]) => {
                      const ok = s.conditions[key];
                      return <span key={key} className="text-[10px] px-1.5 py-0.5 rounded" style={{ ...M, background: ok ? '#00FFA3' + '15' : '#1F2937', color: ok ? '#00FFA3' : '#3D4560' }}>{ok ? '✅' : '⬜'}{label}</span>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
