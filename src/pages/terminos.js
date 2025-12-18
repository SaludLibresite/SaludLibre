import React from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function TerminosYCondiciones() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Términos y condiciones de uso de la plataforma Salud Libre
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-6">
                Última actualización: {new Date().toLocaleDateString("es-AR")}
              </p>
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Al acceder y utilizar la plataforma Salud Libre, usted acepta
                cumplir con estos términos y condiciones. Si no está de acuerdo
                con alguna parte de estos términos, no debe utilizar nuestros
                servicios.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Salud Libre es una plataforma digital que conecta pacientes con
                profesionales de la salud en Argentina, facilitando la búsqueda
                de médicos, agendamiento de citas y gestión de historiales
                médicos.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                2. Servicios Ofrecidos
              </h2>
              <div className="bg-blue-50 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Nuestros servicios incluyen:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Directorio de profesionales de la salud verificados
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Sistema de agendamiento de citas médicas
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Gestión de historiales médicos digitales
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Almacenamiento seguro de recetas médicas
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Comunicación segura entre pacientes y médicos
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                3. Registro y Cuentas de Usuario
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para utilizar ciertos servicios de Salud Libre, debe crear una
                cuenta proporcionando información precisa y actualizada. Es
                responsable de mantener la confidencialidad de sus credenciales
                de acceso.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong className="text-yellow-800">Importante:</strong> Los
                  usuarios deben ser mayores de 18 años o contar con
                  autorización de un tutor legal para utilizar la plataforma.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                4. Responsabilidades del Usuario
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Proporcionar información veraz y actualizada
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  No utilizar la plataforma para fines ilegales o no autorizados
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Respetar la confidencialidad de la información médica
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Cumplir con las citas programadas o cancelarlas con
                  anticipación
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  No compartir credenciales de acceso con terceros
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                5. Limitaciones de Responsabilidad
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Salud Libre actúa como intermediario entre pacientes y
                profesionales de la salud. No somos responsables por:
              </p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• La calidad de los servicios médicos prestados</li>
                <li>• Diagnósticos, tratamientos o decisiones médicas</li>
                <li>
                  • Cancelaciones o modificaciones de citas por parte de los
                  profesionales
                </li>
                <li>• Problemas técnicos temporales en la plataforma</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                6. Protección de Datos y Privacidad
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nos comprometemos a proteger su información personal y médica de
                acuerdo con la Ley de Protección de Datos Personales de
                Argentina (Ley 25.326) y nuestra
                <Link
                  href="/privacidad"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {" "}
                  Política de Privacidad
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                7. Modificaciones
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en
                cualquier momento. Las modificaciones serán efectivas una vez
                publicadas en la plataforma. El uso continuado de nuestros
                servicios constituye la aceptación de los términos modificados.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                8. Ley Aplicable
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Estos términos se rigen por las leyes de la República Argentina.
                Cualquier disputa será resuelta en los tribunales competentes de
                la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                9. Contacto
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Para consultas sobre estos términos y condiciones, puede
                  contactarnos:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Email:</strong> saludlibre2025@gmail.com
                  </p>
                  <p>
                    <strong>Teléfono:</strong> 1124765705
                  </p>
                  <p>
                    <strong>Dirección:</strong> Juan José Paso 749
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Volver al inicio
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
