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
import { formatDoctorName } from "../../lib/dataUtils";
import DoctorCard from "../../components/doctoresPage/DoctorCard";
import { getDoctorBySlug, getAllDoctors } from "../../lib/doctorsService";
import { getDoctorRank } from "../../lib/subscriptionUtils";
import { createAppointment } from "../../lib/appointmentsService";
import {
  getReviewsByDoctorId,
  getDoctorAverageRating,
} from "../../lib/reviewsService";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/SEO";

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

export default function DoctorDetailPage({ 
  doctor, 
  relatedDoctors, 
  reviews, 
  averageRating, 
  error 
}) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { currentUser } = useAuth();

  // If there's an error, redirect to doctors page
  useEffect(() => {
    if (error) {
      router.push("/doctores");
    }
  }, [error, router]);

  // Function to check if today is doctor's birthday
  const isBirthday = (fechaNacimiento) => {
    if (!fechaNacimiento) return false;

    // Parse the date string manually to avoid timezone issues
    const dateParts = fechaNacimiento.split("-");
    if (dateParts.length !== 3) return false;

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);

    const today = new Date();
    const birthDate = new Date(year, month, day);

    return (
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate()
    );
  };

  // Function to calculate age
  const calculateAge = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;

    // Parse the date string manually to avoid timezone issues
    const dateParts = fechaNacimiento.split("-");
    if (dateParts.length !== 3) return null;

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);

    const today = new Date();
    const birthDate = new Date(year, month, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Function to format birthday date
  const formatBirthday = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;

    // Parse the date string manually to avoid timezone issues
    const dateParts = fechaNacimiento.split("-");
    if (dateParts.length !== 3) return null;

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);

    // Create date with local timezone
    const birthDate = new Date(year, month, day);
    const options = {
      day: "numeric",
      month: "long",
    };

    return birthDate.toLocaleDateString("es-ES", options);
  };

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

  // Render SEO first for better server-side rendering
  const seoComponent = (
    <SEO
      title={`${formatDoctorName(doctor?.nombre, doctor?.genero)} - ${doctor?.especialidad} | Salud Libre`}
      description={
        doctor?.descripcion || 
        `Consulta con ${formatDoctorName(doctor?.nombre, doctor?.genero)}, especialista en ${doctor?.especialidad}. ${doctor?.formattedAddress || doctor?.ubicacion}. Agenda tu cita médica.`
      }
      image={
        doctor?.photoURL ||
        (doctor?.imagen?.startsWith("http")
          ? doctor?.imagen
          : `https://saludlibre.com/${doctor?.imagen || "/img/doctor-1.jpg"}`)
      }
      url={`https://saludlibre.com/doctores/${doctor?.slug}`}
      pinColor="#3B82F6"
    >
      {/* JSON-LD structured data for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Physician",
            "name": doctor?.nombre,
            "description": doctor?.descripcion,
            "specialty": doctor?.especialidad,
            "image": doctor?.photoURL || doctor?.imagen,
            "telephone": doctor?.telefono,
            "email": doctor?.email,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": doctor?.formattedAddress || doctor?.ubicacion
            },
            "geo": doctor?.latitude && doctor?.longitude ? {
              "@type": "GeoCoordinates",
              "latitude": doctor.latitude,
              "longitude": doctor.longitude
            } : undefined,
            "url": `https://saludlibre.com/doctores/${doctor?.slug}`,
            "priceRange": "$$",
            "availableLanguage": "Spanish"
          })
        }}
      />
    </SEO>
  );

  // Show error state
  if (error) {
    return (
      <>
        {seoComponent}
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-red-500 text-6xl">⚠️</div>
            <p className="text-gray-600 text-center">
              Error al cargar la información del doctor
            </p>
            <button
              onClick={() => router.push("/doctores")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </>
    );
  }

  // Loading state
  if (router.isFallback || !doctor) {
    return (
      <>
        {seoComponent}
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600">Cargando información del doctor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      {seoComponent}
      <NavBar />

      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Mobile Layout - Integrated Professional Design */}
        <div className="lg:hidden">
          {/* Single Integrated Panel */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            {/* Professional Header */}
            <div className="bg-gray-800 px-6 py-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    doctor.photoURL ||
                    (doctor.imagen?.startsWith("http")
                      ? doctor.imagen
                      : doctor.imagen?.startsWith("/")
                      ? doctor.imagen
                      : `/${doctor.imagen || "img/doctor-1.jpg"}`)
                  }
                  alt={doctor.nombre}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-white"
                  onError={(e) => {
                    e.target.src = "/img/doctor-1.jpg";
                  }}
                />
                <div className="flex-1 text-white">
                  <h1 className="text-xl font-semibold">{doctor.nombre}</h1>
                  <p className="text-gray-200">{doctor.especialidad}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${isAvailable ? "bg-green-400" : "bg-gray-400"}`}></div>
                    <span className="text-sm text-gray-200">
                      {isAvailable ? "Disponible" : "No disponible"}
                    </span>
                    {getDoctorRank(doctor) === "VIP" && (
                      <span className="ml-2 bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded">
                        Premium
                      </span>
                    )}
                  </div>
                  {/* Estado de verificación móvil */}
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-300 font-medium">
                      {doctor.verified ? "Verificado" : "En proceso"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="divide-y divide-gray-200">
              {/* Location */}
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Ubicación</p>
                    <p className="text-gray-600 text-sm">{doctor.formattedAddress || doctor.ubicacion}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Información profesional</h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {doctor.descripcion || `Especialista en ${doctor.especialidad} con amplia experiencia en el área.`}
                </p>
                
                {/* Professional Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center py-3 px-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600">Horario</div>
                    <div className="font-medium text-sm">{doctor.horario || "A consultar"}</div>
                  </div>
                  <div className="text-center py-3 px-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600">Estado</div>
                    <div className="font-medium text-sm text-amber-600">
                      {doctor.verified ? "Verificado" : "En verificación"}
                    </div>
                  </div>
                  {doctor.consultaOnline && (
                    <div className="text-center py-3 px-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600">Modalidad</div>
                      <div className="font-medium text-sm text-green-600">Online</div>
                    </div>
                  )}
                  {doctor.ageGroup && (
                    <div className="text-center py-3 px-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600">Pacientes</div>
                      <div className="font-medium text-sm">
                        {doctor.ageGroup === "menores" ? "Menores" :
                         doctor.ageGroup === "adultos" ? "Adultos" :
                         "Todos"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Agendar consulta</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isAvailable 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {isAvailable ? "Disponible" : "No disponible"}
                  </span>
                </div>

                <button
                  onClick={handleAppointmentClick}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 mb-3"
                >
                  {currentUser ? "Solicitar cita" : "Iniciar sesión"}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  {currentUser 
                    ? "Te contactaremos para confirmar la cita" 
                    : "Necesitas una cuenta para agendar"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Grid with sidebar */}
        <div className="hidden lg:block">
          <motion.div
            className="grid grid-cols-1 xl:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Main Content Column */}
            <div className="xl:col-span-2 space-y-8">
              {/* Main Doctor Card */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                variants={fadeInUp}
              >
                {/* Header Section */}
                <div className="bg-gray-800 p-8 text-white">
                  <div className="flex items-start gap-6">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          doctor.photoURL ||
                          (doctor.imagen?.startsWith("http")
                            ? doctor.imagen
                            : doctor.imagen?.startsWith("/")
                            ? doctor.imagen
                            : `/${doctor.imagen || "img/doctor-1.jpg"}`)
                        }
                        alt={doctor.nombre}
                        className="w-32 h-32 rounded-lg object-cover border-2 border-white"
                        onError={(e) => {
                          e.target.src = "/img/doctor-1.jpg";
                        }}
                      />
                      {getDoctorRank(doctor) === "VIP" && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-sm font-semibold px-2 py-1 rounded">
                          Premium
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h1 className="text-3xl font-bold mb-2">{doctor.nombre}</h1>
                          <p className="text-xl text-gray-200 font-medium">{doctor.especialidad}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${isAvailable ? "bg-green-400" : "bg-gray-400"}`}></div>
                            <span className="text-white font-medium">
                              {isAvailable ? "Disponible" : "No disponible"}
                            </span>
                          </div>
                          {/* Estado de verificación integrado */}
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-300 font-medium">
                              {doctor.verified ? "Verificado" : "En proceso"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-200 mb-4">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-lg">{doctor.formattedAddress || doctor.ubicacion}</span>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{doctor.horario || "Horarios a consultar"}</span>
                        </div>
                        {doctor.consultaOnline && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-green-400 font-medium">Consulta Online</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8">
                  <div className="grid grid-cols-1  gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Sobre mí</h3>
                        <p className="text-gray-700 leading-relaxed text-lg">
                          {doctor.descripcion || `Especialista en ${doctor.especialidad} con amplia experiencia en el área.`}
                        </p>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {doctor.ageGroup && (
                          <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <div>
                              <p className="font-semibold text-gray-900">Pacientes atendidos</p>
                              <p className="text-amber-600 font-medium">
                                {doctor.ageGroup === "menores" ? "Solo menores de edad" :
                                 doctor.ageGroup === "adultos" ? "Solo adultos" :
                                 "Menores y adultos"}
                              </p>
                            </div>
                          </div>
                        )}

                        {doctor.fechaNacimiento && calculateAge(doctor.fechaNacimiento) && (
                          <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="font-semibold text-gray-900">Edad</p>
                              <p className="text-amber-600 font-medium">
                                {calculateAge(doctor.fechaNacimiento)} años
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Additional Content Sections */}
              <div className="grid grid-cols-1 gap-8">
                {/* Doctor Location Map */}
                <motion.div variants={fadeInUp}>
                  <DoctorLocationMap doctor={doctor} />
                </motion.div>

                {/* Doctor Gallery Component */}
                <motion.div variants={fadeInUp}>
                  <DoctorGallery images={doctor.galleryImages || []} />
                </motion.div>
              </div>

              {/* Doctor Reviews Component */}
              <motion.div variants={fadeInUp}>
                <DoctorReviews
                  reviews={reviews}
                  averageRating={averageRating}
                  loading={false}
                />
              </motion.div>
            </div>

            {/* Desktop Sidebar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit sticky top-24">
              {/* Appointment booking section */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Agendar consulta
                </h3>
                <p className="text-gray-600">
                  Reserva una cita con {doctor.nombre}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <span className="text-sm font-medium text-gray-700">
                  Estado
                </span>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded ${
                    isAvailable
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isAvailable ? "Disponible" : "No disponible"}
                </span>
              </div>

              {/* Appointment Button */}
              <button
                onClick={handleAppointmentClick}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-6"
              >
                {currentUser ? "Solicitar cita" : "Iniciar sesión"}
              </button>

              {/* Info note */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-8">
                <p className="text-sm text-amber-800 text-center">
                  {currentUser
                    ? "Te contactaremos para confirmar la cita"
                    : "Necesitas una cuenta para agendar"}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 mb-8"></div>

              {/* Contact section */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 text-center">
                  Contacto directo
                </h4>

                <div className="space-y-3">
                  <a
                    href={`tel:${doctor.telefono}`}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Llamar
                  </a>

                  <a
                    href={`https://wa.me/${doctor.telefono?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${formatDoctorName(doctor.nombre, doctor.genero)}, quisiera agendar una consulta`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>

                  <a
                    href={`mailto:${doctor.email}`}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </a>
                </div>

                {/* Additional info */}
                <div className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Horarios: {doctor.horario || "A consultar"}</span>
                  </div>
                  {doctor.latitude && doctor.longitude && (
                    <div>
                      <a
                        href={`https://www.google.com/maps?q=${doctor.latitude},${doctor.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver ubicación
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Related doctors section - full width below grid */}
          {relatedDoctors.length > 0 && (
            <motion.div
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8"
              variants={slideIn}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Otros especialistas en {doctor.especialidad}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Mobile Appointment Modal */}
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
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
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

// Load doctor reviews function
const loadDoctorReviews = async (doctorId) => {
  try {
    // Load reviews and average rating
    const [doctorReviews, ratingData] = await Promise.all([
      getReviewsByDoctorId(doctorId),
      getDoctorAverageRating(doctorId),
    ]);

    // Transform reviews to match the expected format for DoctorReviews component
    const transformedReviews = doctorReviews.map((review) => {
      // Helper function to convert Firestore dates to strings
      const formatDate = (dateValue) => {
        if (!dateValue) return null;
        
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate().toISOString().split("T")[0];
        } else if (dateValue instanceof Date) {
          return dateValue.toISOString().split("T")[0];
        } else if (dateValue.seconds && dateValue.nanoseconds !== undefined) {
          return new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000).toISOString().split("T")[0];
        } else if (typeof dateValue === 'string') {
          return new Date(dateValue).toISOString().split("T")[0];
        }
        
        return new Date(dateValue).toISOString().split("T")[0];
      };

      const formatFullDate = (dateValue) => {
        if (!dateValue) return null;
        
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate().toISOString();
        } else if (dateValue instanceof Date) {
          return dateValue.toISOString();
        } else if (dateValue.seconds && dateValue.nanoseconds !== undefined) {
          return new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000).toISOString();
        } else if (typeof dateValue === 'string') {
          return new Date(dateValue).toISOString();
        }
        
        return new Date(dateValue).toISOString();
      };

      return {
        id: review.id,
        name: review.patientName,
        photo: "/img/user2.png", // Default photo since we don't store patient photos
        rating: review.rating,
        date: formatDate(review.createdAt),
        comment: review.comment || "",
        verified: true, // All reviews from our system are verified
        aspects: review.aspects,
        wouldRecommend: review.wouldRecommend,
        appointmentDate: formatFullDate(review.appointmentDate),
      };
    });

    return { transformedReviews, ratingData };
  } catch (error) {
    console.error("Error loading doctor reviews:", error);
    return { transformedReviews: [], ratingData: null };
  }
};

// Helper function to serialize Firestore objects
const serializeFirestoreData = (data) => {
  if (!data) return data;
  
  const serialized = { ...data };
  
  // Convert Firestore Timestamps to ISO strings and undefined to null
  Object.keys(serialized).forEach(key => {
    const value = serialized[key];
    
    // Convert undefined to null for JSON serialization
    if (value === undefined) {
      serialized[key] = null;
      return;
    }
    
    // Check if it's a Firestore Timestamp or Date object
    if (value && typeof value === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        // Firestore Timestamp
        serialized[key] = value.toDate().toISOString();
      } else if (value instanceof Date) {
        // JavaScript Date
        serialized[key] = value.toISOString();
      } else if (value.seconds && value.nanoseconds !== undefined) {
        // Firestore Timestamp object format
        serialized[key] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
      }
    }
  });
  
  return serialized;
};

export async function getStaticPaths() {
  try {
    // Get all verified doctors
    const allDoctors = await getAllDoctors();
    const verifiedDoctors = allDoctors.filter(d => d.verified === true);

    // Generate paths for all verified doctors
    const paths = verifiedDoctors.map(doctor => ({
      params: { id: doctor.slug },
    }));

    // Return paths with fallback 'blocking' to generate pages on-demand
    // for new doctors that aren't in the build
    return {
      paths,
      fallback: 'blocking', // Generate new pages on-demand and cache them
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}

export async function getStaticProps(context) {
  const { id } = context.params;

  try {
    // Get doctor by slug
    const doctorData = await getDoctorBySlug(id);

    // Check if doctor exists and is verified
    if (!doctorData || doctorData.verified !== true) {
      return {
        redirect: {
          destination: "/doctores",
          permanent: false,
        },
      };
    }

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SSG] Building page for doctor: ${doctorData.nombre} (${doctorData.especialidad})`);
      console.log(`[SSG] Doctor image: ${doctorData.photoURL || doctorData.imagen}`);
      console.log(`[SSG] Doctor slug: ${doctorData.slug}`);
    }

    // Load reviews for this doctor
    const { transformedReviews, ratingData } = await loadDoctorReviews(doctorData.id);

    // Get all doctors to find related ones
    const allDoctors = await getAllDoctors();
    const relatedDoctors = allDoctors
      .filter(
        (d) =>
          d.id !== doctorData.id &&
          d.especialidad === doctorData.especialidad &&
          d.verified === true
      )
      .sort((a, b) => {
        // Prioritize VIP doctors
        const rankA = getDoctorRank(a);
        const rankB = getDoctorRank(b);
        if (rankA === "VIP" && rankB !== "VIP") return -1;
        if (rankB === "VIP" && rankA !== "VIP") return 1;
        return 0;
      })
      .slice(0, 3);

    // Serialize all data to ensure JSON compatibility
    const serializedDoctor = serializeFirestoreData(doctorData);
    const serializedRelatedDoctors = relatedDoctors.map(doctor => serializeFirestoreData(doctor));

    return {
      props: {
        doctor: serializedDoctor,
        relatedDoctors: serializedRelatedDoctors,
        reviews: transformedReviews,
        averageRating: ratingData,
        error: null,
      },
      // Revalidate every 10 minutes (600 seconds)
      // This enables ISR - pages are regenerated in the background
      revalidate: 600,
    };
  } catch (error) {
    console.error("Error loading doctor data:", error);
    
    return {
      props: {
        doctor: null,
        relatedDoctors: [],
        reviews: [],
        averageRating: null,
        error: "Error loading doctor data",
      },
      revalidate: 60, // Retry sooner if there was an error
    };
  }
}
