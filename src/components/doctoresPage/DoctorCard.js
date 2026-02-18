import React, { useState, useEffect } from "react";
import { getDoctorRank, cleanDoctorName } from "../../lib/subscriptionUtils";
import Link from "next/link";

const checkDoctorAvailability = (horario) => {
  // Return false if horario is not provided or invalid
  if (!horario || typeof horario !== "string") {
    return false;
  }

  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Parse schedule string (e.g., "Lunes a Viernes, 9:00 AM - 5:00 PM")
    const scheduleeParts = horario.split(", ");
    if (scheduleeParts.length < 2) {
      console.warn("Invalid horario format:", horario);
      return false;
    }

    const [days, hours] = scheduleeParts;

    // Parse days
    const daysParts = days.split(" a ");
    if (daysParts.length !== 2) {
      console.warn("Invalid days format in horario:", days);
      return false;
    }

    const [startDay, endDay] = daysParts.map((day) => {
      const daysMap = {
        Domingo: 0,
        Lunes: 1,
        Martes: 2,
        Miércoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sábado: 6,
      };
      return daysMap[day.trim()];
    });

    // Check if day parsing was successful
    if (startDay === undefined || endDay === undefined) {
      console.warn("Could not parse days from horario:", days);
      return false;
    }

    // Parse time range
    const timeParts = hours.split(" - ");
    if (timeParts.length !== 2) {
      console.warn("Invalid time range format in horario:", hours);
      return false;
    }

    const [startTime, endTime] = timeParts;

    // Parse start time
    const startTimeParts = startTime.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!startTimeParts) {
      console.warn("Could not parse start time:", startTime);
      return false;
    }

    let startHour = parseInt(startTimeParts[1]);
    if (startTimeParts[3].toUpperCase() === "PM" && startHour !== 12)
      startHour += 12;
    if (startTimeParts[3].toUpperCase() === "AM" && startHour === 12)
      startHour = 0;
    const startMinutes = parseInt(startTimeParts[2]);

    // Parse end time
    const endTimeParts = endTime.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!endTimeParts) {
      console.warn("Could not parse end time:", endTime);
      return false;
    }

    let endHour = parseInt(endTimeParts[1]);
    if (endTimeParts[3].toUpperCase() === "PM" && endHour !== 12) endHour += 12;
    if (endTimeParts[3].toUpperCase() === "AM" && endHour === 12) endHour = 0;
    const endMinutes = parseInt(endTimeParts[2]);

    // Check if current time is within schedule
    const isWithinDays = currentDay >= startDay && currentDay <= endDay;
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    const startTimeInMinutes = startHour * 60 + startMinutes;
    const endTimeInMinutes = endHour * 60 + endMinutes;
    const isWithinHours =
      currentTimeInMinutes >= startTimeInMinutes &&
      currentTimeInMinutes <= endTimeInMinutes;

    return isWithinDays && isWithinHours;
  } catch (error) {
    console.error("Error parsing horario:", horario, error);
    return false;
  }
};

