import React from "react";
import { motion } from "framer-motion";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import Head from "next/head";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function AcercaDe() {
  return (
    <>
      <Head>
        <title>Acerca de Nosotros - Salud Libre</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#e8ad0f]/5">
        <SEO 
          title="Acerca de Nosotros - Salud Libre"
          description="Conoce más sobre Salud Libre, nuestra misión de conectar pacientes con los mejores especialistas médicos en Argentina y facilitar el acceso a atención de calidad."
          url="/acerca-de"
        />
        <NavBar />

      {/* Hero Section */}
      <motion.div
        className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Background decorative elements */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
        >
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#4dbad9]/20 to-[#4dbad9]/5 rounded-full blur-3xl"
            animate={{
              x: [0, 40, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#e8ad0f]/15 to-[#e8ad0f]/5 rounded-full blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            variants={fadeInUp}
          >


            {/* Main title */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight"
              variants={fadeInUp}
            >
              Quiénes{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dbad9] via-[#4dbad9] to-[#e8ad0f] relative">
                Somos
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.div
              className="space-y-4 mb-12"
              variants={fadeInUp}
            >
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
                Somos la plataforma líder en Argentina que conecta pacientes con los mejores 
                especialistas médicos, facilitando el acceso a atención de calidad.
              </p>
              <p className="text-lg text-gray-500 max-w-3xl mx-auto">
                Con más de <span className="font-semibold text-[#4dbad9]">250,000 pacientes</span> atendidos 
                y <span className="font-semibold text-[#4dbad9]">30+ especialidades</span> disponibles.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mission Section */}
      <motion.section
        className="py-20 bg-white"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              variants={fadeInUp}
            >
              Nuestra Misión
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Democratizar el acceso a la atención médica de calidad, conectando pacientes 
              con especialistas de manera eficiente, segura y confiable.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Accesibilidad",
                description: "Facilitamos el acceso a especialistas médicos para todos los pacientes.",
                icon: "🏥",
                color: "bg-[#4dbad9]",
              },
              {
                title: "Calidad",
                description: "Garantizamos atención médica de la más alta calidad con profesionales certificados.",
                icon: "⭐",
                color: "bg-[#e8ad0f]",
              },
              {
                title: "Innovación",
                description: "Utilizamos tecnología de vanguardia para mejorar la experiencia médica.",
                icon: "🚀",
                color: "bg-[#4dbad9]",
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                variants={fadeInUp}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full transition-shadow duration-300 hover:shadow-xl">
                  <div
                    className={`w-16 h-16 rounded-2xl ${value.color} flex items-center justify-center mb-6 text-3xl`}
                  >
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Services Section */}
      <motion.section
        className="py-20 bg-gradient-to-br from-[#4dbad9]/5 via-white to-[#e8ad0f]/5"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            variants={fadeInUp}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              variants={fadeInUp}
            >
              Nuestros Servicios
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Ofrecemos soluciones integrales tanto para pacientes que buscan atención médica 
              como para profesionales que desean expandir su práctica.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Para Pacientes */}
            <motion.div
              variants={fadeInLeft}
              className="relative"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-full">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#4dbad9] flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    Para Pacientes
                  </h3>
                </div>

                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Accede a una plataforma completa para encontrar, contactar y reservar citas 
                  con los mejores especialistas médicos de Argentina.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Búsqueda avanzada de especialistas",
                    "Reserva de citas online",
                    "Consultas virtuales",
                    "Historial médico digital",
                    "Reseñas y calificaciones",
                    "Recordatorios automáticos"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#4dbad9] rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={() => (window.location.href = "/doctores")}
                  className="w-full bg-[#4dbad9] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#4dbad9] focus:ring-offset-2"
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Buscar Especialistas
                </motion.button>
              </div>
            </motion.div>

            {/* Para Doctores */}
            <motion.div
              variants={fadeInRight}
              className="relative"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-full">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#e8ad0f] flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    Para Doctores
                  </h3>
                </div>

                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Únete a nuestra plataforma y expande tu práctica médica con herramientas 
                  profesionales diseñadas para conectar con más pacientes.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Perfil profesional personalizado",
                    "Gestión de citas automatizada",
                    "Teleconsultas integradas",
                    "Sistema de pagos seguro",
                    "Reportes y analíticas",
                    "Soporte técnico 24/7"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#e8ad0f] rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={() => (window.location.href = "/beneficios#planes")}
                  className="w-full bg-[#e8ad0f] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#e8ad0f] focus:ring-offset-2"
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver Planes para Médicos
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-20 bg-white"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              variants={fadeInUp}
            >
              Nuestros Números
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Cifras que reflejan nuestro compromiso con la excelencia en atención médica
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "250,000+", label: "Pacientes Atendidos", color: "text-[#4dbad9]" },
              { number: "98%", label: "Satisfacción del Usuario", color: "text-[#e8ad0f]" },
              { number: "30+", label: "Especialidades Médicas", color: "text-[#4dbad9]" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl">
                  <motion.h3
                    className={`text-5xl md:text-6xl font-bold ${stat.color} mb-4`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                  >
                    {stat.number}
                  </motion.h3>
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="relative bg-gradient-to-br from-[#011d2f] via-[#011d2f]/90 to-[#4dbad9]/80 text-white py-20 overflow-hidden"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        {/* Background pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            className="space-y-8"
            variants={staggerContainer}
          >
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
              variants={fadeInUp}
            >
              ¿Listo para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8ad0f] to-yellow-300">
                comenzar?
              </span>
            </motion.h2>

            <motion.p
              className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed"
              variants={fadeInUp}
            >
              Únete a miles de usuarios que ya confían en nuestra plataforma 
              para sus necesidades médicas.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={fadeInUp}
            >
              <motion.button
                onClick={() => (window.location.href = "/doctores")}
                className="bg-[#e8ad0f] text-black px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#e8ad0f] focus:ring-offset-2 focus:ring-offset-black"
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                Buscar Especialistas
              </motion.button>
              <motion.button
                onClick={() => (window.location.href = "/beneficios")}
                className="border-2 border-[#e8ad0f] text-white bg-transparent px-10 py-4 rounded-xl font-semibold text-lg hover:bg-[#e8ad0f] hover:text-black transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#e8ad0f] focus:ring-offset-2 focus:ring-offset-white"
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                Únete como Médico
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
      </div>
    </>
  );
}