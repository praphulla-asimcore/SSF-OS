export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.controlTemplate.findMany({ where: { active: true }, orderBy: { stageKey: 'asc' } });
    return NextResponse.json(templates);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}
