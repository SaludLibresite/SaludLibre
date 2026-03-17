'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import Footer from './Footer';
import ChatBubble from '../chat/ChatBubble';

const EXCLUDED_PREFIXES = ['/paciente', '/admin', '/superadmin'];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideShell) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBubble />
    </div>
  );
}
