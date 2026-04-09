// pages/SmartMoneyPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../utils/api';

const M: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };
const COINS = ['BTC','ETH','SOL','BNB','XRP','DOGE'];
const DIRS = ['全部','bullish','bearish'] as const;

function fmtUsd(v: number) {
  if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function SmartMoneyPage() {
  const { smartMoneyFeed, consensus, setConsensus } = useAppStore();
  const [filterCoin, setFilterCoin] = useState('全部');
  const [filterDir, setFilterDir] = useState<string>('全部');
  const [minAmount, setMinAmount] = useState(0);

  // Fetch consensus on mount
  useEffect(() => {
    api.getSmartMoneyConsensus('BTC').then(r => {
      if (r.data) setConsensus({ ...consensus, BTC: r.data });
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return smartMoneyFeed.filter(tx => {
      if (filterCoin !== '全部' && tx.token !== filterCoin && !tx.relatedSymbol?.includes(filterCoin)) return false;
      if (filterDir === 'bullish' && tx.direction !== 'bullish') return false;
      if (filterDir === 'bearish' && tx.direction !== 'bearish') return false;
      if (minAmount > 0 && tx.usdValue < minAmount) return false;
      return true;
    });
  }, [smartMoneyFeed, filterCoin, filterDir, minAmount]);

  // Summary stats
  const bull = smartMoneyFeed.filter(t => t.direction === 'bullish');
  const bear = smartMoneyFeed.filter(t => t.direction === 'bearish');
  const bullVol = bull.reduce((s, t) => s + t.usdValue, 0);
  const bearVol = bear.reduce((s, t) => s + t.usdValue, 0);
  const total = bullVol + bearVol;
  const bullPct = total > 0 ? Math.round(bullVol / total * 100) : 50;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">💰 聰明錢追蹤</h1>

      {/* Consensus indicators */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {COINS.map(coin => {
          const c = consensus[coin];
          const dir = c?.direction || 'neutral';
          const color = dir === 'bullish' ? '#00FFA3' : dir === 'bearish' ? '#FF4D4D' : '#5A6080';
          const arrow = dir === 'bullish' ? '↑' : dir === 'bearish' ? '↓' : '→';
          return (
            <div key={coin} className="bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-center">
              <div className="text-sm font-bold text-white">{coin}</div>
              <div className="text-2xl my-1" style={{ color }}>{arrow}</div>
              <div className="text-xs" style={{ ...M, color }}>{c?.confidence || 0}%</div>
              <div className="text-[10px] text-[#5A6080]">
                {c ? `${fmtUsd(c.bullishVolume - c.bearishVolume)}` : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall flow bar */}
      {total > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#00FFA3]">🟢 吸籌 {fmtUsd(bullVol)} ({bull.length}筆)</span>
            <span className="text-[#5A6080]">整體流向</span>
            <span className="text-[#FF4D4D]">🔴 賣壓 {fmtUsd(bearVol)} ({bear.length}筆)</span>
          </div>
          <div className="h-3 bg-[#1F2937] rounded-full overflow-hidden flex">
            <div className="bg-[#00FFA3] transition-all" style={{ width: `${bullPct}%` }} />
            <div className="bg-[#FF4D4D] flex-1" />
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-bold" style={{ ...M, color: bullPct >= 60 ? '#00FFA3' : bullPct <= 40 ? '#FF4D4D' : '#FFB800' }}>
              {bullPct}% {bullPct >= 60 ? '偏多' : bullPct <= 40 ? '偏空' : '中立'}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {['全部', ...COINS].map(c => (
            <button key={c} onClick={() => setFilterCoin(c)}
              className={`px-2 py-1 rounded text-xs ${filterCoin === c ? 'bg-[#B76FFF]/15 text-[#B76FFF]' : 'bg-[#1F2937] text-[#5A6080]'}`}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {DIRS.map(d => (
            <button key={d} onClick={() => setFilterDir(d)}
              className={`px-2 py-1 rounded text-xs ${filterDir === d ? 'bg-[#4D9FFF]/15 text-[#4D9FFF]' : 'bg-[#1F2937] text-[#5A6080]'}`}>
              {d === 'bullish' ? '🟢 吸籌' : d === 'bearish' ? '🔴 賣壓' : d}
            </button>
          ))}
        </div>
        <select value={minAmount} onChange={e => setMinAmount(+e.target.value)}
          className="bg-[#1F2937] border border-[#2D3748] text-[#5A6080] text-xs rounded px-2 py-1">
          <option value={0}>金額不限</option>
          <option value={500000}>≥ $500K</option>
          <option value={1000000}>≥ $1M</option>
          <option value={5000000}>≥ $5M</option>
        </select>
      </div>

      {/* Transaction feed */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map(tx => (
          <div key={tx.id}
            className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 flex items-center gap-3 animate-[fadeUp_0.3s]"
            style={{ borderLeftWidth: 3, borderLeftColor: tx.direction === 'bullish' ? '#00FFA3' : '#FF4D4D' }}>
            <span className="text-xl flex-shrink-0">{tx.direction === 'bullish' ? '🟢' : '🔴'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">{tx.walletLabel}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: tx.direction === 'bullish' ? '#00FFA3' + '20' : '#FF4D4D' + '20',
                           color: tx.direction === 'bullish' ? '#00FFA3' : '#FF4D4D' }}>
                  {tx.txTypeLabel || (tx.direction === 'bullish' ? '← 吸籌' : '→ 賣壓')}
                </span>
              </div>
              <div className="text-xs text-[#5A6080] mt-0.5" style={M}>
                {tx.token} · {tx.usdFormatted || fmtUsd(tx.usdValue)} · {tx.fromLabel} → {tx.toLabel}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-white" style={M}>{tx.usdFormatted || fmtUsd(tx.usdValue)}</div>
              <div className="text-[10px] text-[#3D4560]">{tx.minutesAgo}分鐘前</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#3D4560]">
            <div className="text-4xl mb-3">💰</div>
            <p>等待聰明錢數據...</p>
          </div>
        )}
      </div>
    </div>
  );
}
