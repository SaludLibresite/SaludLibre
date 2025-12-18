import Image from "next/image";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroCarousel({ images }) {
  const [current, setCurrent] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [direction, setDirection] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      window.location.href = `/doctores?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrent((prev) => (prev + newDirection + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-[80dvh] sm:h-[550px] lg:h-[650px] flex items-center justify-center overflow-hidden shadow-2xl rounded-3xl bg-gradient-to-br from-[#011d2f]/60 to-[#4dbad9]/40">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0"
        >
          <Image
            src={images[current]}
            alt={`slide-${current}`}
            layout="fill"
            objectFit="cover"
            priority
            className="transform hover:scale-105 transition-transform duration-700"
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          {/* Additional gradient overlay for better text readability */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/15 to-black/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          {/* Enhanced readability overlay */}
          <motion.div
            className="absolute inset-0 bg-black/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 drop-shadow-2xl leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.span
              className="block drop-shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              Encuentra tu
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-[#e8ad0f] via-white to-[#4dbad9] bg-clip-text text-transparent drop-shadow-2xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              médico ideal
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl lg:text-2xl text-white mb-8 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Conecta con los mejores especialistas médicos en tu área.
            Citas rápidas, atención de calidad y cuidado personalizado.
          </motion.p>
        </motion.div>

        <motion.form
          className="flex flex-col sm:flex-row w-full max-w-2xl gap-3 px-6 sm:px-4 lg:px-0"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.input
            className="flex-1 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl outline-none text-base sm:text-lg shadow-2xl border-0 focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
            type="text"
            placeholder="Buscar doctor, especialidad, área..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
          <motion.button
            className="bg-[#e8910f] px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white shadow-2xl hover:shadow-3xl transition-all duration-300 text-base sm:text-lg whitespace-nowrap"
            whileHover={{
              scale: 1.05,
              background: "linear-gradient(to right, #4dbad9, #011d2f)"
            }}
            whileTap={{ scale: 0.95 }}
            type="submit"
          >
            Buscar
          </motion.button>
        </motion.form>

        {/* Quick action button */}
        <motion.div
          className="flex justify-center mt-6 sm:mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            className="bg-black/30 backdrop-blur-md text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium hover:bg-black/50 transition-all duration-300 border border-white/20 shadow-lg text-base sm:text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = "/doctores"}
          >
            Ver Doctores
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Page indicators - centered at bottom with proper spacing */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 z-30">
        {images.map((_, idx) => (
          <motion.button
            key={idx}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              idx === current ? "bg-yellow-400 scale-110" : "bg-white/60 hover:bg-white/80"
            }`}
            onClick={() => {
              setDirection(idx > current ? 1 : -1);
              setCurrent(idx);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows - responsive positioning */}
      <motion.button
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors hidden sm:block"
        onClick={() => paginate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Slide anterior"
      >
        <svg
          className="w-4 h-4 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      <motion.button
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors hidden sm:block"
        onClick={() => paginate(1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Slide siguiente"
      >
        <svg
          className="w-4 h-4 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>
    </div>
  );
}
