import React from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cómo protegemos y manejamos su información personal en Salud Libre
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
                1. Información que Recopilamos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En Salud Libre recopilamos diferentes tipos de información para
                brindarle el mejor servicio posible y proteger su privacidad
                médica.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Información Personal:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Nombre completo, DNI y fecha de nacimiento
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Información de contacto (email, teléfono, dirección)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Datos de obra social o seguro médico
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Preferencias de comunicación y notificaciones
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                  Información Médica Sensible:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Historial médico y antecedentes</li>
                  <li>• Recetas y medicamentos</li>
                  <li>• Resultados de estudios y análisis</li>
                  <li>• Notas de consultas médicas</li>
                  <li>• Alergias y condiciones preexistentes</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                2. Cómo Utilizamos su Información
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos su información exclusivamente para los siguientes
                propósitos:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Facilitar la conexión con profesionales de la salud
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Gestionar citas médicas y recordatorios
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Mantener su historial médico actualizado y accesible
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Enviar notificaciones importantes sobre su salud
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Mejorar nuestros servicios y experiencia de usuario
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Cumplir con obligaciones legales y regulatorias
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                3. Protección y Seguridad de Datos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                La seguridad de su información médica es nuestra máxima
                prioridad. Implementamos múltiples capas de protección:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Seguridad Técnica
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Encriptación end-to-end</li>
                    <li>• Servidores seguros certificados</li>
                    <li>• Acceso restringido y autenticación</li>
                    <li>• Backups automáticos seguros</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    Políticas Internas
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Personal capacitado en privacidad</li>
                    <li>• Auditorías regulares de seguridad</li>
                    <li>• Protocolos de acceso estrictos</li>
                    <li>• Monitoreo continuo de amenazas</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                4. Compartir Información
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <p className="text-red-800 font-semibold mb-2">
                  Principio Fundamental:
                </p>
                <p className="text-gray-700">
                  Nunca vendemos, alquilamos o compartimos su información
                  personal con terceros para fines comerciales.
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                Solo compartimos información en las siguientes circunstancias
                limitadas:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Con profesionales de la salud que usted elija para sus
                  consultas
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Con laboratorios autorizados para resultados de estudios
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  Cuando sea requerido por ley o autoridades competentes
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  En emergencias médicas para proteger su vida o salud
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                5. Sus Derechos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                De acuerdo con la Ley de Protección de Datos Personales de
                Argentina, usted tiene los siguientes derechos:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Acceso</h4>
                  <p className="text-sm text-gray-700">
                    Solicitar una copia de toda la información que tenemos sobre
                    usted
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Rectificación
                  </h4>
                  <p className="text-sm text-gray-700">
                    Corregir información inexacta o incompleta
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Supresión
                  </h4>
                  <p className="text-sm text-gray-700">
                    Eliminar su información cuando ya no sea necesaria
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Portabilidad
                  </h4>
                  <p className="text-sm text-gray-700">
                    Obtener sus datos en formato transferible
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                6. Cookies y Tecnologías Similares
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su
                experiencia. Para más información, consulte nuestra
                <Link
                  href="/cookies"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {" "}
                  Política de Cookies
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                7. Menores de Edad
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Los menores de 18 años pueden utilizar la plataforma bajo
                supervisión y autorización de sus padres o tutores legales,
                quienes serán responsables del manejo de la información del
                menor.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                8. Retención de Datos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Conservamos su información médica de acuerdo con las
                regulaciones argentinas de historiales médicos y mientras
                mantenga su cuenta activa. Los datos pueden conservarse por
                períodos adicionales cuando sea requerido por ley.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                9. Contacto y Consultas
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Para ejercer sus derechos o realizar consultas sobre
                  privacidad:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Oficial de Protección de Datos:</strong>{" "}
                    saludlibre2025@gmail.com
                  </p>
                  <p>
                    <strong>Teléfono:</strong> 1124765705
                  </p>
                  <p>
                    <strong>Dirección:</strong> Juan José Paso 749
                  </p>
                  <p>
                    <strong>Horario de atención:</strong> Lunes a viernes, 9:00
                    a 18:00 hs
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                10. Cambios en esta Política
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar esta política ocasionalmente. Le
                notificaremos sobre cambios significativos por email o mediante
                avisos en la plataforma. Le recomendamos revisar esta política
                periódicamente.
              </p>
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
