import { useRouter } from "next/router";
import Link from "next/link";
import doctores from "../../data/doctores.json";

export async function getServerSideProps({ params }) {
  const doctor = doctores.find((d) => d.slug === params.id);

  if (!doctor) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      doctor,
    },
  };
}

export default function DoctorDetailPage({ doctor }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/doctores" className="text-blue-500 hover:text-blue-600">
        ← Volver al listado
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8 mt-4">
        <h1 className="text-3xl font-bold mb-6">{doctor.nombre}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Información de Contacto
            </h2>
            <div className="space-y-3">
              <p className="flex items-center">
                <span className="font-medium w-32">Especialidad:</span>
                <span>{doctor.especialidad}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32">Teléfono:</span>
                <span>{doctor.telefono}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32">Email:</span>
                <span>{doctor.email}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32">Horario:</span>
                <span>{doctor.horario}</span>
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Agendar Cita</h2>
            <p className="text-gray-600 mb-4">
              Para agendar una cita, por favor contacta directamente al doctor a
              través de los medios de contacto proporcionados.
            </p>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => (window.location.href = `tel:${doctor.telefono}`)}
            >
              Llamar Ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
