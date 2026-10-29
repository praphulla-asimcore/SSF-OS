import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Runs during the Vercel build: seeds a fresh database once, never touches one that already has users.
async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.count();
    if (users > 0) {
      console.log(`Seed skipped: database already has ${users} user(s).`);
      return;
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log('Empty database detected, running seed...');
  execSync('tsx scripts/safe-seed.ts', { stdio: 'inherit' });
}

main().catch((err) => {
  console.error('Seed check failed:', err);
  process.exit(1);
});
