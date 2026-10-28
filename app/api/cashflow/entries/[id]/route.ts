export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const entry = await prisma.cashflowEntry.update({
      where: { id },
      data: {
        description: body?.description,
        project: body?.project,
        amount: body?.amount,
        currency: body?.currency,
        rate: body?.rate,
        periodMonth: body?.periodMonth,
        periodWeek: body?.periodWeek,
        notes: body?.notes,
        bankAccountId: body?.bankAccountId || null,
      },
    });
    return NextResponse.json(entry);
  } catch (err: any) {
    console.error('Entry update error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.cashflowEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Entry delete error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
