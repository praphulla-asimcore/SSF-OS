export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body?.budget !== undefined) data.budget = body.budget;
    if (body?.committed !== undefined) data.committed = body.committed;
    if (body?.actual !== undefined) data.actual = body.actual;
    if (body?.notes !== undefined) data.notes = body.notes;

    const line = await prisma.budgetLine.update({ where: { id }, data });
    return NextResponse.json(line);
  } catch (err: any) {
    console.error('Update budget line error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
