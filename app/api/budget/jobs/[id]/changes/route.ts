export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const change = await prisma.changeLog.create({
      data: {
        jobId: id,
        description: body?.description ?? '',
        costImpact: body?.costImpact ?? 0,
        status: body?.status ?? 'Pending',
      },
    });
    return NextResponse.json(change);
  } catch (err: any) {
    console.error('Create change error:', err);
    return NextResponse.json({ error: 'Failed to create change' }, { status: 500 });
  }
}
