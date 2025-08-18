import { getUserSubscription, isSubscriptionActive } from './subscriptionsService';

// Definición de permisos por plan
export const SUBSCRIPTION_PERMISSIONS = {
  free: [
    'profile', // profile.js - administrar perfil básico
    'subscription', // subscription.js - gestión de suscripciones
    'referrals' // referrals.js - gestión de referidos
  ],
  medium: [
    'profile',
    'subscription', 
    'referrals',
    'schedule', // schedule.js - configurar horarios de atención
    'nuevo-paciente', // nuevo-paciente.js - registrar nuevos pacientes
    'patients', // patients/ - gestión de pacientes
    'appointments', // appointment/ - gestión de citas
    'reviews', // reviews.js - gestión de reseñas
  ],
  plus: [
    'profile',
    'subscription',
    'referrals', 
    'schedule',
    'nuevo-paciente',
    'patients',
    'appointments',
    'reviews',
    'video-consultation' // video-consultation/ - videollamadas
  ]
};

// Mapeo de plan ID a nombre de plan
export const PLAN_MAPPING = {
  'free': 'free',
  'medium': 'medium', 
  'plus': 'plus',
  // También podemos usar IDs específicos si es necesario
  'plan-free': 'free',
  'plan-medium': 'medium',
  'plan-plus': 'plus'
};

/**
 * Verifica si el usuario tiene acceso a una funcionalidad específica
 * @param {string} userId - ID del usuario
 * @param {string} feature - Nombre de la funcionalidad a verificar
 * @returns {Promise<boolean>} - true si tiene acceso, false si no
 */
export const hasFeatureAccess = async (userId, feature) => {
  try {
    // Obtener la suscripción actual del usuario
    const subscription = await getUserSubscription(userId);
    
    // Si no tiene suscripción, usar plan free por defecto
    if (!subscription) {
      return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
    }
    
    // Si la suscripción no está activa, usar plan free
    if (!isSubscriptionActive(subscription)) {
      return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
    }
    
    // Determinar el plan del usuario
    const planKey = determinePlanKey(subscription.planId, subscription.planName, subscription.price);
    
    // Verificar si el plan incluye la funcionalidad
    const permissions = SUBSCRIPTION_PERMISSIONS[planKey] || SUBSCRIPTION_PERMISSIONS.free;
    return permissions.includes(feature);
    
  } catch (error) {
    console.error('Error checking feature access:', error);
    // En caso de error, dar acceso solo a funcionalidades del plan free
    return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
  }
};

/**
 * Obtiene todas las funcionalidades disponibles para el usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<string[]>} - Array de funcionalidades disponibles
 */
export const getUserFeatures = async (userId) => {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription || !isSubscriptionActive(subscription)) {
      return SUBSCRIPTION_PERMISSIONS.free;
    }
    
    const planKey = determinePlanKey(subscription.planId, subscription.planName, subscription.price);
    return SUBSCRIPTION_PERMISSIONS[planKey] || SUBSCRIPTION_PERMISSIONS.free;
    
  } catch (error) {
    console.error('Error getting user features:', error);
    return SUBSCRIPTION_PERMISSIONS.free;
  }
};

/**
 * Determina la clave del plan basada en el precio y nombre del plan
 * @param {string} planId - ID del plan
 * @param {string} planName - Nombre del plan
 * @param {number} price - Precio del plan
 * @returns {string} - Clave del plan (free, medium, plus)
 */
const determinePlanKey = (planId, planName, price = 0) => {
  // Si el precio es 0, es plan free
  if (price === 0) {
    return 'free';
  }
  
  // Primero intentar con el ID del plan si existe en el mapeo
  if (PLAN_MAPPING[planId]) {
    return PLAN_MAPPING[planId];
  }
  
  // Luego intentar con el nombre del plan (convertir a lowercase)
  const lowerPlanName = planName?.toLowerCase() || '';
  
  if (lowerPlanName.includes('free') || lowerPlanName.includes('gratis') || price === 0) {
    return 'free';
  }
  
  if (lowerPlanName.includes('medium') || lowerPlanName.includes('medio')) {
    return 'medium';
  }
  
  if (lowerPlanName.includes('plus') || lowerPlanName.includes('premium')) {
    return 'plus';
  }
};

/**
 * Obtiene el nombre legible del plan del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} - Nombre del plan
 */
export const getUserPlanName = async (userId) => {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription || !isSubscriptionActive(subscription)) {
      return 'Free';
    }
    
    const planKey = determinePlanKey(subscription.planId, subscription.planName, subscription.price);
    
    switch (planKey) {
      case 'medium':
        return 'Medium';
      case 'plus':
        return 'Plus';
      default:
        return 'Free';
    }
    
  } catch (error) {
    console.error('Error getting user plan name:', error);
    return 'Free';
  }
};

/**
 * Verifica si el usuario puede acceder a una página específica
 * @param {string} userId - ID del usuario
 * @param {string} pagePath - Ruta de la página (ej: '/admin/patients', '/admin/video-consultation')
 * @returns {Promise<boolean>} - true si puede acceder, false si no
 */
export const canAccessPage = async (userId, pagePath) => {
  // Mapear rutas a funcionalidades
  const pageToFeatureMap = {
    '/admin/profile': 'profile',
    '/admin/subscription': 'subscription',
    '/admin/referrals': 'referrals',
    '/admin/nuevo-paciente': 'nuevo-paciente',
    '/admin/patients': 'patients',
    '/admin/appointment': 'appointments',
    '/admin/reviews': 'reviews',
    '/admin/video-consultation': 'video-consultation',
    '/admin/schedule': 'appointments'
  };
  
  // Buscar la funcionalidad correspondiente
  let feature = pageToFeatureMap[pagePath];
  
  // Si no se encuentra exactamente, buscar por patrones
  if (!feature) {
    if (pagePath.includes('/patients')) {
      feature = 'patients';
    } else if (pagePath.includes('/appointment')) {
      feature = 'appointments';
    } else if (pagePath.includes('/video-consultation')) {
      feature = 'video-consultation';
    }
  }
  
  // Si no se puede mapear, permitir acceso (para páginas no restringidas)
  if (!feature) {
    return true;
  }
  
  return await hasFeatureAccess(userId, feature);
};
