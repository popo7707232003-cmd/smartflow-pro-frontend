// pages/AlertsPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../utils/api';

const M: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

interface CalendarEvent {
  name: string; date: string; importance: number;
  category: string; affectedAssets: string[]; description: string;
}

export default function AlertsPage() {
  const { alerts, dismissAlert } = useAppStore();
  const [tab, setTab] = useState<'all' | 'unread' | 'history'>('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    api.getHealth().then(() => {
      // Try to load calendar events
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/calendar?days=7`)
        .then(r => r.json())
        .then(d => { if (d.data) setEvents(d.data); })
        .catch(() => {});
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = [...alerts];
    if (tab === 'unread') list = list.filter(a => !a.dismissed);
    if (tab === 'history') list = list.filter(a => a.dismissed || Date.now() - a.timestamp > 3600_000);
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [alerts, tab]);

  const levelColor = (l: string) => l === 'A' ? '#FF4D4D' : l === 'B' ? '#FFB800' : '#4D9FFF';
  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">🔔 警報中心</h1>

      {/* Event Timeline */}
      {events.length > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <h3 className="text-sm text-[#5A6080] mb-3">📅 未來 7 天重要事件</h3>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-4 min-w-[600px] relative py-4">
              {/* Timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1F2937]" />

              {events.map((evt, i) => {
                const d = new Date(evt.date);
                const color = evt.importance >= 3 ? '#FF4D4D' : '#FFB800';
                const isHovered = hoveredEvent === evt;
                return (
                  <div key={i} className="relative flex flex-col items-center min-w-[80px]"
                    onMouseEnter={() => setHoveredEvent(evt)}
                    onMouseLeave={() => setHoveredEvent(null)}>
                    {/* Date */}
                    <div className="text-[10px] text-[#5A6080] mb-2" style={M}>
                      {d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Taipei' })}
                    </div>
                    {/* Dot */}
                    <div className={`w-4 h-4 rounded-full border-2 z-10 transition-transform ${isHovered ? 'scale-150' : ''}`}
                      style={{ background: color, borderColor: color + '60' }} />
                    {/* Label */}
                    <div className="text-[10px] text-center mt-2 max-w-[80px] leading-tight"
                      style={{ color }}>{evt.name}</div>
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 bg-[#1F2937] border border-[#2D3748] rounded-lg p-3 z-50 w-52 shadow-xl">
                        <div className="text-xs font-bold text-white mb-1">{evt.name}</div>
                        <div className="text-[10px] text-[#5A6080]" style={M}>
                          {d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-[#5A6080] mt-1">{'⭐'.repeat(evt.importance)} {evt.description}</div>
                        <div className="text-[10px] mt-1" style={{ color }}>
                          影響：{evt.affectedAssets.map(a => a.replace('USDT', '')).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1F2937] pb-2">
        {(['all', 'unread', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === t ? 'bg-[#FFB800]/15 text-[#FFB800]' : 'text-[#5A6080] hover:text-white'
            }`}>
            {t === 'all' ? `全部 (${alerts.length})` :
             t === 'unread' ? `未讀 (${alerts.filter(a => !a.dismissed).length})` : '歷史'}
          </button>
        ))}
      </div>

      {/* Alert stream */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map(a => {
          const lc = levelColor(a.level);
          const isA = a.level === 'A';
          return (
            <div key={a.id}
              className={`bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden transition ${
                a.dismissed ? 'opacity-50' : ''
              }`}
              style={{
                borderLeftWidth: 4, borderLeftColor: lc,
                animation: isA && !a.dismissed ? 'pulse 2s 3' : undefined,
              }}>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: lc + '20', color: lc }}>
                        {a.level}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F2937] text-[#5A6080]">
                        {a.source}
                      </span>
                      <span className="text-sm font-bold text-white">{a.title}</span>
                    </div>
                    <p className="text-xs text-[#C8CCD8] mt-1.5 whitespace-pre-line">{a.message}</p>
                    {a.actionSuggestion && (
                      <p className="text-xs mt-2 px-2 py-1 rounded bg-[#FFB800]/10 text-[#FFB800]">
                        💡 {a.actionSuggestion}
                      </p>
                    )}
                    {a.affectedSymbols.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {a.affectedSymbols.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F2937] text-[#5A6080]" style={M}>
                            {s.replace('USDT', '')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-[#3D4560]" style={M}>{fmtTime(a.timestamp)}</span>
                    {!a.dismissed && (
                      <button onClick={() => dismissAlert(a.id)}
                        className="text-[10px] text-[#5A6080] hover:text-white">已讀</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#3D4560]">
            <div className="text-4xl mb-3">🔔</div>
            <p>尚無警報</p>
          </div>
        )}
      </div>
    </div>
  );
}
