import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { IntelShell } from './_components/intel-shell';

export default async function IntelAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/intelligence/login');
  return <IntelShell user={session.user}>{children}</IntelShell>;
}
