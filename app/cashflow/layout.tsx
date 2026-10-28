import { CashflowShell } from './_components/cashflow-shell';

export default function CashflowLayout({ children }: { children: React.ReactNode }) {
  return <CashflowShell>{children}</CashflowShell>;
}
