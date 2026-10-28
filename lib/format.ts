export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (currency === 'IDR') {
    if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}K`;
    return `${sign}Rp ${abs.toFixed(0)}`;
  }
  const sym: Record<string, string> = { USD: '$', SGD: 'S$', GBP: '£', MYR: 'RM' };
  const s = sym[currency] ?? currency + ' ';
  if (abs >= 1_000_000) return `${sign}${s}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${s}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${s}${abs.toFixed(2)}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(num: number): string {
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}

export const MONTHS_2026 = [
  '2026-01','2026-02','2026-03','2026-04','2026-05','2026-06',
  '2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'
];

export const MONTH_LABELS: Record<string, string> = {
  '2026-01': 'Jan', '2026-02': 'Feb', '2026-03': 'Mar', '2026-04': 'Apr',
  '2026-05': 'May', '2026-06': 'Jun', '2026-07': 'Jul', '2026-08': 'Aug',
  '2026-09': 'Sep', '2026-10': 'Oct', '2026-11': 'Nov', '2026-12': 'Dec'
};

export const MONTH_FULL_LABELS: Record<string, string> = {
  '2026-01': 'January 2026', '2026-02': 'February 2026', '2026-03': 'March 2026',
  '2026-04': 'April 2026', '2026-05': 'May 2026', '2026-06': 'June 2026',
  '2026-07': 'July 2026', '2026-08': 'August 2026', '2026-09': 'September 2026',
  '2026-10': 'October 2026', '2026-11': 'November 2026', '2026-12': 'December 2026'
};

// ─── WEEKLY GRANULARITY ───
// Monday-starting weeks for 2026. Each week is assigned to the month that
// contains its Thursday (ISO-8601 convention), so weeks group cleanly under
// a single month even when they straddle a month boundary.
export interface Week2026 {
  key: string;        // e.g. "2026-W41"
  month: string;      // e.g. "2026-10"
  startISO: string;   // "2026-10-05"
  endISO: string;     // "2026-10-11"
  rangeLabel: string; // short header, e.g. "5–11" or "29 Sep–5 Oct"
  fullLabel: string;  // e.g. "Oct 5 – Oct 11"
  dropdownLabel: string; // e.g. "W41 · Oct 5 – Oct 11"
}

const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildWeeks(year: number): Week2026[] {
  const weeks: Week2026[] = [];
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dow = jan1.getUTCDay(); // 0 Sun .. 6 Sat
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(jan1);
  monday.setUTCDate(jan1.getUTCDate() + toMonday);
  let idx = 1;
  for (let i = 0; i < 60; i++) {
    const start = new Date(monday);
    const end = new Date(monday); end.setUTCDate(start.getUTCDate() + 6);
    const thu = new Date(start); thu.setUTCDate(start.getUTCDate() + 3);
    const ty = thu.getUTCFullYear();
    if (ty > year) break;
    if (ty === year) {
      const mi = thu.getUTCMonth();
      const month = `${year}-${String(mi + 1).padStart(2, '0')}`;
      const key = `${year}-W${String(idx).padStart(2, '0')}`;
      const sd = start.getUTCDate(), ed = end.getUTCDate();
      const sm = start.getUTCMonth(), em = end.getUTCMonth();
      const rangeLabel = sm === em ? `${sd}–${ed}` : `${sd} ${MONTHS_ABBR[sm]}–${ed} ${MONTHS_ABBR[em]}`;
      const fullLabel = `${MONTHS_ABBR[sm]} ${sd} – ${MONTHS_ABBR[em]} ${ed}`;
      weeks.push({
        key, month,
        startISO: start.toISOString().slice(0, 10),
        endISO: end.toISOString().slice(0, 10),
        rangeLabel, fullLabel,
        dropdownLabel: `${key.slice(5)} · ${fullLabel}`,
      });
      idx++;
    }
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return weeks;
}

export const WEEKS_2026: Week2026[] = buildWeeks(2026);

export function weeksForMonth(month: string): Week2026[] {
  return WEEKS_2026.filter((w) => w.month === month);
}

// Suggested default exchange rates to IDR (editable per entry).
export const CURRENCY_RATES: Record<string, number> = {
  IDR: 1, USD: 17200, SGD: 13800, GBP: 22000, MYR: 4450,
};
