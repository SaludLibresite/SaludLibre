'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function useAnimatedCounter(end: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { value, ref };
}

const STATS = [
  {
    key: 'doctors',
    suffix: '+',
    label: 'Médicos registrados',
    description: 'Profesionales de la salud verificados y disponibles en nuestra plataforma.',
    color: 'border-[#4dbad9]',
    bg: 'bg-white',
    text: 'text-[#4dbad9]',
  },
  {
    key: 'satisfaction',
    value: 98,
    suffix: '%',
    label: 'Satisfacción del paciente',
    description: 'Los pacientes reportan altos niveles de satisfacción con los servicios médicos especializados.',
    color: 'border-transparent',
    bg: 'bg-gradient-to-br from-[#011d2f] to-[#0a3a5c]',
    text: 'text-white',
    labelColor: 'text-gray-300',
    descColor: 'text-gray-400',
  },
  {
    key: 'specialties',
    value: 50,
    suffix: '+',
    label: 'Especialidades médicas',
    description: 'Contamos con más de 50 especialidades médicas para cubrir todas tus necesidades de salud.',
    color: 'border-transparent',
    bg: 'bg-gradient-to-br from-[#e8ad0f] to-[#e8910f]',
    text: 'text-white',
    labelColor: 'text-white/90',
    descColor: 'text-white/70',
  },
];

export default function StatsSection() {
  const [doctorsCount, setDoctorsCount] = useState(89);
  const doctors = useAnimatedCounter(doctorsCount);
  const satisfaction = useAnimatedCounter(98);
  const specialties = useAnimatedCounter(50);

  useEffect(() => {
    fetch('/api/doctors?limit=0')
      .then((r) => r.json())
      .then((d) => {
        if (d.total) setDoctorsCount(d.total);
      })
      .catch(() => {});
  }, []);

  const counters = { doctors, satisfaction, specialties };

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Comprometidos con la excelencia en atención médica
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Brindamos la mejor atención médica posible, con profesionales altamente capacitados y tecnología de
            vanguardia para cuidar tu salud y la de tu familia.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STATS.map((stat, i) => {
            const counter = counters[stat.key as keyof typeof counters];
            const finalValue = stat.value ?? doctorsCount;
            return (
              <motion.div
                key={stat.key}
                ref={counter.ref}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`rounded-2xl border-2 ${stat.color} ${stat.bg} p-8 shadow-md`}
              >
                <p className={`text-5xl font-extrabold ${stat.text}`}>
                  {counter.value}
                  {stat.suffix}
                </p>
                <p className={`mt-2 text-lg font-semibold ${stat.labelColor ?? 'text-gray-900'}`}>{stat.label}</p>
                <p className={`mt-2 text-sm ${stat.descColor ?? 'text-gray-500'}`}>{stat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
