// src/utils/format.ts

/** Format price with appropriate decimal places */
export function formatPrice(p: number | null | undefined): string {
  if (p == null) return '—';
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  if (p < 10) return `$${p.toFixed(3)}`;
  if (p < 1000) return `$${p.toFixed(2)}`;
  return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format large USD values (e.g. $2.5M) */
export function formatUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/** Format percentage */
export function formatPct(v: number, showSign = true): string {
  const sign = showSign && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

/** Format timestamp to HH:mm:ss */
export function formatTime(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Format "X minutes ago" */
export function formatAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return '剛才';
  if (mins < 60) return `${mins}分鐘前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小時前`;
  return `${Math.floor(hrs / 24)}天前`;
}

/** Color for direction */
export function directionColor(dir: 'long' | 'short' | string): string {
  return dir === 'long' ? '#00FFA3' : '#FF4D4D';
}

/** Color for signal grade */
export function gradeColor(grade: 'strong' | 'medium' | 'weak' | string): string {
  if (grade === 'strong') return '#00FFA3';
  if (grade === 'medium') return '#FFB800';
  return '#FF4D4D';
}

/** Color for news level */
export function levelColor(level: 'A' | 'B' | 'C' | string): string {
  if (level === 'A') return '#FF4D4D';
  if (level === 'B') return '#FFB800';
  return '#4D9FFF';
}
