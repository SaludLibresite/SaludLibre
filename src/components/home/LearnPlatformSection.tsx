'use client';

import { motion } from 'framer-motion';

export default function LearnPlatformSection() {
  return (
    <section className="relative overflow-hidden bg-[#011d2f] py-20">
      {/* Blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#4dbad9]/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#4dbad9]/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-bold uppercase tracking-widest text-[#e8ad0f]">Tutorial</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Aprendé a usar la plataforma</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Te dejamos los videos explicativos para el uso de la plataforma directamente desde nuestro canal de YouTube.
          </p>

          <a
            href="https://www.youtube.com/@saludlibre2025"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-red-600 hover:shadow-xl"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Ver Videos Explicativos
          </a>
        </motion.div>
      </div>
    </section>
  );
}
