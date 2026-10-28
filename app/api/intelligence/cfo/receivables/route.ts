export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const invoices = await prisma.arInvoice.findMany({
      include: { entity: true, project: true },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const buckets = { notDue: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
    const rows = invoices.map((inv: any) => {
      const daysOverdue = Math.floor(((now?.getTime() ?? 0) - (inv?.dueDate?.getTime() ?? 0)) / (1000 * 60 * 60 * 24));
      let bucket = 'notDue';
      if (daysOverdue <= 0) bucket = 'notDue';
      else if (daysOverdue <= 30) bucket = 'days1_30';
      else if (daysOverdue <= 60) bucket = 'days31_60';
      else if (daysOverdue <= 90) bucket = 'days61_90';
      else bucket = 'over90';

      (buckets as any)[bucket] += inv?.outstandingAmount ?? 0;

      return {
        id: inv?.id, invoiceNo: inv?.invoiceNo, client: inv?.client,
        invoiceDate: inv?.invoiceDate, dueDate: inv?.dueDate,
        currency: inv?.currency, grossAmount: inv?.grossAmount,
        outstandingAmount: inv?.outstandingAmount, status: inv?.status,
        daysOverdue, bucket,
        entity: inv?.entity?.code ?? '', project: inv?.project?.title ?? '',
      };
    });

    return NextResponse.json({ invoices: rows, buckets, currency: 'Mixed', dataAsOf: new Date().toISOString() });
  } catch (err: any) {
    console.error('AR error:', err);
    return NextResponse.json({ invoices: [], buckets: {}, error: err?.message }, { status: 500 });
  }
}
