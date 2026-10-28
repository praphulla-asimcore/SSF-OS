export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

export async function GET() {
  try {
    const docs = await prisma.knowledgeDocument.findMany({
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    const docsWithUrls = await Promise.all(docs.map(async (d: any) => {
      let url = null;
      if (d?.cloudStoragePath) {
        try { url = await getFileUrl(d.cloudStoragePath, d?.contentType ?? 'application/octet-stream', d?.isPublic ?? false); } catch {}
      }
      return { ...d, downloadUrl: url };
    }));
    return NextResponse.json(docsWithUrls);
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, category, classification, entityId, projectId, fileName, contentType, extractedText, fileSize } = body ?? {};

    // Generate presigned upload URL
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(fileName ?? 'document', contentType ?? 'application/octet-stream', false);

    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: title ?? fileName ?? 'Untitled',
        category: category ?? 'other',
        classification: classification ?? 'public_internal',
        entityId: entityId ?? '',
        projectId: projectId || null,
        owner: session.user?.name ?? session.user?.email ?? '',
        cloudStoragePath: cloud_storage_path,
        contentType: contentType ?? 'application/octet-stream',
        extractedText: extractedText ?? '',
        fileSize: fileSize ?? 0,
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        actorUserId: session.user?.id ?? '',
        objectType: 'document',
        objectId: doc?.id ?? '',
        action: 'uploaded',
        entityId: entityId || null,
        projectId: projectId || null,
      },
    });

    return NextResponse.json({ document: doc, uploadUrl, cloud_storage_path });
  } catch (err: any) {
    console.error('Doc upload error:', err);
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 });
  }
}
