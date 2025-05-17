import HeroCarousel from "../components/HeroCarousel";
import InfoSection from "../components/InfoSection";
import StatsSection from "../components/StatsSection";
import GallerySection from "../components/GallerySection";
import FAQSection from "../components/FAQSection";
import NavBar from "../components/NavBar";
import React, { useEffect } from "react";
import { motion } from "framer-motion";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-slate-100 min-h-screen">
      <div className="w-full mx-auto">
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
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5",
          }}
        />

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="pb-4"
        >
          <motion.div variants={fadeInUp}>
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
              className="relative overflow-hidden rounded-2xl shadow-2xl"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 py-16"
        >
          <motion.div variants={fadeInUp}>
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
            variants={fadeInUp}
            className="my-16 bg-gradient-to-br from-blue-300 to-blue-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <StatsSection />
          </motion.div>

          <motion.div variants={fadeInUp} className="mb-16">
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
            variants={fadeInUp}
            className="relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 text-center shadow-2xl"
          >
            <div className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">
                ¿Listo para cuidar tu salud?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Agenda una cita con nuestros especialistas y comienza tu camino
                hacia una mejor salud.
              </p>
              <button
                onClick={() => (window.location.href = "/doctores")}
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Agendar Cita Ahora
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-4">
                Preguntas Frecuentes
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Resolvemos tus dudas más comunes sobre nuestros servicios y
                atención.
              </p>
            </div>
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
      </div>
    </div>
  );
}
