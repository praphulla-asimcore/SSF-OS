export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';
    const category = url.searchParams.get('category') ?? '';
    const projectId = url.searchParams.get('projectId') ?? '';

    if (!q) return NextResponse.json({ results: [] });

    const where: any = { status: 'active' };
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;

    // Simple keyword search on title and extractedText
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { extractedText: { contains: q, mode: 'insensitive' } },
    ];

    const docs = await prisma.knowledgeDocument.findMany({
      where,
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const results = docs.map((d: any) => {
      // Find snippet
      const text = d?.extractedText ?? '';
      const idx = text?.toLowerCase()?.indexOf(q?.toLowerCase());
      const snippet = idx >= 0
        ? '...' + text.slice(Math.max(0, idx - 50), idx + q.length + 100) + '...'
        : text.slice(0, 150) + '...';
      return {
        id: d?.id, title: d?.title, category: d?.category,
        classification: d?.classification, version: d?.version,
        project: d?.project?.title ?? '', snippet, updatedAt: d?.updatedAt,
      };
    });

    return NextResponse.json({ results, query: q });
  } catch (err: any) {
    return NextResponse.json({ results: [], error: err?.message }, { status: 500 });
  }
}
