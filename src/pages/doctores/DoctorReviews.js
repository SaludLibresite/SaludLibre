import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';

const reviewVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  })
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
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
      damping: 10
    }
  })
};

const RatingStars = ({ rating }) => {
  return (
    <div className="flex gap-1 mt-2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={starVariants}
          initial="hidden"
          animate="visible"
        >
          <StarIcon
            className={`h-5 w-5 ${
              i < rating ? 'text-yellow-400' : 'text-gray-200'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default function DoctorReviews({ reviews }) {
  // Agregar ratings aleatorios para demostración
  const reviewsWithRatings = reviews.map(review => ({
    ...review,
    rating: Math.floor(Math.random() * 2) + 4 // Rating entre 4 y 5
  }));

  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-white py-24 sm:py-32">
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
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Testimonios de Pacientes
          </motion.h2>
          <motion.p 
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Lo que dicen nuestros pacientes
          </motion.p>
          <motion.p 
            className="mt-4 text-lg text-gray-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            Descubre las experiencias de quienes han confiado en nuestros servicios médicos
          </motion.p>
        </motion.div>

        <motion.div 
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {reviewsWithRatings.map((review, index) => (
            <motion.div
              key={review.id}
              custom={index}
              variants={reviewVariants}
              whileHover="hover"
              className="relative"
            >
              <motion.figure 
                className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5 hover:ring-blue-500/20 transition-all duration-300"
                variants={cardHoverVariants}
              >
                <motion.div
                  className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {review.name.charAt(0)}
                </motion.div>

                <blockquote className="text-gray-900">
                  <motion.p 
                    className="text-base leading-relaxed"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    &ldquo;{review.comment}&rdquo;
                  </motion.p>
                </blockquote>

                <RatingStars rating={review.rating} />

                <figcaption className="mt-6 flex items-center gap-x-4">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-blue-500/20">
                    <Image
                      src={review.photo}
                      alt={review.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <motion.div 
                      className="font-semibold text-gray-900"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {review.name}
                    </motion.div>
                    <motion.div 
                      className="text-gray-600"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {review.date || "Paciente verificado"}
                    </motion.div>
                  </div>
                </figcaption>

                <motion.div
                  className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 -z-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.2, opacity: 0.7 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.figure>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="inline-flex items-center gap-x-2 rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ver más testimonios
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
