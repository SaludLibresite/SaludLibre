'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Point {
  icon: string;
  name: string;
  description: string;
}

interface InfoSectionProps {
  image: string;
  title: string;
  points: Point[];
  firstTitle?: string;
  firstDescription?: string;
  lastTitle?: string;
  lastDescription?: string;
  reverse?: boolean;
}

export default function InfoSection({
  image,
  title,
  points,
  firstTitle,
  firstDescription,
  lastTitle,
  lastDescription,
  reverse = false,
}: InfoSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col items-center gap-12 lg:flex-row ${reverse ? 'lg:flex-row-reverse' : ''}`}>
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative w-full lg:w-1/2"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <img src={image} alt={title} fill className="object-cover" />
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-gradient-to-br from-[#4dbad9]/20 to-[#e8ad0f]/20" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            {firstTitle && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#4dbad9]">{firstTitle}</h3>
                {firstDescription && <p className="mt-1 text-sm text-gray-600">{firstDescription}</p>}
              </div>
            )}

            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              <span className="bg-gradient-to-r from-[#4dbad9] to-[#011d2f] bg-clip-text text-transparent">{title}</span>
            </h2>

            <div className="mt-8 space-y-5">
              {points.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4dbad9]/10">
                    <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={point.icon} />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{point.name}</h4>
                    <p className="mt-0.5 text-sm text-gray-600">{point.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {lastTitle && (
              <div className="mt-8 rounded-xl bg-gradient-to-r from-[#4dbad9]/5 to-[#e8ad0f]/5 p-5">
                <h4 className="font-semibold text-gray-900">{lastTitle}</h4>
                {lastDescription && <p className="mt-1 text-sm text-gray-600">{lastDescription}</p>}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
