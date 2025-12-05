import React from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Cookies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Información sobre el uso de cookies y tecnologías similares en Salud
            Libre
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
                1. ¿Qué son las Cookies?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Las cookies son pequeños archivos de texto que se almacenan en
                su dispositivo cuando visita un sitio web. Nos ayudan a recordar
                sus preferencias y mejorar su experiencia en Salud Libre.
              </p>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  ¿Por qué utilizamos cookies?
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Mantener su sesión activa mientras navega
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Recordar sus preferencias y configuraciones
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Mejorar la seguridad de la plataforma
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Analizar el uso del sitio para mejorarlo
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                2. Tipos de Cookies que Utilizamos
              </h2>

              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    Cookies Esenciales (Necesarias)
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Son indispensables para el funcionamiento básico de la
                    plataforma. No se pueden desactivar.
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Autenticación y seguridad de sesión</li>
                    <li>• Preferencias de idioma</li>
                    <li>• Carrito de servicios médicos</li>
                    <li>• Protección contra ataques maliciosos</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    Cookies de Funcionalidad
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Mejoran la experiencia del usuario recordando preferencias.
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Recordar médicos favoritos</li>
                    <li>• Configuraciones de notificaciones</li>
                    <li>• Historial de búsquedas recientes</li>
                    <li>• Preferencias de visualización</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    Cookies de Análisis
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Nos ayudan a entender cómo se usa la plataforma para
                    mejorarla.
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Google Analytics (datos anónimos)</li>
                    <li>• Estadísticas de uso de funciones</li>
                    <li>• Análisis de rendimiento del sitio</li>
                    <li>• Detección de errores técnicos</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">
                    Cookies de Marketing (Opcional)
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Solo con su consentimiento, para mostrar contenido
                    relevante.
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Seguimiento de campañas publicitarias</li>
                    <li>• Personalización de contenido</li>
                    <li>• Retargeting en redes sociales</li>
                    <li>• Medición de efectividad publicitaria</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                3. Cookies de Terceros
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Algunos servicios externos que utilizamos pueden establecer sus
                propias cookies:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Google Analytics
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Análisis de tráfico y comportamiento (anónimo)
                  </p>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver política de Google
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Facebook Pixel
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Optimización de publicidad (solo con consentimiento)
                  </p>
                  <a
                    href="https://www.facebook.com/privacy/explanation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver política de Facebook
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Hotjar</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Análisis de experiencia de usuario
                  </p>
                  <a
                    href="https://www.hotjar.com/legal/policies/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver política de Hotjar
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Stripe</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Procesamiento seguro de pagos
                  </p>
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver política de Stripe
                  </a>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                4. Control de Cookies
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Usted tiene control total sobre las cookies no esenciales. Puede
                gestionar sus preferencias de las siguientes maneras:
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Centro de Preferencias de Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  Puede acceder en cualquier momento desde el pie de página o
                  aquí:
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Gestionar Cookies
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-800 mb-3">
                    Configuración del Navegador
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    Puede configurar su navegador para:
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Bloquear todas las cookies</li>
                    <li>• Aceptar solo cookies esenciales</li>
                    <li>• Eliminar cookies existentes</li>
                    <li>• Recibir avisos antes de aceptar</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="font-semibold text-green-800 mb-3">
                    Navegación Privada
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    Al usar modo privado/incógnito:
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Las cookies se eliminan al cerrar</li>
                    <li>• Menor personalización</li>
                    <li>• Puede afectar funcionalidades</li>
                    <li>• Mayor privacidad</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                5. Duración de las Cookies
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-gray-50 rounded-lg overflow-hidden">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="text-left p-4 font-semibold text-blue-900">
                        Tipo
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-900">
                        Duración
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-900">
                        Propósito
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-t border-gray-200">
                      <td className="p-4 font-medium">Sesión</td>
                      <td className="p-4">Al cerrar navegador</td>
                      <td className="p-4">Autenticación temporal</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="p-4 font-medium">Persistentes</td>
                      <td className="p-4">30 días - 2 años</td>
                      <td className="p-4">Preferencias y análisis</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="p-4 font-medium">Analíticas</td>
                      <td className="p-4">2 años máximo</td>
                      <td className="p-4">Estadísticas de uso</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="p-4 font-medium">Marketing</td>
                      <td className="p-4">90 días</td>
                      <td className="p-4">Publicidad personalizada</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                6. Impacto de Deshabilitar Cookies
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-yellow-800 font-semibold mb-3">
                  ¿Qué puede verse afectado?
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3">⚠️</span>
                    Necesidad de iniciar sesión repetidamente
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3">⚠️</span>
                    Pérdida de preferencias guardadas
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3">⚠️</span>
                    Funciones de la plataforma limitadas
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-3">⚠️</span>
                    Experiencia menos personalizada
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                7. Actualizaciones de esta Política
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Esta política puede actualizarse ocasionalmente para reflejar
                cambios en nuestras prácticas o nuevas regulaciones. Le
                notificaremos sobre cambios significativos a través de nuestra
                plataforma o por email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 border-l-4 border-yellow-400 pl-4">
                8. Contacto
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Para consultas sobre cookies o privacidad:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Email:</strong> saludlibre2025@gmail.com
                  </p>
                  <p>
                    <strong>Teléfono:</strong> 1124765705
                  </p>
                  <p>
                    <strong>Formulario de contacto:</strong>
                    <Link
                      href="/contacto"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      Enviar consulta
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/privacidad"
              className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              Ver Política de Privacidad
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
