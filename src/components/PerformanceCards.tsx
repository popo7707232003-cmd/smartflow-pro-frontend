import { usePerformance } from '../hooks/useSignals';

export default function PerformanceCards() {
  const { data, loading } = usePerformance(30000);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const s = data?.summary || {
    totalSignals: 0, activeSignals: 0, wins: 0, losses: 0,
    winRate: 0, profitFactor: 0, totalPnl: 0, avgWin: 0, avgLoss: 0, partials: 0
  };

  const cards = [
    {
      label: '總訊號',
      value: `${s.totalSignals}`,
      sub: `${s.activeSignals} 進行中`,
      color: 'text-blue-400'
    },
    {
      label: '勝率',
      value: s.totalSignals > 0 ? `${s.winRate}%` : '—',
      sub: `${s.wins}W / ${s.losses}L`,
      color: s.winRate >= 50 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: '盈虧因子',
      value: s.totalSignals > 0 ? `${s.profitFactor}` : '—',
      sub: `平均盈 ${s.avgWin.toFixed(1)}% / 虧 ${s.avgLoss.toFixed(1)}%`,
      color: s.profitFactor >= 1.5 ? 'text-green-400' : s.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'
    },
    {
      label: '累計損益',
      value: `${s.totalPnl >= 0 ? '+' : ''}${s.totalPnl.toFixed(2)}%`,
      sub: `${s.partials} 部分獲利`,
      color: s.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          <div className="text-xs text-gray-500 mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
