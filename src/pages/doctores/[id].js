import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import DoctorInfo from "../../components/doctoresPage/DoctorInfo";
import DoctorGallery from "../../components/doctoresPage/DoctorGallery";
import DoctorReviews from "../../components/doctoresPage/DoctorReviews";
import AgendarCita from "../../components/doctoresPage/AgendarCita";
import DoctorLocationMap from "../../components/doctoresPage/DoctorLocationMap";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../../components/Footer";
import DoctorCard from "../../components/doctoresPage/DoctorCard";
import { getDoctorBySlug, getAllDoctors } from "../../lib/doctorsService";
import { createAppointment } from "../../lib/appointmentsService";
import {
  getReviewsByDoctorId,
  getDoctorAverageRating,
} from "../../lib/reviewsService";
import { useAuth } from "../../context/AuthContext";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const slideIn = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function DoctorDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [doctor, setDoctor] = useState(null);
  const [relatedDoctors, setRelatedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(null);
  const { currentUser } = useAuth();

  // Handle appointment submission
  const handleAppointmentSubmit = async (appointmentData) => {
    try {
      await createAppointment(appointmentData);
      console.log("Cita creada exitosamente:", appointmentData);
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  };

  // Handle appointment button click
  const handleAppointmentClick = () => {
    if (currentUser) {
      setIsModalOpen(true);
    } else {
      setShowLoginModal(true);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/paciente/login");
  };

  // Load doctor reviews
  const loadDoctorReviews = async (doctorId) => {
    try {
      setReviewsLoading(true);

      // Load reviews and average rating
      const [doctorReviews, ratingData] = await Promise.all([
        getReviewsByDoctorId(doctorId),
        getDoctorAverageRating(doctorId),
      ]);

      // Transform reviews to match the expected format for DoctorReviews component
      const transformedReviews = doctorReviews.map((review) => ({
        id: review.id,
        name: review.patientName,
        photo: "/img/user2.png", // Default photo since we don't store patient photos
        rating: review.rating,
        date: review.createdAt?.toDate
          ? review.createdAt.toDate().toISOString().split("T")[0]
          : new Date(review.createdAt).toISOString().split("T")[0],
        comment: review.comment || "",
        verified: true, // All reviews from our system are verified
        aspects: review.aspects,
        wouldRecommend: review.wouldRecommend,
        appointmentDate: review.appointmentDate?.toDate
          ? review.appointmentDate.toDate()
          : new Date(review.appointmentDate),
      }));

      setReviews(transformedReviews);
      setAverageRating(ratingData);
    } catch (error) {
      console.error("Error loading doctor reviews:", error);
      setReviews([]);
      setAverageRating(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Load doctor data
  useEffect(() => {
    async function loadDoctor() {
      if (!id) return;

      try {
        setLoading(true);

        // Get doctor by slug
        const doctorData = await getDoctorBySlug(id);

        // Check if doctor is verified
        if (doctorData.verified !== true) {
          router.push("/doctores"); // Redirect if not verified
          return;
        }

        setDoctor(doctorData);

        // Load reviews for this doctor
        await loadDoctorReviews(doctorData.id);

        // Get all doctors to find related ones
        const allDoctors = await getAllDoctors();
        const related = allDoctors
          .filter(
            (d) =>
              d.id !== doctorData.id &&
              d.especialidad === doctorData.especialidad &&
              d.verified === true
          )
          .sort((a, b) => {
            // Prioritize VIP doctors
            if (a.rango === "VIP" && b.rango !== "VIP") return -1;
            if (b.rango === "VIP" && a.rango !== "VIP") return 1;
            return 0;
          })
          .slice(0, 3);

        setRelatedDoctors(related);
      } catch (error) {
        console.error("Error loading doctor:", error);
        router.push("/doctores"); // Redirect to doctors list if not found
      } finally {
        setLoading(false);
      }
    }

    loadDoctor();
  }, [id, router]);

  useEffect(() => {
    if (!doctor?.horario) return;

    // Check doctor availability
    const checkAvailability = () => {
      const now = new Date();
      try {
        const [start, end] = doctor.horario.split(" - ").map((time) => {
          const [hours, minutes] = time.split(":");
          return new Date().setHours(parseInt(hours), parseInt(minutes));
        });
        setIsAvailable(now >= start && now <= end);
      } catch (error) {
        setIsAvailable(false);
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 60000);
    return () => clearInterval(interval);
  }, [doctor?.horario]);

  if (loading || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Cargando información del doctor...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <NavBar />

      <motion.div
        className="max-w-6xl mx-auto px-4 py-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card principal del doctor */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              variants={fadeInUp}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Foto y badges */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative">
                    <img
                      src={
                        doctor.photoURL ||
                        (doctor.imagen?.startsWith("http")
                          ? doctor.imagen
                          : `/${doctor.imagen || "img/doctor-1.jpg"}`)
                      }
                      alt={doctor.nombre}
                      className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl object-cover border-4 border-white shadow-md"
                      onError={(e) => {
                        e.target.src = "/img/doctor-1.jpg"; // Fallback image
                      }}
                    />
                    {doctor.rango === "VIP" && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Premium
                      </div>
                    )}
                  </div>

                  {/* Status indicators */}
                  <div className="mt-4 space-y-2 text-center lg:text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isAvailable ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-gray-600">
                        {doctor.experience || "Experiencia profesional"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-blue-600 font-medium">
                        {doctor.verified ? "Verificado" : "En verificación"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info principal */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {doctor.nombre}
                      </h1>
                      {doctor.rango === "VIP" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                          Premium
                        </span>
                      )}
                    </div>

                    <p className="text-lg text-blue-600 font-medium mb-2">
                      {doctor.especialidad}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        <span>
                          {doctor.formattedAddress || doctor.ubicacion}
                        </span>
                        {doctor.latitude && doctor.longitude && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-1">
                            📍 Ubicación exacta
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        <span>{doctor.horario || "Horarios a consultar"}</span>
                      </div>

                      {doctor.consultaOnline && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-green-600 font-medium">
                            Consulta Online disponible
                          </span>
                        </div>
                      )}

                      {doctor.ageGroup && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className="text-purple-600 font-medium">
                            {doctor.ageGroup === "menores"
                              ? "Atiende solo menores"
                              : doctor.ageGroup === "adultos"
                              ? "Atiende solo adultos"
                              : "Atiende menores y adultos"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    {doctor.descripcion ||
                      `Especialista en ${doctor.especialidad} con amplia experiencia en el área.`}
                  </p>

                  {/* Contact info */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                    <a
                      href={`tel:${doctor.telefono}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {doctor.telefono}
                    </a>

                    <a
                      href={`mailto:${doctor.email}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Enviar email
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Doctor Info Component */}
            <DoctorInfo
              especialidad={doctor.especialidad}
              horario={doctor.horario}
            />

            {/* Doctor Location Map */}
            <motion.div variants={fadeInUp}>
              <DoctorLocationMap doctor={doctor} />
            </motion.div>

            {/* Doctor Gallery Component */}
            <DoctorGallery images={doctor.galleryImages || []} />

            {/* Doctor Reviews Component */}
            <DoctorReviews
              reviews={reviews}
              averageRating={averageRating}
              loading={reviewsLoading}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Appointment booking form */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 "
              variants={slideIn}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Agenda tu cita
                </h3>
                <p className="text-gray-600">
                  Reserva una consulta con {doctor.nombre}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6">
                <span className="text-sm font-medium text-gray-700">
                  Estado
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isAvailable ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isAvailable ? "Disponible ahora" : "No disponible"}
                </span>
              </div>

              {/* Appointment Button */}
              <button
                onClick={handleAppointmentClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
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
                {currentUser ? "Agendar Cita" : "Iniciar Sesión para Agendar"}
              </button>

              {/* Quick info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    {currentUser
                      ? "Proceso rápido y sencillo"
                      : "Cuenta requerida"}
                  </span>
                </div>
                <p className="text-sm text-blue-700 text-center">
                  {currentUser
                    ? "Completa el formulario y te contactaremos para confirmar tu cita"
                    : "Crea una cuenta para poder agendar tu cita médica"}
                </p>
              </div>
            </motion.div>

            {/* Contact Options - Separate sticky container */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24"
              variants={slideIn}
            >
              <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
                O contacta directamente
              </h4>
              <div className="space-y-3">
                <a
                  href={`tel:${doctor.telefono}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Llamar Ahora
                </a>

                <a
                  href={`https://wa.me/${doctor.telefono?.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Hola Dr. ${doctor.nombre}, quisiera agendar una consulta`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>

              <div className="text-center text-sm text-gray-500 mt-4 space-y-2">
                <div>Horarios: {doctor.horario || "A consultar"}</div>
                {doctor.latitude && doctor.longitude && (
                  <div>
                    <a
                      href={`https://www.google.com/maps?q=${doctor.latitude},${doctor.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <svg
                        className="w-3 h-3"
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
                      Ver ubicación en mapa
                    </a>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Related doctors */}
            {relatedDoctors.length > 0 && (
              <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                variants={slideIn}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Otros especialistas en {doctor.especialidad}
                </h3>
                <div className="space-y-4">
                  {relatedDoctors.map((relatedDoctor, index) => (
                    <motion.div
                      key={relatedDoctor.id}
                      variants={cardHover}
                      whileHover="hover"
                      initial="rest"
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/doctores/${relatedDoctor.slug}`)
                      }
                    >
                      <DoctorCard doctor={relatedDoctor} compact />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Appointment Modal */}
      <AgendarCita
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctor={doctor}
        onSubmit={handleAppointmentSubmit}
      />

      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cuenta requerida
                </h3>

                {/* Message */}
                <p className="text-gray-600 mb-6">
                  Debes crear una cuenta de paciente para poder agendar citas
                  médicas.
                </p>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLoginRedirect}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Crear Cuenta
                  </button>
                </div>

                {/* Additional info */}
                <p className="text-sm text-gray-500 mt-4">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={handleLoginRedirect}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
