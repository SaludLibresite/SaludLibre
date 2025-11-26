import HeroCarousel from "../components/HeroCarousel";
import InfoSection from "../components/InfoSection";
import LearnPlatformSection from "../components/LearnPlatformSection";
import StatsSection from "../components/StatsSection";
import GallerySection from "../components/GallerySection";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

// Enhanced Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
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
      duration: 0.8,
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
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const scaleUp = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const slideInFromBottom = {
  initial: { opacity: 0, y: 100 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// Services data
const services = [
  {
    title: "Consultas Médicas",
    description: "Atención médica especializada con los mejores profesionales",
    icon: "👨‍⚕️",
    color: "bg-[#4dbad9]",
  },
  {
    title: "Telemedicina",
    description: "Consultas virtuales desde la comodidad de tu hogar",
    icon: "💻",
    color: "bg-[#e8ad0f]",
  },
 
  {
    title: "Recetas digitales",
    description: "Emisión de recetas electrónicas válidas, seguras y fáciles de compartir",
    icon: "💊",
    color: "bg-[#4dbad9]",
  },
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    setIsLoaded(true);
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#e8ad0f]/5">
      <motion.div
        className="w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <NavBar />

        {/* Enhanced Hero Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="relative pb-8 mt-10 overflow-hidden"
        >
          {/* Background decorative elements */}
          <motion.div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 1, duration: 2 }}
          >
            <motion.div
              className="absolute -top-40 -right-40 w-80 h-80 bg-[#4dbad9]/30 rounded-full blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#e8ad0f]/20 rounded-full blur-3xl"
              animate={{
                x: [0, -30, 0],
                y: [0, 20, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="px-4 sm:px-6 lg:px-8 relative z-10"
          >
            <HeroCarousel
              images={[
                "/img/doctor-1.jpg",
                "/img/doctor-2.jpg",
                "/img/doctor-3.jpg",
              ]}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            />
          </motion.div>
        </motion.div>

        {/* Medical Professionals Section */}
        <motion.section
          className="py-16 bg-gradient-to-br from-[#011d2f]/5 via-white to-[#4dbad9]/5"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl p-8 shadow-lg border border-[#4dbad9]/20"
            >
              <motion.div
                className="flex items-center justify-center mb-6"
                variants={fadeInUp}
              >
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6"
                    />
                  </svg>
                </div>
                <motion.h3
                  className="text-2xl md:text-3xl font-bold text-gray-900"
                  variants={fadeInUp}
                >
                  ¿Deseas crecer tu práctica médica?
                </motion.h3>
              </motion.div>
              <motion.p
                className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Únete a nuestra plataforma y conecta con más pacientes. 
                Ofrecemos herramientas profesionales para expandir tu consulta y 
                mejorar la gestión de tu práctica médica.
              </motion.p>
              <motion.button
                onClick={() => (window.location.href = "/beneficios")}
                className="bg-[#e8ad0f] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#e8ad0f] focus:ring-offset-2"
                variants={fadeInUp}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                Ver Planes para Médicos
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* New Services Section */}
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
                Servicios Médicos Disponibles
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Ofrecemos una amplia gama de servicios médicos especializados
                para cuidar de tu salud y la de tu familia con la más alta calidad.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  variants={slideInFromBottom}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full transition-shadow duration-300 hover:shadow-xl">
                    <div
                      className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center mb-6 text-3xl`}
                    >
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Enhanced Info Section */}
        <motion.div
          variants={fadeInLeft}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-7xl mx-auto px-6"
        >
          <InfoSection
            firstTitle="El impacto en la salud"
            firstDescription="Conoce algunos de los logros y cifras que distinguen a los profesionales médicos en la región."
            image="/img/doctor-4.jpg"
            title="Buscamos mejorar la salud de la comunidad"
            points={[
              {
                name: "Atención médica de calidad",
                description:
                  "Atención médica de calidad y personalizada con los más altos estándares internacionales.",
                icon: "🏥",
              },
              {
                name: "Equipo médico calificado",
                description:
                  "Equipo médico altamente calificado con especialistas de reconocida trayectoria.",
                icon: "👨‍⚕️",
              },
              {
                name: "Tecnología de punta",
                description:
                  "Tecnología de punta en diagnóstico y tratamiento para resultados óptimos.",
                icon: "🔬",
              },
              {
                name: "Compromiso con la innovación",
                description:
                  "Compromiso constante con la innovación y la investigación médica.",
                icon: "💡",
              },
            ]}
          />
        </motion.div>

        {/* Learn Platform Section */}
        <motion.div
          variants={fadeInLeft}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-7xl mx-auto px-6"
        >
          <LearnPlatformSection />
        </motion.div>

        
        {/* Enhanced Gallery Section */}
        <motion.div
          variants={fadeInRight}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <GallerySection />
        </motion.div>

        {/* Enhanced Stats Section */}
        <motion.div
          variants={scaleUp}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto my-20 overflow-hidden"
          style={{ y }}
        >
          <StatsSection />
        </motion.div>

        {/* Enhanced Call to Action Section */}
        <motion.div
          variants={scaleUp}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto mb-20 overflow-hidden rounded-3xl bg-gradient-to-br from-[#011d2f] via-[#011d2f]/90 to-[#4dbad9]/80 text-white p-12 sm:p-16 lg:p-20 text-center shadow-2xl"
        >
          {/* Dark subtle background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Enhanced background effects */}
          <motion.div
            className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-10 mix-blend-overlay"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#4dbad9]/20 to-[#e8ad0f]/20"
            animate={{
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          {/* Floating elements - subtle with dark background */}
          <motion.div
            className="absolute top-10 right-10 w-20 h-20 bg-[#4dbad9]/20 rounded-full blur-xl pointer-events-none"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-16 h-16 bg-[#e8ad0f]/15 rounded-full blur-xl pointer-events-none"
            animate={{
              y: [0, 15, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.h2
              className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-white drop-shadow-lg"
            >
              ¿Listo para cuidar tu salud?
            </motion.h2>
            <motion.p
              className="text-xl mb-10 text-white max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Agenda una cita con especialistas y comienza tu camino
              hacia una mejor salud. Tu bienestar es la prioridad.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
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
                Agendar Cita Ahora
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
                Ver Beneficios
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Enhanced FAQ Section */}
        <motion.div
          variants={fadeInUp}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <FAQSection />
        </motion.div>

        <Footer />

    
      </motion.div>
    </div>
  );
}
