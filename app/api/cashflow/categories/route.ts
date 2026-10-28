export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.cashflowCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(categories ?? []);
  } catch (err: any) {
    console.error('Categories fetch error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const maxOrder = await prisma.cashflowCategory.aggregate({
      _max: { sortOrder: true },
      where: { type: body?.type ?? 'OUTFLOW' },
    });
    const category = await prisma.cashflowCategory.create({
      data: {
        name: body?.name ?? 'New Category',
        type: body?.type ?? 'OUTFLOW',
        sortOrder: ((maxOrder?._max?.sortOrder) ?? 0) + 1,
      },
    });
    return NextResponse.json(category);
  } catch (err: any) {
    console.error('Category create error:', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
