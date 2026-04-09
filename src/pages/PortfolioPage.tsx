// pages/PortfolioPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useAppStore, type TradeResult, type PortfolioStats } from '../stores/useAppStore';
import { api } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';

const M: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

function MetricCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[130px]">
      <div className="text-[11px] text-[#5A6080] mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ ...M, color }}>{value}</div>
      {sub && <div className="text-[10px] text-[#3D4560] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function PortfolioPage() {
  const { portfolioStats, setPortfolioStats, trades, setTrades } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [sortCol, setSortCol] = useState<string>('closedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tradesRes] = await Promise.allSettled([
          api.getPortfolioStats(),
          api.getTrades(),
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value.data) setPortfolioStats(statsRes.value.data);
        if (tradesRes.status === 'fulfilled' && tradesRes.value.data) setTrades(tradesRes.value.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const s = portfolioStats;

  // PnL curve data
  const chartData = useMemo(() => {
    if (!trades.length) return [];
    const sorted = [...trades].sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime());
    let cumPnl = 0;
    const now = Date.now();
    const rangeMs = timeRange === '7d' ? 7 * 86400e3 : timeRange === '30d' ? 30 * 86400e3 :
                    timeRange === '90d' ? 90 * 86400e3 : Infinity;
    return sorted
      .filter(t => now - new Date(t.closedAt).getTime() < rangeMs)
      .map(t => {
        cumPnl += t.pnlPct || t.pnl || 0;
        return {
          date: new Date(t.closedAt).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
          pnl: +cumPnl.toFixed(2),
        };
      });
  }, [trades, timeRange]);

  // Sorted trades
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let va: any = a[sortCol as keyof TradeResult];
      let vb: any = b[sortCol as keyof TradeResult];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trades, sortCol, sortDir]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // Analysis cards
  const coinWinRates = useMemo(() => {
    const map = new Map<string, { w: number; t: number }>();
    trades.forEach(t => {
      const sym = t.symbol?.replace('USDT', '') || '?';
      const e = map.get(sym) || { w: 0, t: 0 };
      e.t++;
      if (t.result === 'tp1' || t.result === 'tp2') e.w++;
      map.set(sym, e);
    });
    return Array.from(map.entries()).map(([sym, { w, t }]) => ({
      sym, wr: t > 0 ? +(w / t * 100).toFixed(1) : 0, total: t,
    })).sort((a, b) => b.wr - a.wr);
  }, [trades]);

  const longVsShort = useMemo(() => {
    const longs = trades.filter(t => t.direction === 'long');
    const shorts = trades.filter(t => t.direction === 'short');
    const lw = longs.filter(t => t.result === 'tp1' || t.result === 'tp2').length;
    const sw = shorts.filter(t => t.result === 'tp1' || t.result === 'tp2').length;
    return {
      longWr: longs.length > 0 ? +(lw / longs.length * 100).toFixed(1) : 0,
      shortWr: shorts.length > 0 ? +(sw / shorts.length * 100).toFixed(1) : 0,
      longN: longs.length, shortN: shorts.length,
    };
  }, [trades]);

  const fp = (p: number) => p < 1 ? `$${p.toFixed(4)}` : p < 1000 ? `$${p.toFixed(2)}` :
    `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">📊 績效日誌</h1>

      {/* 6 Metrics */}
      <div className="flex flex-wrap gap-3">
        <MetricCard label="總損益" value={s ? `${s.totalPnl >= 0 ? '+' : ''}${s.totalPnl.toFixed(2)}%` : '—'}
          color={(s?.totalPnl || 0) >= 0 ? '#00FFA3' : '#FF4D4D'} sub={s ? `${s.totalTrades} 筆交易` : ''} />
        <MetricCard label="勝率" value={s ? `${s.winRate}%` : '—'}
          color={(s?.winRate || 0) >= 50 ? '#00FFA3' : '#FF4D4D'} sub={s ? `${s.wins}W / ${s.losses}L` : ''} />
        <MetricCard label="盈虧因子" value={s?.profitFactor?.toFixed(2) || '—'}
          color={(s?.profitFactor || 0) >= 2 ? '#00FFA3' : '#FFB800'} />
        <MetricCard label="最大回撤" value={s?.maxDrawdown ? `${s.maxDrawdown.toFixed(2)}%` : '—'}
          color="#FF4D4D" />
        <MetricCard label="平均持倉" value={s?.avgHoldTime || '—'} color="#4D9FFF" />
        <MetricCard label="本月報酬" value={s?.monthReturn ? `${s.monthReturn >= 0 ? '+' : ''}${s.monthReturn.toFixed(2)}%` : '—'}
          color={(s?.monthReturn || 0) >= 0 ? '#00FFA3' : '#FF4D4D'} />
      </div>

      {/* PnL Chart */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-[#5A6080]">📈 累計損益曲線</h3>
          <div className="flex gap-1">
            {(['7d','30d','90d','all'] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-2 py-1 rounded text-[10px] ${
                  timeRange === r ? 'bg-[#00FFA3]/15 text-[#00FFA3]' : 'text-[#5A6080] hover:text-white'
                }`}>{r === 'all' ? '全部' : r}</button>
            ))}
          </div>
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFA3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00FFA3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="date" tick={{ fill: '#5A6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5A6080', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                tickFormatter={v => `${v >= 0 ? '+' : ''}${v}%`} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #2D3748', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#5A6080' }} formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, 'PnL']} />
              <Area type="monotone" dataKey="pnl" stroke="#00FFA3" fill="url(#pnlGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-[#3D4560] text-sm">尚無足夠數據</div>
        )}
      </div>

      {/* Trade Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#5A6080] mb-3">📋 交易紀錄</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-b-2 border-[#1F2937]">
                {[
                  ['symbol','幣種'],['direction','方向'],['entry','入場價'],
                  ['result','結果'],['pnlPct','損益%'],['score','評分'],['closedAt','時間']
                ].map(([col, label]) => (
                  <th key={col} onClick={() => toggleSort(col)}
                    className="text-left py-2 px-2 text-[11px] text-[#5A6080] cursor-pointer hover:text-white select-none">
                    {label} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((t, i) => {
                const isWin = t.result === 'tp1' || t.result === 'tp2';
                return (
                  <tr key={i} className="border-b border-[#1F2937] hover:bg-[#1F2937]/30 transition">
                    <td className="py-2 px-2 text-sm font-bold text-white" style={M}>{(t.symbol || '').replace('USDT', '')}</td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: t.direction === 'long' ? '#00FFA3' : '#FF4D4D', color: '#000' }}>
                        {t.direction === 'long' ? '多' : '空'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs text-[#5A6080]" style={M}>{fp(t.entry)}</td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: isWin ? '#00FFA3' + '20' : '#FF4D4D' + '20', color: isWin ? '#00FFA3' : '#FF4D4D' }}>
                        {t.result === 'tp1' ? '✓ TP1' : t.result === 'tp2' ? '✓ TP2' : '✗ SL'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-sm font-bold" style={{ ...M, color: (t.pnlPct || t.pnl || 0) >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                      {(t.pnlPct || t.pnl || 0) >= 0 ? '+' : ''}{(t.pnlPct || t.pnl || 0).toFixed(2)}%
                    </td>
                    <td className="py-2 px-2 text-xs text-[#5A6080]" style={M}>{t.score}/13</td>
                    <td className="py-2 px-2 text-[10px] text-[#3D4560]">
                      {t.closedAt ? new Date(t.closedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })}
              {sortedTrades.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-[#3D4560]">尚無交易紀錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Cards */}
      {trades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coin win rates */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
            <h3 className="text-sm text-[#5A6080] mb-3">🏆 各幣種勝率</h3>
            <div className="space-y-2">
              {coinWinRates.slice(0, 8).map(({ sym, wr, total }) => (
                <div key={sym} className="flex items-center gap-2">
                  <span className="text-xs text-white w-10 font-bold" style={M}>{sym}</span>
                  <div className="flex-1 h-4 bg-[#1F2937] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${wr}%`, background: wr >= 50 ? '#00FFA3' : '#FF4D4D' }} />
                  </div>
                  <span className="text-xs w-16 text-right" style={{ ...M, color: wr >= 50 ? '#00FFA3' : '#FF4D4D' }}>
                    {wr}% ({total})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Long vs Short */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
            <h3 className="text-sm text-[#5A6080] mb-3">📊 做多 vs 做空</h3>
            <div className="flex gap-4 items-center justify-center py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00FFA3]" style={M}>{longVsShort.longWr}%</div>
                <div className="text-xs text-[#5A6080] mt-1">做多勝率</div>
                <div className="text-[10px] text-[#3D4560]">{longVsShort.longN} 筆</div>
              </div>
              <div className="text-2xl text-[#2D3748]">vs</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FF4D4D]" style={M}>{longVsShort.shortWr}%</div>
                <div className="text-xs text-[#5A6080] mt-1">做空勝率</div>
                <div className="text-[10px] text-[#3D4560]">{longVsShort.shortN} 筆</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