export default function DoctorCard({ doctor, delay = 0, inside = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Obtener el rango basado en la suscripción actual
  const doctorRank = getDoctorRank(doctor);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    // Check availability initially only if horario exists
    if (doctor.horario) {
      setIsAvailable(checkDoctorAvailability(doctor.horario));

      // Update availability every minute
      const interval = setInterval(() => {
        setIsAvailable(checkDoctorAvailability(doctor.horario));
      }, 60000);

      return () => clearInterval(interval);
    } else {
      // If no horario, set as not available
      setIsAvailable(false);
    }
  }, [doctor.horario]);

  const handleWhatsAppClick = () => {
    const doctorName = cleanDoctorName(doctor.nombre, doctor.genero);
    const message = `Hola ${doctorName}, quisiera agendar una consulta`;
    const whatsappUrl = `https://wa.me/${doctor.telefono.replace(
      /\D/g,
      ""
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCallClick = () => {
    window.location.href = `tel:${doctor.telefono}`;
  };

  const getCardStyle = () => {
    switch (doctorRank) {
      case "VIP":
        return "p-0 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-2 border-amber-300/50 shadow-xl hover:shadow-2xl hover:border-amber-400/70 hover:from-amber-100/50 hover:to-white ring-1 ring-amber-200/30";
      case "Intermedio":
        return "p-0 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl hover:border-blue-300/70 ring-1 ring-blue-100/30";
      default:
        return "p-0 border border-slate-100 shadow-md hover:shadow-lg hover:border-slate-200";
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl transition-all duration-700 transform isolate backdrop-blur-sm
        ${getCardStyle()}
        ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
        }`}
    >
      <div className="relative group overflow-hidden rounded-3xl">
        {/* Premium Badge - Redesigned */}
        {doctorRank === "VIP" && (
          <div className="absolute -top-2 -right-2 z-20">
            <div className="relative">
              <div
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 
                text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg
                flex items-center gap-2 border-2 border-white"
              >
                <svg
                  className="w-4 h-4 text-yellow-100"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold tracking-wide">PREMIUM</span>
              </div>
              {/* Shine effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                rounded-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                transition-transform duration-1000 ease-out"
              ></div>
            </div>
          </div>
        )}

        {/* Intermediate Badge */}
        {doctorRank === "Intermedio" && (
          <div className="absolute -top-2 -right-2 z-20">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 
              text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md
              flex items-center gap-1.5 border border-blue-400"
            >
              <svg
                className="w-3.5 h-3.5 text-blue-100"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">PLUS</span>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className={`${doctorRank === "VIP" ? "p-6" : "p-5"}`}>
          {/* Header Section - Photo and Basic Info Horizontal Layout */}
          <div className="flex gap-4 mb-4 flex-col">
            {/* Doctor Image - Fixed size for consistency */}
            <div className="relative shrink-0 mx-auto group-hover:transform group-hover:scale-105 transition-all duration-500 ease-out">
              {/* Glow effect for premium */}
              {doctorRank === "VIP" && (
                <div
                  className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 
                  rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"
                ></div>
              )}
              <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20 
                opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
              />
              {(doctorRank === "VIP" || doctorRank === "Intermedio") && (
                <img
                  src={doctor.photoURL || doctor.imagen || "/img/doctor-1.jpg"}
                  alt={doctor.nombre}
                  className={`rounded-2xl object-cover shadow-lg transition-all duration-500 border-2
                  ${
                    doctorRank === "VIP"
                      ? "w-40 h-40 border-amber-200/50 shadow-amber-200/20"
                      : doctorRank === "Intermedio"
                      ? "w-18 h-18 border-blue-200/50 shadow-blue-200/20"
                      : "w-16 h-16 border-slate-200"
                  }`}
                  onError={(e) => {
                    e.target.src = "/img/doctor-1.jpg";
                  }}
                />
              )}
            </div>

            {/* Doctor Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3
                  className={`font-bold transition-colors duration-500 leading-tight tracking-tight
                  ${
                    doctorRank === "VIP"
                      ? "text-xl lg:text-2xl bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent"
                      : doctorRank === "Intermedio"
                      ? "text-lg lg:text-xl text-blue-800"
                      : "text-base text-blue-700"
                  }`}
                >
                  {cleanDoctorName(doctor.nombre, doctor.genero)}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300
                    ${
                      doctorRank === "VIP"
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-200/50 shadow-sm"
                        : doctorRank === "Intermedio"
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200/50"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {doctor.especialidad}
                  </span>
                  {doctorRank === "VIP" && (
                    <span
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-full border text-xs font-semibold gap-1.5 ${
                        isAvailable
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/50"
                          : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 ${
                          isAvailable ? "bg-emerald-500" : "bg-red-500"
                        } rounded-full ${
                          isAvailable ? "animate-pulse" : ""
                        } shadow-sm`}
                      ></span>
                      {isAvailable ? "Disponible" : "No disponible"}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {doctor.consultaOnline && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-xs font-semibold gap-1.5 border border-cyan-200/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3 h-3"
                        >
                          <path d="M1 12.5A4.5 4.5 0 005.5 17H15a4 4 0 001.866-7.539 3.504 3.504 0 00-4.504-4.272A4.5 4.5 0 004.06 8.235 4.502 4.502 0 001 12.5z" />
                        </svg>
                        Consulta Online
                      </span>
                    )}
                    {doctor.distance !== undefined && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 text-xs font-semibold gap-1.5 border border-emerald-200/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3 h-3"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.646 7.584.829.8 1.654 1.381 2.274 1.765.311.193.571.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {doctor.distance} km
                      </span>
                    )}
                    {(doctorRank === "VIP" || doctorRank === "Intermedio") &&
                      doctor.ubicacion && (
                        <span className="inline-flex items-start px-3 py-1.5 text-purple-700 text-xs font-semibold gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="truncate text-wrap flex-1">{doctor.ubicacion}</span>
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Tags and Info */}
          <div className="space-y-3 mb-4">
            {/* Description */}
            {(doctorRank === "VIP" || doctorRank === "Intermedio") &&
              doctor.descripcion && (
                <div
                  className={`${
                    doctorRank === "VIP"
                      ? "bg-gradient-to-r from-amber-50/50 to-yellow-50/50 border border-amber-100/50"
                      : "bg-blue-50/30 border border-blue-100/50"
                  } 
                rounded-xl p-3`}
                >
                  <p className="text-slate-700 leading-relaxed text-sm line-clamp-2">
                    {doctor.descripcion}
                  </p>
                </div>
              )}

            {/* Prepagas Section - Enhanced */}
            {doctor.prepagas && doctor.prepagas.length > 0 && (
              <div
                className={`pt-3 border-t ${
                  doctorRank === "VIP" ? "border-amber-100" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-1 rounded-full ${
                      doctorRank === "VIP" ? "bg-emerald-100" : "bg-green-100"
                    }`}
                  >
                    <svg
                      className="w-3 h-3 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">
                    Obras Sociales
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.prepagas.slice(0, 3).map((prepaga, index) => (
                    <span
                      key={index}
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-md border transition-colors
                        ${
                          doctorRank === "VIP"
                            ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/50"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                    >
                      {prepaga}
                    </span>
                  ))}
                  {doctor.prepagas.length > 3 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md border border-gray-200">
                      +{doctor.prepagas.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Enhanced */}
          <div
            className={`${doctorRank === "VIP" ? "mt-5" : "mt-4"} space-y-2.5`}
          >
            <div className="flex gap-2.5">
              {(doctorRank === "VIP" || doctorRank === "Intermedio") && (
                <button
                  onClick={handleWhatsAppClick}
                  className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2.5 
                    transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] 
                    font-semibold text-white shadow-lg hover:shadow-xl
                    ${
                      doctorRank === "VIP"
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-emerald-200"
                        : "bg-emerald-500 hover:bg-emerald-600"
                    }`}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="tracking-wide text-sm">WhatsApp</span>
                </button>
              )}
              <button
                onClick={handleCallClick}
                className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2.5 
                  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                  font-semibold text-white shadow-lg hover:shadow-xl
                  ${
                    doctorRank === "VIP"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-200"
                      : doctorRank === "Intermedio"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="tracking-wide text-sm">Llamar</span>
              </button>
            </div>
            <Link
              href={`/doctores/${doctor.slug || doctor.id}`}
              className={`w-full py-2.5 text-center transition-all duration-300 rounded-2xl font-semibold border-2 block text-sm
                ${
                  doctorRank === "VIP"
                    ? "text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200 hover:border-amber-300"
                    : doctorRank === "Intermedio"
                    ? "text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
            >
              Ver perfil completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
