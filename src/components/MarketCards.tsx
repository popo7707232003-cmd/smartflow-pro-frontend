import Skeleton from './Skeleton';

// ===== Market Bias Card =====
// Used in Dashboard - shows symbol, bias direction, 24h change with arrow
interface MarketBiasProps {
  symbol: string;
  bias: 'LONG' | 'SHORT' | 'WAIT';
  confidence?: 'high' | 'medium' | 'low';
  change24h: number; // percentage
  price: number;
  loading?: boolean;
}

export function MarketBiasCard({ symbol, bias, confidence, change24h, price, loading }: MarketBiasProps) {
  if (loading) return <Skeleton className="h-24" />;

  const isUp = change24h >= 0;
  const arrow = isUp ? '↑' : '↓';
  const changeColor = isUp ? 'text-green-400' : 'text-red-400';
  const biasColor = bias === 'LONG' ? 'text-green-400' : bias === 'SHORT' ? 'text-red-400' : 'text-gray-400';
  const biasBg = bias === 'LONG' ? 'bg-green-900/20 border-green-800/50' :
                 bias === 'SHORT' ? 'bg-red-900/20 border-red-800/50' :
                 'bg-gray-800 border-gray-700';

  return (
    <div className={`rounded-lg border p-3 ${biasBg}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-white">{symbol}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${biasColor} ${
          bias === 'LONG' ? 'bg-green-900/40' : bias === 'SHORT' ? 'bg-red-900/40' : 'bg-gray-700'
        }`}>
          {bias === 'LONG' ? '↗ 做多' : bias === 'SHORT' ? '↘ 做空' : '⏸ 觀望'}
        </span>
      </div>
      <div className="text-lg font-mono text-white">
        ${price < 1 ? price.toFixed(4) : price < 100 ? price.toFixed(2) : price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-sm font-medium ${changeColor}`}>
          {arrow} {isUp ? '+' : ''}{change24h.toFixed(2)}%
        </span>
        {confidence && (
          <span className="text-xs text-gray-500">
            信心：{confidence === 'high' ? '高' : confidence === 'medium' ? '中' : '低'}
          </span>
        )}
      </div>
    </div>
  );
}

// ===== Signal Score Bar =====
// Color: ≤5 red, 6-9 yellow, ≥10 green
interface ScoreBarProps {
  score: number;
  maxScore?: number;
}

export function SignalScoreBar({ score, maxScore = 13 }: ScoreBarProps) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color = score <= 5 ? 'bg-red-500' : score <= 9 ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = score <= 5 ? 'text-red-400' : score <= 9 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${textColor} w-10 text-right`}>
        {score}/{maxScore}
      </span>
    </div>
  );
}

// ===== Signal Card (complete) =====
interface SignalCardProps {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  score: number;
  maxScore: number;
  scoreDetails?: Record<string, number>;
  rsi: number;
  rr: number;
  status: string;
  tp1Hit?: boolean;
  pnlPercent?: number | null;
  createdAt: string;
  source?: 'backend' | 'frontend';
}

export function SignalCard({
  symbol, direction, entry, tp1, tp2, sl, score, maxScore,
  scoreDetails, rsi, rr, status, tp1Hit, pnlPercent, createdAt, source
}: SignalCardProps) {
  const isLong = direction === 'LONG';
  const dirColor = isLong ? 'text-green-400' : 'text-red-400';
  const dirBg = isLong ? 'border-green-800/50' : 'border-red-800/50';
  const fmt = (v: number) => v < 1 ? v.toFixed(5) : v < 100 ? v.toFixed(3) : v.toFixed(2);
  const age = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
  const ageText = age < 60 ? `${age}分鐘前` : age < 1440 ? `${Math.round(age / 60)}小時前` : `${Math.round(age / 1440)}天前`;

  return (
    <div className={`bg-gray-800 border ${dirBg} rounded-lg p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{symbol.replace('USDT', '')}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            isLong ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
          }`}>
            {direction}
          </span>
          {status !== 'active' && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              status === 'closed' && pnlPercent && pnlPercent > 0 ? 'bg-green-900/40 text-green-400' :
              status === 'closed' ? 'bg-red-900/40 text-red-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {status === 'closed' ? (pnlPercent && pnlPercent > 0 ? '✅ 已平倉' : '❌ 已止損') : '⏰ 已過期'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {source === 'frontend' && <span className="bg-yellow-900/30 text-yellow-500 px-1.5 py-0.5 rounded">前端計算</span>}
          {tp1Hit && <span className="bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">TP1 ✓</span>}
          <span>{ageText}</span>
        </div>
      </div>

      {/* Score Bar */}
      <SignalScoreBar score={score} maxScore={maxScore} />

      {/* Score Details */}
      {scoreDetails && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(scoreDetails).map(([k, v]) => (
            <span key={k} className={`text-xs px-1.5 py-0.5 rounded ${
              v === 1 ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-700 text-gray-500'
            }`}>
              {k}
            </span>
          ))}
        </div>
      )}

      {/* Levels */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-gray-500">進場</span>
          <div className="text-white font-mono">{fmt(entry)}</div>
        </div>
        <div>
          <span className="text-green-500">TP1 (50%)</span>
          <div className="text-green-400 font-mono">{fmt(tp1)}</div>
        </div>
        <div>
          <span className="text-green-500">TP2 (全平)</span>
          <div className="text-green-400 font-mono">{fmt(tp2)}</div>
        </div>
        <div>
          <span className="text-red-500">SL</span>
          <div className="text-red-400 font-mono">{fmt(sl)}</div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>RSI {rsi?.toFixed(1)}</span>
        <span>R:R {rr?.toFixed(2)}</span>
        {pnlPercent != null && (
          <span className={pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}>
            PnL: {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}
