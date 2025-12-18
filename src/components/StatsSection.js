import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { getDoctorsCount } from "../lib/doctorsService";

// Custom hook for animated counter
const useAnimatedCounter = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + (end - start) * easeOutCubic));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return [count, setIsVisible];
};

export default function StatsSection() {
  const [doctorsTotal, setDoctorsTotal] = useState(0);
  const [doctorsCount, setDoctorsVisible] = useAnimatedCounter(doctorsTotal);
  const [satisfactionCount, setSatisfactionVisible] = useAnimatedCounter(98);
  const [specialtiesCount, setSpecialtiesVisible] = useAnimatedCounter(50);

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  // Fetch doctors count from database
  useEffect(() => {
    const fetchDoctorsCount = async () => {
      try {
        const count = await getDoctorsCount();
        setDoctorsTotal(count);
      } catch (error) {
        console.error("Error fetching doctors count:", error);
        setDoctorsTotal(0);
      }
    };

    fetchDoctorsCount();
  }, []);

  useEffect(() => {
    if (inView) {
      setDoctorsVisible(true);
      setSatisfactionVisible(true);
      setSpecialtiesVisible(true);
    }
  }, [inView, setDoctorsVisible, setSatisfactionVisible, setSpecialtiesVisible]);

  return (
    <div ref={ref} className="py-24 sm:py-32 bg-gradient-to-br from-[#4dbad9]/5 via-white to-[#e8ad0f]/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl lg:mx-0 text-center lg:text-left"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Comprometidos con la excelencia en atención médica
          </motion.h2>
          <motion.p
            className="text-base/7 text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            El enfoque se centra en brindar la mejor atención médica
            posible, con profesionales altamente capacitados y tecnología de
            vanguardia para cuidar tu salud y la de tu familia.
          </motion.p>
        </motion.div>

        <div className="mx-auto mt-16 flex max-w-2xl flex-col gap-8 lg:mx-0 lg:mt-20 lg:max-w-none lg:flex-row lg:items-end">
          {/* Doctors Card */}
          <motion.div
            className="group flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-white p-8 sm:w-3/4 sm:max-w-md sm:flex-row-reverse sm:items-end lg:w-72 lg:max-w-none lg:flex-none lg:flex-col lg:items-start hover:shadow-xl transition-all duration-300 border border-[#4dbad9]/30 hover:border-[#4dbad9]/60 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            {/* Subtle border glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4dbad9]/10 via-transparent to-[#4dbad9]/10"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="flex items-baseline gap-1 relative z-10"
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.p className="flex-none text-4xl font-bold tracking-tight text-[#4dbad9]">
                {doctorsCount > 0 ? doctorsCount.toLocaleString() : "Cargando..."}
              </motion.p>
              <motion.div
                className="w-2 h-2 bg-[#e8ad0f] rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none relative z-10">
              <p className="text-lg font-semibold tracking-tight text-gray-900 group-hover:text-[#4dbad9] transition-colors">
                Médicos registrados
              </p>
              <p className="mt-2 text-base/7 text-gray-600 group-hover:text-gray-700 transition-colors">
                Profesionales de la salud verificados y disponibles en nuestra plataforma.
              </p>
            </div>
          </motion.div>

          {/* Satisfaction Card */}
          <motion.div
            className="group flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-gradient-to-br from-[#011d2f]/95 via-[#011d2f]/90 to-[#4dbad9]/85 p-8 sm:flex-row-reverse sm:items-end lg:w-full lg:max-w-sm lg:flex-auto lg:flex-col lg:items-start lg:gap-y-44 hover:shadow-2xl transition-all duration-300 border border-[#4dbad9]/60 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            {/* Subtle shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            {/* Overlay for better text readability */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-black/20 rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.8 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="flex items-baseline gap-1 relative z-10"
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <motion.p className="flex-none text-4xl font-bold tracking-tight text-[#e8ad0f]">
                {satisfactionCount}%
              </motion.p>
              <motion.div
                className="w-2 h-2 bg-[#4dbad9] rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>
            <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none relative z-10">
              <p className="text-lg font-semibold tracking-tight text-white drop-shadow-md">
                Satisfacción del paciente
              </p>
              <p className="mt-2 text-base/7 text-gray-300 drop-shadow-sm">
                Los pacientes reportan altos niveles de satisfacción con
                los servicios médicos especializados disponibles.
              </p>
            </div>
          </motion.div>

          {/* Specialties Card */}
          <motion.div
            className="group flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-gradient-to-br from-yellow-200/90 via-[#e8ad0f]/95 to-yellow-300/80 p-8 sm:w-11/12 sm:max-w-xl sm:flex-row-reverse sm:items-end lg:w-full lg:max-w-none lg:flex-auto lg:flex-col lg:items-start lg:gap-y-28 hover:shadow-2xl transition-all duration-300 border border-[#e8ad0f]/70 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            {/* Subtle shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100/30 to-transparent rounded-2xl"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            {/* Overlay for better text readability */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-900/10 to-amber-900/20 rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.6 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="flex items-baseline gap-1 relative z-10"
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <motion.p className="flex-none text-4xl font-bold tracking-tight text-gray-800">
                {specialtiesCount}+
              </motion.p>
              <motion.div
                className="w-2 h-2 bg-gray-700 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
            <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none relative z-10">
              <p className="text-lg font-semibold tracking-tight text-gray-800">
                Especialidades médicas
              </p>
              <p className="mt-2 text-base/7 text-gray-700">
                Contamos con más de 50 especialidades médicas para cubrir todas
                tus necesidades de salud y bienestar.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
