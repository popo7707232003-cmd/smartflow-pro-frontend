// pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../utils/api';

const M: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };
const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE'];

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[140px]">
      <div className="text-xs text-[#5A6080] mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ ...M, color }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { signals, smartMoneyFeed, alerts, consensus, portfolioStats, setPortfolioStats, setConsensus } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, consRes] = await Promise.allSettled([
          api.getPortfolioStats(),
          api.getSmartMoneyConsensus('BTC'),
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value.data) setPortfolioStats(statsRes.value.data);
        // Consensus would need full implementation
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const stats = portfolioStats;
  const strongSignals = signals.filter(s => s.scoreLabel === 'strong').slice(0, 3);
  const recentSM = smartMoneyFeed.slice(0, 5);
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Inter'" }}>儀表板</h1>

      {/* Metrics */}
      <div className="flex flex-wrap gap-3">
        <MetricCard label="今日訊號" value={signals.length} color="#4D9FFF" />
        <MetricCard label="勝率" value={stats ? `${stats.winRate}%` : '—'} color={(stats?.winRate || 0) >= 50 ? '#00FFA3' : '#FF4D4D'} />
        <MetricCard label="盈虧因子" value={stats?.profitFactor?.toFixed(2) || '—'} color={(stats?.profitFactor || 0) >= 2 ? '#00FFA3' : '#FFB800'} />
        <MetricCard label="總損益" value={stats ? `${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%` : '—'} color={(stats?.totalPnl || 0) >= 0 ? '#00FFA3' : '#FF4D4D'} />
      </div>

      {/* Market Bias */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#5A6080] mb-3">市場偏向</h3>
        <div className="flex flex-wrap gap-3">
          {COINS.map(coin => {
            const c = consensus[coin];
            const dir = c?.direction || 'neutral';
            const color = dir === 'bullish' ? '#00FFA3' : dir === 'bearish' ? '#FF4D4D' : '#5A6080';
            return (
              <div key={coin} className="bg-[#0A0E1A] rounded-lg px-4 py-2 text-center min-w-[80px]">
                <div className="text-sm font-bold text-white">{coin}</div>
                <div className="text-lg" style={{ color }}>{dir === 'bullish' ? '↑' : dir === 'bearish' ? '↓' : '→'}</div>
                <div className="text-[10px]" style={{ ...M, color }}>{c?.confidence || 0}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latest signals */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#5A6080]">🎯 最新強訊號</h3>
            <button onClick={() => navigate('/signals')} className="text-xs text-[#4D9FFF]">查看全部 →</button>
          </div>
          {strongSignals.length === 0 && <p className="text-xs text-[#3D4560] text-center py-6">等待訊號...</p>}
          {strongSignals.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm" style={M}>{s.symbol.replace('USDT', '')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: s.direction === 'long' ? '#00FFA3' : '#FF4D4D', color: '#000' }}>
                  {s.direction === 'long' ? '多' : '空'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-white" style={M}>{s.entry < 1 ? `$${s.entry.toFixed(4)}` : `$${s.entry.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</div>
                <div className="text-[10px] text-[#00FFA3]" style={M}>{s.score}/13 R:R {s.rr}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Smart Money */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#5A6080]">💰 聰明錢動向</h3>
            <button onClick={() => navigate('/smartmoney')} className="text-xs text-[#B76FFF]">查看全部 →</button>
          </div>
          {recentSM.length === 0 && <p className="text-xs text-[#3D4560] text-center py-6">等待數據...</p>}
          {recentSM.map(tx => (
            <div key={tx.id} className="flex items-center gap-2 py-2 border-b border-[#1F2937] last:border-0">
              <span className="text-sm">{tx.direction === 'bullish' ? '🟢' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{tx.walletLabel}</div>
                <div className="text-[10px] text-[#5A6080]">{tx.token} {tx.usdFormatted}</div>
              </div>
              <span className="text-[10px] text-[#3D4560]">{tx.minutesAgo}m</span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#5A6080]">🔔 最新警報</h3>
            <button onClick={() => navigate('/alerts')} className="text-xs text-[#FFB800]">查看全部 →</button>
          </div>
          {recentAlerts.length === 0 && <p className="text-xs text-[#3D4560] text-center py-6">尚無警報</p>}
          {recentAlerts.map(a => {
            const lc = a.level === 'A' ? '#FF4D4D' : a.level === 'B' ? '#FFB800' : '#4D9FFF';
            return (
              <div key={a.id} className="flex gap-2 py-2 border-b border-[#1F2937] last:border-0"
                style={a.level === 'A' ? { animation: 'pulse 2s 3' } : undefined}>
                <div className="w-1 rounded flex-shrink-0" style={{ background: lc }} />
                <div className="min-w-0">
                  <div className="text-xs text-white truncate">{a.title}</div>
                  <div className="text-[10px] text-[#5A6080] truncate">{a.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
