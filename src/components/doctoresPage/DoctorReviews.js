import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const reviewVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  }),
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      duration: 0.5,
      bounce: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const listItemHoverVariants = {
  hover: {
    x: 10,
    backgroundColor: "rgba(239, 246, 255, 0.6)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

const starVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  }),
};

const RatingStars = ({ rating, size = "small" }) => {
  const starSize = size === "small" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { scale: 0, opacity: 0 },
            visible: {
              scale: 1,
              opacity: 1,
              transition: { delay: i * 0.1 },
            },
          }}
        >
          <StarIcon
            className={`${starSize} ${
              i < rating ? "text-yellow-400" : "text-gray-200"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
};

const ReviewItem = ({ review, isCompact = false }) => (
  <motion.div
    variants={reviewVariants}
    className={`flex items-start space-x-4 ${
      isCompact ? "p-4" : "p-6"
    } rounded-xl hover:bg-blue-50/40 transition-colors duration-200`}
  >
    <div className="relative flex-shrink-0">
      <div
        className={`relative ${
          isCompact ? "h-12 w-12" : "h-16 w-16"
        } rounded-full overflow-hidden ring-4 ring-white shadow-lg`}
      >
        <Image
          src={review.photo}
          alt={review.name}
          fill
          className="object-cover"
        />
      </div>
      {!isCompact && (
        <motion.div
          className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1.5 text-white text-xs font-bold ring-2 ring-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {review.rating}
        </motion.div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <motion.h3
          className={`font-semibold text-gray-900 truncate ${
            isCompact ? "text-base" : "text-lg"
          }`}
          whileHover={{ x: 5 }}
        >
          {review.name}
        </motion.h3>
        <RatingStars
          rating={review.rating}
          size={isCompact ? "small" : "medium"}
        />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {review.date || "Paciente verificado"}
      </p>
      <motion.p
        className={`${
          isCompact ? "mt-2 text-sm" : "mt-3 text-base"
        } text-gray-700 leading-relaxed`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        "{review.comment}"
      </motion.p>

      {/* Show recommendation status */}
      {review.wouldRecommend !== undefined && !isCompact && (
        <motion.div
          className="mt-3 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              review.wouldRecommend
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {review.wouldRecommend ? "✓ Recomendado" : "✗ No recomendado"}
          </span>
        </motion.div>
      )}

      {/* Show aspects ratings if available */}
      {review.aspects && !isCompact && (
        <motion.div
          className="mt-3 grid grid-cols-2 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Object.entries(review.aspects).map(([aspect, rating]) => (
            <div
              key={aspect}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-600 capitalize">
                {aspect === "punctuality"
                  ? "Puntualidad"
                  : aspect === "attention"
                  ? "Atención"
                  : aspect === "explanation"
                  ? "Explicación"
                  : aspect === "facilities"
                  ? "Instalaciones"
                  : aspect}
              </span>
              <div className="flex items-center gap-1">
                <RatingStars rating={rating} size="small" />
                <span className="text-gray-500">{rating}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  </motion.div>
);

const ReviewsModal = ({ isOpen, onClose, reviews }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Todos los testimonios
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Lo que dicen nuestros pacientes
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-5rem)]">
              <div className="divide-y divide-gray-100">
                {reviews.map((review, index) => (
                  <ReviewItem
                    key={review.id}
                    review={review}
                    isCompact={true}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default function DoctorReviews({
  reviews,
  averageRating,
  loading = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use the actual reviews data without modification
  const displayedReviews = reviews.slice(0, 3);

  // Loading state
  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-white py-12 sm:py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          <div className="mx-auto max-w-2xl space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4 p-6 rounded-xl">
                  <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No reviews state
  if (!reviews.length) {
    return (
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-white py-12 sm:py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-sm font-semibold text-blue-600 mb-2">
              Testimonios de Pacientes
            </h2>
            <p className="text-2xl font-bold tracking-tight text-gray-900 mb-8">
              Lo que dicen nuestros pacientes
            </p>
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <StarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aún no hay reseñas
              </h3>
              <p className="text-gray-600">
                Este doctor aún no tiene reseñas de pacientes. ¡Sé el primero en
                dejar una reseña después de tu consulta!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-white py-12 sm:py-16">
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute -top-24 -right-24 w-72 h-72 bg-blue-100 rounded-full opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-200 rounded-full opacity-10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div className="flex items-center justify-center gap-2 mb-2">
            <motion.h2
              className="text-sm font-semibold text-blue-600"
              whileHover={{ scale: 1.02 }}
            >
              Testimonios de Pacientes
            </motion.h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
              {reviews.length}
            </span>
            {averageRating && averageRating.totalReviews > 0 && (
              <div className="flex items-center gap-1">
                <RatingStars
                  rating={Math.round(averageRating.averageRating)}
                  size="small"
                />
                <span className="text-sm font-medium text-gray-700">
                  {averageRating.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </motion.div>
          <motion.p className="text-2xl font-bold tracking-tight text-gray-900">
            Lo que dicen nuestros pacientes
          </motion.p>
          {averageRating && averageRating.totalReviews > 0 && (
            <motion.div
              className="mt-2 text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Promedio: {averageRating.averageRating.toFixed(1)}/5 estrellas
              basado en {averageRating.totalReviews} reseña
              {averageRating.totalReviews !== 1 ? "s" : ""}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="mx-auto max-w-2xl space-y-4"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {displayedReviews.map((review, index) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </motion.div>

        {reviews.length > 3 && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-600/20 transition-colors duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Ver todos los testimonios ({reviews.length})
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </div>

      <ReviewsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reviews={reviews}
      />
    </div>
  );
}
