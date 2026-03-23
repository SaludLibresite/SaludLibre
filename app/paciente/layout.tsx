'use client';

import { usePathname } from 'next/navigation';
import PatientLayout from '@/components/layout/PatientLayout';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';

const PUBLIC_PATHS = ['/paciente/login', '/paciente/register'];

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return <PatientLayout>{children}</PatientLayout>;
}
