import { useRouter } from "next/router";
import doctores from "../../data/doctores.json";
import NavBar from "../../components/NavBar";
import AgendarCita from "./AgendarCita";
import DoctorInfo from "./DoctorInfo";
import DoctorGallery from "./DoctorGallery";
import usersReview from "../../data/usersReview.json";
import DoctorReviews from "./DoctorReviews";

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
    <div className="bg-gradient-to-br from-blue-50 to-slate-100 min-h-screen">
      <NavBar
        logo="/images/logo-hospital.png"
        links={[
          { href: "/", label: "Inicio" },
          { href: "/doctores", label: "Doctores" },
        ]}
        button={{ text: "Contacto", onClick: () => alert("Contacto") }}
      />
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: Perfil e info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <img
              src={`/${doctor.imagen}`}
              alt={doctor.nombre}
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-200"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-900 mb-1">
                Dr. {doctor.nombre}
              </h1>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {doctor.especialidad}
                </span>
                <span className="text-slate-400 text-xs">{doctor.horario}</span>
              </div>
              <p className="text-slate-700 mb-2">{doctor.descripcion}</p>
              <div className="flex gap-4 text-sm text-slate-500">
                <span>📞 {doctor.telefono}</span>
                <span>✉️ {doctor.email}</span>
              </div>
            </div>
          </div>
          <DoctorInfo
            especialidad={doctor.especialidad}
            horario={doctor.horario}
          />
          <DoctorGallery
            images={[
              "/img/doctor-1.jpg",
              "/img/doctor-2.jpg",
              "/img/doctor-3.jpg",
            ]}
          />
          <DoctorReviews reviews={usersReview} />
        </div>
        {/* Columna derecha: Agendar cita */}
        <div className="flex flex-col gap-6">
          <AgendarCita
            onSubmit={(data) =>
              alert(`Cita agendada para ${data.nombre} el ${data.fecha}`)
            }
          />
        </div>
      </div>
    </div>
  );
}
