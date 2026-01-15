import React, { useState, useMemo } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import Head from "next/head";

// Componentes de iconos SVG
const HospitalIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const CreditCardIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const ToolIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const BookIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const faqData = [
  {
    category: "General",
    icon: HospitalIcon,
    questions: [
      {
        id: 1,
        question: "¿Qué es Salud Libre?",
        answer:
          "Salud Libre es una plataforma digital que conecta pacientes con profesionales de la salud en Argentina. Ofrecemos un directorio de médicos verificados, sistema de agendamiento de turnos, gestión de historiales médicos digitales y almacenamiento seguro de recetas médicas.",
      },
      {
        id: 2,
        question: "¿Es gratuito usar Salud Libre?",
        answer:
          "El registro y uso básico de la plataforma es gratuito. Esto incluye buscar médicos, ver perfiles profesionales y gestionar tu historial médico. Algunas funcionalidades premium pueden tener costo adicional.",
      },
      {
        id: 3,
        question: "¿Cómo se verifican los profesionales?",
        answer:
          "Todos los médicos en nuestra plataforma pasan por un riguroso proceso de verificación que incluye validación de matrícula profesional, antecedentes académicos, experiencia laboral y referencias profesionales.",
      },
    ],
  },
  {
    category: "Turnos Médicos",
    icon: CalendarIcon,
    questions: [
      {
        id: 4,
        question: "¿Cómo agendo un turno médico?",
        answer:
          "Para agendar un turno, buscá el médico de tu preferencia, seleccioná una fecha y horario disponible en su calendario, completá tus datos y confirmá el turno. Vas a recibir una confirmación por email y SMS.",
      },
      {
        id: 5,
        question: "¿Puedo cancelar o reprogramar un turno?",
        answer:
          "Sí, podés cancelar o reprogramar turnos hasta 24 horas antes de la fecha programada sin costo adicional. Para cambios de último momento, consultá la política específica del profesional.",
      },
      {
        id: 6,
        question: "¿Qué pasa si el médico cancela mi turno?",
        answer:
          "Si un médico cancela tu turno, vas a ser notificado inmediatamente y podés reprogramar sin costo adicional. En algunos casos, podemos sugerirte profesionales alternativos con disponibilidad similar.",
      },
      {
        id: 7,
        question: "¿Funcionan los turnos con obra social?",
        answer:
          "Muchos de nuestros profesionales aceptan diferentes obras sociales. Podés filtrar médicos por obra social en nuestra búsqueda y confirmar la cobertura al agendar el turno.",
      },
    ],
  },
  {
    category: "Historial Médico",
    icon: ClipboardIcon,
    questions: [
      {
        id: 8,
        question: "¿Cómo funciona el historial médico digital?",
        answer:
          "Tu historial médico digital almacena de forma segura todas tus consultas, recetas, estudios y notas médicas. Solo vos y los profesionales que autorices pueden acceder a esta información.",
      },
      {
        id: 9,
        question: "¿Puedo subir mis estudios médicos?",
        answer:
          "Sí, podés subir análisis, radiografías, resonancias y otros estudios en formato PDF o imagen. Nuestro sistema los va a organizar cronológicamente en tu historial.",
      },
      {
        id: 10,
        question: "¿Los médicos pueden ver mi historial completo?",
        answer:
          "Los médicos solo pueden ver tu historial médico cuando vos les otorgues acceso específico para una consulta. Vos mantenés control total sobre quién ve tu información.",
      },
    ],
  },
  {
    category: "Seguridad y Privacidad",
    icon: LockIcon,
    questions: [
      {
        id: 11,
        question: "¿Qué tan segura es mi información médica?",
        answer:
          "Utilizamos encriptación de nivel bancario, servidores certificados y cumplimos con todas las regulaciones argentinas de protección de datos médicos. Tu información está protegida con los más altos estándares de seguridad.",
      },
      {
        id: 12,
        question: "¿Quién puede ver mi información personal?",
        answer:
          "Solo vos y los profesionales de salud que autorices específicamente pueden acceder a tu información médica. Nuestro personal técnico tiene acceso limitado y solo para soporte técnico cuando sea necesario.",
      },
      {
        id: 13,
        question: "¿Puedo eliminar mi cuenta y datos?",
        answer:
          "Sí, podés solicitar la eliminación completa de tu cuenta y datos en cualquier momento. Vamos a conservar solo la información mínima requerida por ley durante los períodos establecidos.",
      },
    ],
  },
  {
    category: "Pagos y Facturación",
    icon: CreditCardIcon,
    questions: [
      {
        id: 14,
        question: "¿Cómo realizo el pago de las consultas?",
        answer:
          "Podés pagar directamente en la plataforma con tarjeta de crédito/débito, transferencia bancaria o efectivo (según el profesional). También aceptamos pagos con obra social cuando corresponda.",
      },
      {
        id: 15,
        question: "¿Recibo factura de mis consultas?",
        answer:
          "Sí, automáticamente generamos facturas digitales para todas las transacciones. Podés descargarlas desde tu panel de usuario y son válidas para reintegros de obra social.",
      },
      {
        id: 16,
        question: "¿Hay costos ocultos?",
        answer:
          "No, todos los costos son transparentes y se muestran claramente antes de confirmar cualquier turno o servicio. No hay costos ocultos ni comisiones adicionales.",
      },
    ],
  },
  {
    category: "Soporte Técnico",
    icon: ToolIcon,
    questions: [
      {
        id: 17,
        question: "¿Qué hago si tengo problemas técnicos?",
        answer:
          "Nuestro equipo de soporte está disponible 24/7 por chat, email o teléfono. También tenemos una base de conocimientos con soluciones a problemas comunes.",
      },
      {
        id: 18,
        question: "¿La plataforma funciona en dispositivos móviles?",
        answer:
          "Sí, Salud Libre está optimizada para funcionar perfectamente en computadoras, tablets y teléfonos móviles. También estamos desarrollando una aplicación móvil nativa.",
      },
    ],
  },
];

