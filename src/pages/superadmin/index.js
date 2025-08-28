import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserStore } from "../../store/userStore";
import { useRouter } from "next/router";
import { canAccessPanel } from "../../lib/userTypeService";
import { getAllDoctors } from "../../lib/doctorsService";
import { getAllSpecialties } from "../../lib/specialtiesService";
import { getAllSubscriptions } from "../../lib/subscriptionsService";

import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

export default function SuperAdminDashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingDoctors: 0,
    verifiedDoctors: 0,
    totalSpecialties: 0,
    activeSpecialties: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirect if user doesn't have superadmin access
  useEffect(() => {
    if (!authLoading && !userStoreLoading) {
      if (!currentUser) {
        router.push("/auth/login?message=superadmin");
        return;
      }

      if (userType && !canAccessPanel(userType, "superadmin")) {
        // Redirect based on user type
        if (userType === 'patient') {
          router.push('/paciente/dashboard');
        } else if (userType === 'doctor') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        return;
      }

      // If user type is still unknown after auth is complete
      if (!userType) {
        console.warn('User type not detected, redirecting to login');
        router.push('/auth/login?message=superadmin');
        return;
      }

      // If user is authorized superadmin, load stats
      if (userType === 'superadmin') {
        loadStats();
      }
    }
  }, [authLoading, userStoreLoading, currentUser, userType, router]);

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

      // Cargar suscripciones para estadísticas
      const allSubscriptions = await getAllSubscriptions();
      const activeSubscriptions = allSubscriptions.filter(
        (s) => s.status === 'active'
      ).length;
      const monthlyRevenue = allSubscriptions
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => sum + (s.price || 0), 0);

      setStats({
        totalDoctors: allDoctors.length,
        pendingDoctors,
        verifiedDoctors,
        totalSpecialties: allSpecialties.length,
        activeSpecialties,
        totalSubscriptions: allSubscriptions.length,
        activeSubscriptions,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication and user type
  if (authLoading || userStoreLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso de superadmin...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is logged in but user type is not yet detected
  if (currentUser && !userType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Detectando tipo de usuario...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not authorized, show access denied
  if (!currentUser || (userType && !canAccessPanel(userType, "superadmin"))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso Denegado</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder al panel de superadmin.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/auth/login?message=superadmin')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Iniciar Sesión como SuperAdmin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while loading stats
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>

        {/* Subscription Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
            <h3 className="text-lg font-medium">Suscripciones Activas</h3>
            <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
            <p className="text-sm opacity-90">
              de {stats.totalSubscriptions} totales
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
            <h3 className="text-lg font-medium">Ingresos Mensuales</h3>
            <p className="text-3xl font-bold">
              ${stats.monthlyRevenue.toLocaleString()}
            </p>
            <p className="text-sm opacity-90">ARS por mes</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
            <h3 className="text-lg font-medium">Tasa de Conversión</h3>
            <p className="text-3xl font-bold">
              {stats.totalDoctors > 0 
                ? Math.round((stats.activeSubscriptions / stats.totalDoctors) * 100)
                : 0}%
            </p>
            <p className="text-sm opacity-90">
              doctores suscritos
            </p>
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

          {/* Zones Management Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                Gestión de Zonas
              </h2>
              <p className="text-emerald-100">
                Crea y administra zonas geográficas para agrupar doctores
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Zonas creadas:</span>
                  <span className="font-semibold text-emerald-600">
                    0
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Doctores agrupados:</span>
                  <span className="font-semibold text-blue-600">
                    {stats.totalDoctors}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Zonas activas:</span>
                  <span className="font-semibold text-green-600">
                    0
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/superadmin/zones")}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Gestionar Zonas →
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

          {/* Subscriptions Management Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                Gestión de Suscripciones
              </h2>
              <p className="text-green-100">
                Administra planes y pagos de suscripciones
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Suscripciones activas:
                  </span>
                  <span className="font-semibold text-green-600">
                    {stats.activeSubscriptions}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total suscripciones:</span>
                  <span className="font-semibold text-blue-600">
                    {stats.totalSubscriptions}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ingresos mensuales:</span>
                  <span className="font-semibold text-green-600">
                    ${stats.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/superadmin/subscriptions")}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Gestionar Suscripciones →
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              onClick={() => router.push("/superadmin/subscriptions")}
              className="flex items-center justify-center px-4 py-3 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              Gestionar Suscripciones
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
