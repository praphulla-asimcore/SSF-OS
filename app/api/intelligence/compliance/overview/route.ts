export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [controls, issues, obligations, stages] = await Promise.all([
      prisma.projectControl.findMany({ include: { controlTemplate: true, stage: true, project: true } }),
      prisma.issue.findMany({ where: { status: { in: ['open', 'in_progress'] } }, include: { project: true } }),
      prisma.obligation.findMany({ orderBy: { dueAt: 'asc' } }),
      prisma.projectStage.findMany({ include: { project: true, controls: { include: { controlTemplate: true } } } }),
    ]);

    const overdueControls = controls.filter((c: any) => c?.status === 'pending' && c?.dueAt && new Date(c.dueAt) < new Date());
    const highRiskIssues = issues.filter((i: any) => i?.severity === 'critical' || i?.severity === 'high');
    const upcomingObligations = obligations.filter((o: any) => o?.status === 'upcoming' && o?.dueAt && new Date(o.dueAt) > new Date());

    // Project readiness grid
    const stageKeys = ['acceptance', 'pre_production', 'shoot_authorization', 'post_production_qc', 'closure'];
    const projects = await prisma.intelProject.findMany({ include: { projectStages: { include: { controls: true } } } });
    const readinessGrid = projects.map((p: any) => {
      const stageStatuses: Record<string, any> = {};
      for (const sk of stageKeys) {
        const stage = p?.projectStages?.find((s: any) => s?.stageKey === sk);
        if (stage) {
          const total = stage?.controls?.length ?? 0;
          const verified = stage?.controls?.filter((c: any) => c?.status === 'verified')?.length ?? 0;
          stageStatuses[sk] = { status: stage?.status, total, verified, pct: total > 0 ? Math.round((verified / total) * 100) : 0 };
        } else {
          stageStatuses[sk] = { status: 'not_started', total: 0, verified: 0, pct: 0 };
        }
      }
      return { id: p?.id, projectCode: p?.projectCode, title: p?.title, state: p?.state, stages: stageStatuses };
    });

    return NextResponse.json({
      overdueControls: overdueControls?.length ?? 0,
      highRiskIssues: highRiskIssues?.length ?? 0,
      pendingApprovals: stages?.filter((s: any) => s?.status === 'pending_review')?.length ?? 0,
      upcomingObligations: upcomingObligations?.length ?? 0,
      readinessGrid,
      recentIssues: issues.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
