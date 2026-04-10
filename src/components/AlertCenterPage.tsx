import { useState } from 'react';
import { useAlerts, useEconomicCalendar, AlertItem } from '../hooks/useSmartMoney';
import Skeleton from './Skeleton';

const SEVERITY_CONFIG = {
  high: { emoji: '🔴', label: '高', bg: 'bg-red-900/30 border-red-800', text: 'text-red-400' },
  medium: { emoji: '🟡', label: '中', bg: 'bg-yellow-900/30 border-yellow-800', text: 'text-yellow-400' },
  low: { emoji: '🟢', label: '低', bg: 'bg-green-900/30 border-green-800', text: 'text-green-400' },
};

const TYPE_LABELS: Record<string, string> = {
  news: '📰 新聞',
  economic: '📅 經濟事件',
  price_spike: '💥 價格異動',
  rsi_extreme: '📊 RSI 極值',
  whale: '🐋 鯨魚',
};

export default function AlertCenterPage() {
  const { alerts, counts, loading, markRead } = useAlerts();
  const { events, loading: calLoading } = useEconomicCalendar();
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter || a.type === filter);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-white">警報中心</h1>

      {/* Summary counters */}
      <div className="flex gap-3">
        {(['all', 'high', 'medium', 'low'] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilter(sev)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === sev
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {sev === 'all' ? '全部' : SEVERITY_CONFIG[sev].emoji + ' ' + SEVERITY_CONFIG[sev].label}
            <span className="ml-1.5 text-xs opacity-70">
              {sev === 'all' ? alerts.length : counts[sev] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Economic Calendar Timeline */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-300 mb-3">📅 經濟日曆</h2>
        {calLoading ? <Skeleton className="h-20" /> : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.filter(e => !e.isPast).slice(0, 10).map((e, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm px-3 py-2 rounded ${
                e.daysUntil <= 1 ? 'bg-red-900/20 border border-red-800/50' :
                e.daysUntil <= 3 ? 'bg-yellow-900/20 border border-yellow-800/50' :
                'bg-gray-700/30'
              }`}>
                <span className={`text-xs font-mono w-16 shrink-0 ${
                  e.impact === 'high' ? 'text-red-400' :
                  e.impact === 'medium' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {e.daysUntil <= 0 ? '今天' :
                   e.daysUntil < 1 ? `${Math.round(e.daysUntil * 24)}h` :
                   `${Math.round(e.daysUntil)}天`}
                </span>
                <span className="text-white flex-1">{e.name}</span>
                <span className="text-xs text-gray-500">{e.date}</span>
                <span className="text-xs">
                  {e.impact === 'high' ? '🔴' : e.impact === 'medium' ? '🟡' : '🟢'}
                </span>
              </div>
            ))}
            {events.filter(e => !e.isPast).length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4">近期無經濟事件</div>
            )}
          </div>
        )}
      </div>

      {/* Alert List */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 text-sm font-medium text-gray-300">
          最近警報
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {filter === 'all' ? '暫無警報 — 系統每60秒自動檢查' : '此分類無警報'}
          </div>
        ) : (
          <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
            {filtered.map(alert => (
              <AlertRow key={alert.id} alert={alert} onRead={markRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert, onRead }: { alert: AlertItem; onRead: (id: number) => void }) {
  const sev = SEVERITY_CONFIG[alert.severity];
  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 text-sm cursor-pointer hover:bg-gray-700/50 transition-colors ${
        alert.read ? 'opacity-50' : ''
      }`}
      onClick={() => !alert.read && onRead(alert.id)}
    >
      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border ${sev.bg} ${sev.text}`}>
        {sev.emoji} {sev.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium">{alert.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{alert.message}</div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{TYPE_LABELS[alert.type] || alert.type}</span>
          <span>·</span>
          <span>{new Date(alert.createdAt).toLocaleString('zh-TW')}</span>
        </div>
      </div>
      {!alert.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
    </div>
  );
}
