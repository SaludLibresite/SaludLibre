import { Suspense } from 'react';
import DoctorSearch from '@/components/doctors/DoctorSearch';

export const metadata = { title: 'Buscar Doctores – SaludLibre' };

export default function DoctoresPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" /></div>}>
      <DoctorSearch />
    </Suspense>
  );
}
