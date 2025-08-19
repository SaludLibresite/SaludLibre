// Configuración del Sistema de Recompensas por Referidos

export const REFERRAL_REWARDS_CONFIG = {
  // Cantidad de referidos necesarios para una recompensa
  REFERRALS_PER_REWARD: 3,
  
  // Días de suscripción gratis por recompensa
  REWARD_DAYS: 30,
  
  // Tipo de recompensa por defecto
  DEFAULT_REWARD_TYPE: "subscription_extension",
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    // Mostrar progreso cuando esté cerca de completar
    SHOW_PROGRESS_THRESHOLD: 1, // Mostrar cuando tenga al menos 1 referido
    
    // Mostrar notificación de recompensa disponible
    SHOW_REWARD_NOTIFICATION: true,
    
    // Recordatorios automáticos (futuro)
    AUTO_REMINDERS: false,
  },
  
  // Configuración de visualización
  UI_CONFIG: {
    // Colores para la barra de progreso
    PROGRESS_COLORS: {
      incomplete: "bg-gray-200",
      progress: "bg-yellow-400",
      complete: "bg-green-500",
    },
    
    // Textos dinámicos
    PROGRESS_MESSAGES: {
      0: "Comienza refiriendo doctores para ganar recompensas",
      1: "¡Excelente! Solo necesitas 2 referidos más",
      2: "¡Casi ahí! Solo 1 referido más para tu recompensa",
      3: "🎉 ¡Recompensa disponible! Solicítala ahora",
    },
  },
  
  // Configuración para diferentes niveles (futuro)
  REWARD_TIERS: [
    {
      referrals: 3,
      reward_days: 30,
      title: "Bronce",
      description: "1 mes gratis"
    },
    {
      referrals: 6,
      reward_days: 60,
      title: "Plata", 
      description: "2 meses gratis"
    },
    {
      referrals: 12,
      reward_days: 90,
      title: "Oro",
      description: "3 meses gratis"
    }
  ],
  
  // Configuración de administración
  ADMIN_CONFIG: {
    // Auto-aprobar recompensas para doctores verificados (futuro)
    AUTO_APPROVE_FOR_VERIFIED: false,
    
    // Límite de recompensas por mes por doctor
    MAX_REWARDS_PER_MONTH: 2,
    
    // Requiere revisión manual
    REQUIRE_MANUAL_APPROVAL: true,
  }
};

// Helper functions
export const getProgressMessage = (confirmedReferrals) => {
  const config = REFERRAL_REWARDS_CONFIG;
  const remainder = confirmedReferrals % config.REFERRALS_PER_REWARD;
  
  if (remainder === 0 && confirmedReferrals >= config.REFERRALS_PER_REWARD) {
    return config.UI_CONFIG.PROGRESS_MESSAGES[3];
  }
  
  return config.UI_CONFIG.PROGRESS_MESSAGES[remainder] || 
         `Tienes ${confirmedReferrals} referidos. Necesitas ${config.REFERRALS_PER_REWARD - remainder} más para la próxima recompensa.`;
};

export const calculateProgress = (confirmedReferrals) => {
  const config = REFERRAL_REWARDS_CONFIG;
  const remainder = confirmedReferrals % config.REFERRALS_PER_REWARD;
  return (remainder / config.REFERRALS_PER_REWARD) * 100;
};

export const getAvailableRewards = (confirmedReferrals, approvedRewards = 0, pendingRewards = 0) => {
  const config = REFERRAL_REWARDS_CONFIG;
  const totalEarned = Math.floor(confirmedReferrals / config.REFERRALS_PER_REWARD);
  return Math.max(0, totalEarned - approvedRewards - pendingRewards);
};
