export function formatAbsTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分鐘前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小時前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export function holdDuration(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

export function remainingTime(ts: number, maxHours: number = 48): { text: string; expired: boolean } {
  const end = ts + maxHours * 3600000;
  const diff = Math.floor((end - Date.now()) / 1000);
  if (diff <= 0) return { text: '已過期', expired: true };
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return { text: `${h}h ${String(m).padStart(2,'0')}m`, expired: false };
}
