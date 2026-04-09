// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

// ═══ WS URL 自動偵測 ═══
// Vercel 部署：VITE_WS_URL = wss://your-backend.up.railway.app/ws
// 本地開發：自動用 ws://localhost:4000/ws
function getWsUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;

  // Auto-detect: same host as API, /ws path
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    return url.toString();
  }

  return 'ws://localhost:4000/ws';
}

const MAX_RETRY = 20;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const { setWsConnected, addSignal, addSmartMoneyTx, addAlert, setBtcPrice } = useAppStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const url = getWsUrl();

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        retryRef.current = 0;
        console.log('[WS] Connected to', url);
      };
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
              if (msg.level === 'A' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('SmartFlow Pro 🔴', { body: msg.data?.title || 'Alert' });
              }
              break;
            case 'PRICE_UPDATE':
              if (msg.data?.symbol === 'BTCUSDT') setBtcPrice(msg.data.price);
              break;
          }
        } catch {}
      };
    } catch { retry(); }
  }, [setWsConnected, addSignal, addSmartMoneyTx, addAlert, setBtcPrice]);

  const retry = useCallback(() => {
    if (retryRef.current >= MAX_RETRY) return;
    retryRef.current++;
    setTimeout(connect, Math.min(retryRef.current * 2000, 30000));
  }, [connect]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);
}

function playBeep(freq: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  } catch {}
}
