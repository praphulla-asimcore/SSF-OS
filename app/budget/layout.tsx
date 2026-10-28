import { BudgetShell } from './_components/budget-shell';

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return <BudgetShell>{children}</BudgetShell>;
}
