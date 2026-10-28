import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mirror of lib/format.ts buildWeeks
function buildWeeks(year: number) {
  const weeks: { key: string; month: string }[] = [];
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dow = jan1.getUTCDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(jan1);
  monday.setUTCDate(jan1.getUTCDate() + toMonday);
  let idx = 1;
  for (let i = 0; i < 60; i++) {
    const start = new Date(monday);
    const thu = new Date(start); thu.setUTCDate(start.getUTCDate() + 3);
    const ty = thu.getUTCFullYear();
    if (ty > year) break;
    if (ty === year) {
      const month = `${year}-${String(thu.getUTCMonth() + 1).padStart(2, '0')}`;
      weeks.push({ key: `${year}-W${String(idx).padStart(2, '0')}`, month });
      idx++;
    }
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return weeks;
}
const WEEKS = buildWeeks(2026);
function weeksForMonth(month: string) { return WEEKS.filter((w) => w.month === month); }

async function main() {
  console.log('Seeding database...');

  // ═══ AUTH USERS ═══
  const hashedTestPw = await bcrypt.hash('2E7Xgi#N0F', 12);
  const hashedDemoPw = await bcrypt.hash('Demo2026!', 12);

  await prisma.user.upsert({
    where: { email: 'abacus-c5719db4@example.com' },
    update: { password: hashedTestPw, role: 'admin', name: 'System Admin' },
    create: { email: 'abacus-c5719db4@example.com', password: hashedTestPw, role: 'admin', name: 'System Admin' },
  });

  await prisma.user.upsert({
    where: { email: 'demo@sevensundayfilms.com' },
    update: { password: hashedDemoPw, role: 'admin', name: 'Demo Admin' },
    create: { email: 'demo@sevensundayfilms.com', password: hashedDemoPw, role: 'admin', name: 'Demo Admin' },
  });
  console.log('Users seeded.');

  // ═══ BANK ACCOUNTS (from Excel) ═══
  const bankAccounts = [
    { id: 'acc-amar-idr', name: 'Amar Bank (IDR)', accountNumber: '1002705503', currency: 'IDR', entity: 'SSF Jakarta', openingBalance: 0, sortOrder: 1 },
    { id: 'acc-bca-idr', name: 'BCA (IDR)', accountNumber: '2863016568', currency: 'IDR', entity: 'SSF Jakarta', openingBalance: 7233173.13, sortOrder: 2 },
    { id: 'acc-bca-gbp', name: 'BCA (GBP)', accountNumber: '2860427730', currency: 'GBP', entity: 'SSF Jakarta', openingBalance: 8742774.95, sortOrder: 3 },
    { id: 'acc-bca-sgd', name: 'BCA (SGD)', accountNumber: '2860309371', currency: 'SGD', entity: 'SSF Jakarta', openingBalance: 11520428.64, sortOrder: 4 },
    { id: 'acc-danamon-idr', name: 'Danamon (IDR)', accountNumber: '000097234751', currency: 'IDR', entity: 'SSF Jakarta', openingBalance: 1116386, sortOrder: 5 },
    { id: 'acc-danamon-usd', name: 'Danamon (USD)', accountNumber: '000094737541', currency: 'USD', entity: 'SSF Jakarta', openingBalance: 16558778.3, sortOrder: 6 },
    { id: 'acc-mandiri', name: 'Mandiri', accountNumber: '', currency: 'IDR', entity: 'SSF Jakarta', openingBalance: 8208230.64, sortOrder: 7 },
    { id: 'acc-bca-movie', name: 'BCA Movie Project (IDR)', accountNumber: '2863082668', currency: 'IDR', entity: 'SSF Jakarta', openingBalance: 372992593, sortOrder: 8 },
    { id: 'acc-bali-idr', name: 'Bali Films BCA (IDR)', accountNumber: '7720884351', currency: 'IDR', entity: 'Bali CO', openingBalance: 11707823, sortOrder: 9 },
    { id: 'acc-bali-usd', name: 'Bali Films BCA (USD)', accountNumber: '', currency: 'USD', entity: 'Bali CO', openingBalance: 1540335, sortOrder: 10 },
    { id: 'acc-bali-sgd', name: 'Bali Films BCA (SGD)', accountNumber: '', currency: 'SGD', entity: 'Bali CO', openingBalance: 966560, sortOrder: 11 },
    { id: 'acc-ocbc-sgd', name: 'OCBC Singapore (SGD)', accountNumber: '601343346001', currency: 'SGD', entity: 'SSF Singapore', openingBalance: 25731484.16, sortOrder: 12 },
    { id: 'acc-ocbc-usd', name: 'OCBC Singapore (USD)', accountNumber: '601343346001', currency: 'USD', entity: 'SSF Singapore', openingBalance: 70540615.1, sortOrder: 13 },
  ];
  for (const acc of bankAccounts) {
    await prisma.bankAccount.upsert({ where: { id: acc.id }, update: acc, create: acc });
  }
  console.log('Bank accounts seeded.');

  // ═══ CASHFLOW CATEGORIES ═══
  const categories = [
    { id: 'cat-bank-balance', name: 'Bank Balance', type: 'INFLOW', sortOrder: 1 },
    { id: 'cat-loan-received', name: 'Loan to be Received', type: 'INFLOW', sortOrder: 2 },
    { id: 'cat-receivables', name: 'Receivables', type: 'INFLOW', sortOrder: 3 },
    { id: 'cat-forecast-recv', name: 'Forecast Receivables (Not Yet Invoiced)', type: 'INFLOW', sortOrder: 4 },
    { id: 'cat-loan-payment', name: 'Loan Payment', type: 'OUTFLOW', sortOrder: 1 },
    { id: 'cat-salary', name: 'Salary & Benefits', type: 'OUTFLOW', sortOrder: 2 },
    { id: 'cat-local-suppliers', name: 'Local Suppliers & Offices', type: 'OUTFLOW', sortOrder: 3 },
    { id: 'cat-overseas', name: 'Overseas Currencies/Suppliers', type: 'OUTFLOW', sortOrder: 4 },
    { id: 'cat-tax', name: 'Tax & Government', type: 'OUTFLOW', sortOrder: 5 },
    { id: 'cat-credit-cards', name: 'Credit Cards', type: 'OUTFLOW', sortOrder: 6 },
    { id: 'cat-crew-fees', name: 'Crew Fees', type: 'OUTFLOW', sortOrder: 7 },
    { id: 'cat-travel', name: 'Travel & Accommodation', type: 'OUTFLOW', sortOrder: 8 },
    { id: 'cat-post-prod', name: 'Post-Production Services', type: 'OUTFLOW', sortOrder: 9 },
    { id: 'cat-pitching', name: 'Pitching Costs', type: 'OUTFLOW', sortOrder: 10 },
    { id: 'cat-profit-sharing', name: 'Profit Sharing', type: 'OUTFLOW', sortOrder: 11 },
    { id: 'cat-other-expense', name: 'Others', type: 'OUTFLOW', sortOrder: 12 },
  ];
  for (const cat of categories) {
    await prisma.cashflowCategory.upsert({ where: { id: cat.id }, update: cat, create: cat });
  }
  console.log('Categories seeded.');

  // ═══ CASHFLOW ENTRIES ═══
  const cfEntries = [
    { id: 'cf-recv-1', description: 'P&G - Vicks Jahe Madu', project: 'Vicks Jahe Madu', amount: 9166667, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-receivables' },
    { id: 'cf-recv-2', description: 'MullenLowe - Royco', project: 'Royco', amount: 62169001, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-receivables' },
    { id: 'cf-recv-3', description: 'Pune HO - Raffaello', project: 'Raffaello', amount: 1235325366, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-receivables' },
    { id: 'cf-recv-4', description: 'Leo Burnett - Income Insurance', project: 'Income Insurance', amount: 26207584, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-receivables' },
    { id: 'cf-recv-5', description: 'WPP Production - Milo', project: 'Milo', amount: 2370212967, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-receivables' },
    { id: 'cf-recv-6', description: 'Clockwork - SC', project: 'SC', amount: 1073578085, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-receivables' },
    { id: 'cf-fc-1', description: 'Mandiri Marriott', project: 'Marriott', amount: 700000000, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-forecast-recv' },
    { id: 'cf-fc-2', description: 'WPP - Coca Cola', project: 'Coca Cola', amount: 381719800, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-forecast-recv' },
    { id: 'cf-sal-1', description: 'Staff Salary', project: 'SALARY', amount: 270000000, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-salary' },
    { id: 'cf-loan-1', description: 'Loan Payback to RLV', project: 'BOD', amount: 150000000, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-loan-payment' },
    { id: 'cf-loc-1', description: 'WB Sunsilk', project: 'Sunsilk', amount: 69000000, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-local-suppliers' },
    { id: 'cf-tax-1', description: 'VAT 11%', project: 'GOVERNMENT', amount: 50000000, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-tax' },
    { id: 'cf-ov-1', description: 'Deluxe - 2nd 50%', project: '', amount: 48024, currency: 'USD', rate: 17200, periodMonth: '2026-10', categoryId: 'cat-overseas' },
    { id: 'cf-crew-1', description: 'Crew Fee Report - Afeeq (EP) Mastercard', project: 'Mastercard', amount: 35000000, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-crew-fees' },
    { id: 'cf-trav-1', description: 'Galeri Wisata - Nutella Flights', project: 'Nutella', amount: 38640420, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-travel' },
    { id: 'cf-post-1', description: 'Blue Magic Audio - Mandiri Bonvoy', project: 'Mandiri Bonvoy', amount: 22000000, currency: 'IDR', rate: 1, periodMonth: '2026-11', categoryId: 'cat-post-prod' },
    { id: 'cf-pitch-1', description: 'Pitching Estimation Cost', project: 'PITCHING', amount: 20000000, currency: 'IDR', rate: 1, periodMonth: '2026-10', categoryId: 'cat-pitching' },
  ];
  const weekCursor: Record<string, number> = {};
  for (const entry of cfEntries) {
    const wks = weeksForMonth(entry.periodMonth);
    const n = weekCursor[entry.periodMonth] ?? 0;
    const periodWeek = wks.length ? wks[n % wks.length].key : null;
    weekCursor[entry.periodMonth] = n + 1;
    await prisma.cashflowEntry.upsert({ where: { id: entry.id }, update: { ...entry, periodWeek }, create: { ...entry, periodWeek } });
  }
  console.log('Cashflow entries seeded.');

  // ═══ JOBS ═══
  const jobs = [
    { id: 'job-milo', name: 'Milo TVC', client: 'WPP Production', status: 'In Production', office: 'Jakarta', director: 'Sarah Lois', currency: 'IDR', exchangeRate: 1, awardedValue: 2370212967, approvedBudget: 1900000000, forecastCost: 1850000000, notes: 'Full production TVC for Milo', budgetLines: [
      { category: 'Production', budget: 600000000, committed: 550000000, actual: 520000000 },
      { category: 'Crew', budget: 400000000, committed: 380000000, actual: 350000000 },
      { category: 'Equipment', budget: 250000000, committed: 200000000, actual: 200000000 },
      { category: 'Location/Travel', budget: 200000000, committed: 180000000, actual: 170000000 },
      { category: 'Post-Production', budget: 300000000, committed: 250000000, actual: 280000000 },
      { category: 'Music/SFX', budget: 100000000, committed: 80000000, actual: 80000000 },
      { category: 'Other', budget: 50000000, committed: 40000000, actual: 30000000 },
    ]},
    { id: 'job-nutella', name: 'Nutella Digital Campaign', client: 'Pune HO / FERGULF', status: 'Awarded', office: 'Jakarta', director: 'RLV', currency: 'USD', exchangeRate: 17705, awardedValue: 56019, approvedBudget: 45000, forecastCost: 42000, notes: 'Nutella digital content for SEA', budgetLines: [
      { category: 'Production', budget: 15000, committed: 12000, actual: 10000 },
      { category: 'Crew', budget: 10000, committed: 8000, actual: 7000 },
      { category: 'Equipment', budget: 5000, committed: 4000, actual: 4000 },
      { category: 'Location/Travel', budget: 5000, committed: 3000, actual: 3000 },
      { category: 'Post-Production', budget: 6000, committed: 5000, actual: 5000 },
      { category: 'Music/SFX', budget: 2000, committed: 1000, actual: 1000 },
      { category: 'Other', budget: 2000, committed: 1000, actual: 500 },
    ]},
    { id: 'job-dettol', name: 'Dettol ASL TVC', client: 'McCann Worldgroup Singapore', status: 'Delivered', office: 'Singapore', director: 'Afeeq', currency: 'SGD', exchangeRate: 13808, awardedValue: 1068, approvedBudget: 900, forecastCost: 850, notes: 'Dettol antiseptic liquid campaign', budgetLines: [
      { category: 'Production', budget: 300, committed: 280, actual: 270 },
      { category: 'Crew', budget: 200, committed: 180, actual: 170 },
      { category: 'Equipment', budget: 100, committed: 90, actual: 85 },
      { category: 'Location/Travel', budget: 100, committed: 80, actual: 75 },
      { category: 'Post-Production', budget: 120, committed: 110, actual: 100 },
      { category: 'Music/SFX', budget: 50, committed: 40, actual: 35 },
      { category: 'Other', budget: 30, committed: 20, actual: 15 },
    ]},
    { id: 'job-coca-cola', name: 'Coca Cola SEA Campaign', client: 'WPP', status: 'Pitching', office: 'Jakarta', director: 'Sarah Lois', currency: 'USD', exchangeRate: 17705, awardedValue: 21560, approvedBudget: 0, forecastCost: 18000, notes: 'Coca Cola regional campaign pitch', budgetLines: [
      { category: 'Production', budget: 0, committed: 0, actual: 0 },
    ]},
    { id: 'job-income', name: 'Income Insurance TVC', client: 'Leo Burnett', status: 'In Production', office: 'Singapore', director: 'Afeeq', currency: 'SGD', exchangeRate: 13808, awardedValue: 1898, approvedBudget: 1500, forecastCost: 1450, notes: 'Income Insurance Singapore brand campaign', budgetLines: [
      { category: 'Production', budget: 500, committed: 450, actual: 400 },
      { category: 'Crew', budget: 350, committed: 300, actual: 280 },
      { category: 'Equipment', budget: 150, committed: 120, actual: 110 },
      { category: 'Location/Travel', budget: 150, committed: 130, actual: 120 },
      { category: 'Post-Production', budget: 200, committed: 180, actual: 170 },
      { category: 'Music/SFX', budget: 100, committed: 80, actual: 70 },
      { category: 'Other', budget: 50, committed: 40, actual: 30 },
    ]},
  ];
  for (const jobData of jobs) {
    const { budgetLines, ...jobFields } = jobData;
    await prisma.job.upsert({
      where: { id: jobFields.id },
      update: jobFields,
      create: { ...jobFields, budgetLines: { create: budgetLines } },
    });
    const existingLines = await prisma.budgetLine.findMany({ where: { jobId: jobFields.id } });
    if (existingLines.length > 0) {
      for (const line of budgetLines) {
        const existing = existingLines.find((e: any) => e?.category === line.category);
        if (existing) { await prisma.budgetLine.update({ where: { id: existing.id }, data: line }); }
      }
    }
  }
  console.log('Jobs seeded.');

  // Change logs
  const changes = [
    { id: 'chg-1', jobId: 'job-milo', description: 'Additional shooting day requested by client', costImpact: 50000000, status: 'Client Approved' },
    { id: 'chg-2', jobId: 'job-milo', description: 'Equipment upgrade for 4K delivery', costImpact: 20000000, status: 'Internal Approved' },
    { id: 'chg-3', jobId: 'job-nutella', description: 'Added drone shots for hero sequence', costImpact: 3000, status: 'Pending' },
  ];
  for (const change of changes) {
    await prisma.changeLog.upsert({ where: { id: change.id }, update: change, create: change });
  }

  // ═══════════════════════════════════════════
  // ═══ INTELLIGENCEOS DEMO DATA ═══
  // ═══════════════════════════════════════════

  // ═══ ENTITIES ═══
  const entities = [
    { id: 'ent-jkt', code: 'SSF-JKT', name: 'SSF Jakarta', jurisdiction: 'Indonesia', functionalCurrency: 'IDR', timezone: 'Asia/Jakarta' },
    { id: 'ent-sgp', code: 'SSF-SGP', name: 'SSF Singapore', jurisdiction: 'Singapore', functionalCurrency: 'SGD', timezone: 'Asia/Singapore' },
    { id: 'ent-mys', code: 'SSF-MYS', name: 'SSF Malaysia', jurisdiction: 'Malaysia', functionalCurrency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
    { id: 'ent-bali', code: 'BALI-CO', name: 'Bali CO', jurisdiction: 'Indonesia', functionalCurrency: 'IDR', timezone: 'Asia/Makassar' },
  ];
  for (const e of entities) {
    await prisma.intelEntity.upsert({ where: { id: e.id }, update: e, create: e });
  }
  console.log('Entities seeded.');

  // ═══ PROJECTS ═══
  const projects = [
    { id: 'ip-auto-tvc', projectCode: 'DEMO-2026-001', title: 'DEMO Automotive TVC', client: 'AutoCorp Asia', producer: 'Sarah Lois', type: 'TVC', state: 'pre_production', contractCurrency: 'IDR', entityId: 'ent-jkt', startDate: new Date('2026-09-15'), endDate: new Date('2026-12-31') },
    { id: 'ip-fmcg-digital', projectCode: 'DEMO-2026-002', title: 'DEMO FMCG Digital Campaign', client: 'Unilever SEA', producer: 'Afeeq', type: 'Digital', state: 'production', contractCurrency: 'SGD', entityId: 'ent-sgp', startDate: new Date('2026-10-01'), endDate: new Date('2026-11-30') },
    { id: 'ip-bank-brand', projectCode: 'DEMO-2026-003', title: 'DEMO Banking Brand Film', client: 'National Bank MY', producer: 'RLV', type: 'TVC', state: 'post_production', contractCurrency: 'MYR', entityId: 'ent-mys', startDate: new Date('2026-08-01'), endDate: new Date('2026-10-31') },
    { id: 'ip-luxury-tvc', projectCode: 'DEMO-2026-004', title: 'DEMO Luxury Resort TVC', client: 'Paradise Hotels', producer: 'Sarah Lois', type: 'TVC', state: 'delivered', contractCurrency: 'USD', entityId: 'ent-bali', startDate: new Date('2026-06-01'), endDate: new Date('2026-09-30') },
    { id: 'ip-telco-pitch', projectCode: 'DEMO-2026-005', title: 'DEMO Telco Rebrand', client: 'TelcoMax', producer: 'Afeeq', type: 'TVC', state: 'pitching', contractCurrency: 'IDR', entityId: 'ent-jkt' },
    { id: 'ip-snack-content', projectCode: 'DEMO-2026-006', title: 'DEMO Snack Content Series', client: 'SnackWise Corp', producer: 'RLV', type: 'Digital', state: 'awarded', contractCurrency: 'IDR', entityId: 'ent-jkt', startDate: new Date('2026-11-01') },
  ];
  for (const p of projects) {
    await prisma.intelProject.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log('IntelligenceOS projects seeded.');

  // ═══ CONTRACT VALUES & BUDGETS ═══
  const cvData = [
    { id: 'cv-1', projectId: 'ip-auto-tvc', contractValue: 3000000000, approvedChangeOrders: 0, currency: 'IDR' },
    { id: 'cv-2', projectId: 'ip-fmcg-digital', contractValue: 85000, approvedChangeOrders: 5000, currency: 'SGD' },
    { id: 'cv-3', projectId: 'ip-bank-brand', contractValue: 350000, approvedChangeOrders: 15000, currency: 'MYR' },
    { id: 'cv-4', projectId: 'ip-luxury-tvc', contractValue: 120000, approvedChangeOrders: 8000, currency: 'USD' },
    { id: 'cv-5', projectId: 'ip-telco-pitch', contractValue: 1500000000, approvedChangeOrders: 0, currency: 'IDR' },
    { id: 'cv-6', projectId: 'ip-snack-content', contractValue: 800000000, approvedChangeOrders: 0, currency: 'IDR' },
  ];
  for (const cv of cvData) {
    await prisma.projectContractValue.upsert({ where: { id: cv.id }, update: cv, create: cv });
  }

  // Budgets
  const budgets = [
    { id: 'bud-1', projectId: 'ip-auto-tvc', version: 1, currency: 'IDR', status: 'approved', totalAmount: 2400000000, approvedAt: new Date('2026-09-10') },
    { id: 'bud-2', projectId: 'ip-fmcg-digital', version: 1, currency: 'SGD', status: 'approved', totalAmount: 72000, approvedAt: new Date('2026-09-25') },
    { id: 'bud-3', projectId: 'ip-bank-brand', version: 1, currency: 'MYR', status: 'approved', totalAmount: 290000, approvedAt: new Date('2026-07-28') },
    { id: 'bud-4', projectId: 'ip-luxury-tvc', version: 1, currency: 'USD', status: 'approved', totalAmount: 95000, approvedAt: new Date('2026-05-20') },
  ];
  for (const b of budgets) {
    await prisma.intelBudget.upsert({ where: { id: b.id }, update: b, create: b });
  }

  // Budget lines for DEMO Automotive TVC (spec example)
  const autoLines = [
    { id: 'bl-1', budgetId: 'bud-1', costCode: 'PROD', description: 'Production', amount: 800000000 },
    { id: 'bl-2', budgetId: 'bud-1', costCode: 'CREW', description: 'Crew', amount: 500000000 },
    { id: 'bl-3', budgetId: 'bud-1', costCode: 'EQUIP', description: 'Equipment', amount: 350000000 },
    { id: 'bl-4', budgetId: 'bud-1', costCode: 'LOC', description: 'Location/Travel', amount: 300000000 },
    { id: 'bl-5', budgetId: 'bud-1', costCode: 'POST', description: 'Post-Production', amount: 300000000 },
    { id: 'bl-6', budgetId: 'bud-1', costCode: 'SFX', description: 'Music/SFX', amount: 100000000 },
    { id: 'bl-7', budgetId: 'bud-1', costCode: 'OTHER', description: 'Other', amount: 50000000 },
  ];
  for (const l of autoLines) {
    await prisma.intelBudgetLine.upsert({ where: { id: l.id }, update: l, create: l });
  }

  // ═══ COST COMMITMENTS (spec demo calc: actual=1.25B, committed->open=350M) ═══
  const commitments = [
    { id: 'cc-1', projectId: 'ip-auto-tvc', costCode: 'PROD', vendor: 'Studio Mega', committedAmount: 700000000, recognizedAmount: 550000000, currency: 'IDR' },
    { id: 'cc-2', projectId: 'ip-auto-tvc', costCode: 'CREW', vendor: 'Crew Collective', committedAmount: 450000000, recognizedAmount: 400000000, currency: 'IDR' },
    { id: 'cc-3', projectId: 'ip-auto-tvc', costCode: 'EQUIP', vendor: 'Rental House', committedAmount: 300000000, recognizedAmount: 200000000, currency: 'IDR' },
    { id: 'cc-4', projectId: 'ip-auto-tvc', costCode: 'LOC', vendor: 'Locations Co', committedAmount: 150000000, recognizedAmount: 100000000, currency: 'IDR' },
    { id: 'cc-5', projectId: 'ip-fmcg-digital', costCode: 'PROD', vendor: 'SG Studio', committedAmount: 35000, recognizedAmount: 28000, currency: 'SGD' },
    { id: 'cc-6', projectId: 'ip-fmcg-digital', costCode: 'CREW', vendor: 'SG Crew', committedAmount: 20000, recognizedAmount: 18000, currency: 'SGD' },
    { id: 'cc-7', projectId: 'ip-bank-brand', costCode: 'PROD', vendor: 'MY Studios', committedAmount: 180000, recognizedAmount: 170000, currency: 'MYR' },
  ];
  for (const c of commitments) {
    await prisma.costCommitment.upsert({ where: { id: c.id }, update: c, create: c });
  }

  // Cost to complete (remaining uncommitted) - spec: 390M
  const ctcLines = [
    { id: 'ctc-1', projectId: 'ip-auto-tvc', costCode: 'POST', remainingUncommittedCost: 200000000, reason: 'Post-production not yet contracted' },
    { id: 'ctc-2', projectId: 'ip-auto-tvc', costCode: 'SFX', remainingUncommittedCost: 90000000, reason: 'Music scoring pending' },
    { id: 'ctc-3', projectId: 'ip-auto-tvc', costCode: 'OTHER', remainingUncommittedCost: 100000000, reason: 'Contingency and other costs' },
  ];
  for (const l of ctcLines) {
    await prisma.costToCompleteLine.upsert({ where: { id: l.id }, update: l, create: l });
  }
  console.log('Finance data seeded.');

  // ═══ AR INVOICES ═══
  const now = new Date();
  const arInvoices = [
    { id: 'ar-1', invoiceNo: 'INV-2026-101', client: 'AutoCorp Asia', invoiceDate: new Date('2026-09-20'), dueDate: new Date('2026-10-20'), currency: 'IDR', grossAmount: 900000000, outstandingAmount: 900000000, status: 'open', entityId: 'ent-jkt', projectId: 'ip-auto-tvc' },
    { id: 'ar-2', invoiceNo: 'INV-2026-102', client: 'AutoCorp Asia', invoiceDate: new Date('2026-10-01'), dueDate: new Date('2026-11-01'), currency: 'IDR', grossAmount: 1200000000, outstandingAmount: 1200000000, status: 'open', entityId: 'ent-jkt', projectId: 'ip-auto-tvc' },
    { id: 'ar-3', invoiceNo: 'SGP-2026-050', client: 'Unilever SEA', invoiceDate: new Date('2026-09-15'), dueDate: new Date('2026-10-15'), currency: 'SGD', grossAmount: 42500, outstandingAmount: 42500, status: 'open', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital' },
    { id: 'ar-4', invoiceNo: 'SGP-2026-051', client: 'Unilever SEA', invoiceDate: new Date('2026-10-10'), dueDate: new Date('2026-12-10'), currency: 'SGD', grossAmount: 42500, outstandingAmount: 42500, status: 'open', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital' },
    { id: 'ar-5', invoiceNo: 'MYS-2026-030', client: 'National Bank MY', invoiceDate: new Date('2026-08-15'), dueDate: new Date('2026-09-15'), currency: 'MYR', grossAmount: 175000, outstandingAmount: 50000, status: 'partial', entityId: 'ent-mys', projectId: 'ip-bank-brand' },
    { id: 'ar-6', invoiceNo: 'BALI-2026-020', client: 'Paradise Hotels', invoiceDate: new Date('2026-07-01'), dueDate: new Date('2026-08-01'), currency: 'USD', grossAmount: 60000, outstandingAmount: 60000, status: 'overdue', entityId: 'ent-bali', projectId: 'ip-luxury-tvc' },
    { id: 'ar-7', invoiceNo: 'BALI-2026-021', client: 'Paradise Hotels', invoiceDate: new Date('2026-09-01'), dueDate: new Date('2026-10-01'), currency: 'USD', grossAmount: 60000, outstandingAmount: 60000, status: 'overdue', entityId: 'ent-bali', projectId: 'ip-luxury-tvc' },
  ];
  for (const inv of arInvoices) {
    await prisma.arInvoice.upsert({ where: { id: inv.id }, update: inv, create: inv });
  }

  // ═══ AP BILLS ═══
  const apBills = [
    { id: 'ap-1', billNo: 'VND-MEGA-001', vendor: 'Studio Mega', dueDate: new Date('2026-10-25'), currency: 'IDR', amount: 200000000, outstandingAmount: 200000000, status: 'open', entityId: 'ent-jkt', projectId: 'ip-auto-tvc' },
    { id: 'ap-2', billNo: 'VND-CREW-001', vendor: 'Crew Collective', dueDate: new Date('2026-11-10'), currency: 'IDR', amount: 150000000, outstandingAmount: 150000000, status: 'open', entityId: 'ent-jkt', projectId: 'ip-auto-tvc' },
    { id: 'ap-3', billNo: 'VND-RENT-001', vendor: 'Rental House', dueDate: new Date('2026-09-20'), currency: 'IDR', amount: 100000000, outstandingAmount: 100000000, status: 'overdue', entityId: 'ent-jkt', projectId: 'ip-auto-tvc' },
    { id: 'ap-4', billNo: 'VND-SG-001', vendor: 'SG Studio', dueDate: new Date('2026-10-30'), currency: 'SGD', amount: 18000, outstandingAmount: 18000, status: 'open', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital' },
    { id: 'ap-5', billNo: 'VND-MY-001', vendor: 'MY Studios', dueDate: new Date('2026-08-30'), currency: 'MYR', amount: 85000, outstandingAmount: 35000, status: 'partial', entityId: 'ent-mys', projectId: 'ip-bank-brand' },
    { id: 'ap-6', billNo: 'VND-BALI-001', vendor: 'Bali Location Services', dueDate: new Date('2026-07-15'), currency: 'USD', amount: 15000, outstandingAmount: 15000, status: 'overdue', entityId: 'ent-bali', projectId: 'ip-luxury-tvc' },
  ];
  for (const b of apBills) {
    await prisma.apBill.upsert({ where: { id: b.id }, update: b, create: b });
  }
  console.log('AR/AP seeded.');

  // ═══ 13-WEEK CASH FORECAST ═══
  const forecastStart = new Date('2026-10-26'); // current date context
  for (let scenario of ['base', 'optimistic', 'conservative']) {
    const mult = scenario === 'optimistic' ? 1.15 : scenario === 'conservative' ? 0.85 : 1;
    for (let w = 1; w <= 13; w++) {
      const weekStart = new Date(forecastStart);
      weekStart.setDate(forecastStart.getDate() + (w - 1) * 7);
      const receipts = Math.round((800000000 + Math.sin(w) * 200000000) * mult);
      const payments = Math.round((600000000 + Math.cos(w) * 150000000) * mult);
      await prisma.cashForecastLine.upsert({
        where: { id: `cf-${scenario}-r-${w}` },
        update: { scenario, weekLabel: `W${w}`, weekStartDate: weekStart, direction: 'receipt', amount: receipts, currency: 'IDR', category: 'Operating', assumption: `${scenario} forecast`, entityId: 'ent-jkt' },
        create: { id: `cf-${scenario}-r-${w}`, scenario, weekLabel: `W${w}`, weekStartDate: weekStart, direction: 'receipt', amount: receipts, currency: 'IDR', category: 'Operating', assumption: `${scenario} forecast`, entityId: 'ent-jkt' },
      });
      await prisma.cashForecastLine.upsert({
        where: { id: `cf-${scenario}-p-${w}` },
        update: { scenario, weekLabel: `W${w}`, weekStartDate: weekStart, direction: 'payment', amount: payments, currency: 'IDR', category: 'Operating', assumption: `${scenario} forecast`, entityId: 'ent-jkt' },
        create: { id: `cf-${scenario}-p-${w}`, scenario, weekLabel: `W${w}`, weekStartDate: weekStart, direction: 'payment', amount: payments, currency: 'IDR', category: 'Operating', assumption: `${scenario} forecast`, entityId: 'ent-jkt' },
      });
    }
  }
  console.log('Cash forecasts seeded.');

  // ═══ KNOWLEDGE DOCUMENTS ═══
  const knowledgeDocs = [
    { id: 'doc-1', title: 'DEMO Production Brief - Automotive TVC', category: 'production_brief', classification: 'public_internal', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', owner: 'Sarah Lois', extractedText: 'DEMO: Production brief for Automotive TVC campaign. Client: AutoCorp Asia. Objective: Hero brand film showcasing new electric vehicle lineup. Target audience: Urban professionals 28-45. Deliverables: 60s TVC, 30s cutdown, 15s social versions. Production timeline: October-December 2026. Key locations: Jakarta studio, Bali outdoor. Director: Sarah Lois.' },
    { id: 'doc-2', title: 'DEMO Call Sheet - Day 1 Studio Shoot', category: 'call_sheet', classification: 'public_internal', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', owner: 'Production Manager', extractedText: 'DEMO: Call sheet for Day 1. Studio A, Pondok Indah Studios. Call time: 06:00. Crew: 45 pax. Talent: 3 principals + 8 extras. Scenes: 1A, 1B, 2A. Catering: 07:00 breakfast, 12:00 lunch. Weather backup: Interior scenes only. Safety briefing: 05:45. Emergency contacts listed.' },
    { id: 'doc-3', title: 'DEMO Equipment List & Insurance', category: 'contract', classification: 'confidential', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', owner: 'Production Manager', extractedText: 'DEMO: Equipment insurance certificate. Policy #EQ-2026-4521. Coverage: All-risk production equipment. Sum insured: IDR 2.5B. Policy period: 15 Oct - 15 Dec 2026. Deductible: IDR 25M. Insurer: Asuransi XYZ. Includes: Camera package (ARRI Alexa Mini LF), lens set, lighting, grip, sound equipment.' },
    { id: 'doc-4', title: 'DEMO Location Permit - Bali Outdoor', category: 'permit', classification: 'public_internal', entityId: 'ent-bali', projectId: 'ip-auto-tvc', owner: 'Location Manager', extractedText: 'DEMO: Filming permit granted for Tanah Lot area. Permit #BALI-FILM-2026-089. Valid: 1-10 November 2026. Conditions: No drone flights above 50m. Maximum crew: 30 pax. Road closure approval pending. Community liaison: Mr. Made Wijaya.' },
    { id: 'doc-5', title: 'DEMO Safety Risk Assessment', category: 'safety', classification: 'public_internal', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', owner: 'Safety Officer', extractedText: 'DEMO: Risk assessment for Automotive TVC production. Identified risks: Vehicle stunts (high), crowd scenes (medium), night shoots (medium), outdoor weather (low). Mitigation: Professional stunt coordinator, crowd barriers, lighting safety checks. First aid station on set. Emergency evacuation plan attached.' },
    { id: 'doc-6', title: 'DEMO Vendor Rate Card - SG Studio', category: 'vendor', classification: 'restricted_finance', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital', owner: 'Afeeq', extractedText: 'DEMO: SG Studio rate card 2026. Studio A: SGD 8,000/day. Studio B: SGD 5,500/day. Equipment included. Additional lighting: SGD 1,200/day. Green screen: SGD 800/day. Overtime after 12hrs: 1.5x rate.' },
    { id: 'doc-7', title: 'DEMO SOP: Pre-Production Checklist', category: 'SOP', classification: 'public_internal', entityId: '', owner: 'Operations', extractedText: 'DEMO: Standard Operating Procedure for Pre-Production. Step 1: Client brief review and creative alignment. Step 2: Director treatment and storyboard approval. Step 3: Budget breakdown and approval. Step 4: Crew booking confirmation. Step 5: Location scouting and permits. Step 6: Equipment list and insurance. Step 7: Call sheet distribution 48hrs before shoot. Step 8: Safety briefing and emergency plan. Step 9: Client/agency on-set protocol confirmation.' },
    { id: 'doc-8', title: 'DEMO Post-Mortem: FMCG Digital Campaign', category: 'postmortem', classification: 'public_internal', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital', owner: 'Afeeq', extractedText: 'DEMO: Project post-mortem notes. Budget came in under by 8%. Client satisfaction: High. Key learning: Start casting 2 weeks earlier for Singapore market. Equipment rental from MY office saved 15% vs local. Color grading timeline was tight - allow extra day next time.' },
    { id: 'doc-9', title: 'DEMO Budget Template - Standard TVC', category: 'budget', classification: 'restricted_finance', entityId: '', owner: 'Finance', extractedText: 'DEMO: Standard TVC budget template. Categories: Pre-production (10-15%), Production (40-50%), Post-production (20-25%), Music/SFX (5-8%), Insurance/Contingency (5-8%). Typical IDR budgets range 1.5B-4B depending on scope. SGD projects: 60K-150K. Always include 5% contingency.' },
    { id: 'doc-10', title: 'DEMO Location Guide - Jakarta Studios', category: 'location', classification: 'public_internal', entityId: 'ent-jkt', owner: 'Location Manager', extractedText: 'DEMO: Jakarta studio guide. Pondok Indah Studios: 3 stages, largest 800sqm. Facilities include parking for 50 cars, green rooms, production offices. MD Place Studio: 2 stages, central location. Cibubur Studios: Outdoor backlot available. Contact details and rate negotiations handled by Location Dept.' },
    { id: 'doc-11', title: 'DEMO Incident Report - Equipment Damage', category: 'incident', classification: 'confidential', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', owner: 'Production Manager', extractedText: 'DEMO: Incident report. Date: 18 Oct 2026. A monitor fell from its stand during setup. No injuries. Monitor (SmallHD 1303) damaged - replacement ordered. Root cause: improper clamp attachment. Corrective action: Additional safety check added to equipment setup procedure. Insurance claim filed.' },
    { id: 'doc-12', title: 'DEMO Client Contract - Banking Brand Film', category: 'contract', classification: 'restricted_finance', entityId: 'ent-mys', projectId: 'ip-bank-brand', owner: 'RLV', extractedText: 'DEMO: Service agreement between SSF Malaysia and National Bank MY. Project: Brand film campaign. Total contract value: MYR 350,000. Payment terms: 50% upon award, 25% upon completion of shooting, 25% upon final delivery. Usage rights: 1 year broadcast + digital, Malaysia territory. Renewal option at MYR 50,000/year.' },
    { id: 'doc-13', title: 'DEMO Crew Engagement Template', category: 'contract', classification: 'public_internal', entityId: '', owner: 'HR', extractedText: 'DEMO: Standard crew engagement letter template. Includes: Project name, role, dates, day rate, overtime terms, meal allowance, transport, equipment responsibility, NDA clause, cancellation policy (48hr notice for daily crew, 1 week for key crew). Payment terms: Net 30 from invoice.' },
    { id: 'doc-14', title: 'DEMO Insurance Policy Summary', category: 'safety', classification: 'confidential', entityId: 'ent-jkt', owner: 'Finance', extractedText: 'DEMO: Annual production insurance summary. Public liability: IDR 10B per occurrence. Professional indemnity: IDR 5B. Workers compensation per statutory requirements. Equipment all-risk: per project endorsement. Third party property damage: IDR 2B. Policy renewal: January 2027.' },
    { id: 'doc-15', title: 'DEMO Delivery Specs - Digital Content', category: 'SOP', classification: 'public_internal', entityId: '', owner: 'Post-Production', extractedText: 'DEMO: Standard delivery specifications. TVC: ProRes 422 HQ, 1920x1080 or 3840x2160, 25fps (ID/MY/SG). Social: H.264, 1080x1920 (9:16), 1080x1080 (1:1). YouTube: 3840x2160 preferred. Color space: Rec.709. Audio: -24 LUFS integrated, stereo mix + M&E. Naming convention: CLIENT_PROJECT_VERSION_DATE.' },
  ];
  for (const d of knowledgeDocs) {
    await prisma.knowledgeDocument.upsert({ where: { id: d.id }, update: d, create: d });
  }
  console.log('Knowledge documents seeded.');

  // ═══ LESSONS LEARNED ═══
  const lessons = [
    { id: 'll-1', projectId: 'ip-luxury-tvc', category: 'logistics', observation: 'Equipment delivery to Bali took 3 days longer than expected due to customs clearance', recommendation: 'Always verify equipment delivery timeline 24 hours before the shoot. Book backup equipment locally for critical items.', submittedBy: 'Sarah Lois', status: 'approved', approvedBy: 'RLV' },
    { id: 'll-2', projectId: 'ip-fmcg-digital', category: 'crew', observation: 'Singapore casting agency required 2 weeks lead time for commercial talent', recommendation: 'Start casting process minimum 3 weeks before shoot date for Singapore projects', submittedBy: 'Afeeq', status: 'approved', approvedBy: 'RLV' },
    { id: 'll-3', projectId: 'ip-bank-brand', category: 'client', observation: 'Client approval process took longer than budgeted - 5 rounds vs expected 3', recommendation: 'Include client approval buffer of 2 extra rounds in timeline. Set clear approval deadline in contract.', submittedBy: 'RLV', status: 'pending' },
    { id: 'll-4', projectId: 'ip-auto-tvc', category: 'production', observation: 'Night shoot required additional generator rental not in original budget', recommendation: 'Always include generator costs in location budget for shoots outside studio hours', submittedBy: 'Sarah Lois', status: 'pending' },
  ];
  for (const l of lessons) {
    await prisma.lessonLearned.upsert({ where: { id: l.id }, update: l, create: l });
  }

  // ═══ CONTROL TEMPLATES ═══
  const controlTemplates = [
    { id: 'ct-acc-1', controlCode: 'ACC-001', title: 'Signed scope/contract', stageKey: 'acceptance', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Signed contract PDF' },
    { id: 'ct-acc-2', controlCode: 'ACC-002', title: 'Authorized quote and budget', stageKey: 'acceptance', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Approved budget document' },
    { id: 'ct-acc-3', controlCode: 'ACC-003', title: 'Assigned owner/producer', stageKey: 'acceptance', riskLevel: 'medium', mandatory: true, evidenceRequirement: 'Producer assignment confirmation' },
    { id: 'ct-acc-4', controlCode: 'ACC-004', title: 'Payment terms documented', stageKey: 'acceptance', riskLevel: 'medium', mandatory: true, evidenceRequirement: 'Payment schedule in contract' },
    { id: 'ct-pre-1', controlCode: 'PRE-001', title: 'Crew engagement documents', stageKey: 'pre_production', riskLevel: 'medium', mandatory: true, evidenceRequirement: 'Signed crew deal memos' },
    { id: 'ct-pre-2', controlCode: 'PRE-002', title: 'Location authorizations', stageKey: 'pre_production', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Location permits and agreements' },
    { id: 'ct-pre-3', controlCode: 'PRE-003', title: 'Applicable permits/insurance', stageKey: 'pre_production', riskLevel: 'critical', mandatory: true, evidenceRequirement: 'Insurance certificate and filming permits' },
    { id: 'ct-pre-4', controlCode: 'PRE-004', title: 'Safety risk review', stageKey: 'pre_production', riskLevel: 'critical', mandatory: true, evidenceRequirement: 'Completed risk assessment form' },
    { id: 'ct-pre-5', controlCode: 'PRE-005', title: 'Vendor commitments confirmed', stageKey: 'pre_production', riskLevel: 'medium', mandatory: false, evidenceRequirement: 'Vendor POs or confirmations' },
    { id: 'ct-shoot-1', controlCode: 'SHT-001', title: 'Finalized call sheet', stageKey: 'shoot_authorization', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Distributed call sheet' },
    { id: 'ct-shoot-2', controlCode: 'SHT-002', title: 'Location access confirmed', stageKey: 'shoot_authorization', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Location confirmation email/doc' },
    { id: 'ct-shoot-3', controlCode: 'SHT-003', title: 'Safety briefing and emergency plan', stageKey: 'shoot_authorization', riskLevel: 'critical', mandatory: true, evidenceRequirement: 'Signed safety briefing attendance' },
    { id: 'ct-post-1', controlCode: 'PST-001', title: 'Deliverable specs confirmed', stageKey: 'post_production_qc', riskLevel: 'medium', mandatory: true, evidenceRequirement: 'Delivery spec document' },
    { id: 'ct-post-2', controlCode: 'PST-002', title: 'Usage/license checks', stageKey: 'post_production_qc', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Music/talent license confirmations' },
    { id: 'ct-post-3', controlCode: 'PST-003', title: 'Client sign-off', stageKey: 'post_production_qc', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Client approval email' },
    { id: 'ct-close-1', controlCode: 'CLS-001', title: 'Final cost-to-complete review', stageKey: 'closure', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Final cost report' },
    { id: 'ct-close-2', controlCode: 'CLS-002', title: 'Client acceptance', stageKey: 'closure', riskLevel: 'high', mandatory: true, evidenceRequirement: 'Client acceptance letter' },
    { id: 'ct-close-3', controlCode: 'CLS-003', title: 'Outstanding payments resolved', stageKey: 'closure', riskLevel: 'medium', mandatory: true, evidenceRequirement: 'Payment reconciliation' },
    { id: 'ct-close-4', controlCode: 'CLS-004', title: 'Project retrospective', stageKey: 'closure', riskLevel: 'low', mandatory: false, evidenceRequirement: 'Retrospective meeting notes' },
  ];
  for (const ct of controlTemplates) {
    await prisma.controlTemplate.upsert({ where: { id: ct.id }, update: ct, create: ct });
  }

  // ═══ PROJECT STAGES & CONTROLS ═══
  const stageKeys = ['acceptance', 'pre_production', 'shoot_authorization', 'post_production_qc', 'closure'];
  const projectStageData: { pid: string; stages: { key: string; status: string }[] }[] = [
    { pid: 'ip-auto-tvc', stages: [
      { key: 'acceptance', status: 'approved' },
      { key: 'pre_production', status: 'in_progress' },
      { key: 'shoot_authorization', status: 'not_started' },
      { key: 'post_production_qc', status: 'not_started' },
      { key: 'closure', status: 'not_started' },
    ]},
    { pid: 'ip-fmcg-digital', stages: [
      { key: 'acceptance', status: 'approved' },
      { key: 'pre_production', status: 'approved' },
      { key: 'shoot_authorization', status: 'approved' },
      { key: 'post_production_qc', status: 'in_progress' },
      { key: 'closure', status: 'not_started' },
    ]},
    { pid: 'ip-bank-brand', stages: [
      { key: 'acceptance', status: 'approved' },
      { key: 'pre_production', status: 'approved' },
      { key: 'shoot_authorization', status: 'approved' },
      { key: 'post_production_qc', status: 'approved' },
      { key: 'closure', status: 'pending_review' },
    ]},
    { pid: 'ip-luxury-tvc', stages: stageKeys.map(k => ({ key: k, status: 'approved' })) },
    { pid: 'ip-snack-content', stages: [
      { key: 'acceptance', status: 'in_progress' },
      { key: 'pre_production', status: 'not_started' },
      { key: 'shoot_authorization', status: 'not_started' },
      { key: 'post_production_qc', status: 'not_started' },
      { key: 'closure', status: 'not_started' },
    ]},
  ];

  for (const psd of projectStageData) {
    for (const s of psd.stages) {
      const stageId = `ps-${psd.pid}-${s.key}`;
      await prisma.projectStage.upsert({
        where: { projectId_stageKey: { projectId: psd.pid, stageKey: s.key } },
        update: { status: s.status },
        create: { id: stageId, projectId: psd.pid, stageKey: s.key, status: s.status },
      });

      // Create project controls from templates
      const templates = controlTemplates.filter(ct => ct.stageKey === s.key);
      for (const tmpl of templates) {
        const ctrlId = `pc-${psd.pid}-${tmpl.id}`;
        const dbStage = await prisma.projectStage.findUnique({ where: { projectId_stageKey: { projectId: psd.pid, stageKey: s.key } } });
        if (!dbStage) continue;
        let ctrlStatus = 'pending';
        if (s.status === 'approved') ctrlStatus = 'verified';
        else if (s.status === 'in_progress') ctrlStatus = Math.random() > 0.5 ? 'evidence_submitted' : 'pending';
        else if (s.status === 'pending_review') ctrlStatus = 'evidence_submitted';

        await prisma.projectControl.upsert({
          where: { id: ctrlId },
          update: { status: ctrlStatus },
          create: { id: ctrlId, projectId: psd.pid, stageId: dbStage.id, controlTemplateId: tmpl.id, status: ctrlStatus, assignedUser: 'Demo User' },
        });
      }
    }
  }
  console.log('Stages & controls seeded.');

  // ═══ ISSUES & CORRECTIVE ACTIONS ═══
  const issues = [
    { id: 'iss-1', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', severity: 'high', title: 'Equipment damage during setup - monitor replacement needed', description: 'SmallHD 1303 monitor fell during rigging. Insurance claim filed. Replacement ordered.', ownerUser: 'Sarah Lois', dueAt: new Date('2026-11-05'), status: 'in_progress' },
    { id: 'iss-2', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', severity: 'critical', title: 'Bali outdoor permit road closure approval pending', description: 'Road closure for Tanah Lot area shoot still awaiting local government approval. Shoot date: Nov 5.', ownerUser: 'Location Manager', dueAt: new Date('2026-11-01'), status: 'open' },
    { id: 'iss-3', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital', severity: 'medium', title: 'Color grading timeline at risk', description: 'Colorist availability limited in November. May need backup colorist.', ownerUser: 'Afeeq', dueAt: new Date('2026-11-15'), status: 'open' },
    { id: 'iss-4', entityId: 'ent-mys', projectId: 'ip-bank-brand', severity: 'low', title: 'Client requesting additional 5s social cutdown not in scope', description: 'Client asked for extra 5s version. Need to assess cost impact and scope change.', ownerUser: 'RLV', dueAt: new Date('2026-11-10'), status: 'open' },
  ];
  for (const iss of issues) {
    await prisma.issue.upsert({ where: { id: iss.id }, update: iss, create: iss });
  }

  const cas = [
    { id: 'ca-1', issueId: 'iss-1', action: 'File insurance claim for damaged monitor', ownerUser: 'Finance', targetDate: new Date('2026-11-01'), status: 'completed' },
    { id: 'ca-2', issueId: 'iss-1', action: 'Order replacement SmallHD monitor from Jakarta supplier', ownerUser: 'Production Manager', targetDate: new Date('2026-10-30'), status: 'in_progress' },
    { id: 'ca-3', issueId: 'iss-1', action: 'Update equipment setup safety procedure', ownerUser: 'Safety Officer', targetDate: new Date('2026-11-05'), status: 'open' },
    { id: 'ca-4', issueId: 'iss-2', action: 'Escalate road closure permit to regional government liaison', ownerUser: 'Location Manager', targetDate: new Date('2026-10-30'), status: 'in_progress' },
  ];
  for (const ca of cas) {
    await prisma.correctiveAction.upsert({ where: { id: ca.id }, update: ca, create: ca });
  }

  // ═══ OBLIGATIONS ═══
  const obligations = [
    { id: 'obl-1', entityId: 'ent-jkt', jurisdiction: 'Indonesia', title: 'Monthly VAT filing', category: 'tax', dueAt: new Date('2026-11-20'), ownerUser: 'Finance', status: 'upcoming' },
    { id: 'obl-2', entityId: 'ent-jkt', jurisdiction: 'Indonesia', title: 'WHT 21 payroll submission', category: 'tax', dueAt: new Date('2026-11-10'), ownerUser: 'Finance', status: 'upcoming' },
    { id: 'obl-3', entityId: 'ent-sgp', jurisdiction: 'Singapore', title: 'GST quarterly filing', category: 'tax', dueAt: new Date('2026-12-31'), ownerUser: 'Finance', status: 'upcoming' },
    { id: 'obl-4', entityId: 'ent-mys', jurisdiction: 'Malaysia', title: 'Annual business license renewal', category: 'regulatory', dueAt: new Date('2027-01-15'), ownerUser: 'Admin', status: 'upcoming' },
    { id: 'obl-5', entityId: 'ent-jkt', jurisdiction: 'Indonesia', title: 'Production insurance renewal', category: 'insurance', dueAt: new Date('2027-01-01'), ownerUser: 'Finance', status: 'upcoming', notes: 'Review coverage limits before renewal' },
    { id: 'obl-6', entityId: 'ent-bali', jurisdiction: 'Indonesia', title: 'Bali filming permit annual renewal', category: 'regulatory', dueAt: new Date('2026-12-15'), ownerUser: 'Location Manager', status: 'upcoming' },
    { id: 'obl-7', entityId: 'ent-jkt', jurisdiction: 'Indonesia', title: 'BPJS Ketenagakerjaan monthly submission', category: 'filing', dueAt: new Date('2026-10-15'), ownerUser: 'HR', status: 'overdue' },
  ];
  for (const ob of obligations) {
    await prisma.obligation.upsert({ where: { id: ob.id }, update: ob, create: ob });
  }

  // ═══ DATA QUALITY EXCEPTIONS ═══
  const dqExceptions = [
    { id: 'dq-1', source: 'AR Import', objectRef: 'INV-2026-101', severity: 'warning', reason: 'Invoice currency mismatch with project contract currency', resolutionStatus: 'open' },
    { id: 'dq-2', source: 'Budget Validation', objectRef: 'DEMO-2026-005', severity: 'info', reason: 'Project in pitching state has no approved budget (expected)', resolutionStatus: 'dismissed' },
    { id: 'dq-3', source: 'AP Reconciliation', objectRef: 'VND-BALI-001', severity: 'error', reason: 'AP bill overdue by >90 days - vendor payment at risk', resolutionStatus: 'open' },
    { id: 'dq-4', source: 'FX Rates', severity: 'warning', reason: 'Using static demo FX rates - not connected to live rate feed', resolutionStatus: 'open', objectRef: 'SYSTEM' },
  ];
  for (const dq of dqExceptions) {
    await prisma.dataQualityException.upsert({ where: { id: dq.id }, update: dq, create: dq });
  }

  // ═══ AUDIT EVENTS ═══
  const auditEvents = [
    { id: 'ae-1', actorUserId: 'demo', objectType: 'project', objectId: 'ip-auto-tvc', action: 'created', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', at: new Date('2026-09-15') },
    { id: 'ae-2', actorUserId: 'demo', objectType: 'stage', objectId: 'ps-ip-auto-tvc-acceptance', action: 'approved', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', at: new Date('2026-09-20') },
    { id: 'ae-3', actorUserId: 'demo', objectType: 'document', objectId: 'doc-1', action: 'uploaded', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', at: new Date('2026-09-16') },
    { id: 'ae-4', actorUserId: 'demo', objectType: 'issue', objectId: 'iss-1', action: 'created', entityId: 'ent-jkt', projectId: 'ip-auto-tvc', at: new Date('2026-10-18') },
    { id: 'ae-5', actorUserId: 'demo', objectType: 'control', objectId: 'pc-ip-fmcg-digital-ct-acc-1', action: 'verified', entityId: 'ent-sgp', projectId: 'ip-fmcg-digital', at: new Date('2026-10-01') },
  ];
  for (const ae of auditEvents) {
    await prisma.auditEvent.upsert({ where: { id: ae.id }, update: ae, create: ae });
  }

  console.log('IntelligenceOS DEMO data seeded successfully!');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
