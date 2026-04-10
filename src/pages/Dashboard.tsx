import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useBinancePrices, CoinTicker } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;

// Economic calendar events
const UPCOMING_EVENTS = [
  { name: 'FOMC', date: '2026-05-06', level: 'A', desc: 'Fed Rate Decision' },
  { name: 'CPI', date: '2026-05-13', level: 'A', desc: 'Consumer Price Index' },
  { name: 'NFP', date: '2026-05-02', level: 'A', desc: 'Non-Farm Payrolls' },
  { name: 'GDP', date: '2026-04-30', level: 'B', desc: 'Q1 GDP Advance' },
];

function getNextEvent() {
  const now = Date.now();
  const future = UPCOMING_EVENTS.map(e => ({ ...e, ts: new Date(e.date).getTime() }))
    .filter(e => e.ts > now).sort((a, b) => a.ts - b.ts);
  if (!future.length) return null;
  const days = Math.ceil((future[0].ts - now) / 86400000);
  return { ...future[0], days };
}

function formatPrice(p: number) {
  if (p >= 10000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(3);
  return p.toFixed(5);
}

function PriceCell({ coin }: { coin: CoinTicker }) {
  const isUp = coin.changePct >= 0;
  const color = isUp ? '#00FFA3' : '#FF4D4D';
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 border-r border-[#1F2937]">
      <span className="text-sm text-[#5A6080]">{coin.icon}</span>
      <span className="text-sm font-bold text-white">{coin.name}</span>
      <span className="text-sm font-semibold text-white" style={M}>${formatPrice(coin.price)}</span>
      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ ...M, color, background: color + '15' }}>
        {isUp ? '▲' : '▼'}{Math.abs(coin.changePct).toFixed(2)}%
      </span>
    </div>
  );
}

function MetricCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[150px] hover:border-[#2D3748] transition-all duration-200 group">
      <div className="text-xs text-[#5A6080] mb-1.5">{label}</div>
      <div className="text-2xl font-bold transition-all duration-300 group-hover:scale-105" style={{ ...M, color }}>{value}</div>
      {sub && <div className="text-[10px] text-[#3D4560] mt-1">{sub}</div>}
    </div>
  );
}

