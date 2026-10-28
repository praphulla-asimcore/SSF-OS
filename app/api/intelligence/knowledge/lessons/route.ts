export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const lessons = await prisma.lessonLearned.findMany({
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(lessons);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const lesson = await prisma.lessonLearned.create({
      data: {
        projectId: body?.projectId,
        category: body?.category ?? 'general',
        observation: body?.observation ?? '',
        recommendation: body?.recommendation ?? '',
        submittedBy: session.user?.name ?? session.user?.email ?? '',
        status: 'pending',
      },
    });
    return NextResponse.json(lesson);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
