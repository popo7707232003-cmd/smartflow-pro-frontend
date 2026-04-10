import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useBinancePrices, CoinTicker } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const API = import.meta.env.VITE_API_URL || '';

const EVENTS = [
  { name:'NFP', date:'2026-05-01', level:'A' }, { name:'FOMC', date:'2026-05-06', level:'A' },
  { name:'CPI', date:'2026-05-13', level:'A' }, { name:'PPI', date:'2026-05-15', level:'B' },
  { name:'PCE', date:'2026-04-30', level:'A' }, { name:'GDP', date:'2026-05-28', level:'B' },
];

function getNextEvent() {
  const now = Date.now();
  const f = EVENTS.map(e => ({ ...e, ts: new Date(e.date).getTime() })).filter(e => e.ts > now).sort((a,b) => a.ts - b.ts);
  return f.length ? { ...f[0], days: Math.ceil((f[0].ts - now) / 86400000) } : null;
}

function fp(p: number) { return p >= 10000 ? p.toLocaleString(undefined,{maximumFractionDigits:0}) : p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(3) : p.toFixed(5); }

function CoinCard({ coin, bias }: { coin: CoinTicker; bias?: any }) {
  const isUp = coin.changePct >= 0;
  // Use backend bias if available, otherwise fall back to coin.bias
  const biasDir = bias?.overall || coin.bias || 'WAIT';
  const biasLabel = biasDir === 'LONG' ? '做多' : biasDir === 'SHORT' ? '做空' : 'WAIT';
  const bc = biasDir === 'LONG' ? '#00FFA3' : biasDir === 'SHORT' ? '#FF4D4D' : '#5A6080';
  const arrow = biasDir === 'LONG' ? '↗' : biasDir === 'SHORT' ? '↘' : '→';
  const conf = bias?.confidence === 'high' ? '100%' : bias?.confidence === 'medium' ? '67%' : bias ? '33%' : '';
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3.5 hover:border-[#2D3748] transition-all min-w-[140px] flex-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5"><span className="text-base">{coin.icon}</span><span className="text-sm font-bold text-white">{coin.name}</span></div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: bc + '20', color: bc }}>{biasLabel}</span>
      </div>
      <div className="text-lg font-bold text-white mb-1" style={M}>${fp(coin.price)}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ ...M, color: isUp ? '#00FFA3' : '#FF4D4D' }}>{isUp ? '+' : ''}{coin.changePct.toFixed(2)}%</span>
        <span className="text-[10px] text-[#3D4560]">{conf}</span>
      </div>
      <div className="text-2xl mt-1 text-center" style={{ color: bc }}>{arrow}</div>
    </div>
  );
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
  return <div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#00FFA3]' : 'bg-[#FF4D4D]'}`} /><span className="text-[10px] text-[#5A6080]">{label}</span></div>;
}

