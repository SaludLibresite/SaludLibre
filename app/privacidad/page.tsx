export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
      <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Información que Recopilamos</h2>
          <p className="mt-2">
            Recopilamos la información que nos proporcionás al registrarte: nombre, email, teléfono y datos
            médicos relevantes. También recopilamos datos de uso de la plataforma de forma anónima.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Uso de la Información</h2>
          <p className="mt-2">
            Utilizamos tu información para: brindar y mejorar nuestros servicios, facilitar la comunicación
            entre pacientes y profesionales, procesar pagos y enviar notificaciones relevantes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Protección de Datos</h2>
          <p className="mt-2">
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal.
            Los datos se almacenan en servidores seguros con encriptación.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Compartir Información</h2>
          <p className="mt-2">
            No vendemos ni compartimos tu información personal con terceros, salvo cuando sea necesario para
            brindar el servicio (ej: compartir datos con tu médico) o cuando la ley lo requiera.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Tus Derechos</h2>
          <p className="mt-2">
            Tenés derecho a acceder, rectificar y eliminar tus datos personales. Podés ejercer estos derechos
            contactándonos a contacto@saludlibre.com.ar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Cookies</h2>
          <p className="mt-2">
            Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies analíticas
            para mejorar la experiencia de usuario. Podés configurar tu navegador para rechazar cookies.
          </p>
        </section>

        <p className="pt-4 text-xs text-gray-400">Última actualización: Enero 2025</p>
      </div>
    </div>
  );
}
