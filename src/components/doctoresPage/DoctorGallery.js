import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export default function DoctorGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const imagesPerSlide = 3;
  const totalSlides = Math.ceil(images.length / imagesPerSlide);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const openFullscreen = (index) => {
    setSelectedImage(index);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setSelectedImage(null);
    document.body.style.overflow = "unset";
  };

  const navigateFullscreen = (direction) => {
    setSelectedImage(
      (prev) => (prev + direction + images.length) % images.length
    );
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedImage !== null) {
        if (e.key === "Escape") closeFullscreen();
        if (e.key === "ArrowRight") navigateFullscreen(1);
        if (e.key === "ArrowLeft") navigateFullscreen(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedImage]);

  // Divide images into slides
  const slides = Array.from({ length: totalSlides }, (_, i) =>
    images.slice(i * imagesPerSlide, (i + 1) * imagesPerSlide)
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow p-5 w-full my-4">
        <h3 className="font-bold text-lg mb-3 text-blue-800">
          Galería de trabajo
        </h3>

        {/* Carousel */}
        <div className="relative">
          <motion.div
            ref={carouselRef}
            className="overflow-hidden"
            initial={false}
          >
            <motion.div
              className="flex transition-transform duration-500 ease-out"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {slides.map((slideImages, slideIndex) => (
                <div
                  key={slideIndex}
                  className="flex-shrink-0 w-full grid grid-cols-3 gap-4 px-2"
                >
                  {slideImages.map((img, imgIndex) => (
                    <motion.div
                      key={imgIndex + slideIndex * imagesPerSlide}
                      className="relative aspect-[4/3] group cursor-pointer"
                      onClick={() =>
                        openFullscreen(imgIndex + slideIndex * imagesPerSlide)
                      }
                    >
                      <img
                        src={img}
                        alt={`trabajo-${
                          imgIndex + slideIndex * imagesPerSlide
                        }`}
                        className="w-full h-full object-cover rounded-lg shadow border transition-all duration-300 group-hover:brightness-110"
                      />
                      <motion.div className="absolute inset-0 bg-black/0 rounded-lg transition-colors duration-300 group-hover:bg-black/10" />
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Navigation buttons */}
          {totalSlides > 1 && (
            <>
              <motion.button
                className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white"
                onClick={handlePrev}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white"
                onClick={handleNext}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-800"
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
              </motion.button>
            </>
          )}

          {/* Dots indicator */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, i) => (
                <motion.button
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex ? "bg-blue-600" : "bg-blue-200"
                  }`}
                  onClick={() => setCurrentIndex(i)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 sm:p-8"
            onClick={closeFullscreen}
          >
            {/* Contenedor principal fijo */}
            <motion.div
              className="relative w-full h-full max-w-[1400px] max-h-[800px] mx-auto flex items-center justify-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Contenedor de la imagen con padding para los botones */}
              <div className="relative w-full h-full px-16">
                {/* Contenedor de la imagen con restricciones de tamaño */}
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={images[selectedImage]}
                    alt={`trabajo-${selectedImage}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Botones de navegación con posición fija */}
                {images.length > 1 && (
                  <>
                    <motion.button
                      className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateFullscreen(-1);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateFullscreen(1);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
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
                    </motion.button>
                  </>
                )}

                {/* Close button con posición fija */}
                <motion.button
                  className="absolute top-0 right-0 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFullscreen();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>

                {/* Contador de imágenes con posición fija */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
