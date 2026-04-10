import { useBinancePrices } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function PortfolioPage() {
  const { tickers } = useBinancePrices();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">📊 績效日誌</h1>

      <div className="flex flex-wrap gap-3">
        {[['總損益','—','#00FFA3'],['勝率','—','#FFB800'],['盈虧因子','—','#4D9FFF'],['最大回撤','—','#FF4D4D'],['平均持倉','—','#B76FFF'],['本月報酬','—','#00FFA3']].map(([l,v,c]) => (
          <div key={l} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex-1 min-w-[130px]">
            <div className="text-[11px] text-[#5A6080] mb-1">{l}</div>
            <div className="text-xl font-bold" style={{ ...M, color: c as string }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">📈</div>
        <p className="text-sm text-[#5A6080]">累計損益曲線</p>
        <p className="text-xs text-[#3D4560] mt-2">系統正在收集交易紀錄</p>
        <p className="text-xs text-[#3D4560]">當第一筆訊號觸發 TP 或 SL 後，績效數據會自動更新</p>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-3">📋 交易紀錄</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-b-2 border-[#1F2937]">
                {['幣種','方向','入場價','結果','損益%','評分','時間'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-[11px] text-[#5A6080]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={7} className="text-center py-8 text-[#3D4560] text-sm">尚無交易紀錄 · 等待訊號觸及止盈或止損</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Market overview */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm text-[#8B95B0] mb-3">🌍 即時市場概覽</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {tickers.map(t => (
            <div key={t.symbol} className="bg-[#0A0E1A] rounded-lg p-3 text-center">
              <div className="text-xs text-[#5A6080]">{t.icon} {t.name}</div>
              <div className="text-sm font-bold text-white mt-1" style={M}>${t.price >= 1000 ? t.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : t.price.toFixed(2)}</div>
              <div className="text-xs font-bold mt-0.5" style={{ ...M, color: t.changePct >= 0 ? '#00FFA3' : '#FF4D4D' }}>
                {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
