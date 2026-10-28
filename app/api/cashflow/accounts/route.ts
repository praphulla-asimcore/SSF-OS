export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(accounts ?? []);
  } catch (err: any) {
    console.error('Accounts fetch error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
