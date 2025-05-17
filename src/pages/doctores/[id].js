import { useRouter } from "next/router";
import doctores from "../../data/doctores.json";
import NavBar from "../../components/NavBar";
import AgendarCita from "./AgendarCita";
import DoctorInfo from "./DoctorInfo";
import DoctorGallery from "./DoctorGallery";
import usersReview from "../../data/usersReview.json";
import DoctorReviews from "./DoctorReviews";
import { motion } from "framer-motion";
import { useEffect } from "react";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export async function getServerSideProps({ params }) {
  const doctor = doctores.find((d) => d.slug === params.id);

  if (!doctor) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      doctor,
    },
  };
}

export default function DoctorDetailPage({ doctor }) {
  const router = useRouter();

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  if (router.isFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 'VIP':
        return 'from-amber-400 to-amber-500';
      case 'Intermedio':
        return 'from-blue-400 to-blue-500';
      case 'Normal':
        return 'from-red-400 to-red-500';
      default:
        return 'from-slate-400 to-slate-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-slate-100 min-h-screen">
      <NavBar
        logo="/images/logo-hospital.png"
        links={[
          { href: "/", label: "Inicio" },
          { href: "/doctores", label: "Doctores" },
        ]}
        button={{ 
          text: "Agendar Cita", 
          onClick: () => document.getElementById('agendar-cita').scrollIntoView({ behavior: 'smooth' }),
          className: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        }}
      />

      <motion.div 
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Columna izquierda: Perfil e info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-xl p-8 flex flex-col md:flex-row gap-8 items-center md:items-start border-2 border-blue-100"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-50"></div>
              <img
                src={`/${doctor.imagen}`}
                alt={doctor.nombre}
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow-lg relative z-10"
              />
              <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${getRankColor(doctor.rango)} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20`}>
                {doctor.rango || 'Normal'}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-2">
                Dr. {doctor.nombre}
              </h1>
              <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                  {doctor.especialidad}
                </span>
                <span className="text-slate-500 text-sm bg-slate-100 px-4 py-1.5 rounded-full">
                  {doctor.horario}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">{doctor.descripcion}</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 justify-center md:justify-start">
                <span className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-blue-500">📞</span>
                  {doctor.telefono}
                </span>
                <span className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-blue-500">✉️</span>
                  {doctor.email}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <DoctorInfo
              especialidad={doctor.especialidad}
              horario={doctor.horario}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <DoctorGallery
              images={[
                "/img/doctor-1.jpg",
                "/img/doctor-2.jpg",
                "/img/doctor-3.jpg",
              ]}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <DoctorReviews reviews={usersReview} />
          </motion.div>
        </div>

        {/* Columna derecha: Agendar cita */}
        <motion.div 
          variants={fadeInUp}
          className="flex flex-col gap-6"
          id="agendar-cita"
        >
          <div className="sticky top-8">
            <AgendarCita
              onSubmit={(data) => {
                alert(`Cita agendada para ${data.nombre} el ${data.fecha}`);
                // Aquí podrías implementar la lógica real de agendamiento
              }}
              doctorName={doctor.nombre}
              especialidad={doctor.especialidad}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Call to Action Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 py-12"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">¿Necesitas más información?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Nuestro equipo está disponible para resolver tus dudas y ayudarte a encontrar el mejor tratamiento.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('agendar-cita').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Agendar Cita
              </button>
              <button 
                onClick={() => alert('Contacto')}
                className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-white"
              >
                Contactar Doctor
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
