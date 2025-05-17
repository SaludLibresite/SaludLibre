import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

export default function GallerySection({ items }) {
  // Define categories for the carousel
  const categories = [
    {
      id: 1,
      title: "Cardiología",
      description:
        "Especialistas en el diagnóstico y tratamiento de enfermedades del corazón.",
      imageUrl: "/img/doctor-1.jpg",
    },
    {
      id: 2,
      title: "Neurología",
      description: "Expertos en el sistema nervioso y trastornos cerebrales.",
      imageUrl: "/img/doctor-2.jpg",
    },
    {
      id: 3,
      title: "Pediatría",
      description:
        "Cuidado especializado para niños, desde recién nacidos hasta adolescentes.",
      imageUrl: "/img/doctor-3.jpg",
    },
    {
      id: 4,
      title: "Dermatología",
      description:
        "Especialistas en el diagnóstico y tratamiento de afecciones de la piel.",
      imageUrl: "/img/doctor-4.jpg",
    },
    {
      id: 5,
      title: "Traumatología",
      description:
        "Tratamiento de lesiones y enfermedades del sistema musculoesquelético.",
      imageUrl: "/img/doctor-5.jpg",
    },
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

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
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"
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
            className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 sm:text-5xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Nuestras Especialidades
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Descubre las áreas de especialización médica en las que nuestros
            profesionales pueden ayudarte a mejorar tu salud y bienestar.
          </motion.p>
        </motion.div>

        {/* Embla carousel container with gradient overlays */}
        <div className="relative">
          {/* Left gradient overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-white to-transparent z-10" />
          {/* Right gradient overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-white to-transparent z-10" />

          {/* Carousel wrapper */}
          <div className="overflow-hidden px-6 lg:px-8" ref={emblaRef}>
            <div className="flex -ml-4 pl-[5%] [&>:nth-child(1)]:ml-24">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] md:flex-[0_0_30%] pl-4"
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
                        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
                        priority
                      />
                    </div>

                    {/* Contenido */}
                    <div className="relative h-full z-10 flex flex-col justify-end p-8">
                      {/* Badge de categoría */}
                      <div className="bg-amber-50 w-fit px-4 py-2 rounded-full mb-6 shadow-sm">
                        <span className="text-sm font-medium text-amber-700">
                          Especialidad médica
                        </span>
                      </div>

                      {/* Contenedor del texto principal */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 transition-transform duration-300 group-hover:translate-y-[-4px]">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                          {category.title}
                        </h3>
                        <p className="text-gray-600 text-base leading-relaxed mb-8 line-clamp-3">
                          {category.description}
                        </p>

                        <motion.a
                          href={`#${category.title.toLowerCase()}`}
                          className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium text-sm hover:from-amber-600 hover:to-yellow-600 transition-all duration-300"
                          whileTap={{ scale: 0.98 }}
                        >
                          Ver especialistas
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
                className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] md:flex-[0_0_30%] pl-4"
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 mb-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-amber-600"
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
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Más especialidades
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed mb-8">
                      Descubre todas nuestras especialidades médicas y encuentra
                      el especialista adecuado para ti
                    </p>
                    <motion.a
                      href="/especialidades"
                      className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-medium text-sm hover:bg-amber-50 transition-colors duration-300"
                      whileTap={{ scale: 0.98 }}
                    >
                      Ver todas
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
                className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] md:flex-[0_0_30%] pl-4"
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
                className="w-5 h-5 text-blue-800"
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
                className="w-5 h-5 text-blue-800"
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
                  ? "bg-blue-600 w-6"
                  : "bg-blue-200 hover:bg-blue-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
