export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [categories, entries, accounts] = await Promise.all([
      prisma.cashflowCategory.findMany(),
      prisma.cashflowEntry.findMany(),
      prisma.bankAccount.findMany(),
    ]);

    const catMap = new Map((categories ?? []).map((c: any) => [c?.id, c]));

    // KPIs
    const totalBalance = (accounts ?? []).reduce((s: number, a: any) => s + (a?.openingBalance ?? 0), 0);
    const totalInflow = (entries ?? []).filter((e: any) => catMap.get(e?.categoryId)?.type === 'INFLOW')
      .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);
    const totalOutflow = (entries ?? []).filter((e: any) => catMap.get(e?.categoryId)?.type === 'OUTFLOW')
      .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);
    const netCashflow = totalInflow - totalOutflow;

    // Build entity-aware kpis
    const entityList = ['All', 'SSF Jakarta', 'SSF Singapore', 'Bali CO'];
    const kpis: any[] = [];
    for (const entity of entityList) {
      const accs = entity === 'All' ? accounts : (accounts ?? []).filter((a: any) => a?.entity === entity);
      const accIds = new Set(accs.map((a: any) => a?.id));
      const eBalance = accs.reduce((s: number, a: any) => s + (a?.openingBalance ?? 0), 0);

      const relevantEntries = entity === 'All' ? entries : (entries ?? []).filter((e: any) => !e?.bankAccountId || accIds.has(e?.bankAccountId));
      const eInflow = relevantEntries.filter((e: any) => catMap.get(e?.categoryId)?.type === 'INFLOW')
        .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);
      const eOutflow = relevantEntries.filter((e: any) => catMap.get(e?.categoryId)?.type === 'OUTFLOW')
        .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);

      kpis.push(
        { metric: 'cash_position', entity, label: 'Cash Position', value: eBalance, format: 'currency_compact', delta: 0, delta_label: 'vs last month', spark: [], good_when: 'up' },
        { metric: 'total_inflow', entity, label: 'Total Inflows', value: eInflow, format: 'currency_compact', delta: 0, delta_label: 'vs last month', spark: [], good_when: 'up' },
        { metric: 'total_outflow', entity, label: 'Total Outflows', value: eOutflow, format: 'currency_compact', delta: 0, delta_label: 'vs last month', spark: [], good_when: 'down' },
        { metric: 'net_cashflow', entity, label: 'Net Cash Flow', value: eInflow - eOutflow, format: 'currency_compact', delta: 0, delta_label: 'vs last month', spark: [], good_when: 'up' },
      );
    }

    // Monthly trend
    const months = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
    const trend = months.map((m: string) => {
      const monthEntries = (entries ?? []).filter((e: any) => e?.periodMonth === m);
      const inflow = monthEntries.filter((e: any) => catMap.get(e?.categoryId)?.type === 'INFLOW')
        .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);
      const outflow = monthEntries.filter((e: any) => catMap.get(e?.categoryId)?.type === 'OUTFLOW')
        .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);
      return { month: m, inflow, outflow, entity: 'All' };
    });

    // Entity breakdown
    const breakdown: any[] = [];
    for (const entity of entityList) {
      if (entity === 'All') continue;
      const accIds = new Set((accounts ?? []).filter((a: any) => a?.entity === entity).map((a: any) => a?.id));
      const eEntries = (entries ?? []).filter((e: any) => !e?.bankAccountId || accIds.has(e?.bankAccountId));
      const inflow = eEntries.filter((e: any) => catMap.get(e?.categoryId)?.type === 'INFLOW')
        .reduce((s: number, e: any) => s + ((e?.amount ?? 0) * (e?.rate ?? 1)), 0);
      breakdown.push({ entity, type: 'Inflow', amount: inflow });
    }

    // Top expenses by category
    const expenseByCat: Record<string, number> = {};
    for (const e of (entries ?? [])) {
      const cat = catMap.get(e?.categoryId);
      if (cat?.type === 'OUTFLOW') {
        const catName = cat?.name ?? 'Other';
        expenseByCat[catName] = (expenseByCat[catName] ?? 0) + ((e?.amount ?? 0) * (e?.rate ?? 1));
      }
    }
    const topExpenses = Object.entries(expenseByCat)
      .map(([category, total]: [string, number]) => ({ category, total, entity: 'All' }))
      .sort((a: any, b: any) => (b?.total ?? 0) - (a?.total ?? 0))
      .slice(0, 8);

    // Account balances
    const accountBalances = (accounts ?? []).map((a: any) => ({
      name: a?.name ?? '',
      currency: a?.currency ?? '',
      entity: a?.entity ?? '',
      balance: a?.openingBalance ?? 0,
    }));

    return NextResponse.json({
      data_as_of: new Date().toISOString(),
      data: {
        kpis,
        trend,
        breakdown,
        top_expenses: topExpenses,
        account_balances: accountBalances,
      },
    });
  } catch (err: any) {
    console.error('Cashflow dashboard error:', err);
    return NextResponse.json({ data_as_of: new Date().toISOString(), data: {} }, { status: 500 });
  }
}
