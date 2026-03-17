'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Specialty {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export default function EspecialidadesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/specialties');
        if (res.ok) {
          const data = await res.json();
          setSpecialties(data.specialties ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Especialidades Médicas</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500">
          Encontrá profesionales en más de 50 especialidades médicas. Seleccioná una para ver los doctores disponibles.
        </p>
        <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />
      </div>

      <div className="mt-12">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {specialties.map((spec) => (
              <Link
                key={spec.id}
                href={`/doctores?specialty=${encodeURIComponent(spec.title)}`}
                className="group flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4dbad9]/10 text-[#4dbad9] transition group-hover:bg-[#4dbad9] group-hover:text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900">{spec.title}</span>
                  {spec.description && <p className="mt-0.5 truncate text-xs text-gray-400">{spec.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
