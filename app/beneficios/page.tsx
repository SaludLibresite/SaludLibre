export default function BeneficiosPage() {
  const benefits = [
    {
      title: 'Para Pacientes',
      items: [
        'Buscá profesionales por especialidad, zona y disponibilidad',
        'Agendá turnos online las 24hs sin necesidad de llamar',
        'Videoconsultas desde la comodidad de tu hogar',
        'Historial médico digital accesible en cualquier momento',
        'Recetas digitales seguras y fáciles de usar',
        'Sistema de reseñas para elegir con confianza',
      ],
      color: 'bg-[#4dbad9]',
      lightColor: 'bg-[#4dbad9]/10',
    },
    {
      title: 'Para Profesionales',
      items: [
        'Perfil profesional visible para miles de pacientes',
        'Gestión de agenda y turnos simplificada',
        'Historial clínico digital de tus pacientes',
        'Videoconsultas integradas en la plataforma',
        'Emisión de recetas digitales con formato oficial',
        'Sistema de referidos con recompensas',
      ],
      color: 'bg-[#e8ad0f]',
      lightColor: 'bg-[#e8ad0f]/10',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Beneficios</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500">
          Descubrí todas las ventajas que SaludLibre tiene para vos
        </p>
        <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {benefits.map((group) => (
          <div key={group.title} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{group.title}</h2>
            <ul className="mt-6 space-y-3">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${group.color} text-white`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
