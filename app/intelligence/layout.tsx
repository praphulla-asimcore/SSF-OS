import { IntelProviders } from './providers';

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <IntelProviders>{children}</IntelProviders>;
}
