import HeroCarousel from "../components/HeroCarousel";
import InfoSection from "../components/InfoSection";
import StatsSection from "../components/StatsSection";
import GallerySection from "../components/GallerySection";
import FAQSection from "../components/FAQSection";
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
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const scaleUp = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
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
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen overflow-hidden">
      <motion.div 
        className="w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <NavBar
          logo="/img/logo-hospital.png"
          links={[
            { href: "#servicios", label: "Servicios" },
            { href: "/doctores", label: "Doctores" },
            { href: "#especialidades", label: "Especialidades" },
            { href: "#nosotros", label: "Nosotros" },
            { href: "#contacto", label: "Contacto" },
          ]}
          button={{
            text: "Agendar Cita",
            onClick: () => (window.location.href = "/doctores"),
            className:
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105",
          }}
        />

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="pb-8"
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
              searchPlaceholder="Buscar doctor, especialidad, área..."
              onSearch={(q) => {
                if (q.trim()) {
                  window.location.href = `/doctores?search=${encodeURIComponent(
                    q
                  )}`;
                }
              }}
              className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <motion.div 
            variants={fadeInLeft}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-20"
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
            className="my-20 bg-gradient-to-br from-blue-400 to-blue-900 rounded-3xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-500"
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
            <GallerySection
              items={[
                {
                  id: 1,
                  title: "Avances en el tratamiento del cáncer",
                  href: "#",
                  description:
                    "Descubre los últimos avances en el tratamiento del cáncer y cómo estamos mejorando la calidad de vida de nuestros pacientes.",
                  imageUrl: "/img/doctor-2.jpg",
                  date: "Mar 16, 2024",
                  datetime: "2024-03-16",
                  author: {
                    name: "Dr. Michael Foster",
                    imageUrl: "/img/doctor-1.jpg",
                  },
                  category: "Oncología",
                },
                {
                  id: 2,
                  title: "Cuidado preventivo: La clave de una buena salud",
                  href: "#",
                  description:
                    "La importancia de la prevención en la salud y cómo nuestros programas de chequeo preventivo pueden ayudarte.",
                  imageUrl: "/img/doctor-5.jpg",
                  date: "Mar 15, 2024",
                  datetime: "2024-03-15",
                  author: {
                    name: "Dra. Sarah Johnson",
                    imageUrl: "/img/doctor-7.jpg",
                  },
                  category: "Prevención",
                },
              ]}
            />
          </motion.div>

          {/* Call to Action Section */}
          <motion.div
            variants={scaleUp}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mb-20 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-12 sm:p-16 text-center shadow-2xl transform hover:scale-[1.02] transition-all duration-500"
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-10 mix-blend-overlay"
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse"
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
                repeatType: "reverse"
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
                  transition: { duration: 0.2 }
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
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <motion.h2 
                className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-6 tracking-tight"
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
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <FAQSection
                faqs={[
                  {
                    question: "¿Cómo puedo agendar una cita?",
                    answer:
                      "Puedes agendar una cita de tres formas: 1) A través de nuestro sitio web en la sección de doctores, 2) Llamando a nuestro centro de atención al paciente, o 3) Visitando nuestras instalaciones. Te recomendamos usar nuestra plataforma online para una experiencia más rápida y conveniente.",
                    icon: "📅",
                  },
                  {
                    question: "¿Qué especialidades ofrecen?",
                    answer:
                      "Contamos con más de 30 especialidades médicas, incluyendo cardiología, neurología, pediatría, ginecología, traumatología, y muchas más. Nuestro equipo de especialistas está altamente calificado y en constante actualización.",
                    icon: "👨‍⚕️",
                  },
                  {
                    question: "¿Aceptan seguros médicos?",
                    answer:
                      "Sí, trabajamos con la mayoría de los seguros médicos nacionales e internacionales. Nuestro equipo de asesores puede ayudarte a verificar la cobertura de tu seguro y explicarte los beneficios disponibles.",
                    icon: "💳",
                  },
                  {
                    question: "¿Dónde están ubicados?",
                    answer:
                      "Estamos ubicados en el centro de la ciudad, con fácil acceso por transporte público y amplio estacionamiento para nuestros pacientes. Contamos con señalización clara y personal de recepción para guiarte.",
                    icon: "📍",
                  },
                ]}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
