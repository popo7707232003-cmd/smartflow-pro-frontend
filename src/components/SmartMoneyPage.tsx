import { useSmartMoney } from '../hooks/useSmartMoney';
import Skeleton from './Skeleton';

export default function SmartMoneyPage() {
  const { transactions, bias, source, loading, noApiKey } = useSmartMoney();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-white">聰明錢追蹤</h1>

      {/* No API Key Warning */}
      {noApiKey && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-300 text-sm">
          <p className="font-bold mb-1">⚠ 尚未設定 API Key</p>
          <p>請在 Railway 環境變數加入 <code className="bg-gray-800 px-1 rounded">ETHERSCAN_API_KEY</code> 或 <code className="bg-gray-800 px-1 rounded">WHALE_ALERT_API_KEY</code> 以啟用真實數據。</p>
          <p className="mt-1 text-xs text-yellow-500">Etherscan 免費 API Key 申請：etherscan.io/myapikey</p>
        </div>
      )}

      {/* Bias Card */}
      {loading ? <Skeleton className="h-32" /> : bias && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
          <div className="text-xs text-gray-400 mb-2">聰明錢偏向指標 {source && `(${source})`}</div>
          <div className="flex items-center gap-6">
            <div className={`text-3xl font-bold ${
              bias.bias.includes('BULLISH') ? 'text-green-400' :
              bias.bias.includes('BEARISH') ? 'text-red-400' : 'text-gray-400'
            }`}>
              {bias.bias === 'BULLISH' ? '🟢 看多' :
               bias.bias === 'SLIGHTLY_BULLISH' ? '🟢 偏多' :
               bias.bias === 'BEARISH' ? '🔴 看空' :
               bias.bias === 'SLIGHTLY_BEARISH' ? '🔴 偏空' :
               bias.bias === 'NO_DATA' ? '⚪ 無數據' : '⚪ 中性'}
            </div>
            <div className="flex-1">
              {/* Bias bar */}
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span>空</span>
                <div className="flex-1 bg-gray-700 rounded-full h-3 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30"
                    style={{ width: '100%' }}
                  />
                  <div
                    className="absolute top-0 h-full w-1 bg-white rounded"
                    style={{ left: `${bias.score}%` }}
                  />
                </div>
                <span>多</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>流入交易所：${formatUsd(bias.inflow)}</span>
                <span>流出交易所：${formatUsd(bias.outflow)}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">更新：{new Date(bias.updatedAt).toLocaleString('zh-TW')}</div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 text-sm font-medium text-gray-300">
          大額轉帳記錄（&gt;$500K）
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">暫無交易記錄</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {transactions.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                {/* Sentiment dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  tx.sentiment === 'bullish' ? 'bg-green-500' :
                  tx.sentiment === 'bearish' ? 'bg-red-500' : 'bg-gray-500'
                }`} />

                {/* Direction arrow */}
                <span className="text-lg">
                  {tx.direction === 'exchange_inflow' ? '🏦➡️' :
                   tx.direction === 'exchange_outflow' ? '⬅️🏦' : '🔄'}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">
                      {tx.fromLabel} → {tx.toLabel}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      tx.significance === 'high' ? 'bg-red-900/50 text-red-400' :
                      tx.significance === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {tx.significance === 'high' ? '🔴' : tx.significance === 'medium' ? '🟡' : '🟢'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {tx.token} · ${formatUsd(tx.valueUsd)} ·
                    {tx.direction === 'exchange_inflow' ? ' 流入交易所（偏空）' :
                     tx.direction === 'exchange_outflow' ? ' 流出交易所（偏多）' : ' 機構間轉帳'}
                  </div>
                </div>

                {/* Time */}
                <span className="text-xs text-gray-500 shrink-0">
                  {timeAgo(tx.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatUsd(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins}分前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}時前`;
  return `${Math.floor(hrs / 24)}天前`;
}
