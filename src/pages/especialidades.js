import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { getActiveSpecialties } from "../lib/specialtiesService";



// Enhanced Animation variants with improved performance
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

const scaleUp = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Enhanced custom animation variants
const slideInFromBottom = {
  initial: { opacity: 0, y: 100 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  }),
};

const bounceIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export default function Especialidades({ specialties: initialSpecialties = [] }) {
  const [specialties, setSpecialties] = useState(initialSpecialties);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize specialties from props
  useEffect(() => {
    if (initialSpecialties.length > 0) {
      setSpecialties(initialSpecialties);
    }
  }, [initialSpecialties]);

  // Load specialties (only as fallback if no initial data)
  useEffect(() => {
    if (initialSpecialties.length === 0) {
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
    }
  }, [initialSpecialties]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSpecialtyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
        className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Enhanced Background decorative elements */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
        >
          {/* Primary gradient orbs */}
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


            {/* Main title with enhanced typography */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight"
              variants={fadeInUp}
            >
              Especialidades{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dbad9] via-[#4dbad9] to-[#e8ad0f] relative">
                Médicas
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
            </motion.h1>

            {/* Enhanced description */}
            <motion.div
              className="space-y-4 mb-12"
              variants={fadeInUp}
            >
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
                Conecta con los mejores especialistas de Argentina. Desde cardiología hasta neurología,
                encuentra el cuidado médico que necesitas.
              </p>
              <p className="text-lg text-gray-500 max-w-3xl mx-auto">
                Más de <span className="font-semibold text-[#4dbad9]">30 especialidades</span> disponibles con 
                profesionales certificados y de confianza.
              </p>
            </motion.div>

            {/* Key features */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 mb-8"
              variants={staggerContainer}
            >
              {[
                { text: "Especialistas Certificados" },
                { text: "Citas Online" },
                { text: "Reseñas Verificadas" },
                { text: "100% Seguro" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-sm border border-gray-100"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-2 h-2 bg-[#4dbad9] rounded-full"></div>
                  <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Search and Filter Section */}
      <motion.div
        className="bg-white/80 backdrop-blur-lg py-12 border-b border-gray-100"
        variants={fadeInLeft}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Enhanced Search Input */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <motion.svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ rotate: searchTerm ? 0 : 360 }}
                    transition={{ duration: 2, repeat: searchTerm ? 0 : Infinity }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </motion.svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar especialidad médica..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#4dbad9]/20 focus:border-[#4dbad9] focus:outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400"
                />
                {searchTerm && (
                  <motion.button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </div>

              {/* Filter options */}
              <div className="flex items-center space-x-4">
                {/* Specialty dropdown selector */}
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                    className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-4 h-4 text-[#4dbad9]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {filteredSpecialties.length} especialidades
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showSpecialtyDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.button>

                  {/* Dropdown menu */}
                  {showSpecialtyDropdown && (
                    <motion.div
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setShowSpecialtyDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Todas las especialidades
                        </button>
                        {specialties.map((specialty) => (
                          <button
                            key={specialty.id}
                            onClick={() => {
                              setSearchTerm(specialty.title);
                              setShowSpecialtyDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {specialty.title}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Active filters display */}
            {searchTerm && (
              <motion.div
                className="mt-4 flex items-center space-x-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="text-sm text-gray-500">Filtros activos:</span>
                <motion.div
                  className="inline-flex items-center space-x-2 bg-[#4dbad9]/10 text-[#4dbad9] px-3 py-1 rounded-lg text-sm font-medium"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span>"{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-[#4dbad9] hover:text-[#4dbad9]/70 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Specialties Grid */}
      <div className="py-20 bg-gradient-to-b from-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            // Enhanced Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  {/* Image skeleton */}
                  <div className="relative h-56 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  
                  {/* Content skeleton */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                    <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
                  </div>
                </motion.div>
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredSpecialties.map((specialty, index) => (
                <motion.div
                  key={specialty.id}
                  variants={fadeInUp}
                  className="relative"
                  custom={index}
                >
                  <div className="relative bg-white rounded-3xl shadow-lg transition-shadow duration-300 hover:shadow-xl overflow-hidden border border-gray-100/50 h-full backdrop-blur-sm">
                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none z-10" />
                    
                    {/* Enhanced Image Container */}
                    <div className="relative h-56 overflow-hidden rounded-t-3xl">
                      {/* Image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10" />
                      <Image
                        src={specialty.imageUrl || "/img/doctor-1.jpg"}
                        alt={specialty.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>

                    {/* Enhanced Content */}
                    <div className="relative p-6 z-20">
                      {/* Specialty Title - Clickeable */}
                      <div className="flex items-center justify-between mb-3">
                        <motion.a
                          href={`/doctores?search=${encodeURIComponent(specialty.title)}`}
                          className="text-xl font-bold text-gray-900 hover:text-[#4dbad9] transition-colors duration-300 cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {specialty.title}
                        </motion.a>
                        <motion.a
                          href={`/doctores?search=${encodeURIComponent(specialty.title)}`}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#4dbad9] hover:text-white transition-all duration-300 cursor-pointer"
                          whileHover={{ rotate: 15, scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.a>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                        {specialty.description}
                      </p>

                      {/* Enhanced Action Button */}
                      <motion.a
                        href={`/doctores?search=${encodeURIComponent(specialty.title)}`}
                        className="group/btn flex items-center justify-center w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-[#4dbad9] to-[#4dbad9]/90 text-white font-semibold text-sm hover:from-[#4dbad9]/90 hover:to-[#4dbad9] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>Ver especialistas</span>
                        <motion.svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          animate={{ x: [0, 3, 0] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            repeatType: "reverse",
                            ease: "easeInOut" 
                          }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </motion.svg>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <motion.div
        className="relative bg-gradient-to-br from-[#011d2f] via-[#4dbad9] to-[#011d2f] text-white py-20 overflow-hidden"
        variants={scaleUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {/* Background pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
          {/* Geometric pattern */}
          <div className="absolute top-10 left-10 w-16 h-16 border-2 border-white/20 rounded-xl rotate-45"></div>
          <div className="absolute top-20 right-20 w-12 h-12 border-2 border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-14 h-14 border-2 border-white/20 rounded-lg rotate-12"></div>
          <div className="absolute bottom-10 right-10 w-18 h-18 border-2 border-white/20 rounded-2xl -rotate-12"></div>
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            className="space-y-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Main headline */}
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
              variants={fadeInUp}
            >
              ¿No encuentras la{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8ad0f] to-yellow-300">
                especialidad
              </span>{" "}
              que buscas?
            </motion.h2>

            {/* Supporting text */}
            <motion.div
              className="space-y-4"
              variants={fadeInUp}
            >
              <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed">
                Tenemos más de 30 especialidades médicas y cientos de profesionales
                listos para atenderte.
              </p>
              <p className="text-lg text-white/80 max-w-3xl mx-auto">
                Explora nuestra amplia red de doctores o ponte en contacto con nosotros
                para encontrar exactamente lo que necesitas.
              </p>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 my-12"
              variants={staggerContainer}
            >
              {[
                { text: "Búsqueda avanzada" },
                { text: "Reserva online" },
                { text: "Consulta virtual" },
                { text: "Respuesta inmediata" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20"
                  variants={slideInFromBottom}
                  custom={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-2 h-2 bg-[#e8ad0f] rounded-full"></div>
                  <span className="text-white font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={fadeInUp}
            >
              <motion.a
                href="/doctores"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-gradient-to-r from-[#e8ad0f] to-yellow-400 rounded-2xl shadow-2xl hover:shadow-[#e8ad0f]/25 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-[#e8ad0f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Ver todos los doctores</span>
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>
              </motion.a>

              <motion.a
                href="/beneficios"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-transparent border-2 border-white rounded-2xl hover:bg-white hover:text-[#011d2f] transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center space-x-2">
                  <span>Conocer beneficios</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </motion.a>
            </motion.div>

            {/* Contact info */}
            <motion.div
              className="mt-12 pt-8 border-t border-white/20"
              variants={fadeInUp}
            >
              <p className="text-white/80 mb-4">
                ¿Necesitas ayuda personalizada? Contáctanos
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href="tel:+5491123456789" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>+54 9 11 2345-6789</span>
                </a>
                <a href="mailto:info@doctores-ar.com" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>info@doctores-ar.com</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <Footer />

      
    </div>
  );
}

// Server-side data fetching with ISR (Incremental Static Regeneration)
export async function getStaticProps() {
  try {
    const specialties = await getActiveSpecialties();
    
    return {
      props: {
        specialties,
      },
      // Revalidate every 10 minutes (600 seconds)
      revalidate: 600,
    };
  } catch (error) {
    console.error("Error fetching specialties:", error);
    
    // Return fallback data if there's an error
    return {
      props: {
        specialties: [],
      },
      revalidate: 600,
    };
  }
}
