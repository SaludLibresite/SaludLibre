import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import {
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
} from "../../lib/doctorsService";
import { getAllSpecialties } from "../../lib/specialtiesService";
import { storage } from "../../lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function DoctorsManagement() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState("all"); // all, pending, verified
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

      // Si es superadmin, cargar los doctores y especialidades
      loadDoctors();
      loadSpecialties();
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

  const loadSpecialties = async () => {
    try {
      const allSpecialties = await getAllSpecialties();
      // Filter only active specialties for selection
      const activeSpecialties = allSpecialties.filter(
        (specialty) => specialty.isActive !== false
      );
      setSpecialties(activeSpecialties);
    } catch (error) {
      console.error("Error loading specialties:", error);
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

  const handleEditSpecialty = (doctor) => {
    setEditingDoctor(doctor);
    setShowSpecialtyModal(true);
  };

  const handleUpdateSpecialty = async (newSpecialty) => {
    try {
      setUpdating((prev) => ({ ...prev, [editingDoctor.id]: true }));
      await updateDoctor(editingDoctor.id, { especialidad: newSpecialty });

      // Actualizar el estado local
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === editingDoctor.id
            ? { ...doctor, especialidad: newSpecialty }
            : doctor
        )
      );

      setShowSpecialtyModal(false);
      setEditingDoctor(null);
    } catch (error) {
      console.error("Error updating doctor specialty:", error);
      alert("Error al actualizar la especialidad del doctor");
    } finally {
      setUpdating((prev) => ({ ...prev, [editingDoctor.id]: false }));
    }
  };

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (updatedData) => {
    try {
      setUpdating((prev) => ({ ...prev, [editingDoctor.id]: true }));
      await updateDoctor(editingDoctor.id, updatedData);

      // Actualizar el estado local
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === editingDoctor.id
            ? { ...doctor, ...updatedData }
            : doctor
        )
      );

      // Update the editing doctor state as well for real-time updates
      setEditingDoctor((prev) => ({ ...prev, ...updatedData }));

      // Don't close modal automatically for file uploads
      if (
        !updatedData.tituloURL &&
        !updatedData.signatureURL &&
        !updatedData.stampURL
      ) {
        setShowEditModal(false);
        setEditingDoctor(null);
      }
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("Error al actualizar el doctor");
    } finally {
      setUpdating((prev) => ({ ...prev, [editingDoctor.id]: false }));
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este doctor? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [doctorId]: true }));
      await deleteDoctor(doctorId);

      // Actualizar el estado local
      setDoctors((prev) => prev.filter((doctor) => doctor.id !== doctorId));

      alert("Doctor eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting doctor:", error);
      alert("Error al eliminar el doctor");
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="px-2">
        {/* Page Title */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Doctores
          </h1>
          <p className="text-gray-600">
            Administra y verifica los perfiles de doctores registrados
          </p>
        </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/superadmin")}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => router.push("/superadmin/specialties")}
                className="inline-flex items-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-all duration-200 font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Especialidades
              </button>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Ver Sitio
              </button>
            </div>
          </div>


      <div className="mt-5">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Total Doctores
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {doctors.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Pendientes
                </h3>
                <p className="text-3xl font-bold text-amber-600">
                  {pendingCount}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Verificados
                </h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {verifiedCount}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Todos</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    filter === "all"
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {doctors.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                filter === "pending"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Pendientes</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    filter === "pending"
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {pendingCount}
                </span>
              </span>
            </button>
            <button
              onClick={() => setFilter("verified")}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                filter === "verified"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Verificados</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    filter === "verified"
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {verifiedCount}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Modern Doctors Table */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg
                  className="w-6 h-6 mr-3 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Lista de Doctores
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredDoctors.length} doctores
              </span>
            </div>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay doctores
              </h3>
              <p className="text-gray-500">
                No se encontraron doctores con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Especialidad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredDoctors.map((doctor, index) => (
                    <tr
                      key={doctor.id}
                      className="hover:bg-blue-50/50 transition-all duration-200"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <div className="relative">
                            <img
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md"
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
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                doctor.verified
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                            ></div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {doctor.nombre}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <p className="line-clamp-1">
                                {doctor.ubicacion || "No especificada"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {doctor.especialidad}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center">
                            <svg
                              className="w-3 h-3 mr-2 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                              />
                            </svg>
                            <span className="truncate">{doctor.email}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <svg
                              className="w-3 h-3 mr-2 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                              />
                            </svg>
                            {doctor.dni || "No especificado"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${
                            doctor.verified
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              doctor.verified
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          ></div>
                          {doctor.verified ? "Verificado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-1">
                          {doctor.tituloURL && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              📜 Título
                            </span>
                          )}
                          {doctor.signatureURL && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✍️ Firma
                            </span>
                          )}
                          {doctor.stampURL && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              🏥 Sello
                            </span>
                          )}
                          {!doctor.tituloURL &&
                            !doctor.signatureURL &&
                            !doctor.stampURL && (
                              <span className="text-gray-400 text-xs italic">
                                Sin documentos
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-2">
                          {doctor.verified ? (
                            <button
                              onClick={() =>
                                handleVerifyDoctor(doctor.id, false)
                              }
                              disabled={updating[doctor.id]}
                              className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 border border-red-200"
                            >
                              {updating[doctor.id] ? "..." : "Revocar"}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleVerifyDoctor(doctor.id, true)
                              }
                              disabled={updating[doctor.id]}
                              className="inline-flex items-center px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 border border-emerald-200"
                            >
                              {updating[doctor.id] ? "..." : "Verificar"}
                            </button>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1">
                            {/* Edit Doctor */}
                            <button
                              onClick={() => handleEditDoctor(doctor)}
                              disabled={updating[doctor.id]}
                              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Editar Perfil"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            {/* View Public Profile */}
                            <button
                              onClick={() =>
                                router.push(`/doctores/${doctor.slug}`)
                              }
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Ver Perfil Público"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </button>

                            {/* Delete Doctor */}
                            <button
                              onClick={() => handleDeleteDoctor(doctor.id)}
                              disabled={updating[doctor.id]}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar Doctor"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Specialty Edit Modal */}
      {showSpecialtyModal && editingDoctor && (
        <SpecialtyEditModal
          doctor={editingDoctor}
          specialties={specialties}
          onSave={handleUpdateSpecialty}
          onClose={() => {
            setShowSpecialtyModal(false);
            setEditingDoctor(null);
          }}
        />
      )}

      {/* Doctor Details Modal */}
      {showDetailsModal && selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDoctor(null);
          }}
        />
      )}

      {/* Doctor Edit Modal */}
      {showEditModal && editingDoctor && (
        <DoctorEditModal
          doctor={editingDoctor}
          specialties={specialties}
          onSave={handleUpdateDoctor}
          onClose={() => {
            setShowEditModal(false);
            setEditingDoctor(null);
          }}
        />
      )}

    </SuperAdminLayout>
  );
}

// Modal component for editing doctor specialty
function SpecialtyEditModal({ doctor, specialties, onSave, onClose }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(
    doctor.especialidad || ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSpecialty.trim()) {
      alert("Por favor, selecciona una especialidad");
      return;
    }
    onSave(selectedSpecialty);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Editar Doctor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    Información Básica
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information & Documents */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    Información Adicional
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Descripción
                      </label>
                      <textarea
                        name="descripcion"
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium resize-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal component for viewing doctor details
function DoctorDetailsModal({ doctor, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Detalles del Doctor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Información Básica
                </h4>

                <div className="flex items-center space-x-6 mb-6">
                  <div className="relative">
                    <img
                      className="h-16 w-16 rounded-lg object-cover ring-2 ring-gray-200 shadow-sm"
                      src={
                        doctor.photoURL || doctor.imagen || "/img/doctor-1.jpg"
                      }
                      alt={doctor.nombre}
                      onError={(e) => {
                        e.target.src = "/img/doctor-1.jpg";
                      }}
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        doctor.verified ? "bg-green-500" : "bg-amber-500"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <p className="font-semibold text-xl text-gray-900">
                      {doctor.nombre}
                    </p>
                    <p className="text-gray-600 font-medium">
                      {doctor.especialidad}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Email", value: doctor.email, icon: "📧" },
                    {
                      label: "DNI",
                      value: doctor.dni || "No especificado",
                      icon: "🆔",
                    },
                    {
                      label: "Teléfono",
                      value: doctor.telefono || "No especificado",
                      icon: "📱",
                    },
                    {
                      label: "Ubicación",
                      value: doctor.ubicacion || "No especificada",
                      icon: "📍",
                    },
                    {
                      label: "Género",
                      value: doctor.genero || "No especificado",
                      icon: "👤",
                    },
                    {
                      label: "Fecha de Nacimiento",
                      value: doctor.fechaNacimiento || "No especificada",
                      icon: "🎂",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg opacity-60">{item.icon}</span>
                        <div>
                          <span className="font-medium text-gray-900">
                            {item.label}:
                          </span>
                          <span className="ml-2 text-gray-700">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg opacity-60">✅</span>
                      <div>
                        <span className="font-medium text-gray-900">
                          Estado:
                        </span>
                        <span
                          className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                            doctor.verified
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {doctor.verified ? "Verificado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg opacity-60">📅</span>
                      <div>
                        <span className="font-medium text-gray-900">
                          Fecha de Registro:
                        </span>
                        <span className="ml-2 text-gray-700">
                          {doctor.createdAt?.toDate?.()?.toLocaleDateString() ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Documents */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  Documentos Profesionales
                </h4>

                {/* Title */}
                <div className="bg-white rounded-lg p-6 mb-4 border border-gray-100">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-lg mr-3 opacity-60">📜</span>
                    Título Profesional
                  </h5>
                  {doctor.tituloURL ? (
                    <div className="space-y-4">
                      <img
                        src={doctor.tituloURL}
                        alt="Título profesional"
                        className="w-full h-32 object-contain border border-gray-200 rounded-lg bg-gray-50"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className="text-center py-6 text-gray-500 bg-gray-100 rounded-lg"
                      >
                        Error al cargar la imagen
                      </div>
                      <a
                        href={doctor.tituloURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                      >
                        Ver documento completo →
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-500 font-medium py-6 text-center bg-gray-100 rounded-lg">
                      No disponible
                    </p>
                  )}
                </div>

                {/* Digital Signature */}
                <div className="bg-white rounded-lg p-6 mb-4 border border-gray-100">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-lg mr-3 opacity-60">✍️</span>
                    Firma Digital
                  </h5>
                  {doctor.signatureURL ? (
                    <div className="space-y-4">
                      <img
                        src={doctor.signatureURL}
                        alt="Firma digital"
                        className="w-full h-20 object-contain border border-gray-200 rounded-lg bg-white"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg"
                      >
                        Error al cargar la imagen
                      </div>
                      <a
                        href={doctor.signatureURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                      >
                        Ver firma completa →
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-500 font-medium py-6 text-center bg-gray-100 rounded-lg">
                      No disponible
                    </p>
                  )}
                </div>

                {/* Professional Seal */}
                <div className="bg-white rounded-lg p-6 border border-gray-100">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-lg mr-3 opacity-60">🏥</span>
                    Sello Profesional
                  </h5>
                  {doctor.stampURL ? (
                    <div className="space-y-4">
                      <img
                        src={doctor.stampURL}
                        alt="Sello profesional"
                        className="w-full h-20 object-contain border border-gray-200 rounded-lg bg-white"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg"
                      >
                        Error al cargar la imagen
                      </div>
                      <a
                        href={doctor.stampURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                      >
                        Ver sello completo →
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-500 font-medium py-6 text-center bg-gray-100 rounded-lg">
                      No disponible
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(doctor.descripcion || doctor.experiencia || doctor.educacion) && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                Información Adicional
              </h4>

              <div className="grid grid-cols-1 gap-6">
                {doctor.descripcion && (
                  <div className="bg-white rounded-lg p-6 border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="text-lg mr-2 opacity-60">📝</span>
                      Descripción
                    </h5>
                    <p className="text-gray-700 leading-relaxed">
                      {doctor.descripcion}
                    </p>
                  </div>
                )}

                {doctor.experiencia && (
                  <div className="bg-white rounded-lg p-6 border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="text-lg mr-2 opacity-60">💼</span>
                      Experiencia
                    </h5>
                    <p className="text-gray-700 leading-relaxed">
                      {doctor.experiencia}
                    </p>
                  </div>
                )}

                {doctor.educacion && (
                  <div className="bg-white rounded-lg p-6 border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="text-lg mr-2 opacity-60">🎓</span>
                      Educación
                    </h5>
                    <p className="text-gray-700 leading-relaxed">
                      {doctor.educacion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal component for editing doctor information
function DoctorEditModal({ doctor, specialties, onSave, onClose }) {
  const [formData, setFormData] = useState({
    nombre: doctor.nombre || "",
    especialidad: doctor.especialidad || "",
    dni: doctor.dni || "",
    telefono: doctor.telefono || "",
    ubicacion: doctor.ubicacion || "",
    genero: doctor.genero || "",
    fechaNacimiento: doctor.fechaNacimiento || "",
    descripcion: doctor.descripcion || "",
    experiencia: doctor.experiencia || "",
    educacion: doctor.educacion || "",
  });

  const [uploading, setUploading] = useState({
    titulo: false,
    signature: false,
    stamp: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDeleteDocument = async (field) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar este documento?`)) {
      return;
    }

    const updateData = { [field]: null };
    onSave(updateData);
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    try {
      setUploading((prev) => ({ ...prev, [type]: true }));

      // Create file path based on type
      let folderName;
      switch (type) {
        case "titulo":
          folderName = "titulos";
          break;
        case "signature":
          folderName = "signatures";
          break;
        case "stamp":
          folderName = "stamps";
          break;
        default:
          throw new Error("Invalid file type");
      }

      const fileName = `${folderName}/${doctor.id}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);

      // Delete old file if exists
      const fieldName =
        type === "titulo"
          ? "tituloURL"
          : type === "signature"
          ? "signatureURL"
          : "stampURL";
      if (doctor[fieldName]) {
        try {
          const url = new URL(doctor[fieldName]);
          const pathParts = url.pathname.split("/o/")[1];
          if (pathParts) {
            const oldPath = decodeURIComponent(pathParts.split("?")[0]);
            const oldRef = ref(storage, oldPath);
            await deleteObject(oldRef);
          }
        } catch (error) {
          console.log("Error deleting old file:", error);
        }
      }

      // Upload new file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update doctor data
      const updateData = { [fieldName]: downloadURL };
      await onSave(updateData);

      alert(
        `${
          type === "titulo"
            ? "Título"
            : type === "signature"
            ? "Firma"
            : "Sello"
        } subido exitosamente`
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error al subir el archivo");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Editar Doctor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    Información Básica
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Especialidad
                      </label>
                      <div className="relative">
                        <select
                          name="especialidad"
                          value={formData.especialidad}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium appearance-none"
                          required
                        >
                          <option value="">Seleccionar especialidad...</option>
                          {specialties.map((specialty) => (
                            <option key={specialty.id} value={specialty.title}>
                              {specialty.title}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        DNI
                      </label>
                      <input
                        type="text"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Ubicación
                      </label>
                      <input
                        type="text"
                        name="ubicacion"
                        value={formData.ubicacion}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Género
                      </label>
                      <div className="relative">
                        <select
                          name="genero"
                          value={formData.genero}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium appearance-none"
                        >
                          <option value="">Seleccionar género...</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information & Documents */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    Información Adicional
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Descripción
                      </label>
                      <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Experiencia
                      </label>
                      <textarea
                        name="experiencia"
                        value={formData.experiencia}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Educación
                      </label>
                      <textarea
                        name="educacion"
                        value={formData.educacion}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Management */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <h5 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    Documentos Profesionales
                  </h5>

                  <div className="space-y-4">
                    {/* Title Document */}
                    <div className="bg-white rounded-lg p-6 border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-900 flex items-center">
                          <span className="text-lg mr-3 opacity-60">📜</span>
                          Título Profesional
                        </span>
                        {doctor.tituloURL && (
                          <div className="flex space-x-2">
                            <a
                              href={doctor.tituloURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
                            >
                              Ver
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument("tituloURL")}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUpload(file, "titulo");
                            }
                          }}
                          className="flex-1 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-900 file:text-white file:font-medium hover:file:bg-gray-800 file:transition-all file:duration-200"
                          disabled={uploading.titulo}
                        />
                        {uploading.titulo && (
                          <span className="text-sm font-medium text-amber-600 bg-amber-100 px-3 py-2 rounded-lg border border-amber-200">
                            Subiendo...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Digital Signature */}
                    <div className="bg-white rounded-lg p-6 border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-900 flex items-center">
                          <span className="text-lg mr-3 opacity-60">✍️</span>
                          Firma Digital
                        </span>
                        {doctor.signatureURL && (
                          <div className="flex space-x-2">
                            <a
                              href={doctor.signatureURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
                            >
                              Ver
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteDocument("signatureURL")
                              }
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUpload(file, "signature");
                            }
                          }}
                          className="flex-1 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-900 file:text-white file:font-medium hover:file:bg-gray-800 file:transition-all file:duration-200"
                          disabled={uploading.signature}
                        />
                        {uploading.signature && (
                          <span className="text-sm font-medium text-amber-600 bg-amber-100 px-3 py-2 rounded-lg border border-amber-200">
                            Subiendo...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Professional Seal */}
                    <div className="bg-white rounded-lg p-6 border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-900 flex items-center">
                          <span className="text-lg mr-3 opacity-60">🏥</span>
                          Sello Profesional
                        </span>
                        {doctor.stampURL && (
                          <div className="flex space-x-2">
                            <a
                              href={doctor.stampURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
                            >
                              Ver
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument("stampURL")}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUpload(file, "stamp");
                            }
                          }}
                          className="flex-1 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-900 file:text-white file:font-medium hover:file:bg-gray-800 file:transition-all file:duration-200"
                          disabled={uploading.stamp}
                        />
                        {uploading.stamp && (
                          <span className="text-sm font-medium text-amber-600 bg-amber-100 px-3 py-2 rounded-lg border border-amber-200">
                            Subiendo...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
