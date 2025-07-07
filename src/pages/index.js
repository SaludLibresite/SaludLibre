import HeroCarousel from "../components/HeroCarousel";
import InfoSection from "../components/InfoSection";
import StatsSection from "../components/StatsSection";
import GallerySection from "../components/GallerySection";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import React, { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Animation variants
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

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div>
      <motion.div
        className="w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <NavBar />

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="pb-8 mt-10"
        >
          <motion.div
            variants={fadeInUp}
            className="px-4 sm:px-6 lg:px-8"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <HeroCarousel
              images={[
                "/img/doctor-1.jpg",
                "/img/doctor-2.jpg",
                "/img/doctor-3.jpg",
              ]}
              className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInLeft}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-7xl mx-auto px-6"
        >
          <InfoSection
            firstTitle="Nuestro impacto en la salud"
            firstDescription="Conoce algunos de los logros y cifras que nos distinguen como hospital líder en la región."
            image="/img/doctor-4.jpg"
            title="Siempre estamos buscando mejorar la salud de nuestra comunidad"
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
            lastTitle="Nuestro compromiso con la salud"
            lastDescription="Nos esforzamos por ofrecer un servicio médico de alta calidad y un ambiente cómodo para nuestros pacientes, combinando la mejor tecnología con un trato humano excepcional."
          />
        </motion.div>

        <motion.div
          variants={scaleUp}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto my-20  overflow-hidden transform hover:scale-[1.02] transition-all duration-500"
          style={{ y }}
        >
          <StatsSection />
        </motion.div>

        <motion.div
          variants={fadeInRight}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <GallerySection />
        </motion.div>

        {/* Call to Action Section */}
        <motion.div
          variants={scaleUp}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto mb-20 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-12 sm:p-16 text-center shadow-2xl transform hover:scale-[1.02] transition-all duration-500"
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.3 },
          }}
        >
          <motion.div
            className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-10 mix-blend-overlay"
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
            className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-800/20"
            animate={{
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
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
              className="text-4xl font-bold mb-6 tracking-tight"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              ¿Listo para cuidar tu salud?
            </motion.h2>
            <motion.p
              className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Agenda una cita con nuestros especialistas y comienza tu camino
              hacia una mejor salud.
            </motion.p>
            <motion.button
              onClick={() => (window.location.href = "/doctores")}
              className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              whileHover={{
                scale: 1.1,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.95 }}
            >
              Agendar Cita Ahora
            </motion.button>
          </motion.div>
        </motion.div>

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
