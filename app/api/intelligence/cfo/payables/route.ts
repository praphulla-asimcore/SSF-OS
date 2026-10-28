export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bills = await prisma.apBill.findMany({
      include: { entity: true, project: true },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const buckets = { notDue: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
    const rows = bills.map((b: any) => {
      const daysOverdue = Math.floor(((now?.getTime() ?? 0) - (b?.dueDate?.getTime() ?? 0)) / (1000 * 60 * 60 * 24));
      let bucket = 'notDue';
      if (daysOverdue <= 0) bucket = 'notDue';
      else if (daysOverdue <= 30) bucket = 'days1_30';
      else if (daysOverdue <= 60) bucket = 'days31_60';
      else if (daysOverdue <= 90) bucket = 'days61_90';
      else bucket = 'over90';
      (buckets as any)[bucket] += b?.outstandingAmount ?? 0;

      return {
        id: b?.id, billNo: b?.billNo, vendor: b?.vendor,
        dueDate: b?.dueDate, currency: b?.currency, amount: b?.amount,
        outstandingAmount: b?.outstandingAmount, status: b?.status,
        daysOverdue, bucket,
        entity: b?.entity?.code ?? '', project: b?.project?.title ?? '',
      };
    });

    return NextResponse.json({ bills: rows, buckets, currency: 'Mixed', dataAsOf: new Date().toISOString() });
  } catch (err: any) {
    console.error('AP error:', err);
    return NextResponse.json({ bills: [], buckets: {}, error: err?.message }, { status: 500 });
  }
}
