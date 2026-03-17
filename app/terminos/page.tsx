export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
      <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Aceptación de los Términos</h2>
          <p className="mt-2">
            Al acceder y utilizar la plataforma SaludLibre, aceptás estos términos y condiciones en su totalidad.
            Si no estás de acuerdo con alguna parte, te pedimos que no utilices nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Descripción del Servicio</h2>
          <p className="mt-2">
            SaludLibre es una plataforma que facilita la conexión entre pacientes y profesionales de la salud.
            No somos un centro de salud ni brindamos atención médica directa. La responsabilidad de la atención
            recae en los profesionales registrados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Registro de Usuarios</h2>
          <p className="mt-2">
            Para acceder a determinadas funcionalidades, debés registrarte proporcionando información veraz y actualizada.
            Sos responsable de mantener la confidencialidad de tus credenciales de acceso.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Uso Aceptable</h2>
          <p className="mt-2">
            Te comprometés a utilizar la plataforma de forma lícita y respetando los derechos de otros usuarios.
            Queda prohibido el uso de la plataforma para actividades ilegales, fraudulentas o que puedan dañar
            a terceros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Pagos y Suscripciones</h2>
          <p className="mt-2">
            Los planes de suscripción para profesionales se procesan a través de MercadoPago. Los precios están
            sujetos a cambios con previo aviso. Las cancelaciones se rigen por la política de cancelación vigente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Limitación de Responsabilidad</h2>
          <p className="mt-2">
            SaludLibre no se responsabiliza por la calidad de los servicios médicos prestados por los profesionales
            registrados, ni por los daños que puedan surgir del uso de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">7. Modificaciones</h2>
          <p className="mt-2">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán
            comunicados a través de la plataforma.
          </p>
        </section>

        <p className="pt-4 text-xs text-gray-400">Última actualización: Enero 2025</p>
      </div>
    </div>
  );
}
