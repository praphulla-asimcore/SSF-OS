export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      select: {
        id: true, name: true, client: true, status: true, office: true,
        currency: true, awardedValue: true, approvedBudget: true, forecastCost: true,
      },
    });

    const totalJobs = jobs?.length ?? 0;
    const totalAwarded = (jobs ?? []).reduce((s: number, j: any) => s + (j?.awardedValue ?? 0), 0);
    const totalBudget = (jobs ?? []).reduce((s: number, j: any) => s + (j?.approvedBudget ?? 0), 0);
    const totalForecast = (jobs ?? []).reduce((s: number, j: any) => s + (j?.forecastCost ?? 0), 0);
    const blendedMargin = totalAwarded > 0 ? ((totalAwarded - totalForecast) / totalAwarded) * 100 : 0;

    const statusCounts: Record<string, number> = {};
    for (const j of (jobs ?? [])) {
      const st = j?.status ?? 'Unknown';
      statusCounts[st] = (statusCounts[st] ?? 0) + 1;
    }

    return NextResponse.json({
      jobs: jobs ?? [],
      totalJobs,
      totalAwarded,
      totalBudget,
      blendedMargin,
      statusCounts,
    });
  } catch (err: any) {
    console.error('Budget dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
