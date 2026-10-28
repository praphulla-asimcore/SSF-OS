export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const exceptions = await prisma.dataQualityException.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ exceptions });
  } catch (err: any) {
    return NextResponse.json({ exceptions: [], error: err?.message }, { status: 500 });
  }
}
