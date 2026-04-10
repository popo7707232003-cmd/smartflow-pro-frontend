import { useWSStatus } from '../hooks/useWebSocket';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://smartflow-pro-backend-production.up.railway.app';

export default function StatusBar() {
  const { backendWS, binanceWS } = useWSStatus();
  const [dbOk, setDbOk] = useState(false);
  const [redisStatus, setRedisStatus] = useState<'connected' | 'fallback' | 'unknown'>('unknown');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        const data = await res.json();
        setDbOk(data.ready === true);
        setRedisStatus(data.redis === true ? 'connected' : 'fallback');
      } catch {
        setDbOk(false);
      }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center gap-5 text-xs text-gray-400 z-50">
      <StatusDot label="敺垢 WS" connected={backendWS} />
      <StatusDot label="Binance WS" connected={binanceWS} />
      <StatusDot label="PostgreSQL" connected={dbOk} />
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${
          redisStatus === 'connected'
            ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
            : 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]'
        }`} />
        <span>Redis {redisStatus === 'fallback' ? '(Fallback)' : ''}</span>
      </div>
      <span className="ml-auto text-gray-600">SmartFlow Pro v1.2</span>
    </div>
  );
}

function StatusDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${
        connected
          ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
          : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
      }`} />
      <span>{label}</span>
    </div>
  );
}

