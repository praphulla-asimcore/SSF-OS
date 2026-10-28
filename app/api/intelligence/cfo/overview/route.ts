export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FX_TO_IDR: Record<string, number> = { IDR: 1, USD: 17200, SGD: 13800, GBP: 22000, MYR: 4450 };
function toIDR(amount: number, currency: string): number {
  return amount * (FX_TO_IDR[currency] ?? 1);
}

export async function GET() {
  try {
    const [projects, arInvoices, apBills, entities, commitments, ctcLines] = await Promise.all([
      prisma.intelProject.findMany({ include: { contractValues: true, budgets: { include: { lines: true } }, costCommitments: true, costToComplete: true } }),
      prisma.arInvoice.findMany(),
      prisma.apBill.findMany(),
      prisma.intelEntity.findMany({ where: { active: true } }),
      prisma.costCommitment.findMany(),
      prisma.costToCompleteLine.findMany(),
    ]);

    // KPIs
    let totalRevenuePipeline = 0;
    let totalApprovedBudget = 0;
    let totalActualCost = 0;
    let totalOpenCommitments = 0;
    let totalCTC = 0;
    const projectRisks: any[] = [];

    for (const p of projects) {
      const cv = p.contractValues?.[0];
      const revenue = cv ? toIDR((cv?.contractValue ?? 0) + (cv?.approvedChangeOrders ?? 0), cv?.currency ?? 'IDR') : 0;
      totalRevenuePipeline += revenue;

      const approvedBudget = p.budgets?.filter((b: any) => b?.status === 'approved')
        ?.reduce((sum: number, b: any) => sum + toIDR(b?.totalAmount ?? 0, b?.currency ?? 'IDR'), 0) ?? 0;
      totalApprovedBudget += approvedBudget;

      const projectCommitments = p.costCommitments ?? [];
      let actual = 0;
      let openComm = 0;
      for (const c of projectCommitments) {
        actual += toIDR(c?.recognizedAmount ?? 0, c?.currency ?? 'IDR');
        openComm += toIDR(Math.max(0, (c?.committedAmount ?? 0) - (c?.recognizedAmount ?? 0)), c?.currency ?? 'IDR');
      }
      totalActualCost += actual;
      totalOpenCommitments += openComm;

      const ctc = (p.costToComplete ?? []).reduce((s: number, l: any) => s + toIDR(l?.remainingUncommittedCost ?? 0, p?.contractCurrency ?? 'IDR'), 0);
      totalCTC += ctc;

      const efc = actual + openComm + ctc;
      const marginPct = revenue > 0 ? ((revenue - efc) / revenue) * 100 : null;
      const variance = efc - approvedBudget;
      const variancePct = approvedBudget > 0 ? (variance / approvedBudget) * 100 : 0;

      if (variancePct > 5 || (marginPct !== null && marginPct < 15)) {
        projectRisks.push({
          id: p?.id, projectCode: p?.projectCode, title: p?.title,
          revenue, efc, marginPct, variancePct,
          reason: variancePct > 5 ? 'Cost overrun >5%' : 'Margin below 15%',
        });
      }
    }

    const totalAR = arInvoices.reduce((s: number, inv: any) => s + toIDR(inv?.outstandingAmount ?? 0, inv?.currency ?? 'IDR'), 0);
    const totalAP = apBills.reduce((s: number, b: any) => s + toIDR(b?.outstandingAmount ?? 0, b?.currency ?? 'IDR'), 0);
    const efc = totalActualCost + totalOpenCommitments + totalCTC;
    const grossProfit = totalRevenuePipeline - efc;

    return NextResponse.json({
      kpis: {
        revenuePipeline: totalRevenuePipeline,
        grossProfit,
        totalAR,
        totalAP,
        cashPosition: totalRevenuePipeline - totalActualCost,
        activeProductions: projects?.filter((p: any) => ['pre_production', 'production', 'post_production'].includes(p?.state))?.length ?? 0,
        projectsAtRisk: projectRisks?.length ?? 0,
        entityCount: entities?.length ?? 0,
      },
      riskQueue: projectRisks.slice(0, 10),
      dataFreshness: new Date().toISOString(),
      currency: 'IDR',
    });
  } catch (err: any) {
    console.error('CFO Overview error:', err);
    return NextResponse.json({ kpis: {}, riskQueue: [], error: err?.message }, { status: 500 });
  }
}
