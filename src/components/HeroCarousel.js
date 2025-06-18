import Image from "next/image";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroCarousel({ images, onSearch, searchPlaceholder }) {
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
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden shadow-2xl rounded-3xl">
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
            className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white mb-8 drop-shadow-lg text-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Encuentra tu médico ideal
        </motion.h1>
        <motion.form
          className="flex w-full max-w-xl px-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.(query);
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.input
            className="flex-1 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-l-xl outline-none text-lg shadow-lg"
            type="text"
            placeholder={searchPlaceholder || "Buscar doctor, especialidad..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
          <motion.button
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-3 rounded-r-xl font-semibold text-black shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, backgroundColor: "#fbbf24" }}
            whileTap={{ scale: 0.95 }}
            type="submit"
          >
            Buscar
          </motion.button>
        </motion.form>
      </motion.div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-30">
        {images.map((_, idx) => (
          <motion.button
            key={idx}
            className={`w-3 h-3 rounded-full ${
              idx === current ? "bg-yellow-400" : "bg-white/60"
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

      <motion.button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
        onClick={() => paginate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Slide anterior"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      <motion.button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
        onClick={() => paginate(1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Slide siguiente"
      >
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>
    </div>
  );
}
