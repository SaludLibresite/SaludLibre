import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import {
  createReferralCode,
  getReferralsByDoctorId,
  getReferralStats,
  getReferralLink,
  createRewardRequest,
} from "../../lib/referralsService";
import { REFERRAL_REWARDS_CONFIG, getAvailableRewards } from "../../lib/referralRewardsConfig";
import { canDoctorRefer, getReferralConfiguration } from "../../lib/referralConfigService";
import ReferralProgressBar from "./ReferralProgressBar";
import {
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CogIcon as CopyIcon,
  TrophyIcon,
  ShareIcon,
  LinkIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

export default function ReferralsList() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({ nombre: "", especialidad: "", email: "" });
  const [doctorId, setDoctorId] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [requestingReward, setRequestingReward] = useState(false);
  const [canRefer, setCanRefer] = useState({ canRefer: true, reason: null });
  const [currentConfig, setCurrentConfig] = useState(null);

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Load doctor profile on component mount (EXACT COPY FROM ProfileSettings)
  useEffect(() => {
    async function loadDoctorProfile() {
      if (!currentUser) {
        console.log('No current user available, cannot load doctor profile');
        setLoading(false);
        return;
      }

      if (!currentUser.uid) {
        console.log('Current user has no uid, cannot load doctor profile');
        setLoading(false);
        return;
      }

      console.log('Loading doctor profile for user:', currentUser.uid, 'email:', currentUser.email);

      try {
        console.log('Fetching doctor data for userId:', currentUser.uid);
        const doctorData = await getDoctorByUserId(currentUser.uid);
        console.log('Doctor data received:', doctorData ? 'YES' : 'NO', doctorData ? { id: doctorData.id, nombre: doctorData.nombre, email: doctorData.email } : null);

        if (doctorData) {
          setDoctorId(doctorData.id);
          setProfile({
            nombre: doctorData.nombre || "",
            especialidad: doctorData.especialidad || "",
            email: doctorData.email || "",
            ...doctorData,
          });

          // Load referral data
          let referralsData = [];
          let statsData = null;

          if (doctorData.id) {
            [referralsData, statsData] = await Promise.all([
              getReferralsByDoctorId(doctorData.id),
              getReferralStats(doctorData.id),
            ]);
          }

          const configData = await getReferralConfiguration();

          setReferrals(referralsData || []);
          setReferralStats(
            statsData || {
              referralStats: {
                totalReferrals: 0,
                pendingReferrals: 0,
                confirmedReferrals: 0,
              },
            }
          );
          setCurrentConfig(configData);
          setTopReferrers([]);

          // Check if doctor can refer
          if (doctorData.id) {
            const canReferResult = await canDoctorRefer(doctorData.id);
            setCanRefer(canReferResult);
          }
        } else {
          console.warn("No doctor data found for user:", currentUser.uid);
          setDoctorId(null);
          setProfile({
            nombre: "Usuario",
            especialidad: "Sin especialidad",
            email: currentUser?.email || ""
          });
          // Set default referral data for users without doctor profile
          setReferrals([]);
          setReferralStats({
            referralStats: {
              totalReferrals: 0,
              pendingReferrals: 0,
              confirmedReferrals: 0,
            },
          });
          setCurrentConfig(await getReferralConfiguration());
        }
      } catch (error) {
        console.error("Error loading doctor profile:", error);
        setDoctorId(null);
        setProfile({
          nombre: "Usuario",
          especialidad: "Sin especialidad",
          email: currentUser?.email || ""
        });
        // Set default referral data on error
        setReferrals([]);
        setReferralStats({
          referralStats: {
            totalReferrals: 0,
            pendingReferrals: 0,
            confirmedReferrals: 0,
          },
        });
        setCurrentConfig(await getReferralConfiguration().catch(() => null));
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    }

    loadDoctorProfile();
  }, [currentUser]);

  const handleGenerateCode = async () => {
    if (!doctorId || !profile?.nombre || profile.nombre === "Usuario") {
      alert("Error: No tienes un perfil de doctor registrado. Contacta al administrador para activar tu cuenta de referidos.");
      return;
    }

    try {
      setGeneratingCode(true);

      const doctorName = profile.nombre || "Doctor";
      const code = await createReferralCode(doctorId, doctorName);

      if (code) {
        setReferralStats((prev) => ({
          ...prev,
          referralCode: code,
          referralStats: prev?.referralStats || {
            totalReferrals: 0,
            pendingReferrals: 0,
            confirmedReferrals: 0,
          },
        }));

        alert("¡Código generado exitosamente: " + code);
      } else {
        alert("Error: No se pudo generar el código");
      }
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Error al generar código: " + (error.message || error.toString()));
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copiado al portapapeles`);
  };

  // Helper function to calculate available rewards with dynamic config
  const getAvailableRewardsWithConfig = (confirmedReferrals, approvedRewards = 0, pendingRewards = 0) => {
    const config = currentConfig || REFERRAL_REWARDS_CONFIG;
    const totalEarned = Math.floor(confirmedReferrals / config.REFERRALS_PER_REWARD);
    return Math.max(0, totalEarned - approvedRewards - pendingRewards);
  };

  const shareViaWhatsApp = () => {
    if (!referralStats?.referralCode) return;
    const link = getReferralLink(referralStats.referralCode);
    const message = `¡Únete a nuestra plataforma médica! Usa mi código de referencia: ${referralStats.referralCode}\n\nRegistrate aquí: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleRequestReward = async () => {
    if (!doctorId || profile?.nombre === "Usuario") {
      alert("Error: No tienes un perfil de doctor registrado. Contacta al administrador para activar tu cuenta de referidos.");
      return;
    }

    try {
      setRequestingReward(true);
      
      await createRewardRequest(doctorId);
      
      alert(`¡Solicitud de recompensa de ${(currentConfig?.REWARD_DAYS || REFERRAL_REWARDS_CONFIG.REWARD_DAYS)} días enviada! El superadmin la revisará pronto.`);
      
      // Reload stats to update pending rewards
      const statsData = await getReferralStats(doctorId);
      setReferralStats(statsData);
      
    } catch (error) {
      console.error("Error requesting reward:", error);
      alert("Error al solicitar recompensa: " + (error.message || error.toString()));
    } finally {
      setRequestingReward(false);
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    if (filter === "all") return true;
    return referral.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Cargando información del doctor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <div className="bg-yellow-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Tu Código de Referencia</h2>
            
            {/* Referral Status */}
            {!canRefer.canRefer && (
              <div className="mb-4 bg-red-500/20 border border-red-300 rounded-lg p-3">
                <div className="flex items-center">
                  <XMarkIcon className="h-5 w-5 text-red-200 mr-2" />
                  <span className="text-sm font-medium">Sistema de referidos deshabilitado</span>
                </div>
                <p className="text-xs text-red-100 mt-1">{canRefer.reason}</p>
              </div>
            )}
            
            {referralStats?.referralCode ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 flex-1">
                  <code className="text-lg sm:text-2xl font-mono font-bold text-white break-all">
                    {referralStats.referralCode}
                  </code>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() =>
                      copyToClipboard(referralStats.referralCode, "Código")
                    }
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex-shrink-0"
                    disabled={!canRefer.canRefer}
                    title="Copiar código"
                  >
                    <CopyIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        getReferralLink(referralStats.referralCode),
                        "Enlace"
                      )
                    }
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex-shrink-0"
                    disabled={!canRefer.canRefer}
                    title="Copiar enlace"
                  >
                    <LinkIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={shareViaWhatsApp}
                    className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition-colors flex-shrink-0"
                    disabled={!canRefer.canRefer}
                    title="Compartir por WhatsApp"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : canRefer.canRefer ? (
              doctorId && profile?.nombre && profile.nombre !== "Usuario" ? (
                <button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {generatingCode ? "Generando..." : "Generar Código"}
                </button>
              ) : (
                <div className="bg-red-500/20 border border-red-300 rounded-lg p-3">
                  <p className="text-sm">
                    {profile?.nombre === "Usuario"
                      ? "No tienes un perfil de doctor registrado. Contacta al administrador para activar tu cuenta de referidos."
                      : "Información del doctor no disponible."
                    }
                  </p>
                </div>
              )
            ) : (
              <div className="bg-red-500/20 border border-red-300 rounded-lg p-3">
                <p className="text-sm">No puedes generar un código de referido en este momento.</p>
              </div>
            )}
          </div>
        </div>

        {referralStats && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">
                {referralStats.referralStats?.totalReferrals || 0}
              </div>
              <div className="text-white/80 text-sm">Total Referidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">
                {referralStats.referralStats?.pendingReferrals || 0}
              </div>
              <div className="text-white/80 text-sm">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">
                {referralStats.referralStats?.confirmedReferrals || 0}
              </div>
              <div className="text-white/80 text-sm">Confirmados</div>
            </div>
          </div>
        )}

        {/* Rewards Section */}
        {referralStats?.referralRewards && (
          <div className="mt-6 border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold mb-4">🎁 Sistema de Recompensas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">
                  {Math.floor((referralStats.referralStats?.confirmedReferrals || 0) / REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD)}
                </div>
                <div className="text-white/80">Recompensas Ganadas</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">
                  {referralStats.referralRewards?.pendingRewards || 0}
                </div>
                <div className="text-white/80">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">
                  {referralStats.referralRewards?.approvedRewards || 0}
                </div>
                <div className="text-white/80">Aprobadas</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">
                  {referralStats.referralRewards?.totalRewardsEarned || 0}
                </div>
                <div className="text-white/80">Días Gratis</div>
              </div>
            </div>
            
            {/* Request Reward Button */}
            {canRefer.canRefer && getAvailableRewardsWithConfig(
              referralStats.referralStats?.confirmedReferrals || 0,
              referralStats.referralRewards?.approvedRewards || 0,
              referralStats.referralRewards?.pendingRewards || 0
            ) > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleRequestReward}
                  disabled={requestingReward}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
                >
                  <GiftIcon className="h-4 w-4" />
                  <span>{requestingReward ? "Solicitando..." : `Solicitar ${(currentConfig?.REWARD_DAYS || REFERRAL_REWARDS_CONFIG.REWARD_DAYS)} Días Gratis`}</span>
                </button>
                <p className="text-xs text-white/70 mt-2">
                  ¡Tienes derecho a una recompensa de {(currentConfig?.REWARD_DAYS || REFERRAL_REWARDS_CONFIG.REWARD_DAYS)} días gratis! (Cada {(currentConfig?.REFERRALS_PER_REWARD || REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD)} referidos confirmados = {(currentConfig?.REWARD_DAYS || REFERRAL_REWARDS_CONFIG.REWARD_DAYS)} días gratis)
                </p>
              </div>
            )}
            
            {referralStats.referralRewards?.pendingRewards > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-white/80">
                  ⏳ Tienes {referralStats.referralRewards.pendingRewards} recompensa(s) esperando aprobación del administrador
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar Section */}
      {referralStats && canRefer.canRefer && (
        <div className="mt-6">
          <ReferralProgressBar 
            confirmedReferrals={referralStats.referralStats?.confirmedReferrals || 0}
            pendingRewards={referralStats.referralRewards?.pendingRewards || 0}
            approvedRewards={referralStats.referralRewards?.approvedRewards || 0}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Doctores Referidos
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Doctores que se registraron usando tu código de referencia
              </p>
            </div>
            <button
              onClick={() => alert("Función en desarrollo")}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-not-allowed"
              disabled
            >
              <TrophyIcon className="h-4 w-4" />
              <span>Top Referrers</span>
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todos los Referidos" },
              { key: "pending", label: "Pendientes" },
              { key: "confirmed", label: "Confirmados" },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilter(status.key)}
                className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap ${
                  filter === status.key
                    ? "bg-yellow-100 text-yellow-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Referrals List */}
        {filteredReferrals.length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No se encontraron referidos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all"
                ? "Comparte tu código de referencia para empezar a invitar doctores."
                : `No hay referidos ${
                    filter === "pending" ? "pendientes" : "confirmados"
                  } en este momento.`}
            </p>
            {referralStats?.referralCode && (
              <div className="mt-6">
                <button
                  onClick={shareViaWhatsApp}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2 mx-auto"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span>Compartir Código</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReferrals.map((referral) => (
              <div key={referral.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {referral.referredDoctorName}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          referral.status
                        )}`}
                      >
                        {getStatusIcon(referral.status)}
                        <span className="ml-1">
                          {getStatusText(referral.status)}
                        </span>
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        <strong>Especialidad:</strong>{" "}
                        {referral.referredDoctorSpecialty}
                      </p>
                      <p>
                        <strong>Email:</strong> {referral.referredDoctorEmail}
                      </p>
                      <p>
                        <strong>Fecha de Registro:</strong>{" "}
                        {new Date(
                          referral.createdAt?.seconds * 1000
                        ).toLocaleDateString("es-ES")}
                      </p>
                      {referral.confirmedAt && (
                        <p>
                          <strong>Confirmado el:</strong>{" "}
                          {new Date(
                            referral.confirmedAt?.seconds * 1000
                          ).toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
                Top Referrers
              </h3>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {topReferrers.length === 0 ? (
                <p className="text-gray-500 text-center">
                  No hay datos disponibles
                </p>
              ) : (
                <div className="space-y-4">
                  {topReferrers.map((referrer, index) => (
                    <div
                      key={referrer.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-orange-600"
                              : "bg-amber-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {referrer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {referrer.totalReferrals} referidos
                          </p>
                        </div>
                      </div>
                      {index < 3 && (
                        <TrophyIcon
                          className={`h-5 w-5 ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                              ? "text-gray-400"
                              : "text-orange-600"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