function CoinCard({ coin }: { coin: CoinTicker }) {
  const isUp = coin.changePct >= 0;
  const biasColor = coin.bias === 'bullish' ? '#00FFA3' : coin.bias === 'bearish' ? '#FF4D4D' : '#5A6080';
  const biasIcon = coin.bias === 'bullish' ? '↑' : coin.bias === 'bearish' ? '↓' : '→';
  const biasLabel = coin.bias === 'bullish' ? 'LONG' : coin.bias === 'bearish' ? 'SHORT' : 'WAIT';
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3.5 hover:border-[#2D3748] transition-all min-w-[140px] flex-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{coin.icon}</span>
          <span className="text-sm font-bold text-white">{coin.name}</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: biasColor + '20', color: biasColor }}>{biasLabel}</span>
      </div>
      <div className="text-lg font-bold text-white mb-1" style={M}>${formatPrice(coin.price)}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ ...M, color: isUp ? '#00FFA3' : '#FF4D4D' }}>
          {isUp ? '+' : ''}{coin.changePct.toFixed(2)}%
        </span>
        <span className="text-[10px] text-[#3D4560]" style={M}>{coin.confidence}%</span>
      </div>
      <div className="text-2xl mt-1 text-center" style={{ color: biasColor }}>{biasIcon}</div>
    </div>
  );
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
  const { tickers, connected: binanceConnected } = useBinancePrices();
  const { signals, smartMoneyFeed, alerts, wsConnected, backendStatus } = useAppStore();
  const navigate = useNavigate();
  const nextEvent = getNextEvent();

  const strongSignals = signals.filter(s => s.scoreLabel === 'strong').slice(0, 3);
  const recentSM = smartMoneyFeed.slice(0, 5);
  const recentAlerts = alerts.filter(a => !a.dismissed).slice(0, 5);

  // Mock smart money data when empty
  const mockSM = recentSM.length === 0 ? [
    { id: 'm1', walletLabel: 'Cumberland DRW', direction: 'bearish', token: 'BTC', usdFormatted: '$4.2M', minutesAgo: 12, txType: 'sell_pressure' },
    { id: 'm2', walletLabel: 'Jump Trading', direction: 'bullish', token: 'ETH', usdFormatted: '$2.8M', minutesAgo: 28, txType: 'accumulation' },
    { id: 'm3', walletLabel: 'Wintermute', direction: 'bullish', token: 'SOL', usdFormatted: '$1.1M', minutesAgo: 45, txType: 'accumulation' },
  ] : recentSM;

  return (
    <div className="space-y-4">
      {/* Live Ticker Bar */}
      <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tickers.map(coin => <PriceCell key={coin.symbol} coin={coin} />)}
          {tickers.length === 0 && <div className="px-4 py-2 text-xs text-[#3D4560] animate-pulse">Loading prices from Binance...</div>}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-wrap gap-3">
        <MetricCard label="今日訊號" value={String(signals.length)} color="#4D9FFF" sub="每 5 分鐘掃描" />
        <MetricCard label="勝率" value="—" color="#FFB800" sub="等待交易紀錄" />
        <MetricCard label="盈虧因子" value="—" color="#00FFA3" sub="PF = 盈利/虧損" />
        <MetricCard label="總損益" value="—" color="#00FFA3" sub="模擬交易中" />
      </div>

      {/* Market Bias */}
      <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#8B95B0]">市場偏向</h3>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${binanceConnected ? 'bg-[#00FFA3] animate-pulse' : 'bg-[#FF4D4D]'}`} />
            <span className="text-[10px] text-[#5A6080]">{binanceConnected ? 'LIVE' : 'REST'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {tickers.map(coin => <CoinCard key={coin.symbol} coin={coin} />)}
        </div>
      </div>

      {/* Three panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signals */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#8B95B0]">🎯 最新強訊號</h3>
            <button onClick={() => navigate('/signals')} className="text-xs text-[#4D9FFF] hover:text-[#6DB5FF]">查看全部 →</button>
          </div>
          {strongSignals.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4D9FFF]/10 text-[#4D9FFF] text-xs mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#4D9FFF] animate-pulse" />
                掃描中
              </div>
              <p className="text-xs text-[#3D4560] mt-2">系統每 5 分鐘掃描市場</p>
              <p className="text-xs text-[#3D4560]">等待符合 13 項條件的進場機會...</p>
            </div>
          ) : strongSignals.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm" style={M}>{s.symbol.replace('USDT', '')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: s.direction === 'long' ? '#00FFA3' : '#FF4D4D', color: '#000' }}>
                  {s.direction === 'long' ? '多' : '空'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-white" style={M}>${formatPrice(s.entry)}</div>
                <div className="text-[10px] text-[#00FFA3]" style={M}>{s.score}/13 R:R {s.rr}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Smart Money */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#8B95B0]">💰 聰明錢動向</h3>
            <button onClick={() => navigate('/smartmoney')} className="text-xs text-[#B76FFF] hover:text-[#D09FFF]">查看全部 →</button>
          </div>
          {mockSM.map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-2 py-2 border-b border-[#1F2937] last:border-0">
              <span className="text-sm">{tx.direction === 'bullish' ? '🟢' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">🐋 {tx.walletLabel}</div>
                <div className="text-[10px] text-[#5A6080]" style={M}>
                  {tx.direction === 'bullish' ? '←交易所 吸籌' : '→交易所 賣壓'} · {tx.token} · {tx.usdFormatted}
                </div>
              </div>
              <span className="text-[10px] text-[#3D4560]">{tx.minutesAgo}m</span>
            </div>
          ))}
          {recentSM.length === 0 && <p className="text-[10px] text-[#3D4560] text-center mt-1 italic">示範數據 · 等待真實大額交易</p>}
        </div>

        {/* Alerts */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-[#8B95B0]">🔔 最新警報</h3>
            <button onClick={() => navigate('/alerts')} className="text-xs text-[#FFB800] hover:text-[#FFD060]">查看全部 →</button>
          </div>
          {nextEvent && (
            <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">⏰</span>
                <div>
                  <div className="text-xs font-bold text-[#FFB800]">{nextEvent.name} — 還有 {nextEvent.days} 天</div>
                  <div className="text-[10px] text-[#5A6080]">{nextEvent.desc} · {nextEvent.date}</div>
                </div>
              </div>
            </div>
          )}
          {recentAlerts.length === 0 && !nextEvent && (
            <div className="text-center py-6">
              <span className="text-2xl">✅</span>
              <p className="text-xs text-[#3D4560] mt-2">目前沒有重要警報</p>
            </div>
          )}
          {recentAlerts.map(a => {
            const lc = a.level === 'A' ? '#FF4D4D' : a.level === 'B' ? '#FFB800' : '#4D9FFF';
            return (
              <div key={a.id} className="flex gap-2 py-2 border-b border-[#1F2937] last:border-0">
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

      {/* System Status Bar */}
      <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg px-4 py-2 flex flex-wrap items-center gap-4">
        <span className="text-[10px] text-[#3D4560] mr-2">系統狀態</span>
        <StatusDot label="Binance WS" active={binanceConnected} />
        <StatusDot label="後端 WS" active={wsConnected} />
        <StatusDot label="PostgreSQL" active={backendStatus.pg} />
        <StatusDot label="訊號掃描" active={backendStatus.scanner} />
        <StatusDot label="新聞抓取" active={backendStatus.news} />
      </div>
    </div>
  );
}
