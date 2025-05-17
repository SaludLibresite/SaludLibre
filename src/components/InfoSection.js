import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const PointCard = ({ point, index }) => {
  return (
    <motion.div
      variants={fadeInUp}
      className="relative pl-12 py-4 group"
      whileHover={{ x: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
        {point.icon}
      </div>
      <dt className="text-lg font-semibold text-gray-900 mb-1">{point.name}</dt>
      <dd className="text-gray-600 leading-relaxed">{point.description}</dd>
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-100 -z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        whileHover={{ scale: 1.5, opacity: 0.5 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default function InfoSection({
  image,
  title,
  points,
  firstTitle,
  firstDescription,
  lastTitle,
  lastDescription,
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-white py-24 sm:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
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
        <motion.div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {firstTitle}
          </motion.h2>
          <motion.p
            className="text-xl text-slate-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {firstDescription}
          </motion.p>
        </motion.div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <motion.div
            className="lg:ml-auto"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="lg:max-w-lg m-4">
              <motion.h2
                className="font-semibold text-3xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-8"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {title}
              </motion.h2>
              <motion.dl
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="space-y-6 text-base/7 text-gray-600 lg:max-w-none"
              >
                {points.map((point, index) => (
                  <PointCard key={point.name} point={point} index={index} />
                ))}
              </motion.dl>
            </div>
          </motion.div>

          <motion.div
            className="flex items-start justify-end lg:order-first"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
            >
              <Image
                alt="Product screenshot"
                src={image}
                width={2432}
                height={1442}
                className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] transform hover:shadow-2xl transition-all duration-300"
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-t from-blue-900/20 to-transparent"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {lastTitle}
          </motion.h2>
          <motion.p
            className="text-lg text-slate-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {lastDescription}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
