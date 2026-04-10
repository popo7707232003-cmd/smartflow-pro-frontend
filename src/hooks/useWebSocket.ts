import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';

function getWsUrl(): string {
  const e = import.meta.env.VITE_WS_URL;
  if (e) return e;
  const api = import.meta.env.VITE_API_URL;
  if (api) { const u = new URL(api); u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'; u.pathname = '/ws'; return u.toString(); }
  return 'ws://localhost:4000/ws';
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const { setWsConnected, addSignal, addSmartMoneyTx, addAlert, setBackendStatus } = useAppStore();

  useEffect(() => {
    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      try {
        const ws = new WebSocket(getWsUrl());
        wsRef.current = ws;
        ws.onopen = () => { setWsConnected(true); retryRef.current = 0; setBackendStatus({ binance: true }); };
        ws.onclose = () => { setWsConnected(false); retry(); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            switch (msg.type) {
              case 'SIGNAL_UPDATE': addSignal(msg.data); break;
              case 'SMART_MONEY_ALERT': addSmartMoneyTx(msg.data); break;
              case 'NEWS_ALERT_A': case 'NEWS_ALERT_B': case 'EVENT_WARNING': case 'RISK_WARNING':
                addAlert({ ...msg.data, type: msg.type, level: msg.level || 'C', timestamp: msg.timestamp });
                if (msg.data?.soundEnabled) playBeep(msg.level === 'A' ? 660 : 880);
                if (msg.level === 'A' && 'Notification' in window && Notification.permission === 'granted')
                  new Notification('SmartFlow Pro', { body: msg.data?.title || 'Alert' });
                break;
            }
          } catch {}
        };
      } catch { retry(); }
    }
    function retry() { if (retryRef.current >= 15) return; retryRef.current++; setTimeout(connect, Math.min(retryRef.current * 2000, 30000)); }
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

    // Check backend health
    const apiUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${apiUrl}/api/health`).then(r => r.json()).then(d => {
      if (d.ready) setBackendStatus({ pg: true, scanner: true, news: true });
    }).catch(() => {});

    connect();
    return () => { wsRef.current?.close(); };
  }, []);
}

function playBeep(freq: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.12);
  } catch {}
}
