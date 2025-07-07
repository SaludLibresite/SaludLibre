import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import { getAllDoctors, updateDoctor } from "../../lib/doctorsService";

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function DoctorsManagement() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState("all"); // all, pending, verified

  useEffect(() => {
    if (!authLoading) {
      // Si no hay usuario logueado, redirigir al login
      if (!currentUser) {
        router.push("/superadmin");
        return;
      }

      // Si hay usuario logueado, verificar si es superadmin
      if (!SUPERADMIN_EMAILS.includes(currentUser.email)) {
        // Si no es superadmin, redirigir al dashboard principal
        router.push("/superadmin");
        return;
      }

      // Si es superadmin, cargar los doctores
      loadDoctors();
    }
  }, [currentUser, authLoading, router]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const allDoctors = await getAllDoctors();
      setDoctors(allDoctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId, verified) => {
    try {
      setUpdating((prev) => ({ ...prev, [doctorId]: true }));
      await updateDoctor(doctorId, { verified });

      // Actualizar el estado local
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === doctorId ? { ...doctor, verified } : doctor
        )
      );
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("Error al actualizar el doctor");
    } finally {
      setUpdating((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (filter === "pending") return !doctor.verified;
    if (filter === "verified") return doctor.verified;
    return true;
  });

  const pendingCount = doctors.filter((d) => !d.verified).length;
  const verifiedCount = doctors.filter((d) => d.verified).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Doctores
              </h1>
              <p className="text-gray-600">
                Administra y verifica los perfiles de doctores
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/superadmin")}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => router.push("/superadmin/specialties")}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Especialidades
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Ver Sitio Público
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Total Doctores
            </h3>
            <p className="text-3xl font-bold text-blue-600">{doctors.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pendientes</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Verificados</h3>
            <p className="text-3xl font-bold text-green-600">{verifiedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Todos ({doctors.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-md ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("verified")}
              className={`px-4 py-2 rounded-md ${
                filter === "verified"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Verificados ({verifiedCount})
            </button>
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Lista de Doctores
            </h2>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No hay doctores para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Especialidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={
                              doctor.photoURL ||
                              `/${doctor.imagen}` ||
                              "/img/doctor-1.jpg"
                            }
                            alt={doctor.nombre}
                            onError={(e) => {
                              e.target.src = "/img/doctor-1.jpg";
                            }}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doctor.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doctor.ubicacion}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.especialidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            doctor.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {doctor.verified ? "Verificado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.createdAt?.toDate?.()?.toLocaleDateString() ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {doctor.verified ? (
                          <button
                            onClick={() => handleVerifyDoctor(doctor.id, false)}
                            disabled={updating[doctor.id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {updating[doctor.id] ? "..." : "Revocar"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyDoctor(doctor.id, true)}
                            disabled={updating[doctor.id]}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {updating[doctor.id] ? "..." : "Verificar"}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            router.push(`/doctores/${doctor.slug}`)
                          }
                          className="text-blue-600 hover:text-blue-900 ml-2"
                        >
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
