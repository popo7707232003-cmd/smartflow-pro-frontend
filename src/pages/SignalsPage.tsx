// pages/SignalsPage.tsx
import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import SignalCard from '../components/SignalCard';

const COINS = ['全部','BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','LINK','DOT'];
const DIRS = ['全部','做多','做空'] as const;
const GRADES = ['全部','strong','normal'] as const;

export default function SignalsPage() {
  const { signals } = useAppStore();
  const [coin, setCoin] = useState('全部');
  const [dir, setDir] = useState<string>('全部');
  const [grade, setGrade] = useState<string>('全部');

  const filtered = useMemo(() => {
    return signals.filter(s => {
      if (coin !== '全部' && !s.symbol.startsWith(coin)) return false;
      if (dir === '做多' && s.direction !== 'long') return false;
      if (dir === '做空' && s.direction !== 'short') return false;
      if (grade !== '全部' && s.scoreLabel !== grade) return false;
      return true;
    });
  }, [signals, coin, dir, grade]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-white">🎯 訊號引擎</h1>
        <span className="text-xs text-[#5A6080]">ATR(1H) · 13項ICT/SMC評分 · R:R≥1.8 · RSI過濾</span>
      </div>

      {/* Filters - sticky */}
      <div className="sticky top-12 z-40 bg-[#0A0E1A]/95 backdrop-blur py-3 flex flex-wrap gap-2 border-b border-[#1F2937]">
        {/* Coin filter */}
        <div className="flex gap-1 overflow-x-auto">
          {COINS.map(c => (
            <button key={c} onClick={() => setCoin(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                coin === c ? 'bg-[#00FFA3]/15 text-[#00FFA3]' : 'bg-[#1F2937] text-[#5A6080] hover:text-white'
              }`}>{c}</button>
          ))}
        </div>
        {/* Direction */}
        <div className="flex gap-1">
          {DIRS.map(d => (
            <button key={d} onClick={() => setDir(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                dir === d ? 'bg-[#4D9FFF]/15 text-[#4D9FFF]' : 'bg-[#1F2937] text-[#5A6080] hover:text-white'
              }`}>{d}</button>
          ))}
        </div>
        {/* Grade */}
        <div className="flex gap-1">
          {GRADES.map(g => (
            <button key={g} onClick={() => setGrade(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                grade === g ? 'bg-[#FFB800]/15 text-[#FFB800]' : 'bg-[#1F2937] text-[#5A6080] hover:text-white'
              }`}>{g === 'strong' ? '強訊號' : g === 'normal' ? '普通' : g}</button>
          ))}
        </div>
        <span className="text-xs text-[#3D4560] self-center ml-auto">{filtered.length} 個訊號</span>
      </div>

      {/* Signal cards */}
      <div className="space-y-3">
        {filtered.map(s => <SignalCard key={s.id} signal={s} />)}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#3D4560]">
            <div className="text-4xl mb-3">🎯</div>
            <p>等待符合條件的訊號...</p>
            <p className="text-xs mt-1">系統每 5 分鐘掃描一次（score ≥ 5/13 · R:R ≥ 1.8 · RSI 健康）</p>
          </div>
        )}
      </div>
    </div>
  );
}
