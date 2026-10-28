export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId') ?? '';
    
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const stages = await prisma.projectStage.findMany({
      where,
      include: {
        project: true,
        controls: {
          include: {
            controlTemplate: true,
            evidence: { include: { document: true } },
          },
        },
      },
      orderBy: { project: { projectCode: 'asc' } },
    });

    return NextResponse.json(stages);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { stageId, action, controlId, notes } = body ?? {};

    if (action === 'approve_gate') {
      // Check all mandatory controls verified
      const stage = await prisma.projectStage.findUnique({
        where: { id: stageId },
        include: { controls: { include: { controlTemplate: true } } },
      });
      const mandatoryPending = stage?.controls?.filter((c: any) => c?.controlTemplate?.mandatory && c?.status !== 'verified' && c?.status !== 'waived') ?? [];
      if (mandatoryPending.length > 0) {
        return NextResponse.json({ error: `Cannot approve: ${mandatoryPending.length} mandatory control(s) not yet verified`, pending: mandatoryPending.map((c: any) => c?.controlTemplate?.title) }, { status: 400 });
      }
      await prisma.projectStage.update({ where: { id: stageId }, data: { status: 'approved', closedAt: new Date() } });
      await prisma.auditEvent.create({
        data: {
          actorUserId: session.user?.id ?? '', objectType: 'stage', objectId: stageId ?? '',
          action: 'approved', projectId: stage?.projectId ?? null,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'verify_control') {
      const control = await prisma.projectControl.findUnique({ where: { id: controlId } });
      if (control?.assignedUser === (session.user?.name ?? session.user?.email)) {
        return NextResponse.json({ error: 'Maker cannot verify their own control (maker≠checker)' }, { status: 400 });
      }
      await prisma.projectControl.update({ where: { id: controlId }, data: { status: 'verified', notes: notes ?? '' } });
      await prisma.auditEvent.create({
        data: {
          actorUserId: session.user?.id ?? '', objectType: 'control', objectId: controlId ?? '',
          action: 'verified', projectId: control?.projectId ?? null,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'reject_control') {
      await prisma.projectControl.update({ where: { id: controlId }, data: { status: 'rejected', notes: notes ?? '' } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
