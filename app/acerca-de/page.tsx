import Image from 'next/image';

export default function AcercaDePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Acerca de SaludLibre</h1>
        <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />
      </div>

      <div className="mt-12 space-y-10">
        <section className="flex flex-col items-center gap-8 md:flex-row">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Nuestra Misión</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              SaludLibre nace con el objetivo de conectar a pacientes con profesionales de la salud de manera rápida,
              accesible y transparente. Creemos que todos merecen acceso a atención médica de calidad, sin importar
              dónde se encuentren.
            </p>
          </div>
          <div className="w-full md:w-64 shrink-0">
            <img
              src="/img/logo.png"
              alt="SaludLibre"
              width={256}
              height={256}
              className="mx-auto h-48 w-48 object-contain"
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900">¿Qué ofrecemos?</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {[
              { title: 'Búsqueda inteligente', description: 'Encontrá especialistas por zona, especialidad y disponibilidad.' },
              { title: 'Turnos online', description: 'Agendá turnos de forma simple y rápida, sin llamadas.' },
              { title: 'Videoconsultas', description: 'Consultá con tu médico desde la comodidad de tu hogar.' },
              { title: 'Recetas digitales', description: 'Recibí tus recetas de forma digital, segura y accesible.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900">Nuestro Equipo</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Somos un equipo apasionado por la tecnología y la salud, comprometidos en crear herramientas que
            mejoren la experiencia tanto de pacientes como de profesionales médicos en Argentina.
          </p>
        </section>
      </div>
    </div>
  );
}
