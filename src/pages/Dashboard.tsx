import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useBinancePrices, CoinTicker } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const API = import.meta.env.VITE_API_URL || 'https://smartflow-pro-backend-production.up.railway.app';

function fp(p: number) {
  return p >= 10000 ? p.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(3) : p.toFixed(5);
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#00FFA3]' : 'bg-[#FF4D4D]'}`} />
      <span className="text-[10px] text-[#5A6080]">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { tickers, connected: binWs } = useBinancePrices();
  const { signals, smartMoneyFeed, alerts, wsConnected } = useAppStore();
  const navigate = useNavigate();
  const [health, setHealth] = useState<any>(null);
  const [marketBias, setMarketBias] = useState<any[]>([]);
  const [perfStats, setPerfStats] = useState<any>(null);
  const [backendSignals, setBackendSignals] = useState<any[]>([]);
  const [backendAlerts, setBackendAlerts] = useState<any[]>([]);
  const [smartMoneyData, setSmartMoneyData] = useState<any>(null);

  useEffect(() => {
    const f = () => fetch(API + '/api/market-bias').then(r => r.json()).then(d => { if (d.success) setMarketBias(d.data); }).catch(() => {});
    f(); const iv = setInterval(f, 30000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const f = () => fetch(API + '/api/performance').then(r => r.json()).then(d => { if (d.success) setPerfStats(d.data.summary); }).catch(() => {});
    f(); const iv = setInterval(f, 30000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const f = () => fetch(API + '/api/signals?limit=20').then(r => r.json()).then(d => { if (d.success) setBackendSignals(d.data || []); }).catch(() => {});
    f(); const iv = setInterval(f, 30000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch(API + '/api/alerts?limit=10').then(r => r.json()).then(d => { if (d.success) setBackendAlerts(d.data.alerts || []); }).catch(() => {});
    const iv = setInterval(() => {
      fetch(API + '/api/alerts?limit=10').then(r => r.json()).then(d => { if (d.success) setBackendAlerts(d.data.alerts || []); }).catch(() => {});
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch(API + '/api/smart-money').then(r => r.json()).then(d => { if (d.success) setSmartMoneyData(d.data); }).catch(() => {});
    const iv = setInterval(() => {
      fetch(API + '/api/smart-money').then(r => r.json()).then(d => { if (d.success) setSmartMoneyData(d.data); }).catch(() => {});
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const c = () => fetch(API + '/api/health').then(r => r.json()).then(d => setHealth(d)).catch(() => setHealth(null));
    c(); const iv = setInterval(c, 30000); return () => clearInterval(iv);
  }, []);

  const s = perfStats || { totalSignals: 0, winRate: 0, profitFactor: 0, totalPnl: 0, wins: 0, losses: 0, activeSignals: 0 };
  const totalSig = backendSignals.length || signals.length;

  // Smart money: use backend data if available, else mock
  const smTransactions = smartMoneyData?.transactions?.length > 0 ? smartMoneyData.transactions.slice(0, 3).map((tx: any) => ({
    id: tx.id,
    walletLabel: tx.fromLabel || 'Unknown',
    direction: tx.sentiment === 'bullish' ? 'bullish' : tx.sentiment === 'bearish' ? 'bearish' : 'neutral',
    token: tx.token,
    usdFormatted: tx.valueUsd >= 1e6 ? (tx.valueUsd / 1e6).toFixed(1) + 'M' : (tx.valueUsd / 1e3).toFixed(0) + 'K',
    minutesAgo: Math.floor((Date.now() - new Date(tx.timestamp).getTime()) / 60000),
  })) : (smartMoneyFeed.length > 0 ? smartMoneyFeed : [
    { id: 'm1', walletLabel: 'Cumberland DRW', direction: 'bearish', token: 'BTC', usdFormatted: '4.2M', minutesAgo: 12 },
    { id: 'm2', walletLabel: 'Jump Trading', direction: 'bullish', token: 'ETH', usdFormatted: '2.8M', minutesAgo: 28 },
    { id: 'm3', walletLabel: 'Wintermute', direction: 'bullish', token: 'SOL', usdFormatted: '1.1M', minutesAgo: 45 },
  ]);
  const isSmartMoneyReal = smartMoneyData?.transactions?.length > 0;

  // Alerts: use backend alerts if available
  const displayAlerts = backendAlerts.length > 0 ? backendAlerts : alerts;

  // Economic events for countdown
  const EVENTS = [
    { name: 'NFP', date: '2026-05-01', level: 'A' },
    { name: 'FOMC', date: '2026-05-06', level: 'A' },
    { name: 'CPI', date: '2026-05-13', level: 'A' },
    { name: 'PPI', date: '2026-05-15', level: 'B' },
    { name: 'PCE', date: '2026-04-30', level: 'A' },
    { name: 'GDP', date: '2026-05-28', level: 'B' },
    { name: 'Jobless Claims', date: '2026-04-17', level: 'B' },
    { name: 'ISM PMI', date: '2026-05-01', level: 'B' },
  ];
  const now = Date.now();
  const futureEvents = EVENTS.map(e => ({ ...e, ts: new Date(e.date).getTime() })).filter(e => e.ts > now).sort((a, b) => a.ts - b.ts);
  const nextEvent = futureEvents.length ? { ...futureEvents[0], days: Math.ceil((futureEvents[0].ts - now) / 86400000) } : null;

  return (
    <div className="space-y-4">
      {/* Ticker Bar */}
      <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tickers.map(c => (
            <div key={c.symbol} className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 border-r border-[#1F2937]">
              <span className="text-sm text-[#5A6080]">{c.icon}</span>
              <span className="text-sm font-bold text-white">{c.name}</span>
              <span className="text-sm font-semibold text-white" style={M}>{'$'}{fp(c.price)}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ ...M, color: c.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                {c.changePct >= 0 ? '+' : ''}{c.changePct.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]">
          <div className="text-xs text-[#5A6080] mb-1">今日訊號</div>
          <div className="text-2xl font-bold text-[#4D9FFF]" style={M}>{totalSig}</div>
          <div className="text-[10px] text-[#3D4560]">每 5 分鐘掃描</div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]">
          <div className="text-xs text-[#5A6080] mb-1">勝率</div>
          <div className="text-2xl font-bold" style={{ ...M, color: s.winRate >= 50 ? '#00FFA3' : '#FFB800' }}>
            {s.totalSignals > 0 ? s.winRate + '%' : '—'}
          </div>
          <div className="text-[10px] text-[#3D4560]">{s.totalSignals > 0 ? s.wins + '勝 / ' + s.losses + '負' : '等待交易記錄'}</div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]">
          <div className="text-xs text-[#5A6080] mb-1">盈利因子</div>
          <div className="text-2xl font-bold text-[#00FFA3]" style={M}>
            {s.totalSignals > 0 ? s.profitFactor : '—'}
          </div>
          <div className="text-[10px] text-[#3D4560]">{s.totalSignals > 0 ? '盈利/虧損比' : '等待交易記錄'}</div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px]">
          <div className="text-xs text-[#5A6080] mb-1">總損益</div>
          <div className="text-2xl font-bold" style={{ ...M, color: s.totalPnl >= 0 ? '#00FFA3' : '#FF4D4D' }}>
            {s.totalSignals > 0 ? (s.totalPnl >= 0 ? '+' : '') + s.totalPnl + '%' : '—'}
          </div>
          <div className="text-[10px] text-[#3D4560]">{s.totalSignals > 0 ? '累計績效' : '等待交易記錄'}</div>
        </div>
      </div>

      {/* Market Bias */}
      <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#8B95B0]">市場偏向</h3>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${binWs ? 'bg-[#00FFA3] animate-pulse' : 'bg-[#FF4D4D]'}`} />
            <span className="text-[10px] text-[#5A6080]">{binWs ? 'LIVE' : 'REST'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {tickers.map(c => {
            const bias = marketBias.find((b: any) => b.symbol === c.symbol);
            const dir = bias?.overall || 'WAIT';
            const color = dir === 'LONG' ? '#00FFA3' : dir === 'SHORT' ? '#FF4D4D' : '#5A6080';
            return (
              <div key={c.symbol} className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{c.icon} {c.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: color + '20', color }}>{dir}</span>
                </div>
                <div className="text-lg font-bold text-white" style={M}>{'$'}{fp(c.price)}</div>
                <div className="text-xs font-bold" style={{ color: c.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                  {c.changePct >= 0 ? '+' : ''}{c.changePct.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Three Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signals */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#8B95B0]">🎯 最新強訊號</h3>
            <button onClick={() => navigate('/signals')} className="text-xs text-[#4D9FFF]">查看全部 →</button>
          </div>
          {backendSignals.length > 0 ? backendSignals.filter((sig: any) => sig.status === 'active').slice(0, 3).map((sig: any) => (
            <div key={sig.id} className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm" style={M}>{(sig.symbol || '').replace('USDT', '')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: (sig.direction === 'LONG' ? '#00FFA3' : '#FF4D4D') + '20', color: sig.direction === 'LONG' ? '#00FFA3' : '#FF4D4D' }}>
                  {sig.direction === 'LONG' ? '做多' : '做空'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-white" style={M}>{'$'}{fp(parseFloat(sig.entry))}</div>
                <div className="text-[10px] text-[#00FFA3]" style={M}>{sig.score}/13</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-xs text-[#3D4560]">目前無符合條件的訊號</div>
          )}
        </div>

        {/* Smart Money */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#8B95B0]">🐋 聰明錢動向</h3>
            <button onClick={() => navigate('/smartmoney')} className="text-xs text-[#B76FFF]">查看全部 →</button>
          </div>
          {(smTransactions as any[]).map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-2 py-2 border-b border-[#1F2937] last:border-0">
              <span className="text-sm">{tx.direction === 'bullish' ? '🟢' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{tx.walletLabel}</div>
                <div className="text-[10px] text-[#5A6080]">{tx.token} {'$'}{tx.usdFormatted}</div>
              </div>
              <span className="text-[10px] text-[#3D4560]">{tx.minutesAgo}m</span>
            </div>
          ))}
          {!isSmartMoneyReal && <p className="text-[10px] text-[#3D4560] text-center mt-1 italic">示範數據</p>}
        </div>

        {/* Alerts */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#8B95B0]">🔔 最新警報</h3>
            <button onClick={() => navigate('/alerts')} className="text-xs text-[#FFB800]">查看全部 →</button>
          </div>
          {nextEvent && (
            <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-lg p-3 mb-3">
              <div className="text-xs font-bold text-[#FFB800]">{'📅 '}{nextEvent.name}{' — 還有 '}{nextEvent.days}{' 天'}</div>
              <div className="text-[10px] text-[#5A6080]">{nextEvent.date}</div>
            </div>
          )}
          {/* Show upcoming events within 30 days */}
          {futureEvents.slice(1, 4).map((ev, i) => {
            const days = Math.ceil((ev.ts - now) / 86400000);
            const lc = days <= 3 ? '#FF4D4D' : days <= 7 ? '#FFB800' : '#4D9FFF';
            return (
              <div key={i} className="flex gap-2 py-1.5 border-b border-[#1F2937] last:border-0">
                <div className="w-1 rounded" style={{ background: lc }} />
                <div className="min-w-0">
                  <div className="text-xs text-white">{ev.name} — {days}天</div>
                  <div className="text-[10px] text-[#5A6080]">{ev.date}</div>
                </div>
              </div>
            );
          })}
          {displayAlerts.filter((a: any) => !a.dismissed && !a.read).slice(0, 2).map((a: any) => (
            <div key={a.id} className="flex gap-2 py-1.5 border-b border-[#1F2937] last:border-0">
              <div className="w-1 rounded" style={{ background: a.severity === 'high' || a.level === 'A' ? '#FF4D4D' : '#FFB800' }} />
              <div className="min-w-0">
                <div className="text-xs text-white truncate">{a.title}</div>
                <div className="text-[10px] text-[#5A6080] truncate">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg px-4 py-2 flex flex-wrap items-center gap-4">
        <span className="text-[10px] text-[#3D4560] mr-2">系統狀態</span>
        <StatusDot label="Binance WS" active={binWs} />
        <StatusDot label="後端 WS" active={wsConnected} />
        <StatusDot label="PostgreSQL" active={health?.ready === true} />
        <StatusDot label="訊號掃描" active={health?.ready === true} />
      </div>
    </div>
  );
}
