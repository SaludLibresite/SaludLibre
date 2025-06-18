import React from "react";
import Link from "next/link";
import Image from "next/image";

const specialties = [
  {
    id: 1,
    name: "Cardiología",
    href: "/especialidades/cardiologia",
  },
  {
    id: 2,
    name: "Neurología",
    href: "/especialidades/neurologia",
  },
  {
    id: 3,
    name: "Pediatría",
    href: "/especialidades/pediatria",
  },
  {
    id: 4,
    name: "Dermatología",
    href: "/especialidades/dermatologia",
  },
  {
    id: 5,
    name: "Traumatología",
    href: "/especialidades/traumatologia",
  },
  {
    id: 6,
    name: "Oftalmología",
    href: "/especialidades/oftalmologia",
  },
  {
    id: 7,
    name: "Ginecología",
    href: "/especialidades/ginecologia",
  },
  {
    id: 8,
    name: "Odontología",
    href: "/especialidades/odontologia",
  },
];

const quickLinks = [
  { name: "Encontrar médico", href: "/buscar-medico" },
  { name: "Agendar cita", href: "/agendar" },
  { name: "Emergencias", href: "/emergencias" },
  { name: "Telemedicina", href: "/telemedicina" },
];

const contactInfo = [
  { label: "Teléfono", value: "+54 11 4444-5555" },
  { label: "Email", value: "contacto@doctores-ar.com" },
  { label: "Dirección", value: "Av. Principal 1234, CABA" },
];

export default function Footer() {
  return (
    <footer className=" mt-8 bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-20 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo y descripción */}
          <div className="space-y-8">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Doctores AR"
                width={800}
                height={800}
                className="h-14 w-auto"
              />
            </div>
            <p className="text-sm leading-6 text-gray-600 max-w-md">
              Conectamos pacientes con los mejores profesionales de la salud en
              Argentina. Tecnología y cuidado humano para tu bienestar.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-600">
                <span className="sr-only">Facebook</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-600">
                <span className="sr-only">Instagram</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-600">
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Enlaces y especialidades */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900">
                  Especialidades
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {specialties.map((specialty) => (
                    <li key={specialty.id}>
                      <Link
                        href={specialty.href}
                        className="text-sm leading-6 text-gray-600 hover:text-gray-900"
                      >
                        {specialty.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900">
                  Enlaces rápidos
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {quickLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm leading-6 text-gray-600 hover:text-gray-900"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-gray-900">
                Contacto
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {contactInfo.map((item) => (
                  <li
                    key={item.label}
                    className="text-sm leading-6 text-gray-600"
                  >
                    <span className="font-medium text-gray-900">
                      {item.label}:
                    </span>{" "}
                    {item.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright y links legales */}
        <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} Doctores AR. Todos los derechos
              reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link
                href="/privacidad"
                className="text-xs leading-5 text-gray-600 hover:text-gray-900"
              >
                Política de privacidad
              </Link>
              <Link
                href="/terminos"
                className="text-xs leading-5 text-gray-600 hover:text-gray-900"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/cookies"
                className="text-xs leading-5 text-gray-600 hover:text-gray-900"
              >
                Política de cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
