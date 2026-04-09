// components/SignalCard.tsx
import { useState } from 'react';
import type { Signal } from '../stores/useAppStore';
import PositionCalculator from './PositionCalculator';

const fp = (p: number) => p < 1 ? `$${p.toFixed(4)}` : p < 1000 ? `$${p.toFixed(2)}` : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const M = { fontFamily: "'JetBrains Mono',monospace" };

const CONDITION_LABELS: [string, string][] = [
  ['mtfAligned', 'MTF'], ['bosConfirmed', 'BOS'], ['chochDetected', 'ChoCH'],
  ['inOrderBlock', 'OB'], ['hasFVG', 'FVG'], ['inSDZone', 'S/D'],
  ['liquiditySweep', 'LiqSweep'], ['emaAligned', 'EMA'],
  ['rsiHealthy', 'RSI'], ['macdAligned', 'MACD'],
  ['vwapBias', 'VWAP'], ['volumeConfirmed', 'Volume'], ['rrAbove2', 'R:R'],
];

export default function SignalCard({ signal: s }: { signal: Signal }) {
  const [showCalc, setShowCalc] = useState(false);
  const isLong = s.direction === 'long';
  const dirColor = isLong ? '#00FFA3' : '#FF4D4D';
  const gradeColor = s.scoreLabel === 'strong' ? '#00FFA3' : s.scoreLabel === 'normal' ? '#FFB800' : '#FF4D4D';
  const sym = s.symbol.replace('USDT', '');
  const minsAgo = Math.round((Date.now() - s.timestamp) / 60000);

  const copyParams = () => {
    const text = `${s.symbol} ${isLong ? '做多' : '做空'}\nEntry: ${fp(s.entry)}\nTP1: ${fp(s.tp1)} (+${s.tp1Pct}%)\nTP2: ${fp(s.tp2)} (+${s.tp2Pct}%)\nSL: ${fp(s.sl)} (-${s.slPct}%)\nR:R 1:${s.rr}`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden animate-[fadeUp_0.3s]"
         style={{ borderLeftColor: dirColor, borderLeftWidth: 3 }}>
      {/* Warnings banner */}
      {s.warnings.length > 0 && (
        <div className="bg-[#FFB800]/10 border-b border-[#FFB800]/20 px-4 py-2 text-[#FFB800] text-xs">
          {s.warnings.join(' · ')}
        </div>
      )}

      <div className="p-4 flex flex-col lg:flex-row gap-4">
        {/* LEFT COLUMN: Symbol + Direction + Score */}
        <div className="lg:w-1/4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white" style={M}>{sym}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ background: dirColor, color: '#000' }}>
              {isLong ? '做多 LONG' : '做空 SHORT'}
            </span>
          </div>

          {/* Score bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#1F2937] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(s.score / 13) * 100}%`, background: gradeColor }} />
            </div>
            <span className="text-sm font-bold" style={{ ...M, color: gradeColor }}>
              {s.score}/13
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded w-fit" style={{ background: gradeColor + '20', color: gradeColor }}>
            {s.scoreLabel === 'strong' ? '強訊號' : '普通訊號'}
          </span>

          <span className="text-[11px] text-[#5A6080]">{minsAgo}分鐘前</span>
        </div>

        {/* CENTER COLUMN: Price Levels */}
        <div className="lg:w-1/2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Entry */}
            <div className="bg-[#0A0E1A] rounded-lg p-3">
              <div className="text-[10px] text-[#5A6080] mb-1">ENTRY 入場</div>
              <div className="text-base font-bold text-white" style={M}>{fp(s.entry)}</div>
            </div>
            {/* TP1 */}
            <div className="bg-[#0A0E1A] rounded-lg p-3 border-l-2 border-[#00FFA3]">
              <div className="text-[10px] text-[#00FFA3] mb-1">TP1 止盈1 (50%)</div>
              <div className="text-base font-bold text-[#00FFA3]" style={M}>{fp(s.tp1)}</div>
              <div className="text-xs text-[#00FFA3]" style={M}>+{s.tp1Pct}%</div>
            </div>
            {/* TP2 */}
            <div className="bg-[#0A0E1A] rounded-lg p-3 border-l-2 border-[#00cc82]">
              <div className="text-[10px] text-[#00cc82] mb-1">TP2 止盈2 (全平)</div>
              <div className="text-base font-bold text-[#00cc82]" style={M}>{fp(s.tp2)}</div>
              <div className="text-xs text-[#00cc82]" style={M}>+{s.tp2Pct}%</div>
            </div>
            {/* SL */}
            <div className="bg-[#0A0E1A] rounded-lg p-3 border-l-2 border-[#FF4D4D]">
              <div className="text-[10px] text-[#FF4D4D] mb-1">SL 止損 (ATR×1.5)</div>
              <div className="text-base font-bold text-[#FF4D4D]" style={M}>{fp(s.sl)}</div>
              <div className="text-xs text-[#FF4D4D]" style={M}>-{s.slPct}%</div>
            </div>
          </div>

          {/* R:R + indicators */}
          <div className="flex items-center justify-between mt-3 text-xs text-[#5A6080]" style={M}>
            <span>R:R <strong className="text-[#FFB800]">1:{s.rr}</strong></span>
            <span>RSI {s.rsiValue?.toFixed(1) || '—'} · MACD {(s.macdHistogram || 0) > 0 ? '+' : ''}{s.macdHistogram?.toFixed(2) || '—'} · {s.emaAlignment || '—'} · VWAP {s.vwapBiasStr || '—'}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Conditions + Meta */}
        <div className="lg:w-1/4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#5A6080]">ATR <span style={M}>{s.atr}</span></span>
            <span className="text-[11px] text-[#5A6080]">持倉 {s.estimatedHoldTime}</span>
          </div>

          {/* 13 conditions grid */}
          <div className="grid grid-cols-2 gap-1">
            {CONDITION_LABELS.map(([key, label]) => {
              const passed = s.conditions[key];
              return (
                <div key={key} className="flex items-center gap-1 text-[11px]" style={M}>
                  <span style={{ color: passed ? '#00FFA3' : '#2D3748' }}>{passed ? '✓' : '✗'}</span>
                  <span style={{ color: passed ? '#C8CCD8' : '#3D4560' }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={copyParams}
              className="flex-1 text-[11px] py-1.5 rounded bg-[#1F2937] text-[#5A6080] hover:text-white transition">
              📋 複製
            </button>
            <button onClick={() => setShowCalc(!showCalc)}
              className="flex-1 text-[11px] py-1.5 rounded bg-[#4D9FFF]/10 text-[#4D9FFF] hover:bg-[#4D9FFF]/20 transition">
              ⚖️ 倉位
            </button>
          </div>
        </div>
      </div>

      {showCalc && <PositionCalculator entry={s.entry} sl={s.sl} onClose={() => setShowCalc(false)} />}
    </div>
  );
}
