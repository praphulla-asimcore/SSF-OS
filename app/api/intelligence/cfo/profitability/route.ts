export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FX: Record<string, number> = { IDR: 1, USD: 17200, SGD: 13800, GBP: 22000, MYR: 4450 };
function toIDR(amt: number, cur: string) { return amt * (FX[cur] ?? 1); }

export async function GET() {
  try {
    const projects = await prisma.intelProject.findMany({
      include: {
        entity: true,
        contractValues: true,
        budgets: { where: { status: 'approved' }, include: { lines: true } },
        costCommitments: true,
        costToComplete: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = projects.map((p: any) => {
      const cv = p?.contractValues?.[0];
      const revenue = cv ? toIDR((cv?.contractValue ?? 0) + (cv?.approvedChangeOrders ?? 0), cv?.currency ?? 'IDR') : 0;
      const budget = p?.budgets?.[0];
      const approvedBudget = budget ? toIDR(budget?.totalAmount ?? 0, budget?.currency ?? 'IDR') : 0;

      let actual = 0, openComm = 0;
      for (const c of (p?.costCommitments ?? [])) {
        actual += toIDR(c?.recognizedAmount ?? 0, c?.currency ?? 'IDR');
        openComm += toIDR(Math.max(0, (c?.committedAmount ?? 0) - (c?.recognizedAmount ?? 0)), c?.currency ?? 'IDR');
      }

      const ctc = (p?.costToComplete ?? []).reduce((s: number, l: any) => s + toIDR(l?.remainingUncommittedCost ?? 0, p?.contractCurrency ?? 'IDR'), 0);
      const efc = actual + openComm + ctc;
      const marginPct = revenue > 0 ? ((revenue - efc) / revenue) * 100 : null;
      const variance = efc - approvedBudget;
      const variancePct = approvedBudget > 0 ? (variance / approvedBudget) * 100 : 0;

      let rag: 'green' | 'amber' | 'red' = 'green';
      if (variancePct > 5 || (marginPct !== null && marginPct < 10)) rag = 'red';
      else if (variancePct > 2 || (marginPct !== null && marginPct < 20)) rag = 'amber';

      return {
        id: p?.id, projectCode: p?.projectCode, title: p?.title,
        client: p?.client, producer: p?.producer, state: p?.state,
        entity: p?.entity?.code ?? '',
        currency: p?.contractCurrency,
        contractedRevenue: revenue, approvedBudget, actualCost: actual,
        openCommitments: openComm, costToComplete: ctc, efc,
        marginPct, variance, variancePct, rag,
      };
    });

    return NextResponse.json({ projects: rows, currency: 'IDR (equivalent)', dataAsOf: new Date().toISOString() });
  } catch (err: any) {
    console.error('Profitability error:', err);
    return NextResponse.json({ projects: [], error: err?.message }, { status: 500 });
  }
}
