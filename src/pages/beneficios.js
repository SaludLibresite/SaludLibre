import {
  CheckIcon,
  StarIcon,
  UsersIcon,
  CalendarIcon,
  GlobeAltIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Link from "next/link";

export default function Beneficios() {
  const benefits = [
    {
      icon: UsersIcon,
      title: "Mayor Visibilidad",
      description:
        "Accede a miles de pacientes potenciales que buscan especialistas como tú en nuestra plataforma.",
      highlight: "Más de 10,000 búsquedas mensuales",
    },
    {
      icon: CalendarIcon,
      title: "Gestión de Citas",
      description:
        "Sistema integrado de reservas que permite a los pacientes agendar citas directamente contigo.",
      highlight: "Ahorra hasta 5 horas semanales",
    },
    {
      icon: GlobeAltIcon,
      title: "Consultas Online",
      description:
        "Ofrece telemedicina y amplía tu alcance más allá de tu ubicación física.",
      highlight: "Aumenta ingresos hasta 40%",
    },
    {
      icon: ChartBarIcon,
      title: "Análisis y Estadísticas",
      description:
        "Obtén insights detallados sobre tus pacientes, horarios más demandados y performance.",
      highlight: "Dashboard profesional incluido",
    },
    {
      icon: StarIcon,
      title: "Sistema de Reseñas",
      description:
        "Construye tu reputación digital con reseñas verificadas de pacientes reales.",
      highlight: "Certificación de calidad",
    },
    {
      icon: CheckIcon,
      title: "Perfil Profesional",
      description:
        "Crea un perfil completo con tu experiencia, especialidades y certificaciones.",
      highlight: "100% personalizable",
    },
  ];

  const plans = [
    {
      name: "Básico",
      price: "Gratis",
      period: "por mes",
      description: "Perfecto para comenzar",
      features: [
        "Perfil básico",
        "Hasta 5 citas por mes",
        "Soporte por email",
        "Reseñas de pacientes",
      ],
      cta: "Comenzar Gratis",
      featured: false,
    },
    {
      name: "Profesional",
      price: "$29",
      period: "por mes",
      description: "Para médicos establecidos",
      features: [
        "Perfil completo con galería",
        "Citas ilimitadas",
        "Consultas online",
        "Dashboard de estadísticas",
        "Soporte prioritario",
        "Integración con calendario",
      ],
      cta: "Iniciar Prueba",
      featured: true,
    },
    {
      name: "Premium",
      price: "$59",
      period: "por mes",
      description: "Para clínicas y centros médicos",
      features: [
        "Todo de Profesional",
        "Múltiples especialistas",
        "API personalizada",
        "Reportes avanzados",
        "Soporte 24/7",
        "Gestor de cuenta dedicado",
      ],
      cta: "Contactar Ventas",
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <NavBar
        links={[
          { href: "/", label: "Inicio" },
          { href: "/doctores", label: "Doctores" },
          { href: "/beneficios", label: "Beneficios" },
        ]}
        button={{ text: "Iniciar Sesión", href: "/auth/login" }}
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Haz crecer tu práctica médica
            </h1>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              Únete a la plataforma líder de profesionales de la salud en
              Argentina. Conecta con más pacientes y gestiona tu consulta de
              manera eficiente.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Registrarse Ahora
              </Link>
              <Link
                href="#beneficios"
                className="text-lg font-semibold leading-6 text-white hover:text-blue-100"
              >
                Conocer más <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="beneficios" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ¿Por qué elegir MedicosAR?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Descubre las ventajas de formar parte de nuestra comunidad médica
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <benefit.icon
                      className="h-5 w-5 flex-none text-blue-600"
                      aria-hidden="true"
                    />
                    {benefit.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{benefit.description}</p>
                    <p className="mt-6">
                      <span className="font-semibold text-blue-600">
                        {benefit.highlight}
                      </span>
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Planes adaptados a tus necesidades
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Elige el plan que mejor se adapte a tu práctica médica
            </p>
          </div>
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {plans.map((plan, planIdx) => (
              <div
                key={plan.name}
                className={`flex flex-col justify-between rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-900/10 sm:p-10 ${
                  plan.featured
                    ? "lg:z-10 lg:rounded-b-none"
                    : planIdx === 0
                    ? "lg:rounded-r-none"
                    : "lg:rounded-l-none"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">
                      {plan.name}
                    </h3>
                    {plan.featured ? (
                      <p className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                        Más Popular
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {plan.description}
                  </p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">
                      {plan.period}
                    </span>
                  </p>
                  <ul
                    role="list"
                    className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
                  >
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon
                          className="h-6 w-5 flex-none text-blue-600"
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/auth/register"
                  className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    plan.featured
                      ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600"
                      : "text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 focus-visible:outline-blue-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ¿Listo para comenzar?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Crea tu perfil profesional en minutos y comienza a recibir
              pacientes hoy mismo.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Crear Cuenta Gratis
              </Link>
              <Link
                href="/auth/login"
                className="text-lg font-semibold leading-6 text-white hover:text-blue-100"
              >
                Ya tengo cuenta <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
