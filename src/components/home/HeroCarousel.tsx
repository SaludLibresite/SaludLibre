'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SLIDES = [
  '/img/doctor-1.jpg',
  '/img/doctor-2.jpg',
  '/img/doctor-3.jpg',
  '/img/doctor-4.jpg',
  '/img/doctor-5.jpg',
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/doctores?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="relative h-[600px] overflow-hidden sm:h-[700px]">
      {/* Background slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={SLIDES[current]}
            alt="Profesional de la salud"
            className="object-cover"
            priority={current === 0}
            fill
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#011d2f]/80 to-[#4dbad9]/30" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-white">Encontrá tu</span>
              <br />
              <span className="bg-gradient-to-r from-[#e8ad0f] via-white to-[#4dbad9] bg-clip-text text-transparent">
                médico ideal
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-white/80 sm:text-xl">
              Conectá con los mejores especialistas médicos en tu zona. Turnos rápidos, atención de calidad y cuidado
              personalizado.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-8 flex overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex flex-1 items-center gap-2 px-4">
                <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar doctor, especialidad, área..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full py-4 text-sm text-gray-900 placeholder-gray-400 outline-none sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="bg-[#e8910f] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#d4830d] sm:px-8 sm:text-base"
              >
                Buscar
              </button>
            </form>

            <div className="mt-6">
              <Link
                href="/doctores"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
              >
                Ver Doctores
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 sm:block"
        aria-label="Anterior"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 sm:block"
        aria-label="Siguiente"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-[#4dbad9]' : 'w-2 bg-white/50'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
