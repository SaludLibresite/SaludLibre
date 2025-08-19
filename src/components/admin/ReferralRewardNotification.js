import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { getReferralStats, createRewardRequest } from "../../lib/referralsService";
import { REFERRAL_REWARDS_CONFIG, getAvailableRewards } from "../../lib/referralRewardsConfig";
import { GiftIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ReferralRewardNotification() {
  const { currentUser } = useAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [availableRewards, setAvailableRewards] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [requestingReward, setRequestingReward] = useState(false);

  useEffect(() => {
    async function checkRewards() {
      if (!currentUser) return;

      try {
        const doctorData = await getDoctorByUserId(currentUser.uid);
        if (doctorData) {
          setDoctorId(doctorData.id);
          
          const stats = await getReferralStats(doctorData.id);
          if (stats) {
            const confirmedReferrals = stats.referralStats?.confirmedReferrals || 0;
            const pendingRewards = stats.referralRewards?.pendingRewards || 0;
            const approvedRewards = stats.referralRewards?.approvedRewards || 0;
            
            const newAvailableRewards = getAvailableRewards(confirmedReferrals, approvedRewards, pendingRewards);
            
            if (newAvailableRewards > 0) {
              setAvailableRewards(newAvailableRewards);
              setShowNotification(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking rewards:", error);
      }
    }

    checkRewards();
  }, [currentUser]);

  const handleRequestReward = async () => {
    try {
      setRequestingReward(true);
      
      await createRewardRequest(doctorId);
      
      setShowNotification(false);
      alert(`¡Solicitud de recompensa de ${REFERRAL_REWARDS_CONFIG.REWARD_DAYS} días enviada! El superadmin la revisará pronto.`);
      
    } catch (error) {
      console.error("Error requesting reward:", error);
      alert("Error al solicitar recompensa: " + error.message);
    } finally {
      setRequestingReward(false);
    }
  };

  if (!showNotification || availableRewards === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <GiftIcon className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              🎉 ¡Tienes recompensas disponibles!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Has ganado <strong>{availableRewards}</strong> recompensa(s) de {REFERRAL_REWARDS_CONFIG.REWARD_DAYS} días gratis por tus referidos exitosos.
            </p>
            <p className="text-xs text-green-600 mt-2">
              Cada {REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD} doctores referidos confirmados = {REFERRAL_REWARDS_CONFIG.REWARD_DAYS} días gratis de suscripción
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="text-green-400 hover:text-green-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mt-4 flex space-x-3">
        <button
          onClick={handleRequestReward}
          disabled={requestingReward}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <GiftIcon className="h-4 w-4" />
          <span>{requestingReward ? "Solicitando..." : `Solicitar ${REFERRAL_REWARDS_CONFIG.REWARD_DAYS} Días Gratis`}</span>
        </button>
        
        <button
          onClick={() => setShowNotification(false)}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Recordar más tarde
        </button>
      </div>
    </div>
  );
}
