export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const obligations = await prisma.obligation.findMany({
      include: { entity: true },
      orderBy: { dueAt: 'asc' },
    });
    return NextResponse.json(obligations);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}
