export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BUDGET_CATEGORIES = ['Production', 'Crew', 'Equipment', 'Location/Travel', 'Post-Production', 'Music/SFX', 'Other'];

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(jobs ?? []);
  } catch (err: any) {
    console.error('Jobs list error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const job = await prisma.job.create({
      data: {
        name: body?.name ?? '',
        client: body?.client ?? '',
        status: body?.status ?? 'Pitching',
        office: body?.office ?? 'Jakarta',
        director: body?.director ?? '',
        currency: body?.currency ?? 'IDR',
        exchangeRate: body?.exchangeRate ?? 1,
        awardedValue: body?.awardedValue ?? 0,
        approvedBudget: body?.approvedBudget ?? 0,
        forecastCost: body?.forecastCost ?? 0,
        notes: body?.notes ?? '',
        budgetLines: {
          create: BUDGET_CATEGORIES.map((cat) => ({
            category: cat,
            budget: 0,
            committed: 0,
            actual: 0,
          })),
        },
      },
    });
    return NextResponse.json(job);
  } catch (err: any) {
    console.error('Create job error:', err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
