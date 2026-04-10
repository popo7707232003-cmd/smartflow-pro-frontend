import { useState, useEffect } from 'react';
import { useBinancePrices } from '../hooks/useBinancePrices';
const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const API = import.meta.env.VITE_API_URL || 'https://smartflow-pro-backend-production.up.railway.app';

export default function PortfolioPage() {
  const { tickers } = useBinancePrices();
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const f = () => fetch(API+'/api/performance').then(r=>r.json()).then(d=>{
      if(d.success){ setStats(d.data.summary); setTrades(d.data.recentTrades||[]); }
    }).catch(()=>{});
    f(); const iv = setInterval(f, 30000); return () => clearInterval(iv);
  }, []);

  const s = stats || { totalSignals:0, wins:0, losses:0, winRate:0, profitFactor:0, totalPnl:0, avgWin:0, avgLoss:0 };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">績效日誌</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['總訊號', String(s.totalSignals), '#4D9FFF'],
          ['勝率', s.totalSignals > 0 ? s.winRate+'%' : '\u2014', s.winRate >= 50 ? '#00FFA3' : '#FFB800'],
          ['盈利因子', s.totalSignals > 0 ? String(s.profitFactor) : '\u2014', s.profitFactor >= 1.5 ? '#00FFA3' : '#FFB800'],
          ['總損益', s.totalSignals > 0 ? (s.totalPnl>=0?'+':'')+s.totalPnl+'%' : '\u2014', s.totalPnl >= 0 ? '#00FFA3' : '#FF4D4D'],
          ['平均獲利', s.totalSignals > 0 ? '+'+s.avgWin+'%' : '\u2014', '#00FFA3'],
          ['平均虧損', s.totalSignals > 0 ? s.avgLoss+'%' : '\u2014', '#FF4D4D'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
            <div className="text-[11px] text-[#5A6080] mb-1">{label}</div>
            <div className="text-xl font-bold" style={{...M, color: color as string}}>{value}</div>
          </div>
        ))}
      </div>

      {s.totalSignals > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8B95B0]">勝率分佈</span>
            <span className="text-xs" style={M}><span className="text-[#00FFA3]">{s.wins}勝</span> / <span className="text-[#FF4D4D]">{s.losses}負</span></span>
          </div>
          <div className="h-4 bg-[#1F2937] rounded-full overflow-hidden flex">
            <div className="h-full bg-[#00FFA3]" style={{width: s.winRate+'%'}} />
            <div className="h-full bg-[#FF4D4D]" style={{width: (100-s.winRate)+'%'}} />
          </div>
        </div>
      )}

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-3">交易歷史</h3>
        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1F2937] last:border-0">
                <div className="flex-1">
                  <span className="text-sm font-bold text-white">{(t.symbol||'').replace('USDT','')}</span>
                  <span className="text-[10px] ml-2" style={{color:t.direction==='LONG'?'#00FFA3':'#FF4D4D'}}>{t.direction}</span>
                  <span className="text-[10px] ml-2 text-[#5A6080]">{t.exitType}</span>
                </div>
                <div className="text-sm font-bold" style={{...M, color: parseFloat(t.pnlPercent)>=0?'#00FFA3':'#FF4D4D'}}>
                  {parseFloat(t.pnlPercent)>=0?'+':''}{parseFloat(t.pnlPercent).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#3D4560]">
            <p className="text-sm">等待訊號觸及 TP 或 SL</p>
            <p className="text-xs mt-1">訊號追蹤器每 30 秒自動檢查</p>
          </div>
        )}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-3">市場概況</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {tickers.map(t => (
            <div key={t.symbol} className="bg-[#0A0E1A] rounded-lg p-3 text-center">
              <div className="text-xs text-[#5A6080]">{t.icon} {t.name}</div>
              <div className="text-sm font-bold text-white mt-1" style={M}>{'\$'}{t.price >= 1000 ? t.price.toLocaleString(undefined,{maximumFractionDigits:0}) : t.price.toFixed(2)}</div>
              <div className="text-xs font-bold mt-0.5" style={{color:t.changePct>=0?'#00FFA3':'#FF4D4D'}}>{t.changePct>=0?'+':''}{t.changePct.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
