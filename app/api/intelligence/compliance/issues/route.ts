export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const issues = await prisma.issue.findMany({
      include: { entity: true, project: true, correctiveActions: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(issues);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const issue = await prisma.issue.create({
      data: {
        entityId: body?.entityId,
        projectId: body?.projectId || null,
        severity: body?.severity ?? 'medium',
        title: body?.title ?? '',
        description: body?.description ?? '',
        ownerUser: body?.ownerUser ?? session.user?.name ?? '',
        dueAt: body?.dueAt ? new Date(body.dueAt) : null,
      },
    });
    await prisma.auditEvent.create({
      data: { actorUserId: session.user?.id ?? '', objectType: 'issue', objectId: issue?.id ?? '', action: 'created', entityId: body?.entityId ?? null, projectId: body?.projectId ?? null },
    });
    return NextResponse.json(issue);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
