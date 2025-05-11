import { useState } from "react";
import Link from "next/link";
import doctores from "../../data/doctores.json";

export async function getServerSideProps() {
  return {
    props: {
      doctores: doctores,
    },
  };
}

export default function DoctoresPage({ doctores }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre"); // nombre, especialidad

  const filteredDoctores = doctores.filter((doctor) =>
    doctor[searchField].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nuestros Doctores</h1>

      {/* Search Section */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar doctor..."
            className="w-full p-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="p-2 border rounded-lg"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
        >
          <option value="nombre">Nombre</option>
          <option value="especialidad">Especialidad</option>
        </select>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctores.map((doctor) => (
          <Link href={`/doctores/${doctor.slug}`} key={doctor.id}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">{doctor.nombre}</h2>
              <p className="text-gray-600 mb-2">{doctor.especialidad}</p>
              <div className="text-sm text-gray-500">
                <p>📞 {doctor.telefono}</p>
                <p>✉️ {doctor.email}</p>
                <p>🕒 {doctor.horario}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredDoctores.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No se encontraron doctores que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}
