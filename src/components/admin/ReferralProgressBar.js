import React from 'react';
import { REFERRAL_REWARDS_CONFIG, getProgressMessage, calculateProgress } from '../../lib/referralRewardsConfig';
import { TrophyIcon, GiftIcon } from '@heroicons/react/24/outline';

export default function ReferralProgressBar({ confirmedReferrals = 0, pendingRewards = 0, approvedRewards = 0 }) {
  const config = REFERRAL_REWARDS_CONFIG;
  const totalEarned = Math.floor(confirmedReferrals / config.REFERRALS_PER_REWARD);
  const currentProgress = confirmedReferrals % config.REFERRALS_PER_REWARD;
  const progressPercentage = (currentProgress / config.REFERRALS_PER_REWARD) * 100;
  const nextRewardIn = config.REFERRALS_PER_REWARD - currentProgress;
  const availableRewards = Math.max(0, totalEarned - approvedRewards - pendingRewards);
  
  const getProgressColor = () => {
    if (availableRewards > 0) return 'bg-green-500';
    if (currentProgress === 0) return 'bg-gray-300';
    return 'bg-yellow-400';
  };

  const getProgressTextColor = () => {
    if (availableRewards > 0) return 'text-green-700';
    if (currentProgress >= 2) return 'text-yellow-700';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium text-gray-900">Progreso de Recompensas</h3>
        </div>
        {availableRewards > 0 && (
          <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full flex items-center space-x-1">
            <GiftIcon className="h-3 w-3" />
            <span>{availableRewards} disponible{availableRewards > 1 ? 's' : ''}</span>
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Referidos confirmados: {confirmedReferrals}</span>
          <span>Meta: {Math.ceil(confirmedReferrals / config.REFERRALS_PER_REWARD) * config.REFERRALS_PER_REWARD}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Progress Text */}
      <div className={`text-sm ${getProgressTextColor()}`}>
        {availableRewards > 0 ? (
          <div className="flex items-center space-x-1">
            <GiftIcon className="h-4 w-4" />
            <span className="font-medium">
              ¡Tienes {availableRewards} recompensa{availableRewards > 1 ? 's' : ''} de {config.REWARD_DAYS} días disponible{availableRewards > 1 ? 's' : ''}!
            </span>
          </div>
        ) : currentProgress === 0 && confirmedReferrals === 0 ? (
          <span>Comienza refiriendo doctores para ganar {config.REWARD_DAYS} días gratis cada {config.REFERRALS_PER_REWARD} referidos confirmados.</span>
        ) : (
          <span>
            Te faltan <strong>{nextRewardIn}</strong> referido{nextRewardIn > 1 ? 's' : ''} más para ganar {config.REWARD_DAYS} días gratis.
          </span>
        )}
      </div>

      {/* Mini Stats */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-xs text-center">
          <div>
            <div className="font-semibold text-gray-900">{totalEarned}</div>
            <div className="text-gray-600">Ganadas</div>
          </div>
          <div>
            <div className="font-semibold text-yellow-600">{pendingRewards}</div>
            <div className="text-gray-600">Pendientes</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{approvedRewards}</div>
            <div className="text-gray-600">Aprobadas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
