import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// SVG Icon Components
const HospitalIcon = () => (
  <svg
    className="w-6 h-6 text-cyan-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-6 h-6 text-cyan-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CreditCardIcon = () => (
  <svg
    className="w-6 h-6 text-cyan-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="w-6 h-6 text-cyan-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    className="w-6 h-6 text-cyan-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const questionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  }),
};

const answerVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
  },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: "0.5rem",
    transition: {
      duration: 0.4,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const iconVariants = {
  open: {
    rotate: 180,
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
  closed: {
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

// Sample FAQ data - curated from the full FAQ page
const sampleFaqs = [
  {
    question: "¿Qué es Salud Libre?",
    answer:
      "Salud Libre es una plataforma digital que conecta pacientes con profesionales de la salud en Argentina. Ofrecemos un directorio de médicos verificados, sistema de agendamiento de citas, gestión de historiales médicos digitales y almacenamiento seguro de recetas médicas.",
    icon: HospitalIcon,
  },
  {
    question: "¿Cómo agendo una cita médica?",
    answer:
      "Para agendar una cita, busque el médico de su preferencia, seleccione una fecha y horario disponible en su calendario, complete sus datos y confirme la cita. Recibirá una confirmación por email y SMS.",
    icon: CalendarIcon,
  },
  {
    question: "¿Es gratuito usar Salud Libre?",
    answer:
      "El registro y uso básico de la plataforma es gratuito. Esto incluye buscar médicos, ver perfiles profesionales y gestionar su historial médico. Algunas funcionalidades premium pueden tener costo adicional.",
    icon: CreditCardIcon,
  },
  {
    question: "¿Qué tan segura es mi información médica?",
    answer:
      "Utilizamos encriptación de nivel bancario, servidores certificados y cumplimos con todas las regulaciones argentinas de protección de datos médicos. Su información está protegida con los más altos estándares de seguridad.",
    icon: LockIcon,
  },
  {
    question: "¿Funcionan las citas con obra social?",
    answer:
      "Muchos de nuestros profesionales aceptan diferentes obras sociales. Puede filtrar médicos por obra social en nuestra búsqueda y confirmar la cobertura al agendar la cita.",
    icon: ClipboardIcon,
  },
];

export default function FAQSection() {
  return (
    <div className="relative bg-gradient-to-br from-white via-cyan-50/30 to-white rounded-2xl py-12">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-100 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl">
          {/* Header Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-800 mb-6 tracking-tight"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Preguntas Frecuentes
            </motion.h2>
            <motion.p
              className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Resolvemos tus dudas más comunes sobre nuestros servicios y
              atención.
            </motion.p>
          </motion.div>

          {/* FAQ List */}
          <motion.dl
            className="mt-8 divide-y divide-gray-900/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {sampleFaqs.map((faq, index) => {
              const IconComponent = faq.icon;
              return (
                <motion.div
                  key={faq.question}
                  custom={index}
                  variants={questionVariants}
                  className="py-6 first:pt-0 last:pb-0"
                >
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <dt>
                          <DisclosureButton className="group flex w-full items-start justify-between text-left">
                            <motion.div
                              className="flex items-center gap-3"
                              whileHover={{ x: 5 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 10,
                              }}
                            >
                              <div className="flex-shrink-0">
                                <IconComponent />
                              </div>
                              <span className="text-lg font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors">
                                {faq.question}
                              </span>
                            </motion.div>
                            <motion.span
                              className="ml-6 flex h-7 items-center"
                              variants={iconVariants}
                              animate={open ? "open" : "closed"}
                            >
                              <PlusSmallIcon
                                aria-hidden="true"
                                className="size-6 text-cyan-600 group-data-[open]:hidden"
                              />
                              <MinusSmallIcon
                                aria-hidden="true"
                                className="size-6 text-cyan-600 group-[&:not([data-open])]:hidden"
                              />
                            </motion.span>
                          </DisclosureButton>
                        </dt>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              variants={answerVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                            >
                              <DisclosurePanel
                                as="dd"
                                className="mt-2 pr-12 pl-12"
                                static
                              >
                                <motion.p
                                  className="text-base text-gray-600 leading-relaxed"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  {faq.answer}
                                </motion.p>
                              </DisclosurePanel>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </Disclosure>
                </motion.div>
              );
            })}
          </motion.dl>

          {/* Ver todas button */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            <Link href="/preguntas-frecuentes">
              <motion.button
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(6, 182, 212, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Ver todas las preguntas</span>
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </motion.svg>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
