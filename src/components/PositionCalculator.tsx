// components/PositionCalculator.tsx
import { useAppStore } from '../stores/useAppStore';

const M = { fontFamily: "'JetBrains Mono',monospace" };

export default function PositionCalculator({ entry, sl, onClose }: { entry: number; sl: number; onClose: () => void }) {
  const { accountBalance, riskPct, setAccountBalance, setRiskPct } = useAppStore();

  const riskAmt = accountBalance * riskPct / 100;
  const slDist = Math.abs(entry - sl);
  const posSize = slDist > 0 ? riskAmt / slDist : 0;
  const posValue = posSize * entry;
  const leverage = Math.min(10, Math.max(1, Math.ceil(posValue / (accountBalance || 1))));
  const margin = posValue / leverage;

  return (
    <div className="border-t border-[#1F2937] bg-[#0A0E1A] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-white">⚖️ 倉位計算器</span>
        <button onClick={onClose} className="text-[#5A6080] hover:text-white text-lg">✕</button>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs text-[#5A6080] mb-1">
            <span>帳戶資金</span>
            <span className="text-white" style={M}>${accountBalance.toLocaleString()}</span>
          </div>
          <input type="range" min="1000" max="100000" step="1000" value={accountBalance}
            onChange={e => setAccountBalance(+e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #00FFA3 ${(accountBalance - 1000) / 990}%, #1F2937 0%)` }} />
          <div className="flex justify-between text-[10px] text-[#3D4560] mt-0.5"><span>$1K</span><span>$100K</span></div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#5A6080] mb-1">
            <span>單筆風險</span>
            <span className="text-[#FFB800]" style={M}>{riskPct}%</span>
          </div>
          <input type="range" min="0.5" max="3" step="0.5" value={riskPct}
            onChange={e => setRiskPct(+e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #FFB800 ${(riskPct - 0.5) / 2.5 * 100}%, #1F2937 0%)` }} />
          <div className="flex justify-between text-[10px] text-[#3D4560] mt-0.5"><span>0.5%</span><span>3%</span></div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111827] rounded-lg p-3">
          <div className="text-[10px] text-[#5A6080] mb-1">建議倉位</div>
          <div className="text-lg font-bold text-white" style={M}>{posSize.toFixed(posSize < 1 ? 4 : 2)}</div>
          <div className="text-[10px] text-[#5A6080]" style={M}>≈ ${posValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-[#111827] rounded-lg p-3">
          <div className="text-[10px] text-[#5A6080] mb-1">最大虧損</div>
          <div className="text-lg font-bold text-[#FF4D4D]" style={M}>${riskAmt.toFixed(0)}</div>
          <div className="text-[10px] text-[#5A6080]">帳戶的 {riskPct}%</div>
        </div>
        <div className="bg-[#111827] rounded-lg p-3">
          <div className="text-[10px] text-[#5A6080] mb-1">建議槓桿</div>
          <div className="text-lg font-bold text-[#FFB800]" style={M}>{leverage}x</div>
          <div className="text-[10px] text-[#5A6080]">上限 10x</div>
        </div>
        <div className="bg-[#111827] rounded-lg p-3">
          <div className="text-[10px] text-[#5A6080] mb-1">所需保證金</div>
          <div className="text-lg font-bold text-[#4D9FFF]" style={M}>${margin.toFixed(0)}</div>
          <div className="text-[10px] text-[#5A6080]">= 倉位值 / 槓桿</div>
        </div>
      </div>
    </div>
  );
}
