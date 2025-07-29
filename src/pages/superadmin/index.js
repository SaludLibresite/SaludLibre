import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import { getAllDoctors } from "../../lib/doctorsService";
import { getAllSpecialties } from "../../lib/specialtiesService";

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

export default function SuperAdminDashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingDoctors: 0,
    verifiedDoctors: 0,
    totalSpecialties: 0,
    activeSpecialties: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      // Si no hay usuario logueado, permitir acceso al superadmin
      if (!currentUser) {
        return; // No hacer nada, mostrar la página
      }

      // Si hay usuario logueado, verificar si es superadmin
      if (!SUPERADMIN_EMAILS.includes(currentUser.email)) {
        // Si no es superadmin, cerrar sesión y redirigir al login
        handleLogout();
        return;
      }

      // Si es superadmin, cargar las estadísticas
      loadStats();
    }
  }, [currentUser, authLoading, router]);

  const handleLogout = async () => {
    try {
      const { logout } = await import("../../context/AuthContext");
      // Usar el contexto de auth para cerrar sesión
      const authModule = await import("../../context/AuthContext");
      // Como no tenemos acceso directo al logout aquí, haremos logout manualmente
      const { signOut } = await import("firebase/auth");
      const { auth } = await import("../../lib/firebase");

      await signOut(auth);
      router.push("/auth/login?message=superadmin");
    } catch (error) {
      console.error("Error logging out:", error);
      router.push("/auth/login");
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);

      // Cargar doctores para estadísticas
      const allDoctors = await getAllDoctors();
      const pendingDoctors = allDoctors.filter((d) => !d.verified).length;
      const verifiedDoctors = allDoctors.filter((d) => d.verified).length;

      // Cargar especialidades para estadísticas
      const allSpecialties = await getAllSpecialties();
      const activeSpecialties = allSpecialties.filter(
        (s) => s.isActive !== false
      ).length;

      setStats({
        totalDoctors: allDoctors.length,
        pendingDoctors,
        verifiedDoctors,
        totalSpecialties: allSpecialties.length,
        activeSpecialties,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado, mostrar pantalla de login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-600">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Panel SuperAdmin
            </h2>
            <p className="mt-2 text-gray-600">
              Inicia sesión con tu cuenta de superadmin para acceder al panel de
              gestión.
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            <div className="text-center space-y-4">
              <div className="rounded-md bg-purple-50 p-4 border border-purple-200">
                <p className="text-sm text-purple-700">
                  🔐 Solo usuarios autorizados pueden acceder a este panel
                </p>
              </div>

              <button
                onClick={() => router.push("/auth/login?message=superadmin")}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Iniciar Sesión como SuperAdmin
              </button>

              <button
                onClick={() => router.push("/")}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Principal
        </h1>
        <p className="text-gray-600">
          Bienvenido al panel de control para la gestión del sistema
        </p>
      </div>

      <div className="px-2 py-2">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Total Doctores
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalDoctors}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pendientes</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingDoctors}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Verificados</h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.verifiedDoctors}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Especialidades
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalSpecialties}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Activas</h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.activeSpecialties}
            </p>
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Doctors Management Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                Gestión de Doctores
              </h2>
              <p className="text-blue-100">
                Administra y verifica los perfiles de doctores
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de doctores:</span>
                  <span className="font-semibold text-blue-600">
                    {stats.totalDoctors}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Pendientes de verificación:
                  </span>
                  <span className="font-semibold text-yellow-600">
                    {stats.pendingDoctors}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verificados:</span>
                  <span className="font-semibold text-green-600">
                    {stats.verifiedDoctors}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/superadmin/doctors")}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Gestionar Doctores →
                </button>
              </div>
            </div>
          </div>

          {/* Specialties Management Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                Gestión de Especialidades
              </h2>
              <p className="text-purple-100">
                Administra las especialidades médicas disponibles
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Total de especialidades:
                  </span>
                  <span className="font-semibold text-purple-600">
                    {stats.totalSpecialties}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Activas:</span>
                  <span className="font-semibold text-green-600">
                    {stats.activeSpecialties}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Inactivas:</span>
                  <span className="font-semibold text-red-600">
                    {stats.totalSpecialties - stats.activeSpecialties}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/superadmin/specialties")}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Gestionar Especialidades →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/superadmin/doctors?filter=pending")}
              className="flex items-center justify-center px-4 py-3 border border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              Ver Doctores Pendientes
            </button>

            <button
              onClick={() => router.push("/superadmin/specialties")}
              className="flex items-center justify-center px-4 py-3 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Crear Especialidad
            </button>

            <button
              onClick={() => window.open("/", "_blank")}
              className="flex items-center justify-center px-4 py-3 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              Vista Previa del Sitio
            </button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
