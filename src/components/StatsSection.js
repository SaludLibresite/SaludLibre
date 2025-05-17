import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const StatCard = ({ number, title, description, isDark = false, delay = 0 }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const numberVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: delay + 0.2,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={`flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl p-8 sm:flex-row-reverse sm:items-end lg:flex-none lg:flex-col lg:items-start ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white' 
          : 'bg-gradient-to-br from-blue-50 to-white'
      } shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      <motion.p 
        variants={numberVariants}
        className={`flex-none text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-blue-900'}`}
      >
        {number}
      </motion.p>
      <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
        <motion.p 
          variants={variants}
          className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-blue-900'}`}
        >
          {title}
        </motion.p>
        <motion.p 
          variants={variants}
          className={`mt-2 text-base/7 ${isDark ? 'text-blue-100' : 'text-blue-600'}`}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function StatsSection() {
  const stats = [
    {
      number: "250k+",
      title: "Pacientes atendidos",
      description: "Más de 250,000 pacientes han confiado en nuestra atención médica de calidad.",
      isDark: false
    },
    {
      number: "98%",
      title: "Satisfacción del paciente",
      description: "Nuestros pacientes reportan altos niveles de satisfacción con nuestros servicios.",
      isDark: true
    },
    {
      number: "50+",
      title: "Especialidades médicas",
      description: "Contamos con más de 50 especialidades médicas para cubrir todas tus necesidades.",
      isDark: false
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
      <motion.div 
        className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            {...stat}
            delay={index * 0.2}
          />
        ))}
      </motion.div>
    </div>
  );
}
