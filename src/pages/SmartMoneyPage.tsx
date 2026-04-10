import { useAppStore } from '../stores/useAppStore';
import { useBinancePrices } from '../hooks/useBinancePrices';

const M = { fontFamily: "'JetBrains Mono', monospace" } as const;
const MOCK = [
  { id:'m1', walletLabel:'Cumberland DRW', direction:'bearish', token:'BTC', usdValue:4200000, usdFormatted:'$4.2M', minutesAgo:8, txType:'sell_pressure', fromLabel:'Cumberland', toLabel:'Binance' },
  { id:'m2', walletLabel:'Jump Trading', direction:'bullish', token:'ETH', usdValue:2800000, usdFormatted:'$2.8M', minutesAgo:23, txType:'accumulation', fromLabel:'Coinbase', toLabel:'Jump Trading' },
  { id:'m3', walletLabel:'Wintermute', direction:'bullish', token:'SOL', usdValue:1100000, usdFormatted:'$1.1M', minutesAgo:41, txType:'accumulation', fromLabel:'OKX', toLabel:'Wintermute' },
  { id:'m4', walletLabel:'Galaxy Digital', direction:'bearish', token:'BTC', usdValue:6500000, usdFormatted:'$6.5M', minutesAgo:67, txType:'sell_pressure', fromLabel:'Galaxy', toLabel:'Kraken' },
  { id:'m5', walletLabel:'Grayscale', direction:'bullish', token:'ETH', usdValue:3200000, usdFormatted:'$3.2M', minutesAgo:95, txType:'accumulation', fromLabel:'Coinbase', toLabel:'Grayscale' },
];

export default function SmartMoneyPage() {
  const { smartMoneyFeed } = useAppStore();
  const { tickers } = useBinancePrices();
  const feed = smartMoneyFeed.length > 0 ? smartMoneyFeed : MOCK;
  const isReal = smartMoneyFeed.length > 0;

  const consensus = ['BTC','ETH','SOL','BNB','XRP','DOGE'].map(token => {
    const txs = (feed as any[]).filter(t => t.token === token);
    const bull = txs.filter(t => t.direction === 'bullish').reduce((s, t) => s + (t.usdValue || 0), 0);
    const bear = txs.filter(t => t.direction === 'bearish').reduce((s, t) => s + (t.usdValue || 0), 0);
    const total = bull + bear;
    const dir = total === 0 ? 'neutral' : bull > bear * 1.5 ? 'bullish' : bear > bull * 1.5 ? 'bearish' : 'neutral';
    return { token, dir, conf: total > 0 ? Math.min(100, Math.round(Math.max(bull, bear) / total * 100)) : 0 };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">💰 聰明錢追蹤</h1>

      {/* Warning banner */}
      {!isReal && (
        <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <span className="text-xs text-[#FFB800]">目前顯示示範數據 — 需要設定 Etherscan API Key 才能顯示真實鏈上數據</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {consensus.map(c => {
          const color = c.dir === 'bullish' ? '#00FFA3' : c.dir === 'bearish' ? '#FF4D4D' : '#5A6080';
          return (
            <div key={c.token} className="bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-center hover:border-[#2D3748] transition-all">
              <div className="text-sm font-bold text-white">{c.token}</div>
              <div className="text-2xl my-1" style={{ color }}>{c.dir === 'bullish' ? '↑' : c.dir === 'bearish' ? '↓' : '→'}</div>
              <div className="text-xs font-bold" style={{ ...M, color }}>{c.dir === 'bullish' ? '偏多' : c.dir === 'bearish' ? '偏空' : '中立'}</div>
              <div className="text-[10px] text-[#5A6080] mt-1" style={M}>{c.conf}%</div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-[#8B95B0]">🐋 大額交易串流</h3>
          {!isReal && <span className="text-[10px] text-[#FFB800] italic">⚠️ 示範數據</span>}
        </div>
        <div className="space-y-2">
          {(feed as any[]).map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-[#1F2937] last:border-0 hover:bg-[#1F2937]/30 rounded transition-all" style={{ borderLeftWidth: 3, borderLeftColor: tx.direction === 'bullish' ? '#00FFA3' : '#FF4D4D' }}>
              <span className="text-lg pl-2">{tx.direction === 'bullish' ? '🟢' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">🐋 {tx.walletLabel}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{background:(tx.direction==='bullish'?'#00FFA3':'#FF4D4D')+'15',color:tx.direction==='bullish'?'#00FFA3':'#FF4D4D'}}>{tx.direction==='bullish'?'←交易所 吸籌':'→交易所 賣壓'}</span></div>
                <div className="text-xs text-[#5A6080] mt-0.5" style={M}>{tx.token} · {tx.usdFormatted} · {tx.fromLabel||'—'} → {tx.toLabel||'—'}</div>
              </div>
              <div className="text-right pr-2"><div className="text-sm font-bold text-white" style={M}>{tx.usdFormatted}</div><div className="text-[10px] text-[#3D4560]">{tx.minutesAgo}分鐘前</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
