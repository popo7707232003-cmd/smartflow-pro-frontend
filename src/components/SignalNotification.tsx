import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;

interface Notif { id: string; type: string; message: string; detail: string; color: string; icon: string; winRate?: number; pnlPct?: number; timestamp: number; }

export default function SignalNotification() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const { wsConnected } = useAppStore();

  const dismiss = useCallback((id: string) => setNotifs(p => p.filter(n => n.id !== id)), []);

  // Listen for WS messages via store — hook into raw WS events
  useEffect(() => {
    function handler(e: MessageEvent) {
      try {
        const msg = JSON.parse(e.data);
        let n: Notif | null = null;
        const d = msg.data || {};
        if (msg.type === 'SIGNAL_TP1') {
          n = { id: d.signalId + '-tp1', type: 'tp1', message: `✅ TP1 觸發！${d.symbol} ${d.direction === 'long' ? '做多' : '做空'}`, detail: `+${d.pnlPct}% · 已平倉50% · 止損移至成本`, color: '#00FFA3', icon: '✅', pnlPct: d.pnlPct, timestamp: Date.now() };
          playSound(800);
        } else if (msg.type === 'SIGNAL_TP2') {
          n = { id: d.signalId + '-tp2', type: 'tp2', message: `🎯 完整止盈！${d.symbol}`, detail: `+${d.pnlPct}% · 勝率 ${d.winRate}%`, color: '#00cc82', icon: '🎯', winRate: d.winRate, pnlPct: d.pnlPct, timestamp: Date.now() };
          playSound(1000);
        } else if (msg.type === 'SIGNAL_SL') {
          n = { id: d.signalId + '-sl', type: 'sl', message: `❌ 止損 ${d.symbol}`, detail: `${d.pnlPct}% · 勝率 ${d.winRate}%`, color: '#FF4D4D', icon: '❌', winRate: d.winRate, pnlPct: d.pnlPct, timestamp: Date.now() };
          playSound(400);
        }
        if (n) {
          setNotifs(p => [n!, ...p].slice(0, 3));
          if ('Notification' in window && Notification.permission === 'granted') new Notification('SmartFlow Pro', { body: n.message });
          setTimeout(() => dismiss(n!.id), 10000);
        }
      } catch {}
    }
    // Attach to existing WS
    const wsUrl = import.meta.env.VITE_WS_URL || '';
    if (!wsUrl) return;
    // We'll use a custom event approach
    const orig = window.addEventListener;
    window.addEventListener('sf-ws-message', ((e: CustomEvent) => handler(e.detail)) as EventListener);
    return () => window.removeEventListener('sf-ws-message', handler as any);
  }, [dismiss]);

  if (notifs.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[9999] space-y-2 max-w-sm">
      {notifs.map(n => (
        <div key={n.id} className="bg-[#111827] border rounded-lg p-4 shadow-2xl animate-[slideIn_0.3s_ease]" style={{ borderColor: n.color, borderLeftWidth: 4 }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white">{n.message}</div>
              <div className="text-xs text-[#C8CCD8] mt-1" style={M}>{n.detail}</div>
            </div>
            <button onClick={() => dismiss(n.id)} className="text-[#5A6080] hover:text-white text-xs">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function playSound(freq: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start(); o.stop(ctx.currentTime + 0.15);
  } catch {}
}