export default function PreguntasFrecuentes() {
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState("General");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const categories = [...new Set(faqData.map((item) => item.category))];

  // Función de búsqueda mejorada
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return faqData.find((item) => item.category === activeCategory);
    }

    const allQuestions = faqData.flatMap((category) =>
      category.questions.map((q) => ({
        ...q,
        category: category.category,
        icon: category.icon,
      }))
    );

    return {
      category: "Resultados de búsqueda",
      icon: SearchIcon,
      questions: allQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    };
  }, [activeCategory, searchTerm]);

  return (
    <>
      <Head>
        <title>Preguntas Frecuentes - Salud Libre</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <SEO 
          title="Preguntas Frecuentes - Salud Libre"
          description="Encontrá respuestas a las preguntas más comunes sobre cómo agendar turnos, consultas online, especialidades médicas y más en Salud Libre."
          url="/preguntas-frecuentes"
        />
        <NavBar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-6">Preguntas Frecuentes</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Encontrá respuestas rápidas a todas tus dudas sobre Salud Libre
            </p>

            {/* Barra de búsqueda */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar en preguntas frecuentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-2xl shadow-lg border-0 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Navegación de categorías */}
          <div className="xl:w-1/4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm mr-3">
                  <BookIcon />
                </span>
                Categorías
              </h3>
              <nav className="space-y-3">
                {categories.map((category) => {
                  const categoryData = faqData.find(
                    (item) => item.category === category
                  );
                  const IconComponent = categoryData?.icon;
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setSearchTerm("");
                      }}
                      className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-300 group flex items-center ${
                        activeCategory === category && !searchTerm
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                          : "text-gray-700 hover:bg-gray-50 hover:shadow-md"
                      }`}
                    >
                      <span className="mr-3">
                        {IconComponent && <IconComponent />}
                      </span>
                      <span className="font-medium">{category}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Contenido de preguntas */}
          <div className="xl:w-3/4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header de la sección */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-4">
                    {filteredData?.icon && <filteredData.icon />}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {filteredData?.category}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {filteredData?.questions?.length || 0} pregunta
                      {filteredData?.questions?.length !== 1 ? "s" : ""}{" "}
                      disponible
                      {filteredData?.questions?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de preguntas */}
              <div className="p-8">
                {filteredData?.questions?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.82-5.66-2.174C8.477 11.332 10.166 10 12.004 10c1.837 0 3.527 1.332 5.663 2.826A7.963 7.963 0 0120 15M4 7a8 8 0 1116 0v5a8 8 0 11-16 0V7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-gray-600">
                      Intentá con otros términos de búsqueda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredData?.questions.map((item, index) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group"
                        >
                          <span className="font-semibold text-gray-900 pr-4 group-hover:text-blue-700 transition-colors duration-300">
                            {item.question}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center transition-all duration-300 ${
                              openItems[item.id]
                                ? "bg-blue-500 rotate-180"
                                : "group-hover:bg-blue-200"
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 transition-colors duration-300 ${
                                openItems[item.id]
                                  ? "text-white"
                                  : "text-blue-600"
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </button>
                        {openItems[item.id] && (
                          <div className="px-6 pb-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                            <div className="pt-4 border-t border-blue-100">
                              <p className="text-gray-700 leading-relaxed text-lg">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sección de contacto mejorada */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  ¿Necesitas más ayuda?
                </h3>
                <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
                  Nuestro equipo de soporte especializado está disponible 24/7
                  para resolver todas tus dudas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <a
                    href="mailto:contactos@saludlibre.com.ar"
                    className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all duration-300">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-semibold mb-2">Email</h4>
                    <p className="text-blue-100 text-sm">
                      contactos@saludlibre.com.ar
                    </p>
                  </a>
                  <a
                    href="tel:+5491124765705"
                    className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all duration-300">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-semibold mb-2">Teléfono</h4>
                    <p className="text-blue-100 text-sm">1124765705</p>
                  </a>
                  <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all duration-300">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-semibold mb-2">Chat en vivo</h4>
                    <p className="text-blue-100 text-sm">Disponible 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
}
