'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    question: '¿Qué es Salud Libre?',
    answer:
      'Salud Libre es una plataforma digital que conecta pacientes con profesionales de la salud en Argentina. Ofrecemos un directorio de médicos verificados, sistema de agendamiento de turnos, gestión de historiales médicos digitales y almacenamiento seguro de recetas médicas.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    question: '¿Cómo agendo un turno médico?',
    answer:
      'Para agendar un turno, buscá el médico de tu preferencia, seleccioná una fecha y horario disponible en su calendario, completá tus datos y confirmá el turno. Vas a recibir una confirmación por email y SMS.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    question: '¿Es gratuito usar Salud Libre?',
    answer:
      'El registro y uso básico de la plataforma es gratuito. Esto incluye buscar médicos, ver perfiles profesionales y gestionar su historial médico. Algunas funcionalidades premium pueden tener costo adicional.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    question: '¿Qué tan segura es mi información médica?',
    answer:
      'Utilizamos encriptación de nivel bancario, servidores certificados y cumplimos con todas las regulaciones argentinas de protección de datos médicos. Su información está protegida con los más altos estándares de seguridad.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    question: '¿Funcionan los turnos con obra social?',
    answer:
      'Muchos profesionales aceptan diferentes obras sociales. Podés filtrar médicos por obra social en la búsqueda y confirmar la cobertura al agendar el turno.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Preguntas Frecuentes</h2>
          <p className="mt-3 text-gray-600">
            Resolvemos tus dudas más comunes sobre los servicios y atención.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4dbad9]/10">
                    <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={faq.icon} />
                    </svg>
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-900 sm:text-base">{faq.question}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-gray-100 px-6 pb-5 pt-4">
                        <p className="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/preguntas-frecuentes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4dbad9] hover:text-[#3da8c5] transition"
          >
            Ver todas las preguntas
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
