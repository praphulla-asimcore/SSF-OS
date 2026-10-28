export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const entities = await prisma.intelEntity.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(entities);
  } catch (err: any) {
    console.error('Entities GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entity = await prisma.intelEntity.create({ data: body });
    return NextResponse.json(entity);
  } catch (err: any) {
    console.error('Entity create error:', err);
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
  }
}
