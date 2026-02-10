import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import Head from "next/head";
import Link from "next/link";
import {
  AcademicCapIcon,
  BeakerIcon,
  HeartIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function Programas() {
  const programs = [
    {
      title: "Formación Médica Continua",
      description: "Actualización profesional y desarrollo de habilidades para médicos",
      icon: AcademicCapIcon,
      color: "blue",
      features: [
        "Cursos especializados online",
        "Certificaciones reconocidas",
        "Webinars con expertos",
        "Contenido actualizado mensualmente"
      ]
    },
    {
      title: "Investigación Clínica",
      description: "Participa en estudios y avances científicos",
      icon: BeakerIcon,
      color: "purple",
      features: [
        "Acceso a protocolos de investigación",
        "Colaboración con instituciones",
        "Publicación de casos clínicos",
        "Red de investigadores"
      ]
    },
    {
      title: "Salud Comunitaria",
      description: "Programas de prevención y atención primaria",
      icon: HeartIcon,
      color: "red",
      features: [
        "Campañas de prevención",
        "Atención en barrios",
        "Educación para la salud",
        "Seguimiento comunitario"
      ]
    },
    {
      title: "Trabajo en Equipo",
      description: "Colaboración interdisciplinaria para mejor atención",
      icon: UserGroupIcon,
      color: "green",
      features: [
        "Juntas médicas virtuales",
        "Interconsultas especializadas",
        "Casos clínicos compartidos",
        "Red de derivación"
      ]
    },
    {
      title: "Calidad y Seguridad",
      description: "Estándares de excelencia en la práctica médica",
      icon: ShieldCheckIcon,
      color: "indigo",
      features: [
        "Protocolos de calidad",
        "Auditorías clínicas",
        "Mejora continua",
        "Certificación de procesos"
      ]
    },
    {
      title: "Innovación en Salud",
      description: "Tecnología y nuevas herramientas para la práctica médica",
      icon: SparklesIcon,
      color: "yellow",
      features: [
        "Telemedicina avanzada",
        "IA en diagnóstico",
        "Historias clínicas digitales",
        "Herramientas de gestión"
      ]
    }
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
    indigo: "bg-indigo-100 text-indigo-600",
    yellow: "bg-yellow-100 text-yellow-600"
  };

  return (
    <>
      <SEO
        title="Programas | SaludLibre"
        description="Descubre nuestros programas de formación, investigación y desarrollo profesional para médicos y profesionales de la salud."
        canonical="https://salud-libre.vercel.app/programas"
      />
      <Head>
        <meta property="og:title" content="Programas | SaludLibre" />
        <meta
          property="og:description"
          content="Descubre nuestros programas de formación, investigación y desarrollo profesional para médicos y profesionales de la salud."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://salud-libre.vercel.app/programas" />
      </Head>

      <NavBar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-sky-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Programas de <span className="text-sky-600">SaludLibre</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Desarrollamos iniciativas para mejorar la práctica médica, fomentar la
            investigación y fortalecer la atención en salud
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program, index) => {
              const Icon = program.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-8">
                    <div
                      className={`w-16 h-16 ${colorClasses[program.color]} rounded-xl flex items-center justify-center mb-6`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 mb-6">{program.description}</p>
                    <ul className="space-y-3">
                      {program.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-sky-600 to-blue-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Quieres participar en nuestros programas?
          </h2>
          <p className="text-xl text-sky-100 mb-8">
            Únete a nuestra comunidad de profesionales comprometidos con la excelencia en salud
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/registro"
              className="bg-white text-sky-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Registrarse como Doctor
            </Link>
            <Link
              href="/doctores"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-sky-600 transition-colors"
            >
              Ver Doctores
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              ¿Cómo funcionan nuestros programas?
            </h2>
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="text-xl font-semibold mb-2">1. Inscripción</h3>
                <p>
                  Regístrate en nuestra plataforma y completa tu perfil profesional.
                  Podrás acceder a todos los programas según tu especialidad e intereses.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">2. Participación</h3>
                <p>
                  Elige los programas que más te interesen. Puedes participar en varios
                  simultáneamente y adaptar tu ritmo según tu disponibilidad.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">3. Certificación</h3>
                <p>
                  Al completar los programas, recibirás certificaciones que avalan tu
                  desarrollo profesional y pueden sumar puntos para tu carrera.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
