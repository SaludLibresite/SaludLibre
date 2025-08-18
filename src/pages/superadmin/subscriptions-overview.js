import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import { getAllDoctors } from "../../lib/doctorsService";
import { getAllPayments, getPaymentStats } from "../../lib/paymentsService";

// Components
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function SubscriptionsOverview() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // States
  const [doctors, setDoctors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Authentication and initial load
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/superadmin");
        return;
      }

      if (!SUPERADMIN_EMAILS.includes(currentUser.email)) {
        router.push("/superadmin");
        return;
      }

      loadData();
    }
  }, [currentUser, authLoading, router]);

  // Data loading functions
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDoctorsWithSubscriptions(),
        loadPayments(),
        loadPaymentStats()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsWithSubscriptions = async () => {
    try {
      const allDoctors = await getAllDoctors();
      // Filtrar solo doctores que tienen suscripción activa o datos de suscripción
      const doctorsWithSubscriptions = allDoctors.filter(doctor => 
        doctor.subscriptionStatus || doctor.subscriptionPlan || doctor.subscriptionActivatedAt
      );
      setDoctors(doctorsWithSubscriptions);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const loadPayments = async () => {
    try {
      const paymentsData = await getAllPayments(50);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  };

  const loadPaymentStats = async () => {
    try {
      const stats = await getPaymentStats();
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error loading payment stats:", error);
    }
  };

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    if (filter === "active") return doctor.subscriptionStatus === 'active';
    if (filter === "pending") return doctor.subscriptionStatus === 'pending';
    if (filter === "expired") return doctor.subscriptionStatus === 'expired' || doctor.subscriptionStatus === 'inactive';
    if (filter === "free") return doctor.subscriptionPlanId === 'plan_gratuito' || doctor.subscriptionPlan === 'Plan Gratuito';
    if (filter === "premium") return doctor.subscriptionPlanId !== 'plan_gratuito' && doctor.subscriptionPlan !== 'Plan Gratuito';
    return true;
  });

  // Calculate counts
  const activeCount = doctors.filter((d) => d.subscriptionStatus === 'active').length;
  const pendingCount = doctors.filter((d) => d.subscriptionStatus === 'pending').length;
  const expiredCount = doctors.filter((d) => d.subscriptionStatus === 'expired' || d.subscriptionStatus === 'inactive').length;
  const freeCount = doctors.filter((d) => d.subscriptionPlanId === 'plan_gratuito' || d.subscriptionPlan === 'Plan Gratuito').length;
  const premiumCount = doctors.filter((d) => d.subscriptionPlanId !== 'plan_gratuito' && d.subscriptionPlan !== 'Plan Gratuito' && d.subscriptionStatus === 'active').length;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'No disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const expirationDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (authLoading || loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vista General de Suscripciones</h1>
          <p className="mt-2 text-gray-600">
            Monitorea las suscripciones activas y pagos de los doctores
          </p>
          {paymentStats && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-lg font-bold text-green-800">
                  ${paymentStats.totalAmount?.toLocaleString()} ARS
                </div>
                <div className="text-sm text-green-600">Ingresos Totales</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-lg font-bold text-blue-800">
                  {paymentStats.total}
                </div>
                <div className="text-sm text-blue-600">Total de Pagos</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-800">
                  ${paymentStats.avgAmount?.toFixed(0).toLocaleString()} ARS
                </div>
                <div className="text-sm text-purple-600">Promedio por Pago</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Activas</dt>
                    <dd className="text-lg font-medium text-gray-900">{activeCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold">✗</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Expiradas</dt>
                    <dd className="text-lg font-medium text-gray-900">{expiredCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">🆓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Gratuitas</dt>
                    <dd className="text-lg font-medium text-gray-900">{freeCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">💎</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Premium</dt>
                    <dd className="text-lg font-medium text-gray-900">{premiumCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas', count: doctors.length },
              { key: 'active', label: 'Activas', count: activeCount },
              { key: 'pending', label: 'Pendientes', count: pendingCount },
              { key: 'expired', label: 'Expiradas', count: expiredCount },
              { key: 'free', label: 'Gratuitas', count: freeCount },
              { key: 'premium', label: 'Premium', count: premiumCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Suscripciones Recientes */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Suscripciones de Doctores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Restantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Pago
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No hay suscripciones para mostrar con el filtro seleccionado
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => {
                    const daysRemaining = getDaysRemaining(doctor.subscriptionExpiresAt);
                    return (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={doctor.photoURL || `/img/doctor-1.jpg`}
                                alt=""
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {doctor.nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doctor.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.subscriptionPlan || 'Sin plan'}</div>
                          <div className="text-sm text-gray-500">
                            ${doctor.lastPaymentAmount?.toLocaleString() || '0'}/mes
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(doctor.subscriptionStatus)}`}>
                            {doctor.subscriptionStatus || 'Sin estado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateShort(doctor.subscriptionActivatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateShort(doctor.subscriptionExpiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {daysRemaining !== null ? (
                            <span className={`font-medium ${
                              daysRemaining <= 7 ? 'text-red-600' : 
                              daysRemaining <= 30 ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {daysRemaining} días
                            </span>
                          ) : (
                            'No disponible'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{doctor.lastPaymentMethod || 'No disponible'}</div>
                          <div className="text-xs text-gray-500">
                            ${doctor.lastPaymentAmount?.toLocaleString() || '0'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagos Recientes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Pagos Recientes</h2>
            <p className="text-sm text-gray-600 mt-1">Últimos 50 pagos procesados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referencia Externa
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No hay pagos registrados
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const doctor = doctors.find(d => d.userId === payment.userId);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {doctor?.nombre || 'Usuario no encontrado'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doctor?.email || payment.userId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${payment.amount?.toLocaleString()} {payment.currency || 'ARS'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentMethod || 'No especificado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="truncate max-w-32 block" title={payment.externalReference}>
                            {payment.externalReference || 'No disponible'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
