import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { getAllSpecialties } from "../lib/specialtiesService";

export default function GallerySection({ specialties: initialSpecialties = [] }) {
  const [categories, setCategories] = useState(initialSpecialties);
  const [loading, setLoading] = useState(initialSpecialties.length === 0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center", // Centrar en mobile
    skipSnaps: false,
    breakpoints: {
      '(min-width: 768px)': { align: 'start' } // Alinear a la izquierda en desktop
    }
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Initialize from props
  useEffect(() => {
    if (initialSpecialties.length > 0) {
      setCategories(initialSpecialties);
      setLoading(false);
    }
  }, [initialSpecialties]);

  // Load specialties from Firebase (only as fallback if no initial data)
  useEffect(() => {
    if (initialSpecialties.length === 0) {
      const loadSpecialties = async () => {
        try {
          setLoading(true);
          const specialties = await getAllSpecialties();
          // Filter only active specialties
          const activeSpecialties = specialties.filter(
            (specialty) => specialty.isActive !== false
          );
          setCategories(activeSpecialties);
        } catch (error) {
          console.error("Error loading specialties:", error);
          // Fallback to default categories if Firebase fails
          const defaultCategories = [
            {
              id: "default-1",
              title: "Cardiología",
              description:
                "Especialistas en el diagnóstico y tratamiento de enfermedades del corazón.",
              imageUrl: "/img/doctor-1.jpg",
            },
            {
              id: "default-2",
              title: "Neurología",
              description:
                "Expertos en el sistema nervioso y trastornos cerebrales.",
              imageUrl: "/img/doctor-2.jpg",
            },
            {
              id: "default-3",
              title: "Pediatría",
              description:
                "Cuidado especializado para niños, desde recién nacidos hasta adolescentes.",
              imageUrl: "/img/doctor-3.jpg",
            },
          ];
          setCategories(defaultCategories);
        } finally {
          setLoading(false);
        }
      };

      loadSpecialties();
    }
  }, [initialSpecialties]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  return (
    <div className="relative py-24">
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

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 px-6 lg:px-8"
        >
          <motion.h2
            className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-800 sm:text-5xl"
          >
             Especialidades
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Descubre las áreas de especialización médica disponibles
            profesionales pueden ayudarte a mejorar tu salud y bienestar.
          </motion.p>
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <motion.a
              href="/especialidades"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-medium hover:from-cyan-700 hover:to-cyan-800 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver todas las especialidades
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
          </motion.div>
        </motion.div>

        {/* Embla carousel container with gradient overlays */}
        <div className="relative">
          {/* Left gradient overlay - hidden on mobile for better visibility */}
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-white to-transparent z-10" />
          {/* Right gradient overlay - hidden on mobile for better visibility */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-white to-transparent z-10" />

          {/* Carousel wrapper */}
          <div className="overflow-hidden px-2 sm:px-6 lg:px-8" ref={emblaRef}>
            <div className="flex -ml-2 sm:-ml-4 md:pl-[5%] md:[&>:nth-child(1)]:ml-24">
              {loading
                ? // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="min-w-0 flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] pl-2 sm:pl-4"
                    >
                      <div className="h-[36rem] bg-gray-200 rounded-3xl animate-pulse" />
                    </div>
                  ))
                : categories.map((category) => (
                    <motion.div
                      key={category.id}
                      className="min-w-0 flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] pl-2 sm:pl-4"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                    >
                      <motion.div
                        className="group relative h-[36rem] bg-white rounded-3xl overflow-hidden transition-all duration-300"
                        whileHover={{
                          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.15)",
                          transition: { duration: 0.3, ease: "easeOut" },
                        }}
                      >
                        {/* Imagen y overlay */}
                        <div className="absolute inset-0 z-0">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10 transition-opacity duration-300 opacity-60 group-hover:opacity-40" />
                          <Image
                            src={category.imageUrl}
                            alt={category.title}
                            fill
                            className="object-cover transition-all duration-700"
                            sizes="(max-width: 640px) 90vw, (max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                            priority
                          />
                        </div>

                        {/* Contenido */}
                        <div className="relative h-full z-10 flex flex-col justify-end p-4 sm:p-6 md:p-8">
                          {/* Badge de categoría */}
                          <div className="bg-amber-50 w-fit px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 shadow-sm">
                            <span className="text-xs sm:text-sm font-medium text-amber-700">
                              Especialidad médica
                            </span>
                          </div>

                          {/* Contenedor del texto principal */}
                          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 transition-transform duration-300 group-hover:translate-y-[-4px]">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 tracking-tight break-words hyphens-auto">
                              {category.title}
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 md:mb-8 line-clamp-3">
                              {category.description}
                            </p>

                            <motion.a
                              href={`/doctores?search=${encodeURIComponent(
                                category.title
                              )}`}
                              className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium text-xs sm:text-sm hover:from-amber-600 hover:to-yellow-600 transition-all duration-300"
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="hidden sm:inline">Encuentra tu especialista</span>
                              <span className="sm:hidden">Ver especialistas</span>
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 transform transition-transform duration-300 group-hover:translate-x-1"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </motion.a>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}

              {/* Card "Ver más" */}
              <motion.div
                className="min-w-0 flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] pl-2 sm:pl-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className="group relative h-[36rem] bg-gradient-to-br from-amber-50 to-white rounded-3xl overflow-hidden border-2 border-dashed border-amber-200 transition-all duration-300 hover:border-amber-300"
                  whileHover={{
                    boxShadow: "0 20px 60px -15px rgba(0,0,0,0.1)",
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 sm:mb-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                      ¿Buscas otro especialista?
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 px-2">
                      Explora todos los médicos especialistas disponibles y encuentra
                      exactamente lo que necesitas para tu salud
                    </p>
                    <motion.a
                      href="/doctores"
                      className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-medium text-sm hover:bg-amber-50 transition-colors duration-300"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="hidden sm:inline">Ver todos los doctores</span>
                      <span className="sm:hidden">Ver doctores</span>
                      <svg
                        className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover:translate-x-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </motion.a>
                  </div>
                </motion.div>
              </motion.div>

              {/* Card vacía para scroll */}
              <motion.div
                className="min-w-0 flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] pl-2 sm:pl-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
              >
                <div className="h-[36rem] w-full" />
              </motion.div>
            </div>
          </div>

          {/* Navigation buttons - Positioned over the gradients */}
          <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-2 z-20">
            <motion.button
              onClick={scrollPrev}
              className="p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 text-cyan-800"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </motion.button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-2 z-20">
            <motion.button
              onClick={scrollNext}
              className="p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 text-cyan-800"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "bg-cyan-600 w-6"
                  : "bg-cyan-200 hover:bg-cyan-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
