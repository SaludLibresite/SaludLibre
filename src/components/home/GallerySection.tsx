'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Specialty {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  slug?: string;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export default function GallerySection() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    fetch('/api/specialties')
      .then((r) => r.json())
      .then((data) => {
        if (data.specialties?.length) {
          const mapped = data.specialties.map((s: Record<string, string>) => ({
            id: s.id,
            title: s.name || s.title,
            description: s.description || '',
            imageUrl: s.imageUrl || '/img/doctor-1.jpg',
            slug: s.slug || s.id,
          }));
          setSpecialties(pickRandom(mapped, 6));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Especialidades</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Descubrí las áreas de especialización médica disponibles. Nuestros profesionales pueden ayudarte a mejorar tu
            salud y bienestar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((spec, i) => (
            <motion.div
              key={spec.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link
                href={`/doctores?specialty=${encodeURIComponent(spec.title)}`}
                className="group block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-100 transition hover:shadow-lg"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={spec.imageUrl || '/img/doctor-1.jpg'}
                    alt={spec.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-[#4dbad9] px-3 py-1 text-xs font-semibold text-white">
                    Disponible
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-[#4dbad9]">
                    {spec.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{spec.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/especialidades"
            className="inline-flex items-center gap-2 rounded-xl bg-[#011d2f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a3a5c]"
          >
            Ver todas las especialidades
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
