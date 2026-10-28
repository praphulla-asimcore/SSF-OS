export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const objectType = url.searchParams.get('objectType') ?? undefined;
    const projectId = url.searchParams.get('projectId') ?? undefined;
    const where: any = {};
    if (objectType) where.objectType = objectType;
    if (projectId) where.projectId = projectId;

    const events = await prisma.auditEvent.findMany({
      where,
      include: { entity: true, project: true },
      orderBy: { at: 'desc' },
      take: 100,
    });
    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}
