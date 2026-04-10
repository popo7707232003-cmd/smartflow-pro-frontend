import { useState, useEffect } from 'react';
import { useBinancePrices } from '../hooks/useBinancePrices';
const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const API = import.meta.env.VITE_API_URL || '';

export default function PortfolioPage() {
  const { tickers } = useBinancePrices();
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [symbolStats, setSymbolStats] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/portfolio/stats`).then(r=>r.json()).then(d=>{ if(d.success) setStats(d.data); }).catch(()=>{});
    fetch(`${API}/api/portfolio/trades?limit=20`).then(r=>r.json()).then(d=>{ if(d.success) setTrades(d.data); }).catch(()=>{});
    fetch(`${API}/api/stats/by-symbol`).then(r=>r.json()).then(d=>{ if(d.success) setSymbolStats(d.data); }).catch(()=>{});
    const iv = setInterval(() => {
      fetch(`${API}/api/portfolio/stats`).then(r=>r.json()).then(d=>{ if(d.success) setStats(d.data); }).catch(()=>{});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const s = stats || { totalTrades:0, wins:0, losses:0, winRate:0, profitFactor:0, totalPnl:0, avgWin:0, avgLoss:0 };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">📊 績效日誌</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['總訊號', s.totalTrades, '#4D9FFF'],
          ['勝率', s.totalTrades > 0 ? s.winRate + '%' : '—', s.winRate >= 50 ? '#00FFA3' : '#FFB800'],
          ['盈虧因子', s.totalTrades > 0 ? s.profitFactor : '—', s.profitFactor >= 1.5 ? '#00FFA3' : '#FFB800'],
          ['累計損益', s.totalTrades > 0 ? (s.totalPnl >= 0 ? '+' : '') + s.totalPnl + '%' : '—', s.totalPnl >= 0 ? '#00FFA3' : '#FF4D4D'],
          ['平均獲利', s.totalTrades > 0 ? '+' + s.avgWin + '%' : '—', '#00FFA3'],
          ['平均虧損', s.totalTrades > 0 ? '-' + s.avgLoss + '%' : '—', '#FF4D4D'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 hover:border-[#2D3748] transition-all">
            <div className="text-[11px] text-[#5A6080] mb-1">{label}</div>
            <div className="text-xl font-bold" style={{ ...M, color: color as string }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      {s.totalTrades > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8B95B0]">勝敗比</span>
            <span className="text-xs" style={M}><span className="text-[#00FFA3]">{s.wins}勝</span> / <span className="text-[#FF4D4D]">{s.losses}敗</span></span>
          </div>
          <div className="h-4 bg-[#1F2937] rounded-full overflow-hidden flex">
            <div className="h-full bg-[#00FFA3] transition-all" style={{ width: `${s.winRate}%` }} />
            <div className="h-full bg-[#FF4D4D] transition-all" style={{ width: `${100 - s.winRate}%` }} />
          </div>
        </div>
      )}

      {/* Symbol stats */}
      {symbolStats.length > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <h3 className="text-sm text-[#8B95B0] mb-3">📊 各幣種勝率</h3>
          <div className="space-y-2">
            {symbolStats.map((ss: any) => (
              <div key={ss.symbol} className="flex items-center gap-3">
                <span className="text-sm font-bold text-white w-16">{ss.symbol.replace('USDT','')}</span>
                <div className="flex-1 h-3 bg-[#1F2937] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#00FFA3]" style={{ width: `${ss.winRate}%` }} />
                </div>
                <span className="text-xs w-20 text-right" style={{ ...M, color: ss.winRate >= 50 ? '#00FFA3' : '#FF4D4D' }}>{ss.winRate}% ({ss.total}筆)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade history */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-3">📋 交易紀錄</h3>
        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.map((t: any, i: number) => {
              const isWin = t.result_type === 'tp2' || t.result_type === 'breakeven';
              const bc = isWin ? '#00FFA3' : t.result_type === 'tp1' ? '#FFB800' : '#FF4D4D';
              const label = t.result_type === 'tp2' ? '✅ 勝' : t.result_type === 'tp1' ? '⚡ TP1' : t.result_type === 'breakeven' ? '⚖️ 平' : '❌ 敗';
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1F2937] last:border-0" style={{ borderLeftWidth: 3, borderLeftColor: bc }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{t.symbol?.replace('USDT','')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: t.direction === 'long' ? '#00FFA3' + '20' : '#FF4D4D' + '20', color: t.direction === 'long' ? '#00FFA3' : '#FF4D4D' }}>{t.direction === 'long' ? '做多' : '做空'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: bc + '20', color: bc }}>{label}</span>
                    </div>
                    <div className="text-[10px] text-[#5A6080] mt-0.5" style={M}>
                      進場 ${parseFloat(t.entry).toFixed(2)} → 出場 ${parseFloat(t.exit_price).toFixed(2)} · 評分 {t.score}/13
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ ...M, color: parseFloat(t.pnl_pct) >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                      {parseFloat(t.pnl_pct) >= 0 ? '+' : ''}{parseFloat(t.pnl_pct).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-[#3D4560]">{t.hold_duration || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-3xl">📈</span>
            <p className="text-sm text-[#5A6080] mt-3">等待第一筆訊號觸及 TP 或 SL</p>
            <p className="text-xs text-[#3D4560] mt-1">系統會自動每 30 秒檢查一次</p>
          </div>
        )}
      </div>

      {/* Market overview */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-3">🌍 即時市場概覽</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {tickers.map(t => (
            <div key={t.symbol} className="bg-[#0A0E1A] rounded-lg p-3 text-center">
              <div className="text-xs text-[#5A6080]">{t.icon} {t.name}</div>
              <div className="text-sm font-bold text-white mt-1" style={M}>${t.price >= 1000 ? t.price.toLocaleString(undefined,{maximumFractionDigits:0}) : t.price.toFixed(2)}</div>
              <div className="text-xs font-bold mt-0.5" style={{...M,color:t.changePct>=0?'#00FFA3':'#FF4D4D'}}>{t.changePct>=0?'+':''}{t.changePct.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
