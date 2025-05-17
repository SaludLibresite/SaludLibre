import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const cardVariants = {
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

const hoverVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const imageVariants = {
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export default function GallerySection({ items }) {
  // Extend items with additional cards for better visual effect
  const extendedItems = [
    ...items,
    {
      id: 3,
      title: "Innovación en cirugía robótica",
      href: "#",
      description: "Descubre cómo la tecnología robótica está revolucionando los procedimientos quirúrgicos.",
      imageUrl: "/img/doctor-3.jpg",
      date: "Mar 14, 2024",
      datetime: "2024-03-14",
      author: {
        name: "Dr. Carlos Rodríguez",
        imageUrl: "/img/doctor-4.jpg",
      },
      category: "Tecnología Médica",
    },
    {
      id: 4,
      title: "Salud mental en tiempos modernos",
      href: "#",
      description: "Estrategias y consejos para mantener una buena salud mental en la era digital.",
      imageUrl: "/img/doctor-6.jpg",
      date: "Mar 13, 2024",
      datetime: "2024-03-13",
      author: {
        name: "Dra. Ana Martínez",
        imageUrl: "/img/doctor-5.jpg",
      },
      category: "Salud Mental",
    }
  ];

  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-white py-24">
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
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2 
            className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 sm:text-5xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Últimas Noticias y Artículos
          </motion.h2>
          <motion.p 
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Mantente informado sobre los últimos avances en medicina y consejos de salud.
          </motion.p>
        </motion.div>

        <motion.div 
          className="mx-auto mt-16 grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3"
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
          {extendedItems.map((post, index) => (
            <motion.article
              key={post.id}
              custom={index}
              variants={cardVariants}
              whileHover="hover"
              className="relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 px-8 pb-8 pt-80 sm:pt-48 lg:pt-80 group"
            >
              <motion.div
                className="absolute inset-0 -z-10"
                variants={imageVariants}
              >
                <Image
                  alt=""
                  src={post.imageUrl}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
              
              <motion.div 
                className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent opacity-80"
                whileHover={{ opacity: 0.9 }}
                transition={{ duration: 0.3 }}
              />
              
              <motion.div 
                className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/10"
                whileHover={{ 
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
                  transition: { duration: 0.3 }
                }}
              />

              <div className="flex flex-wrap items-center gap-y-1 overflow-hidden text-sm/6 text-gray-300">
                <motion.time 
                  dateTime={post.datetime} 
                  className="mr-8"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {post.date}
                </motion.time>
                <div className="-ml-4 flex items-center gap-x-4">
                  <svg
                    viewBox="0 0 2 2"
                    className="-ml-0.5 size-0.5 flex-none fill-white/50"
                  >
                    <circle r={1} cx={1} cy={1} />
                  </svg>
                  <motion.div 
                    className="flex gap-x-2.5 items-center"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="relative size-6 flex-none rounded-full overflow-hidden ring-2 ring-white/20">
                      <Image
                        alt=""
                        src={post.author.imageUrl}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{post.author.name}</span>
                  </motion.div>
                </div>
              </div>

              <motion.h3 
                className="mt-3 text-xl font-semibold leading-6 text-white"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <a href={post.href} className="group">
                  <span className="absolute inset-0" />
                  {post.title}
                </a>
              </motion.h3>

              <motion.p 
                className="mt-2 text-sm text-gray-300 line-clamp-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {post.description}
              </motion.p>

              <motion.div
                className="mt-4 flex items-center gap-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                  {post.category}
                </span>
              </motion.div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
