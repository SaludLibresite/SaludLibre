'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';

interface Specialty {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  slug?: string;
}

const FALLBACK_SPECIALTIES: Specialty[] = [
  { id: '1', title: 'Cardiología', description: 'Especialistas en el diagnóstico y tratamiento de enfermedades del corazón.', imageUrl: '/img/doctor-1.jpg', slug: 'cardiologia' },
  { id: '2', title: 'Neurología', description: 'Expertos en el sistema nervioso y trastornos cerebrales.', imageUrl: '/img/doctor-2.jpg', slug: 'neurologia' },
  { id: '3', title: 'Pediatría', description: 'Cuidado especializado para niños, desde recién nacidos hasta adolescentes.', imageUrl: '/img/doctor-3.jpg', slug: 'pediatria' },
  { id: '4', title: 'Dermatología', description: 'Diagnóstico y tratamiento de enfermedades de la piel.', imageUrl: '/img/doctor-4.jpg', slug: 'dermatologia' },
  { id: '5', title: 'Traumatología', description: 'Especialistas en lesiones musculoesqueléticas y del sistema locomotor.', imageUrl: '/img/doctor-5.jpg', slug: 'traumatologia' },
];

export default function GallerySection() {
  const [specialties, setSpecialties] = useState<Specialty[]>(FALLBACK_SPECIALTIES);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1 });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetch('/api/specialties')
      .then((r) => r.json())
      .then((data) => {
        if (data.specialties?.length) {
          setSpecialties(
            data.specialties.slice(0, 8).map((s: Record<string, string>) => ({
              id: s.id,
              title: s.name || s.title,
              description: s.description || '',
              imageUrl: s.imageUrl || '/img/doctor-1.jpg',
              slug: s.slug || s.id,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

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

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-5">
              {specialties.map((spec, i) => (
                <motion.div
                  key={spec.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]"
                >
                  <Link
                    href={`/especialidades/${spec.slug}`}
                    className="group block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-100 transition hover:shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={spec.imageUrl || '/img/doctor-1.jpg'}
                        alt={spec.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-[#4dbad9] px-3 py-1 text-xs font-semibold text-white">
                        Disponible
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#4dbad9] transition-colors">
                        {spec.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{spec.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Nav arrows */}
          {canPrev && (
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-lg ring-1 ring-gray-200 transition hover:bg-gray-50 sm:block"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {canNext && (
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-lg ring-1 ring-gray-200 transition hover:bg-gray-50 sm:block"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {specialties.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${i === selectedIndex ? 'w-6 bg-[#4dbad9]' : 'w-2 bg-gray-300'}`}
            />
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
