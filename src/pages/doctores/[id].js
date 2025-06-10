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
    <main className="bg-[#f7f9fb] min-h-screen">
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Perfil y formulario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8">
              {/* Foto */}
              <div className="flex flex-col items-center md:items-start">
                <img
                  src={`/${doctor.imagen}`}
                  alt={doctor.nombre}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                />
                {doctor.rango === "VIP" && (
                  <span className="bg-yellow-400 text-white text-xs font-bold px-4 py-1 rounded-full mb-2">Premium</span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mr-2">Dr. {doctor.nombre}</h1>
                  {doctor.rango === "VIP" && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">Premium</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-gray-700 font-medium">{doctor.especialidad}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                    {doctor.rating || '4.9'} ({doctor.reviews || '128 reviews'})
                  </span>
                  <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#22c55e" /></svg>
                    {isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {doctor.experience || '15 años experiencia'}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    Certificado
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{doctor.descripcion}</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  {doctor.detalle || 'Dr. John Smith is a distinguished cardiologist with over 15 years of experience in treating complex cardiovascular conditions. He completed his medical education at Harvard Medical School and underwent specialized training in interventional cardiology at Johns Hopkins Hospital.\n\nHis expertise includes: Coronary artery disease management, Heart failure treatment, Cardiac catheterization, Preventive cardiology, Echocardiography. Dr. Smith has published numerous research papers in prestigious medical journals and is actively involved in clinical research to advance cardiovascular medicine.'}
                </div>
              </div>
            </div>
            {/* Ubicación y horario */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-800 mb-2">Location & Hours</h3>
                <div className="text-gray-700 mb-2">
                  <span className="font-semibold">Primary Location:</span> {doctor.ubicacion || '123 Medical Center Drive New York, NY 10001'}
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Working Hours:</span>
                  <ul className="ml-4 mt-1 text-sm">
                    <li>Monday - Friday: 9:00 AM - 5:00 PM</li>
                    <li>Saturday: 10:00 AM - 2:00 PM</li>
                    <li>Sunday: Closed</li>
                  </ul>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-48 h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>
            </div>
            {/* Galería */}
            <div className="mt-8">
              <DoctorGallery images={["/img/doctor-1.jpg","/img/doctor-2.jpg","/img/doctor-3.jpg"]} />
            </div>
            {/* Reseñas */}
            <div className="mt-8">
              <DoctorReviews reviews={usersReview} />
            </div>
            {/* Especialistas relacionados */}
            {Array.isArray(relatedDoctors) && relatedDoctors.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-lg font-bold text-blue-800 mb-4">Related Specialists</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedDoctors.map((relatedDoctor, index) => (
                    <DoctorCard
                      key={relatedDoctor.slug}
                      doctor={relatedDoctor}
                      delay={index * 100}
                      inside={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Columna derecha */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Book an Appointment</h3>
              <AgendarCita
                onSubmit={(data) => {
                  alert(`Cita agendada para ${data.nombre} el ${data.fecha}`);
                }}
                doctorName={doctor.nombre}
                especialidad={doctor.especialidad}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Quick Contact</h4>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                onClick={() => window.open(`tel:${doctor.telefono}`)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a2 2 0 011.789 1.106l1.387 2.773a2 2 0 01-.217 2.18l-1.516 1.89a11.042 11.042 0 005.516 5.516l1.89-1.516a2 2 0 012.18-.217l2.773 1.387A2 2 0 0121 17.72V21a2 2 0 01-2 2h-1C9.163 23 1 14.837 1 5V4a2 2 0 012-2z"/></svg>
                Call Now
              </button>
              <button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                onClick={() => window.open(`https://wa.me/${doctor.telefono.replace(/\D/g, "")}`, "_blank")}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
