import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import doctores from "../../data/doctores.json";
import usersReview from "../../data/usersReview.json";
import NavBar from "../../components/NavBar";
import AgendarCita from "../../components/doctoresPage/AgendarCita";
import DoctorInfo from "../../components/doctoresPage/DoctorInfo";
import DoctorGallery from "../../components/doctoresPage/DoctorGallery";
import DoctorReviews from "../../components/doctoresPage/DoctorReviews";
import { motion } from "framer-motion";
import Footer from "../../components/Footer";
import DoctorCard from "../../components/doctoresPage/DoctorCard";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const slideIn = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.6 },
};

export async function getServerSideProps({ params }) {
  const doctor = doctores.find((d) => d.slug === params.id);

  if (!doctor) {
    return {
      notFound: true,
    };
  }

  // Get related doctors based on specialty, prioritizing VIP doctors
  const relatedDoctors = doctores
    .filter(
      (d) => d.slug !== params.id && d.especialidad === doctor.especialidad
    )
    .sort((a, b) => {
      // Prioritize VIP doctors
      if (a.rango === "VIP" && b.rango !== "VIP") return -1;
      if (b.rango === "VIP" && a.rango !== "VIP") return 1;
      return 0;
    })
    .slice(0, 3); // Get top 3 related doctors

  return {
    props: {
      doctor,
      relatedDoctors: relatedDoctors || [], // Ensure we always return an array
    },
  };
}

export default function DoctorDetailPage({ doctor, relatedDoctors = [] }) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    // Check doctor availability
    const checkAvailability = () => {
      const now = new Date();
      const [start, end] = doctor.horario.split(" - ").map((time) => {
        const [hours, minutes] = time.split(":");
        return new Date().setHours(parseInt(hours), parseInt(minutes));
      });
      setIsAvailable(now >= start && now <= end);
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 60000);
    return () => clearInterval(interval);
  }, [doctor.horario]);

  if (router.isFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100">
        <NavBar
          logo="/images/logo-hospital.png"
          links={[
            { href: "/", label: "Inicio" },
            { href: "/doctores", label: "Doctores" },
          ]}
          button={{
            text: "Agendar Cita",
            onClick: () => setShowBooking(true),
            className:
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5",
          }}
        />

        {/* Hero Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="relative overflow-hidden bg-white shadow-xl rounded-b-[2.5rem] mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 z-0"></div>
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-75 blur-xl group-hover:opacity-100 transition-opacity duration-300"></div>
                <img
                  src={`/${doctor.imagen}`}
                  alt={doctor.nombre}
                  className="relative w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-white shadow-2xl"
                />
                <div
                  className={`absolute -top-2 -right-2 px-4 py-1 rounded-full text-white text-sm font-semibold
                ${
                  isAvailable ? "bg-green-500" : "bg-red-500"
                } shadow-lg flex items-center gap-2`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvailable ? "bg-green-200" : "bg-red-200"
                    } animate-pulse`}
                  ></span>
                  {isAvailable ? "Disponible" : "No disponible"}
                </div>
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <motion.h1
                  variants={slideIn}
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Dr. {doctor.nombre}
                </motion.h1>

                <motion.div
                  variants={slideIn}
                  className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start"
                >
                  <span className="bg-blue-100 text-blue-800 text-lg font-semibold px-6 py-2 rounded-full">
                    {doctor.especialidad}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-lg font-semibold px-6 py-2 rounded-full">
                    {doctor.horario}
                  </span>
                </motion.div>

                <motion.p
                  variants={slideIn}
                  className="mt-6 text-lg text-gray-600 max-w-2xl"
                >
                  {doctor.descripcion}
                </motion.p>

                <motion.div
                  variants={slideIn}
                  className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start"
                >
                  <button
                    onClick={() => setShowBooking(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                    text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl 
                    transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Agendar Cita
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `https://wa.me/${doctor.telefono.replace(/\D/g, "")}`,
                        "_blank"
                      )
                    }
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold 
                    text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 
                    flex items-center gap-2"
                  >
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                    WhatsApp
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Doctor Info Section */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <DoctorInfo
                  especialidad={doctor.especialidad}
                  horario={doctor.horario}
                />
              </motion.div>

              {/* Gallery Section */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <DoctorGallery
                  images={[
                    "/img/doctor-1.jpg",
                    "/img/doctor-2.jpg",
                    "/img/doctor-3.jpg",
                    "/img/doctor-1.jpg",
                    "/img/doctor-2.jpg",
                    "/img/doctor-3.jpg",
                    "/img/doctor-1.jpg",
                    "/img/doctor-2.jpg",
                    "/img/doctor-3.jpg",
                  ]}
                />
              </motion.div>

              {/* Reviews Section */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <DoctorReviews reviews={usersReview} />
              </motion.div>
            </div>

            {/* Contact Form Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial="initial"
                animate="animate"
                variants={slideIn}
                className="sticky top-24 space-y-6"
              >
                {/* Appointment Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Agendar Cita
                    </h3>
                    <span className="text-sm text-gray-500">
                      {doctor.rango === "VIP" && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                          Doctor VIP
                        </span>
                      )}
                    </span>
                  </div>

                  <AgendarCita
                    onSubmit={(data) => {
                      alert(
                        `Cita agendada para ${data.nombre} el ${data.fecha}`
                      );
                    }}
                    doctorName={doctor.nombre}
                    especialidad={doctor.especialidad}
                  />

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Horario: {doctor.horario}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{doctor.ubicacion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Related Doctors Section */}
          {Array.isArray(relatedDoctors) && relatedDoctors.length > 0 && (
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="mt-12 bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Doctores Relacionados
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Otros especialistas que podrían interesarte
                  </p>
                </div>
                <motion.div
                  className="hidden sm:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                    {relatedDoctors.length} doctores
                  </span>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {relatedDoctors.map((relatedDoctor, index) => (
                  <DoctorCard
                    key={relatedDoctor.slug}
                    doctor={relatedDoctor}
                    delay={index * 100}
                    inside={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
