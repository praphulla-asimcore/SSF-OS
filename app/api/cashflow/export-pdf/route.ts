export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { formatCurrency, weeksForMonth, WEEKS_2026, MONTH_FULL_LABELS } from '@/lib/format';
import { generatePdfFromHtml } from '@/lib/pdf-generation';

const GOLD = '#D4A843';
const WEEK_BY_KEY = new Map(WEEKS_2026.map((w) => [w.key, w]));
const CURRENCY_ORDER = ['IDR', 'SGD', 'MYR', 'USD', 'GBP'];

interface Row {
  id: string; description: string; project: string; invoiceRef: string;
  amount: number; currency: string; rate: number;
  periodMonth: string; periodWeek: string | null; categoryId: string;
  bankAccount: { name: string; entity: string } | null;
}

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function entryWeekKey(e: Row): string {
  if (e.periodWeek && WEEK_BY_KEY.has(e.periodWeek)) return e.periodWeek;
  return weeksForMonth(e.periodMonth)[0]?.key ?? '';
}

const idr = (e: Row) => (e.amount ?? 0) * (e.rate ?? 1);

/** Sum amounts per original currency → "Rp 12.0M<br>S$ 3.2K" */
function byCurrency(rows: Row[]): string {
  if (!rows.length) return '<span class="dash">–</span>';
  const sums = new Map<string, number>();
  rows.forEach((r) => sums.set(r.currency, (sums.get(r.currency) ?? 0) + (r.amount ?? 0)));
  return Array.from(sums.entries())
    .sort((a, b) => CURRENCY_ORDER.indexOf(a[0]) - CURRENCY_ORDER.indexOf(b[0]))
    .map(([c, v]) => `<div>${esc(formatCurrency(v, c))}</div>`)
    .join('');
}

