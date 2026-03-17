'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: '¿Cómo funciona SaludLibre?',
    a: 'SaludLibre es una plataforma que conecta pacientes con profesionales de la salud. Podés buscar médicos por especialidad, zona y disponibilidad, agendar turnos online y realizar videoconsultas.',
  },
  {
    q: '¿Cómo agendo un turno?',
    a: 'Buscá al profesional que necesitás, seleccioná un día y horario disponible, y confirmá tu turno. Recibirás una confirmación con todos los detalles.',
  },
  {
    q: '¿Tiene costo para los pacientes?',
    a: 'No, la plataforma es totalmente gratuita para pacientes. Podés buscar profesionales, agendar turnos y acceder a tu historial sin costo alguno.',
  },
  {
    q: '¿Cómo funcionan las videoconsultas?',
    a: 'Las videoconsultas se realizan directamente desde la plataforma. Tu médico creará una sala virtual y te compartirá el enlace para unirte. Solo necesitás un dispositivo con cámara y micrófono.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí, tomamos la seguridad de tus datos muy en serio. Toda la información se almacena de forma encriptada y cumplimos con las normativas de protección de datos personales.',
  },
  {
    q: '¿Qué planes hay para profesionales?',
    a: 'Ofrecemos tres planes: Free (perfil básico gratuito), Medium ($15,000/mes con gestión de pacientes y agenda) y Plus ($25,000/mes con videoconsultas incluidas).',
  },
  {
    q: '¿Aceptan obras sociales?',
    a: 'Cada profesional indica las obras sociales y prepagas que acepta en su perfil. Podés filtrar por obra social al buscar profesionales.',
  },
  {
    q: '¿Cómo puedo cancelar un turno?',
    a: 'Podés cancelar tu turno desde la sección "Mis Citas" en tu panel de paciente. Te recomendamos hacerlo con al menos 24 horas de anticipación.',
  },
];

export default function PreguntasFrecuentesPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Preguntas Frecuentes</h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-500">
          Respuestas a las dudas más comunes sobre nuestra plataforma
        </p>
        <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />
      </div>

      <div className="mt-12 space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="pr-4 font-medium text-gray-900">{faq.q}</span>
              <svg
                className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="border-t border-gray-50 px-6 py-4">
                <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
