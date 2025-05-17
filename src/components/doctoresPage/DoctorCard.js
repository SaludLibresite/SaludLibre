import React, { useState, useEffect } from "react";

const checkDoctorAvailability = (horario) => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Parse schedule string (e.g., "Lunes a Viernes, 9:00 AM - 5:00 PM")
  const [days, hours] = horario.split(", ");
  const [startDay, endDay] = days.split(" a ").map((day) => {
    const daysMap = {
      Domingo: 0,
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
    };
    return daysMap[day];
  });

  const [timeRange] = hours.split(", ");
  const [startTime, endTime] = timeRange.split(" - ");

  // Parse start time
  const startTimeParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)/);
  let startHour = parseInt(startTimeParts[1]);
  if (startTimeParts[3] === "PM" && startHour !== 12) startHour += 12;
  if (startTimeParts[3] === "AM" && startHour === 12) startHour = 0;
  const startMinutes = parseInt(startTimeParts[2]);

  // Parse end time
  const endTimeParts = endTime.match(/(\d+):(\d+)\s*(AM|PM)/);
  let endHour = parseInt(endTimeParts[1]);
  if (endTimeParts[3] === "PM" && endHour !== 12) endHour += 12;
  if (endTimeParts[3] === "AM" && endHour === 12) endHour = 0;
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
};

export default function DoctorCard({ doctor, delay = 0, inside = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    // Check availability initially
    setIsAvailable(checkDoctorAvailability(doctor.horario));

    // Update availability every minute
    const interval = setInterval(() => {
      setIsAvailable(checkDoctorAvailability(doctor.horario));
    }, 60000);

    return () => clearInterval(interval);
  }, [doctor.horario]);

  const handleWhatsAppClick = () => {
    const message = `Hola Dr. ${doctor.nombre}, quisiera agendar una consulta`;
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
    switch (doctor.rango) {
      case "VIP":
        return "p-0 border-2 border-amber-200 shadow-lg hover:shadow-2xl hover:border-amber-300";
      case "Intermedio":
        return "p-0 border border-blue-100 shadow-md hover:shadow-xl hover:border-blue-200";
      default:
        return "p-0 border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200";
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl  transition-all duration-500 transform isolate
        ${getCardStyle()}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="relative group">
        {/* Premium Badge */}
        {doctor.rango === "VIP" && (
          <div
            className="absolute -top-4 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 
            text-white text-sm font-medium px-4 py-1.5 rounded-full z-10 shadow-md
            flex items-center gap-1.5"
          >
            <span className="text-amber-100">⭐</span>
            <span className="font-semibold">Premium</span>
          </div>
        )}

        {/* Card Content */}
        <div className="p-6">
          <div className={`flex gap-6 ${inside ? "flex-col" : ""}`}>
            {/* Doctor Image with Hover Effect */}
            <div className="relative shrink-0 group-hover:transform group-hover:scale-105 transition-transform duration-300">
              <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
              />
              <img
                src={doctor.imagen}
                alt={doctor.nombre}
                className={`rounded-2xl object-cover shadow-md transition-transform duration-300
                  ${
                    doctor.rango === "VIP"
                      ? "w-40 h-40 md:w-44 md:h-44"
                      : doctor.rango === "Intermedio"
                      ? "w-32 h-32"
                      : "w-28 h-28"
                  }`}
              />
            </div>

            {/* Doctor Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h3
                  className={`font-semibold transition-colors duration-300 leading-tight
                  ${
                    doctor.rango === "VIP"
                      ? "text-2xl text-blue-800"
                      : doctor.rango === "Intermedio"
                      ? "text-xl text-blue-700"
                      : "text-lg text-blue-600"
                  }`}
                >
                  Dr. {doctor.nombre}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span
                    className={`inline-block px-3.5 py-1.5 rounded-full text-sm font-medium
                    ${
                      doctor.rango === "VIP"
                        ? "bg-amber-50 text-amber-700"
                        : doctor.rango === "Intermedio"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {doctor.especialidad}
                  </span>
                  {doctor.rango === "VIP" && (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full ${
                        isAvailable
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      } text-sm font-medium gap-1`}
                    >
                      <span
                        className={`w-1.5 h-1.5 ${
                          isAvailable ? "bg-green-500" : "bg-red-500"
                        } rounded-full ${isAvailable ? "animate-pulse" : ""}`}
                      ></span>
                      {isAvailable ? "Disponible ahora" : "No disponible"}
                    </span>
                  )}
                  {doctor.consultaOnline && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M10 2a.75.75 0 01.75.75v.25h.75a.75.75 0 010 1.5h-.75v.25a.75.75 0 01-1.5 0v-.25h-.75a.75.75 0 010-1.5h.75v-.25A.75.75 0 0110 2zM8.005 4.495A6.5 6.5 0 002.053 8.246a.75.75 0 01-1.49-.195 8 8 0 017.937-5.417.75.75 0 01.505 1.86zM10 6.5A1.5 1.5 0 0111.5 8v2A1.5 1.5 0 0110 11.5a1.5 1.5 0 01-1.5-1.5V8A1.5 1.5 0 0110 6.5z" />
                        <path d="M10 12.5a4.502 4.502 0 00-4.5 4.445V17.5a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75v-.555A4.502 4.502 0 0010 12.5zM5.07 15.035A3.002 3.002 0 018 14.05h4a3.002 3.002 0 012.93 1.018a6.995 6.995 0 00-8.86-.032z" />
                      </svg>
                      Consulta Online
                    </span>
                  )}
                  {(doctor.rango === "VIP" ||
                    doctor.rango === "Intermedio") && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-medium gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {doctor.ubicacion}
                    </span>
                  )}
                </div>
              </div>

              {(doctor.rango === "VIP" || doctor.rango === "Intermedio") && (
                <p
                  className={`text-slate-600 leading-relaxed
                  ${
                    doctor.rango === "VIP"
                      ? "text-base line-clamp-3"
                      : "text-sm line-clamp-2"
                  }`}
                >
                  {doctor.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <div className="flex gap-3">
              {(doctor.rango === "VIP" || doctor.rango === "Intermedio") && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 
                    rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300
                    transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </button>
              )}
              <button
                onClick={handleCallClick}
                className={`flex-1 text-white py-3 rounded-xl flex items-center justify-center gap-2.5 
                  transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
                  font-medium
                  ${
                    doctor.rango === "VIP"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : doctor.rango === "Intermedio"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-blue-400 hover:bg-blue-500"
                  }`}
              >
                <svg
                  className="w-5 h-5"
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
                Call
              </button>
            </div>
            <button
              onClick={() =>
                (window.location.href = `/doctores/${doctor.slug}`)
              }
              className="w-full text-slate-600 hover:text-slate-800 py-2.5 text-center 
                transition-all duration-300 hover:bg-slate-50 rounded-xl font-medium"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
