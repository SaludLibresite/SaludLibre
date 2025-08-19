import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserStore } from "../../store/userStore";
import { useRouter } from "next/router";
import { canAccessPanel } from "../../lib/userTypeService";
import {
  getAllDoctorsWithReferrals,
  getPendingRewardRequests,
  approveRewardRequest,
  rejectRewardRequest,
} from "../../lib/referralsService";
import { REFERRAL_REWARDS_CONFIG } from "../../lib/referralRewardsConfig";
import {
  getUserSubscription,
  updateSubscription,
  createSubscription,
  extendSubscription,
} from "../../lib/subscriptionsService";
import SuperAdminLayout from "../../components/superadmin/SuperAdminLayout";
import ReferralConfigPanel from "../../components/superadmin/ReferralConfigPanel";
import {
  GiftIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  TrophyIcon,
  UserIcon,
  CalendarDaysIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

export default function ReferralRewards() {
  const { currentUser, loading: authLoading } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();
  const router = useRouter();
  const [doctorsWithReferrals, setDoctorsWithReferrals] = useState([]);
  const [pendingRewards, setPendingRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingReward, setProcessingReward] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Redirect if user doesn't have superadmin access
  useEffect(() => {
    if (!authLoading && !userStoreLoading) {
      if (!currentUser) {
        router.push("/auth/login?message=superadmin");
        return;
      }

      if (userType && !canAccessPanel(userType, "superadmin")) {
        if (userType === "patient") {
          router.push("/paciente/dashboard");
        } else if (userType === "doctor") {
          router.push("/admin");
        } else {
          router.push("/");
        }
        return;
      }

      if (!userType) {
        console.warn("User type not detected, redirecting to login");
        router.push("/auth/login?message=superadmin");
        return;
      }

      if (userType === "superadmin") {
        loadData();
      }
    }
  }, [authLoading, userStoreLoading, currentUser, userType, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [doctorsData, pendingRewardsData] = await Promise.all([
        getAllDoctorsWithReferrals(),
        getPendingRewardRequests(),
      ]);

      setDoctorsWithReferrals(doctorsData);
      setPendingRewards(pendingRewardsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReward = async (rewardId, doctorId) => {
    try {
      setProcessingReward(rewardId);

      // Approve the reward request
      await approveRewardRequest(rewardId, currentUser.uid);

      // Get doctor's current subscription
      const currentSubscription = await getUserSubscription(doctorId);

      if (currentSubscription && currentSubscription.status === "active") {
        // Extend existing subscription by configured days using the new function
        await extendSubscription(currentSubscription.id, REFERRAL_REWARDS_CONFIG.REWARD_DAYS, currentUser.uid);

        alert(`✅ Recompensa aprobada y suscripción extendida por ${REFERRAL_REWARDS_CONFIG.REWARD_DAYS} días`);
      } else {
        // Create new free subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + REFERRAL_REWARDS_CONFIG.REWARD_DAYS);

        await createSubscription({
          userId: doctorId,
          planId: "referral_reward",
          planName: `Recompensa por Referidos - ${REFERRAL_REWARDS_CONFIG.REWARD_DAYS} días gratis`,
          price: 0,
          currency: "ARS",
          status: "active",
          startDate,
          endDate,
          paymentMethod: "referral_reward",
          createdBy: currentUser.uid,
          extendedBy: "referral_reward",
          extendedDays: REFERRAL_REWARDS_CONFIG.REWARD_DAYS,
        });

        alert(`✅ Recompensa aprobada y nueva suscripción de ${REFERRAL_REWARDS_CONFIG.REWARD_DAYS} días creada`);
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error approving reward:", error);
      alert("❌ Error al aprobar recompensa: " + error.message);
    } finally {
      setProcessingReward(null);
    }
  };

  const handleRejectReward = async (rewardId, reason = "") => {
    if (!reason) {
      reason = prompt("Motivo del rechazo (opcional):");
    }

    try {
      setProcessingReward(rewardId);

      await rejectRewardRequest(rewardId, currentUser.uid, reason);

      alert("❌ Recompensa rechazada");

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error rejecting reward:", error);
      alert("❌ Error al rechazar recompensa: " + error.message);
    } finally {
      setProcessingReward(null);
    }
  };

  if (authLoading || userStoreLoading || loading) {
    return (
      <SuperAdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <GiftIcon className="h-8 w-8 text-yellow-500 mr-3" />
              Gestión de Recompensas por Referidos
            </h1>
            <p className="text-gray-600 mt-2">
              Administra las recompensas de suscripción por referidos de doctores
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doctores con Referidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctorsWithReferrals.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recompensas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingRewards.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctorsWithReferrals.reduce(
                    (sum, doc) => sum + (doc.referralStats?.confirmedReferrals || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Días Gratis Otorgados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctorsWithReferrals.reduce(
                    (sum, doc) => sum + (doc.referralRewards?.totalRewardsEarned || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Recompensas Pendientes ({pendingRewards.length})
              </button>
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Resumen General ({doctorsWithReferrals.length})
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "config"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <CogIcon className="h-4 w-4 inline mr-2" />
                Configuración
              </button>
            </nav>
          </div>

          {/* Pending Rewards Tab */}
          {activeTab === "pending" && (
            <div className="p-6">
              {pendingRewards.length === 0 ? (
                <div className="text-center py-12">
                  <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay recompensas pendientes
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Todas las solicitudes de recompensa han sido procesadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              Dr. {reward.doctorData?.displayName || reward.doctorData?.nombre || `${reward.doctorData?.firstName || ''} ${reward.doctorData?.lastName || ''}`.trim() || 'Doctor'}
                            </h3>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full">
                              {reward.rewardValue} días gratis
                            </span>
                          </div>

                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Email:</strong> {reward.doctorData?.email}</p>
                            <p><strong>Especialidad:</strong> {reward.doctorData?.specialty || reward.doctorData?.especialidad}</p>
                            <p><strong>Referidos Confirmados:</strong> {reward.doctorData?.referralStats?.confirmedReferrals || 0}</p>
                            <p><strong>Solicitud creada:</strong> {new Date(reward.createdAt?.seconds * 1000).toLocaleDateString("es-ES")}</p>
                          </div>

                          <div className="mt-4 bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Resumen de Referidos:</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <span className="ml-2 font-semibold">{reward.doctorData?.referralStats?.totalReferrals || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Confirmados:</span>
                                <span className="ml-2 font-semibold text-green-600">{reward.doctorData?.referralStats?.confirmedReferrals || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Recompensas Ganadas:</span>
                                <span className="ml-2 font-semibold text-blue-600">
                                  {Math.floor((reward.doctorData?.referralStats?.confirmedReferrals || 0) / REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>                        <div className="ml-6 flex space-x-3">
                          <button
                            onClick={() => handleApproveReward(reward.id, reward.doctorId)}
                            disabled={processingReward === reward.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>
                              {processingReward === reward.id ? "Procesando..." : "Aprobar"}
                            </span>
                          </button>

                          <button
                            onClick={() => handleRejectReward(reward.id)}
                            disabled={processingReward === reward.id}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="p-6">
              {doctorsWithReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay doctores con referidos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ningún doctor ha registrado referidos aún.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doctorsWithReferrals.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {doctor.displayName || doctor.nombre || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor'}
                            </h3>
                            {doctor.newEligibleRewards > 0 && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                                ¡{doctor.newEligibleRewards} nueva(s) recompensa(s)!
                              </span>
                            )}
                            {doctor.progressToNextReward > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                                {doctor.nextRewardIn} para siguiente recompensa
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Email:</strong> {doctor.email}</p>
                            <p><strong>Especialidad:</strong> {doctor.specialty || doctor.especialidad}</p>
                            <p><strong>Código de Referido:</strong> {doctor.referralCode}</p>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progreso hacia recompensa:</span>
                              <span>{doctor.progressToNextReward}/{REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  doctor.progressToNextReward === 0 ? 'bg-gray-300' : 
                                  doctor.progressToNextReward === REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD ? 'bg-green-500' : 'bg-yellow-400'
                                }`}
                                style={{ width: `${(doctor.progressToNextReward / REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-blue-600">
                                {doctor.referralStats?.totalReferrals || 0}
                              </div>
                              <div className="text-blue-800">Total</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-yellow-600">
                                {doctor.referralStats?.pendingReferrals || 0}
                              </div>
                              <div className="text-yellow-800">Pendientes</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-green-600">
                                {doctor.referralStats?.confirmedReferrals || 0}
                              </div>
                              <div className="text-green-800">Confirmados</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-purple-600">
                                {Math.floor((doctor.referralStats?.confirmedReferrals || 0) / 3)}
                              </div>
                              <div className="text-purple-800">Recompensas</div>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-indigo-600">
                                {doctor.referralRewards?.totalRewardsEarned || 0}
                              </div>
                              <div className="text-indigo-800">Días Otorgados</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === "config" && (
            <div className="p-6">
              <ReferralConfigPanel />
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
