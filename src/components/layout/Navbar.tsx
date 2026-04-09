// components/layout/Navbar.tsx
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

const NAV = [
  { path: '/', label: '儀表板', icon: '◉' },
  { path: '/signals', label: '訊號', icon: '🎯' },
  { path: '/smartmoney', label: '聰明錢', icon: '💰' },
  { path: '/alerts', label: '警報', icon: '🔔' },
  { path: '/portfolio', label: '績效', icon: '📊' },
];

export default function Navbar() {
  const { wsConnected, alerts, btcPrice } = useAppStore();
  const unread = alerts.filter(a => !a.dismissed && Date.now() - a.timestamp < 3600_000).length;

  return (
    <header className="border-b border-[#1F2937] bg-[#111827]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between h-12">
        {/* Left: Logo + BTC */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFA3] to-[#4D9FFF] flex items-center justify-center text-black font-bold text-sm">⚡</div>
          <span className="font-bold text-[#F0F2F8] text-lg hidden sm:block" style={{ fontFamily: "'Inter',sans-serif" }}>SmartFlow Pro</span>
          {btcPrice > 0 && (
            <span className="text-xs text-[#5A6080] ml-2 hidden md:block" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              BTC ${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>

        {/* Center: Nav */}
        <nav className="flex gap-1 overflow-x-auto">
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}
              className={({ isActive }) =>
                `px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition whitespace-nowrap ${
                  isActive ? 'bg-[#00FFA3]/10 text-[#00FFA3]' : 'text-[#5A6080] hover:text-[#C8CCD8] hover:bg-[#1F2937]'
                }`
              }>
              <span className="mr-1">{n.icon}</span>
              <span className="hidden sm:inline">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Status */}
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <NavLink to="/alerts" className="relative">
              <span className="text-sm">🔔</span>
              <span className="absolute -top-1 -right-2 bg-[#FF4D4D] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
            </NavLink>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#00FFA3] animate-pulse' : 'bg-[#FF4D4D]'}`} />
            <span className="text-[10px] text-[#5A6080] hidden md:block">{wsConnected ? 'LIVE' : 'OFF'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