export default function Dashboard() {
  const { tickers, connected: binWs } = useBinancePrices();
  const { signals, smartMoneyFeed, alerts, wsConnected, backendStatus } = useAppStore();
  const navigate = useNavigate();
  const nextEvent = getNextEvent();
  const [health, setHealth] = useState<any>(null);

  // Fetch market bias from backend
  const [marketBias, setMarketBias] = useState<any[]>([]);
  useEffect(() => {
    const fetchBias = () => {
      fetch(`${API}/api/market-bias`).then(r=>r.json()).then(d => {
        if (d.success) setMarketBias(d.data);
      }).catch(()=>{});
    };
    fetchBias();
    const iv = setInterval(fetchBias, 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch performance stats from backend
  const [perfStats, setPerfStats] = useState<any>(null);
  useEffect(() => {
    const fetchPerf = () => {
      fetch(`${API}/api/performance`).then(r=>r.json()).then(d => {
        if (d.success) setPerfStats(d.data.summary);
      }).catch(()=>{});
    };
    fetchPerf();
    const iv = setInterval(fetchPerf, 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch backend signals count
  const [backendSignals, setBackendSignals] = useState<any[]>([]);
  useEffect(() => {
    const fetchSig = () => {
      fetch(`${API}/api/signals?status=active&limit=20`).then(r=>r.json()).then(d => {
        if (d.success) setBackendSignals(d.data);
      }).catch(()=>{});
    };
    fetchSig();
    const iv = setInterval(fetchSig, 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch alerts from backend
  const [backendAlerts, setBackendAlerts] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API}/api/alerts?limit=5`).then(r=>r.json()).then(d => {
      if (d.success) setBackendAlerts(d.data.alerts || []);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const check = () => fetch(`${API}/api/health`).then(r=>r.json()).then(d=>setHealth(d)).catch(()=>setHealth(null));
    check(); const iv = setInterval(check, 30000); return () => clearInterval(iv);
  }, []);

  const mockSM = smartMoneyFeed.length === 0 ? [
    { id:'m1', walletLabel:'Cumberland DRW', direction:'bearish', token:'BTC', usdFormatted:'$4.2M', minutesAgo:12, txType:'sell_pressure' },
    { id:'m2', walletLabel:'Jump Trading', direction:'bullish', token:'ETH', usdFormatted:'$2.8M', minutesAgo:28, txType:'accumulation' },
    { id:'m3', walletLabel:'Wintermute', direction:'bullish', token:'SOL', usdFormatted:'$1.1M', minutesAgo:45, txType:'accumulation' },
  ] : smartMoneyFeed;

  // Use backend performance if available, otherwise use local signal count
  const s = perfStats || { totalSignals: 0, winRate: 0, profitFactor: 0, totalPnl: 0 };
  const totalSig = backendSignals.length || signals.length;
  const displayAlerts = backendAlerts.length > 0 ? backendAlerts : alerts;

  return (
    <div className="space-y-4">
      {/* Ticker bar */}
      <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tickers.map(c => (
            <div key={c.symbol} className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 border-r border-[#1F2937]">
              <span className="text-sm text-[#5A6080]">{c.icon}</span>
              <span className="text-sm font-bold text-white">{c.name}</span>
              <span className="text-sm font-semibold text-white" style={M}>${fp(c.price)}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{...M, color: c.changePct>=0?'#00FFA3':'#FF4D4D', background: c.changePct>=0?'#00FFA3':'#FF4D4D'+'15'}}>
                {c.changePct>=0?'↑':'↓'}{Math.abs(c.changePct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards - connected to backend performance API */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]"><div className="text-xs text-[#5A6080] mb-1">今日訊號</div><div className="text-2xl font-bold text-[#4D9FFF]" style={M}>{totalSig}</div><div className="text-[10px] text-[#3D4560]">每 5 分鐘掃描</div></div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]"><div className="text-xs text-[#5A6080] mb-1">勝率</div><div className="text-2xl font-bold" style={{...M, color: s.winRate >= 50 ? '#00FFA3' : '#FFB800'}}>{s.totalSignals > 0 ? s.winRate + '%' : '—'}</div><div className="text-[10px] text-[#3D4560]">{s.totalSignals > 0 ? `${s.wins}勝/${s.losses}負` : '等待交易記錄'}</div></div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]"><div className="text-xs text-[#5A6080] mb-1">盈利因子</div><div className="text-2xl font-bold text-[#00FFA3]" style={M}>{s.totalSignals > 0 ? s.profitFactor : '—'}</div><div className="text-[10px] text-[#3D4560]">PF = 盈利/虧損</div></div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]"><div className="text-xs text-[#5A6080] mb-1">總損益</div><div className="text-2xl font-bold" style={{...M, color: s.totalPnl >= 0 ? '#00FFA3' : '#FF4D4D'}}>{s.totalSignals > 0 ? (s.totalPnl >= 0 ? '+' : '') + s.totalPnl + '%' : '—'}</div><div className="text-[10px] text-[#3D4560]">模擬交易中</div></div>
      </div>

      {/* Market bias - connected to backend /api/market-bias */}
      <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#8B95B0]">市場偏向</h3>
          <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${binWs?'bg-[#00FFA3] animate-pulse':'bg-[#FF4D4D]'}`}/><span className="text-[10px] text-[#5A6080]">{binWs?'LIVE':'REST'}</span></div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {tickers.map(c => {
            const bias = marketBias.find((b: any) => b.symbol === c.symbol);
            return <CoinCard key={c.symbol} coin={c} bias={bias} />;
          })}
        </div>
      </div>

      {/* Three column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signals */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm text-[#8B95B0]">🎯 最新強訊號</h3><button onClick={()=>navigate('/signals')} className="text-xs text-[#4D9FFF]">查看全部 →</button></div>
          {backendSignals.filter((s:any)=>s.score>=6).length === 0 && signals.filter(s=>s.scoreLabel==='strong').length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4D9FFF]/10 text-[#4D9FFF] text-xs mb-2"><span className="w-2 h-2 rounded-full bg-[#4D9FFF] animate-pulse"/><span>掃描中</span></div>
              <p className="text-xs text-[#3D4560] mt-2">等待符合 13 項條件的強訊號...</p>
            </div>
          ) : (backendSignals.length > 0 ? backendSignals : signals.filter(s=>s.scoreLabel==='strong')).slice(0,3).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0">
              <div className="flex items-center gap-2"><span className="font-bold text-white text-sm" style={M}>{(s.symbol||'').replace('USDT','')}</span><span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:s.direction==='LONG'||s.direction==='long'?'#00FFA3'+'20':'#FF4D4D'+'20',color:s.direction==='LONG'||s.direction==='long'?'#00FFA3':'#FF4D4D'}}>{s.direction==='LONG'||s.direction==='long'?'做多':'做空'}</span></div>
              <div className="text-right"><div className="text-xs text-white" style={M}>${fp(s.entry)}</div><div className="text-[10px] text-[#00FFA3]" style={M}>{s.score}/13</div></div>
            </div>
          ))}
        </div>

        {/* Smart Money */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm text-[#8B95B0]">🐋 聰明錢動向</h3><button onClick={()=>navigate('/smartmoney')} className="text-xs text-[#B76FFF]">查看全部 →</button></div>
          {(mockSM as any[]).map((tx:any) => (
            <div key={tx.id} className="flex items-center gap-2 py-2 border-b border-[#1F2937] last:border-0">
              <span className="text-sm">{tx.direction==='bullish'?'🟢':'🔴'}</span>
              <div className="flex-1 min-w-0"><div className="text-xs text-white truncate">{tx.walletLabel}</div><div className="text-[10px] text-[#5A6080]" style={M}>{tx.direction==='bullish'?'← 囤貨':'→ 賣壓'} 🔗 {tx.token} ({tx.usdFormatted})</div></div>
              <span className="text-[10px] text-[#3D4560]">{tx.minutesAgo}m</span>
            </div>
          ))}
          {smartMoneyFeed.length===0 && <p className="text-[10px] text-[#3D4560] text-center mt-1 italic">示範數據</p>}
        </div>

        {/* Alerts */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm text-[#8B95B0]">🔔 最新警報</h3><button onClick={()=>navigate('/alerts')} className="text-xs text-[#FFB800]">查看全部 →</button></div>
          {nextEvent && <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-lg p-3 mb-3"><div className="text-xs font-bold text-[#FFB800]">📅 {nextEvent.name} — 還有 {nextEvent.days} 天</div><div className="text-[10px] text-[#5A6080]">{nextEvent.date}</div></div>}
          {displayAlerts.filter((a:any)=>!a.dismissed && !a.read).slice(0,3).map((a: any) => {
            const lc = a.level==='A'||a.severity==='high'?'#FF4D4D':a.level==='B'||a.severity==='medium'?'#FFB800':'#4D9FFF';
            return <div key={a.id} className="flex gap-2 py-2 border-b border-[#1F2937] last:border-0"><div className="w-1 rounded" style={{background:lc}}/><div className="min-w-0"><div className="text-xs text-white truncate">{a.title}</div><div className="text-[10px] text-[#5A6080] truncate">{a.message}</div></div></div>;
          })}
          {displayAlerts.length===0 && !nextEvent && <div className="text-center py-6"><span className="text-2xl">🔕</span><p className="text-xs text-[#3D4560] mt-2">暫無警報</p></div>}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg px-4 py-2 flex flex-wrap items-center gap-4">
        <span className="text-[10px] text-[#3D4560] mr-2">系統狀態</span>
        <StatusDot label="Binance WS" active={binWs} />
        <StatusDot label="後端 WS" active={wsConnected} />
        <StatusDot label="PostgreSQL" active={health?.ready === true} />
        <StatusDot label="訊號掃描" active={health?.ready === true} />
        <StatusDot label={`Uptime: ${health?.uptime ? Math.floor(health.uptime/60)+'m' : '??'}`} active={!!health} />
      </div>
    </div>
  );
}
