import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { getActiveSpecialties } from "../lib/specialtiesService";

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
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function Especialidades() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");

  // Load specialties
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        setLoading(true);
        const data = await getActiveSpecialties();
        setSpecialties(data);
      } catch (error) {
        console.error("Error loading specialties:", error);
        // Fallback data
        setSpecialties([
          {
            id: "1",
            title: "Cardiología",
            description: "Especialistas en el diagnóstico y tratamiento de enfermedades del corazón.",
            imageUrl: "/img/doctor-1.jpg",
          },
          {
            id: "2",
            title: "Neurología",
            description: "Expertos en el sistema nervioso y trastornos cerebrales.",
            imageUrl: "/img/doctor-2.jpg",
          },
          {
            id: "3",
            title: "Pediatría",
            description: "Cuidado especializado para niños, desde recién nacidos hasta adolescentes.",
            imageUrl: "/img/doctor-3.jpg",
          },
          {
            id: "4",
            title: "Dermatología",
            description: "Especialistas en el diagnóstico y tratamiento de afecciones de la piel.",
            imageUrl: "/img/doctor-4.jpg",
          },
          {
            id: "5",
            title: "Traumatología",
            description: "Tratamiento de lesiones y enfermedades del sistema musculoesquelético.",
            imageUrl: "/img/doctor-5.jpg",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSpecialties();
  }, []);

  // Get unique categories for filter (could be expanded based on specialty types)
  const categories = useMemo(() => {
    const uniqueCategories = ["todas"];
    specialties.forEach((specialty) => {
      // You could add category logic here if specialties have categories
      // For now, we'll keep it simple
    });
    return uniqueCategories;
  }, [specialties]);

  // Filter specialties based on search and category
  const filteredSpecialties = useMemo(() => {
    return specialties.filter((specialty) => {
      const matchesSearch = specialty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           specialty.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "todas" || specialty.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [specialties, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#e8ad0f]/5">
      <NavBar />

      {/* Hero Section */}
      <motion.div
        className="relative pt-24 pb-16 overflow-hidden"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
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

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            className="text-center"
            variants={fadeInUp}
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
              variants={fadeInUp}
            >
              Nuestras{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]">
                Especialidades
              </span>
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Descubre todas las especialidades médicas disponibles en nuestra plataforma.
              Encuentra el especialista perfecto para tus necesidades de salud.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        className="bg-white py-8 border-b border-gray-100"
        variants={fadeInLeft}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-[#4dbad9] focus:border-[#4dbad9] focus:outline-none transition-colors"
              />
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-600">
              {filteredSpecialties.length} especialidad{filteredSpecialties.length !== 1 ? 'es' : ''} encontrada{filteredSpecialties.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Specialties Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSpecialties.length === 0 ? (
            // No results
            <motion.div
              className="text-center py-16"
              variants={scaleUp}
              initial="initial"
              animate="animate"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No se encontraron especialidades
              </h3>
              <p className="text-gray-600">
                Intenta con otros términos de búsqueda
              </p>
            </motion.div>
          ) : (
            // Results grid
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredSpecialties.map((specialty) => (
                <motion.div
                  key={specialty.id}
                  variants={fadeInUp}
                  className="group"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                      <Image
                        src={specialty.imageUrl || "/img/doctor-1.jpg"}
                        alt={specialty.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#4dbad9] transition-colors">
                        {specialty.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {specialty.description}
                      </p>

                      {/* Action button */}
                      <motion.a
                        href={`/doctores?search=${encodeURIComponent(specialty.title)}`}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-[#4dbad9] to-[#4dbad9]/80 text-white font-medium text-sm hover:from-[#4dbad9]/90 hover:to-[#4dbad9] transition-all duration-300"
                        whileTap={{ scale: 0.98 }}
                      >
                        Ver especialistas
                        <svg
                          className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        className="bg-gradient-to-r from-[#011d2f] to-[#4dbad9]/80 text-white py-16"
        variants={scaleUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-6"
            variants={fadeInUp}
          >
            ¿No encuentras la especialidad que buscas?
          </motion.h2>
          <motion.p
            className="text-xl mb-8 text-white/90"
            variants={fadeInUp}
          >
            Explora todos nuestros doctores disponibles o contáctanos para más información
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/doctores"
              className="bg-[#e8ad0f] text-black px-8 py-4 rounded-xl font-semibold hover:bg-[#e8ad0f]/90 transition-all duration-300 transform hover:scale-105"
              whileTap={{ scale: 0.95 }}
            >
              Ver todos los doctores
            </motion.a>
            <motion.a
              href="/beneficios"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#011d2f] transition-all duration-300"
              whileTap={{ scale: 0.95 }}
            >
              Ver beneficios
            </motion.a>
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
