export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const entityId = url.searchParams.get('entityId') ?? undefined;
    const scenario = url.searchParams.get('scenario') ?? 'base';

    const where: any = { scenario };
    if (entityId && entityId !== 'all') where.entityId = entityId;

    const lines = await prisma.cashForecastLine.findMany({
      where,
      orderBy: { weekStartDate: 'asc' },
    });

    // Group by week
    const weekMap: Record<string, { label: string; date: string; receipts: number; payments: number }> = {};
    for (const line of lines) {
      const wk = line?.weekLabel ?? 'W?';
      if (!weekMap[wk]) weekMap[wk] = { label: wk, date: line?.weekStartDate?.toISOString()?.slice(0, 10) ?? '', receipts: 0, payments: 0 };
      if (line?.direction === 'receipt') weekMap[wk].receipts += line?.amount ?? 0;
      else weekMap[wk].payments += line?.amount ?? 0;
    }

    const weeks = Object.values(weekMap).sort((a: any, b: any) => (a?.date ?? '').localeCompare(b?.date ?? ''));
    let opening = 5_000_000_000; // demo opening cash
    const forecast = weeks.map((w: any) => {
      const closing = opening + (w?.receipts ?? 0) - (w?.payments ?? 0);
      const row = { ...w, opening, closing, netFlow: (w?.receipts ?? 0) - (w?.payments ?? 0) };
      opening = closing;
      return row;
    });

    const shortfalls = forecast.filter((w: any) => (w?.closing ?? 0) < 0);

    return NextResponse.json({
      forecast,
      scenario,
      shortfalls: shortfalls.map((w: any) => ({ week: w?.label, closing: w?.closing })),
      currency: 'IDR',
      dataAsOf: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Cash forecast error:', err);
    return NextResponse.json({ forecast: [], error: err?.message }, { status: 500 });
  }
}
