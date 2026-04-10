import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;

const CALENDAR = [
  { name:'NFP 非農', date:'2026-05-01', level:'A', desc:'Non-Farm Payrolls', action:'數據公布前 30 分鐘縮小倉位' },
  { name:'FOMC 利率決議', date:'2026-05-06', level:'A', desc:'Fed Rate Decision + Dot Plot', action:'建議暫停交易，等方向明確後再操作' },
  { name:'CPI 通膨', date:'2026-05-13', level:'A', desc:'Consumer Price Index', action:'高波動預期，設緊止損' },
  { name:'PPI 生產者物價', date:'2026-05-15', level:'B', desc:'Producer Price Index', action:'留意數據偏離預期的幅度' },
  { name:'GDP 初值', date:'2026-05-29', level:'B', desc:'Q1 GDP Advance', action:'觀察經濟動能' },
  { name:'FOMC 利率決議', date:'2026-06-17', level:'A', desc:'FOMC + SEP Projections', action:'季度預測更新，可能大幅波動' },
  { name:'NFP 非農', date:'2026-06-05', level:'A', desc:'May Non-Farm Payrolls', action:'就業數據影響降息預期' },
];

function getDaysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function AlertsPage() {
  const { alerts, dismissAlert } = useAppStore();
  const [tab, setTab] = useState('all');

  const upcoming = CALENDAR.filter(e => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 30)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filtered = tab === 'unread' ? alerts.filter(a => !a.dismissed) : tab === 'history' ? alerts.filter(a => a.dismissed) : alerts;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">🔔 警報中心</h1>

      {/* Calendar Timeline */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-4">📅 即將到來的重要事件</h3>
        <div className="overflow-x-auto">
          <div className="flex items-start gap-4 min-w-[600px] pb-2 relative">
            <div className="absolute top-5 left-0 right-0 h-px bg-[#1F2937]" />
            {upcoming.slice(0, 7).map((evt, i) => {
              const days = getDaysUntil(evt.date);
              const color = evt.level === 'A' ? '#FF4D4D' : '#FFB800';
              return (
                <div key={i} className="relative flex flex-col items-center min-w-[100px] group cursor-pointer">
                  <div className="text-[10px] text-[#5A6080] mb-2" style={M}>
                    {days === 0 ? '今天' : days === 1 ? '明天' : `+${days}天`}
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 z-10 group-hover:scale-150 transition-transform" style={{ background: color, borderColor: color + '60' }} />
                  <div className="text-[11px] text-center mt-2 font-bold" style={{ color }}>{evt.name}</div>
                  <div className="text-[10px] text-[#3D4560] text-center">{evt.date.slice(5)}</div>
                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute top-full mt-2 bg-[#1F2937] border border-[#2D3748] rounded-lg p-3 z-50 w-48 shadow-xl">
                    <div className="text-xs font-bold text-white mb-1">{evt.name}</div>
                    <div className="text-[10px] text-[#5A6080]">{evt.desc}</div>
                    <div className="text-[10px] mt-2 px-2 py-1 rounded bg-[#FFB800]/10 text-[#FFB800]">💡 {evt.action}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert Tabs */}
      <div className="flex gap-2 border-b border-[#1F2937] pb-2">
        {[['all','全部'],['unread','未讀'],['history','歷史']].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === k ? 'bg-[#FFB800]/15 text-[#FFB800]' : 'text-[#5A6080] hover:text-white'}`}>
            {v} {k === 'all' ? `(${alerts.length})` : k === 'unread' ? `(${alerts.filter(a => !a.dismissed).length})` : ''}
          </button>
        ))}
      </div>

      {/* Alert Stream */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
            <span className="text-3xl">✅</span>
            <p className="text-sm text-[#5A6080] mt-3">目前沒有觸發的警報</p>
            <p className="text-xs text-[#3D4560] mt-1">系統監控中：新聞 · 經濟日曆 · 聰明錢 · 風險指標</p>
          </div>
        )}
        {filtered.map(a => {
          const lc = a.level === 'A' ? '#FF4D4D' : a.level === 'B' ? '#FFB800' : '#4D9FFF';
          return (
            <div key={a.id} className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden hover:border-[#2D3748] transition-all" style={{ borderLeftWidth: 4, borderLeftColor: lc, opacity: a.dismissed ? 0.5 : 1 }}>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: lc + '20', color: lc }}>{a.level === 'A' ? '🔴 重要' : a.level === 'B' ? '🟡 注意' : '🔵 參考'}</span>
                      <span className="text-xs font-bold text-white">{a.title}</span>
                    </div>
                    <p className="text-xs text-[#C8CCD8] mt-1">{a.message}</p>
                    {a.actionSuggestion && <p className="text-xs mt-1.5 px-2 py-1 rounded bg-[#FFB800]/10 text-[#FFB800]">💡 {a.actionSuggestion}</p>}
                  </div>
                  {!a.dismissed && <button onClick={() => dismissAlert(a.id)} className="text-[10px] text-[#5A6080] hover:text-white flex-shrink-0">已讀</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
