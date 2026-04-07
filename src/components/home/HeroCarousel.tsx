"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SLIDES = [
  {
    image: "/img/laboratorio-argue-en-acuerdo-con-saludlibre.webp",
    showText: false,
  },
  {
    image: "/img/doctor-1.jpg",
    showText: true,
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % SLIDES.length),
    [],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    const interval = setInterval(next, 8000);
    return () => clearInterval(interval);
  }, [current, next]);

  return (
    <section className="relative -mt-12 h-[600px] overflow-hidden sm:h-[110dvh]">
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
            src={SLIDES[current].image}
            alt="Profesional de la salud"
            className="object-cover object-top"
            priority={current === 0}
            fill
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay + Content (only when showText) */}
      {SLIDES[current].showText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#011d2f]/80 to-[#4dbad9]/30" />

          <div className="relative z-10 flex h-full items-center">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-2xl w-full"
              >
                <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                  <span className="text-white">Encontrá tu</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#e8ad0f] via-white to-[#4dbad9] bg-clip-text text-transparent">
                    médico ideal
                  </span>
                </h1>
                <p className="mt-4 max-w-lg text-lg text-white/80 sm:text-xl">
                  Conectá con los mejores especialistas médicos en tu zona. Turnos
                  rápidos, atención de calidad y cuidado personalizado.
                </p>
              </motion.div>
            </div>
          </div>
        </>
      )}

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 sm:block"
        aria-label="Anterior"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 sm:block"
        aria-label="Siguiente"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-[#4dbad9]" : "w-2 bg-white/50"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
