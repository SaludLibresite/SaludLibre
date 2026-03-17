export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Política de Cookies</h1>
      <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">¿Qué son las cookies?</h2>
          <p className="mt-2">
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitás
            un sitio web. Nos ayudan a recordar tus preferencias y mejorar tu experiencia.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Cookies que utilizamos</h2>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">Cookies esenciales</p>
              <p className="mt-1 text-gray-500">Necesarias para el funcionamiento de la plataforma. Incluyen cookies de autenticación y sesión.</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">Cookies analíticas</p>
              <p className="mt-1 text-gray-500">Nos ayudan a entender cómo los usuarios interactúan con la plataforma para poder mejorarla.</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">Cookies de preferencias</p>
              <p className="mt-1 text-gray-500">Recuerdan tus configuraciones y preferencias para una experiencia personalizada.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Gestión de cookies</h2>
          <p className="mt-2">
            Podés configurar tu navegador para bloquear o eliminar cookies. Tené en cuenta que al deshabilitar
            cookies esenciales, algunas funcionalidades de la plataforma podrían no funcionar correctamente.
          </p>
        </section>

        <p className="pt-4 text-xs text-gray-400">Última actualización: Enero 2025</p>
      </div>
    </div>
  );
}
