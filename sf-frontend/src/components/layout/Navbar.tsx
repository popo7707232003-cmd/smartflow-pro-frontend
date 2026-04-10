import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { useBinancePrices } from '../../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const NAV = [
  { path: '/', label: '儀表板', icon: '◉' },
  { path: '/signals', label: '訊號', icon: '🎯' },
  { path: '/smartmoney', label: '聰明錢', icon: '💰' },
  { path: '/alerts', label: '警報', icon: '🔔' },
  { path: '/portfolio', label: '績效', icon: '📊' },
];

export default function Navbar() {
  const { wsConnected, alerts } = useAppStore();
  const { tickers, connected: binanceWs } = useBinancePrices();
  const btc = tickers.find(t => t.name === 'BTC');
  const unread = alerts.filter(a => !a.dismissed && Date.now() - a.timestamp < 3600000).length;
  const anyConnected = wsConnected || binanceWs;

  return (
    <header className="border-b border-[#1F2937] bg-[#0D1117]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between h-12">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00FFA3] to-[#4D9FFF] flex items-center justify-center text-black font-bold text-xs">⚡</div>
          <span className="font-bold text-white text-base hidden sm:block" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>SmartFlow Pro</span>
          {btc && (
            <span className="text-xs hidden md:flex items-center gap-1 ml-2" style={M}>
              <span className="text-[#5A6080]">BTC</span>
              <span className="text-white">${btc.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span style={{ color: btc.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                {btc.changePct >= 0 ? '▲' : '▼'}{Math.abs(btc.changePct).toFixed(2)}%
              </span>
            </span>
          )}
        </div>
        <nav className="flex gap-0.5 overflow-x-auto">
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}
              className={({ isActive }) =>
                `px-2.5 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive ? 'bg-[#00FFA3]/10 text-[#00FFA3]' : 'text-[#5A6080] hover:text-[#C8CCD8] hover:bg-[#1F2937]'
                }`}>
              <span className="mr-1">{n.icon}</span><span className="hidden sm:inline">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <NavLink to="/alerts" className="relative">
              <span className="text-sm">🔔</span>
              <span className="absolute -top-1 -right-2 bg-[#FF4D4D] text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{unread}</span>
            </NavLink>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${anyConnected ? 'bg-[#00FFA3] animate-pulse' : 'bg-[#FF4D4D]'}`} />
            <span className="text-[10px] text-[#5A6080]">{anyConnected ? 'LIVE' : 'OFF'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