function logoDataUri(): string {
  for (const p of ['public/ssf-logo.png', 'public/brand/ssf-logo.png']) {
    try {
      const buf = fs.readFileSync(path.join(process.cwd(), p));
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch { /* try next */ }
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const month: string = typeof body?.month === 'string' ? body.month : '';
    const entity: string | undefined = body?.entity && body.entity !== 'All' ? String(body.entity) : undefined;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month (expected YYYY-MM)' }, { status: 400 });
    }

    const weeks = weeksForMonth(month);
    const weekKeys = weeks.map((w) => w.key);

    const [categories, raw] = await Promise.all([
      prisma.cashflowCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.cashflowEntry.findMany({
        where: {
          OR: [{ periodMonth: month }, { periodWeek: { in: weekKeys } }],
          ...(entity ? { bankAccount: { entity } } : {}),
        },
        include: { bankAccount: { select: { name: true, entity: true } }, category: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Keep only entries whose effective week belongs to this month (mirrors the ledger UI).
    const entries = (raw as unknown as Row[]).filter((e) => weekKeys.includes(entryWeekKey(e)));

    const catType = new Map(categories.map((c) => [c.id, c.type]));
    const sumType = (type: string, wk?: string) =>
      entries.filter((e) => catType.get(e.categoryId) === type && (!wk || entryWeekKey(e) === wk)).reduce((s, e) => s + idr(e), 0);

    const totalIn = sumType('INFLOW');
    const totalOut = sumType('OUTFLOW');
    const net = totalIn - totalOut;

    const colCount = weeks.length + 2;

    const renderSection = (title: string, type: 'INFLOW' | 'OUTFLOW') => {
      const cats = categories.filter((c) => c.type === type);
      const cls = type === 'INFLOW' ? 'in' : 'out';
      let html = `<tr class="section ${cls}"><td colspan="${colCount}">${esc(title)}</td></tr>`;
      cats.forEach((cat) => {
        const catEntries = entries.filter((e) => e.categoryId === cat.id);
        html += `<tr class="cat${catEntries.length ? '' : ' empty'}"><td class="label">${esc(cat.name)}${catEntries.length ? ` <span class="count">(${catEntries.length})</span>` : ''}</td>`;
        weeks.forEach((w) => { html += `<td class="num">${byCurrency(catEntries.filter((e) => entryWeekKey(e) === w.key))}</td>`; });
        html += `<td class="num month">${byCurrency(catEntries)}</td></tr>`;
        catEntries.forEach((e) => {
          const meta = [e.project, e.invoiceRef, e.bankAccount?.name].filter(Boolean).map((s) => esc(s as string)).join(' · ');
          html += `<tr class="entry"><td class="label"><div class="desc">${esc(e.description)}</div>${meta ? `<div class="meta">${meta}</div>` : ''}</td>`;
          const wk = entryWeekKey(e);
          weeks.forEach((w) => { html += `<td class="num">${w.key === wk ? esc(formatCurrency(e.amount, e.currency)) : ''}</td>`; });
          html += `<td class="num month">${esc(formatCurrency(e.amount, e.currency))}</td></tr>`;
        });
      });
      html += `<tr class="total ${cls}"><td class="label">Total ${esc(title)} <span class="count">(IDR eq.)</span></td>`;
      weeks.forEach((w) => { const v = sumType(type, w.key); html += `<td class="num">${v ? esc(formatCurrency(v, 'IDR')) : '–'}</td>`; });
      html += `<td class="num month">${esc(formatCurrency(sumType(type), 'IDR'))}</td></tr>`;
      return html;
    };

    const netRow = (() => {
      let html = `<tr class="net"><td class="label">Net Cash Flow <span class="count">(IDR eq.)</span></td>`;
      weeks.forEach((w) => {
        const v = sumType('INFLOW', w.key) - sumType('OUTFLOW', w.key);
        html += `<td class="num ${v < 0 ? 'neg' : 'pos'}">${esc(formatCurrency(v, 'IDR'))}</td>`;
      });
      html += `<td class="num month ${net < 0 ? 'neg' : 'pos'}">${esc(formatCurrency(net, 'IDR'))}</td></tr>`;
      return html;
    })();

    const periodLabel = MONTH_FULL_LABELS[month] ?? month;
    const generated = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    });
    const logo = logoDataUri();

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SSF Cashflow ${esc(month)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm 12mm 16mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1f; font-size: 9px; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { height: 34px; }
  .company { font-size: 10px; letter-spacing: 3px; font-weight: 700; color: #1a1a1f; }
  .title { font-size: 18px; font-weight: 800; letter-spacing: 1.5px; color: ${GOLD}; margin-top: 2px; }
  .meta-right { text-align: right; font-size: 9px; color: #555; line-height: 1.6; }
  .meta-right strong { color: #1a1a1f; }
  .divider { height: 3px; background: ${GOLD}; margin: 10px 0 12px; border-radius: 2px; }
  .kpis { display: flex; gap: 10px; margin-bottom: 12px; }
  .kpi { flex: 1; border: 1px solid #e6e1d3; border-top: 3px solid ${GOLD}; border-radius: 6px; padding: 8px 12px; background: #fdfbf6; }
  .kpi .lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #777; }
  .kpi .val { font-size: 16px; font-weight: 800; margin-top: 3px; }
  .kpi .sub { font-size: 8px; color: #999; margin-top: 1px; }
  .green { color: #138a4b; } .red { color: #c0392b; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #1a1a1f; color: #fff; font-weight: 600; padding: 6px 6px; text-align: right; font-size: 8.5px; border-bottom: 2px solid ${GOLD}; }
  th.label { text-align: left; }
  th .wk { display: block; color: ${GOLD}; font-size: 7.5px; letter-spacing: 1px; margin-top: 1px; }
  th.month { background: ${GOLD}; color: #1a1a1f; }
  td { padding: 4px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.label { width: 26%; }
  td.num { text-align: right; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; white-space: nowrap; }
  td.month { background: #fbf6e9; font-weight: 700; }
  .dash { color: #c8c8c8; }
  .count { color: #999; font-weight: 400; font-size: 8px; }
  tr.section td { font-weight: 800; text-transform: uppercase; letter-spacing: 1.4px; font-size: 9px; padding-top: 10px; border-bottom: 1.5px solid ${GOLD}; }
  tr.section.in td { color: #138a4b; } tr.section.out td { color: #c0392b; }
  tr.cat td { font-weight: 600; background: #fafafa; }
  tr.cat.empty td { color: #aaa; font-weight: 400; background: #fff; }
  tr.entry td { font-size: 8px; color: #555; }
  tr.entry td.label { padding-left: 16px; }
  tr.entry .meta { color: #999; font-size: 7.5px; }
  tr.entry td.month { font-weight: 400; background: #fdfaf2; }
  tr.total td { font-weight: 800; border-top: 1px solid #ccc; border-bottom: 2px solid #ddd; background: #f4f4f4; }
  tr.total.in td { color: #138a4b; } tr.total.out td { color: #c0392b; }
  tr.net td { font-weight: 800; font-size: 10px; background: #1a1a1f; color: #fff; border-bottom: none; padding: 7px 6px; }
  tr.net td.month { background: ${GOLD}; color: #1a1a1f; }
  tr.net td.pos { color: #7be3a6; } tr.net td.neg { color: #ff8a80; }
  tr.net td.month.pos, tr.net td.month.neg { color: #1a1a1f; }
  .note { margin-top: 8px; font-size: 7.5px; color: #888; }
  .empty-state { text-align: center; padding: 20px; color: #999; font-style: italic; }
</style></head><body>
  <div class="header">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="Seven Sunday Films" />` : ''}
      <div>
        <div class="company">SEVEN SUNDAY FILMS</div>
        <div class="title">PRODUCTION CASH-FLOW LEDGER</div>
      </div>
    </div>
    <div class="meta-right">
      <div>Entity: <strong>${esc(entity ?? 'All Entities')}</strong></div>
      <div>Period: <strong>${esc(periodLabel)} — Weekly View</strong></div>
      <div>Generated: ${esc(generated)} (WIB)</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="kpis">
    <div class="kpi"><div class="lbl">Total Inflows</div><div class="val green">${esc(formatCurrency(totalIn, 'IDR'))}</div><div class="sub">IDR equivalent · Rp ${totalIn.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div></div>
    <div class="kpi"><div class="lbl">Total Outflows</div><div class="val red">${esc(formatCurrency(totalOut, 'IDR'))}</div><div class="sub">IDR equivalent · Rp ${totalOut.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div></div>
    <div class="kpi"><div class="lbl">Net Cash Flow</div><div class="val ${net < 0 ? 'red' : 'green'}">${esc(formatCurrency(net, 'IDR'))}</div><div class="sub">IDR equivalent · ${entries.length} entries</div></div>
  </div>
  <table>
    <thead><tr>
      <th class="label">Category</th>
      ${weeks.map((w) => `<th>${esc(w.rangeLabel)}<span class="wk">${esc(w.key.slice(5))}</span></th>`).join('')}
      <th class="month">Month Total<span class="wk" style="color:#1a1a1f">${esc(periodLabel)}</span></th>
    </tr></thead>
    <tbody>
      ${renderSection('Cash In (Inflows)', 'INFLOW')}
      ${renderSection('Cash Out (Outflows)', 'OUTFLOW')}
      ${netRow}
    </tbody>
  </table>
  ${entries.length === 0 ? '<div class="empty-state">No entries recorded for this period.</div>' : ''}
  <div class="note">Category and entry amounts are shown in their original currency. Totals, net cash flow and KPIs are IDR equivalents using each entry's recorded exchange rate.</div>
</body></html>`;

    const footerTemplate = `<div style="width:100%;font-size:7px;color:#888;padding:0 12mm;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;">
      <span style="letter-spacing:1px;"><b style="color:${GOLD}">CONFIDENTIAL</b> — Seven Sunday Films Internal Use Only</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;

    const pdf = await generatePdfFromHtml(html, {
      format: 'A4',
      landscape: true,
      headerTemplate: '<span></span>',
      footerTemplate,
      margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' },
    });

    const filename = `SSF_Cashflow_${month}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('PDF export error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to generate PDF' }, { status: 500 });
  }
}
