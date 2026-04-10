import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';

// ===== Connection Status Store =====
interface WSStatusState {
  backendWS: boolean;
  binanceWS: boolean;
  setBackendWS: (v: boolean) => void;
  setBinanceWS: (v: boolean) => void;
}

export const useWSStatus = create<WSStatusState>((set) => ({
  backendWS: false,
  binanceWS: false,
  setBackendWS: (v) => set({ backendWS: v }),
  setBinanceWS: (v) => set({ binanceWS: v }),
}));

// ===== Backend WS Hook =====
const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL
  || (import.meta.env.VITE_API_URL || 'https://smartflow-pro-backend-production.up.railway.app')
    .replace(/^http/, 'ws') + '/ws';

export function useBackendWebSocket(onTicker?: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxDelay = 30000;
  const baseDelay = 1000;
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const { setBackendWS, setBinanceWS } = useWSStatus();

  const connect = useCallback(() => {
    if (!isMounted.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    try {
      const ws = new WebSocket(BACKEND_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Backend WS] Connected');
        reconnectAttempts.current = 0;
        setBackendWS(true);

        // Start heartbeat ping every 25s
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status') {
            setBinanceWS(msg.binanceConnected === true);
          } else if (msg.type === 'ticker' && onTicker) {
            onTicker(msg.data);
          } else if (msg.type === 'prices' && onTicker) {
            // Batch price update
            if (msg.data && typeof msg.data === 'object') {
              Object.values(msg.data).forEach((p: any) => onTicker(p));
            }
          }
          // pong is handled silently
        } catch {}
      };

      ws.onerror = () => {
        // error fires before close, just log
      };

      ws.onclose = () => {
        console.log('[Backend WS] Disconnected');
        setBackendWS(false);
        setBinanceWS(false);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        scheduleReconnect();
      };
    } catch {
      scheduleReconnect();
    }
  }, [setBackendWS, setBinanceWS, onTicker]);

  const scheduleReconnect = useCallback(() => {
    if (!isMounted.current) return;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), maxDelay);
    reconnectAttempts.current++;
    console.log(`[Backend WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
    reconnectTimerRef.current = setTimeout(() => connect(), delay);
  }, [connect]);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}

// ===== Direct Binance WS Hook (fallback if backend WS is down) =====
const BINANCE_WS_BASE = 'wss://data-stream.binance.vision/stream?streams=';
const SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'dogeusdt'];

export function useBinanceDirectWS(onTicker: (data: any) => void, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!isMounted.current || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const streams = SYMBOLS.map(s => `${s}@ticker`).join('/');
    const ws = new WebSocket(BINANCE_WS_BASE + streams);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      useWSStatus.getState().setBinanceWS(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.data) onTicker(msg.data);
      } catch {}
    };

    ws.onclose = () => {
      useWSStatus.getState().setBinanceWS(false);
      if (!isMounted.current || !enabled) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      setTimeout(() => connect(), delay);
    };

    ws.onerror = () => {};
  }, [onTicker, enabled]);

  useEffect(() => {
    isMounted.current = true;
    if (enabled) connect();
    return () => {
      isMounted.current = false;
      wsRef.current?.close();
    };
  }, [connect, enabled]);
}

