export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const entries = await prisma.cashflowEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(entries ?? []);
  } catch (err: any) {
    console.error('Entries fetch error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = await prisma.cashflowEntry.create({
      data: {
        description: body?.description ?? '',
        project: body?.project ?? '',
        invoiceRef: body?.invoiceRef ?? '',
        amount: body?.amount ?? 0,
        currency: body?.currency ?? 'IDR',
        rate: body?.rate ?? 1,
        periodMonth: body?.periodMonth ?? '2026-10',
        periodWeek: body?.periodWeek ?? null,
        notes: body?.notes ?? '',
        categoryId: body?.categoryId,
        bankAccountId: body?.bankAccountId || null,
      },
    });
    return NextResponse.json(entry);
  } catch (err: any) {
    console.error('Entry create error:', err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
