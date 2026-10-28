export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        budgetLines: true,
        changeLogs: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err: any) {
    console.error('Get job error:', err);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const job = await prisma.job.update({
      where: { id },
      data: {
        name: body?.name,
        client: body?.client,
        status: body?.status,
        office: body?.office,
        director: body?.director,
        currency: body?.currency,
        exchangeRate: body?.exchangeRate,
        awardedValue: body?.awardedValue,
        approvedBudget: body?.approvedBudget,
        forecastCost: body?.forecastCost,
        notes: body?.notes,
      },
    });
    return NextResponse.json(job);
  } catch (err: any) {
    console.error('Update job error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
