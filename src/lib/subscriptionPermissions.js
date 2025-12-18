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
    console.log(`🔍 hasFeatureAccess called for userId: ${userId}, feature: ${feature}`);
    
    // Obtener la suscripción actual del usuario desde la colección subscriptions
    const subscription = await getUserSubscription(userId);
    console.log(`📋 User subscription from subscriptions collection:`, subscription);
    
    // Verificar si la suscripción está activa
    const isActive = subscription ? isSubscriptionActive(subscription) : false;
    console.log(`🔄 Subscription active check:`, isActive);
    
    // Si no hay suscripción activa en la colección, verificar los datos del doctor directamente
    if (!subscription || !isActive) {
      console.log(`❌ No active subscription found in collection, checking doctor data as fallback...`);
      
      try {
        // Importar getDoctorByUserId dinámicamente para evitar dependencias circulares
        const { getDoctorByUserId } = await import('./doctorsService');
        const doctor = await getDoctorByUserId(userId);
        
        if (doctor) {
          // Asegurar que subscriptionExpiresAt esté en formato Date
          if (doctor.subscriptionExpiresAt) {
            if (doctor.subscriptionExpiresAt.toDate) {
              doctor.subscriptionExpiresAt = doctor.subscriptionExpiresAt.toDate();
            } else if (typeof doctor.subscriptionExpiresAt === 'string') {
              doctor.subscriptionExpiresAt = new Date(doctor.subscriptionExpiresAt);
            }
          }
          
          console.log(`👨‍⚕️ Doctor data found:`, {
            subscriptionStatus: doctor.subscriptionStatus,
            subscriptionPlan: doctor.subscriptionPlan,
            subscriptionExpiresAt: doctor.subscriptionExpiresAt,
            subscriptionExpiresAtType: typeof doctor.subscriptionExpiresAt,
            subscriptionExpiresAtValue: doctor.subscriptionExpiresAt?.toString(),
            now: new Date().toString(),
            isExpired: doctor.subscriptionExpiresAt ? doctor.subscriptionExpiresAt <= new Date() : 'N/A'
          });
          
          // Usar la función específica para verificar acceso desde datos del doctor
          const hasAccess = hasFeatureAccessFromDoctor(doctor, feature);
          console.log(`✅ Final access result from doctor data:`, hasAccess);
          return hasAccess;
        } else {
          console.log(`❌ No doctor data found, using free plan`);
          return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
        }
      } catch (doctorError) {
        console.error('Error getting doctor data:', doctorError);
        return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
      }
    }
    
    // Si hay suscripción en la colección, verificar si está activa
    const isActive = isSubscriptionActive(subscription);
    console.log(`🔄 Subscription active check:`, isActive);
    
    // Si la suscripción en la colección NO está activa, verificar datos del doctor como fallback
    if (!isActive) {
      console.log(`⚠️ Subscription in collection not active (status: ${subscription.status}), checking doctor data as fallback...`);
      
      try {
        const { getDoctorByUserId } = await import('./doctorsService');
        const doctor = await getDoctorByUserId(userId);
        
        if (doctor) {
          // Asegurar que subscriptionExpiresAt esté en formato Date
          if (doctor.subscriptionExpiresAt) {
            if (doctor.subscriptionExpiresAt.toDate) {
              doctor.subscriptionExpiresAt = doctor.subscriptionExpiresAt.toDate();
            } else if (typeof doctor.subscriptionExpiresAt === 'string') {
              doctor.subscriptionExpiresAt = new Date(doctor.subscriptionExpiresAt);
            }
          }
          
          console.log(`👨‍⚕️ Doctor data found (fallback):`, {
            subscriptionStatus: doctor.subscriptionStatus,
            subscriptionPlan: doctor.subscriptionPlan,
            subscriptionExpiresAt: doctor.subscriptionExpiresAt,
            isExpired: doctor.subscriptionExpiresAt ? doctor.subscriptionExpiresAt <= new Date() : 'N/A'
          });
          
          // Usar la función específica para verificar acceso desde datos del doctor
          const hasAccess = hasFeatureAccessFromDoctor(doctor, feature);
          console.log(`✅ Final access result from doctor data (fallback):`, hasAccess);
          return hasAccess;
        } else {
          console.log(`❌ No doctor data found, using free plan`);
          return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
        }
      } catch (doctorError) {
        console.error('Error getting doctor data:', doctorError);
        return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
      }
    }
    
    // Determinar el plan del usuario
    const planKey = determinePlanKey(subscription.planId, subscription.planName, subscription.price);
    console.log(`📊 Determined plan key:`, planKey, `from planId: ${subscription.planId}, planName: ${subscription.planName}, price: ${subscription.price}`);
    
    // Verificar si el plan incluye la funcionalidad
    const permissions = SUBSCRIPTION_PERMISSIONS[planKey] || SUBSCRIPTION_PERMISSIONS.free;
    const hasAccess = permissions.includes(feature);
    console.log(`✅ Final access result:`, hasAccess, `(plan: ${planKey}, permissions:`, permissions, `)`);
    
    return hasAccess;
    
  } catch (error) {
    console.error('Error checking feature access:', error);
    // En caso de error, dar acceso solo a funcionalidades del plan free
    return SUBSCRIPTION_PERMISSIONS.free.includes(feature);
  }
};

/**
 * Verifica si el doctor tiene acceso a una funcionalidad específica basándose en sus datos directos
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @param {string} feature - Nombre de la funcionalidad a verificar
 * @returns {boolean} - true si tiene acceso, false si no
 */
export const hasFeatureAccessFromDoctor = (doctor, feature) => {
  try {
    console.log(`🔍 hasFeatureAccessFromDoctor called for feature: ${feature}`);
    console.log(`👨‍⚕️ Doctor subscription data:`, {
      subscriptionStatus: doctor.subscriptionStatus,
      subscriptionPlan: doctor.subscriptionPlan,
      subscriptionExpiresAt: doctor.subscriptionExpiresAt
    });
    
    // Determinar el plan basándose en los datos del doctor
    const planKey = determinePlanKeyFromDoctor(doctor);
    console.log(`📊 Determined plan key from doctor: ${planKey}`);
    
    // Verificar si el plan incluye la funcionalidad
    const permissions = SUBSCRIPTION_PERMISSIONS[planKey] || SUBSCRIPTION_PERMISSIONS.free;
    const hasAccess = permissions.includes(feature);
    console.log(`✅ Final access result from doctor:`, hasAccess, `(plan: ${planKey}, permissions:`, permissions, `)`);
    
    return hasAccess;
    
  } catch (error) {
    console.error('Error checking feature access from doctor:', error);
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
 * Determina la clave del plan basada en los campos de suscripción del doctor
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @returns {string} - Clave del plan (free, medium, plus)
 */
const determinePlanKeyFromDoctor = (doctor) => {
  console.log(`🔍 determinePlanKeyFromDoctor called with doctor:`, {
    subscriptionStatus: doctor.subscriptionStatus,
    subscriptionPlan: doctor.subscriptionPlan,
    subscriptionExpiresAt: doctor.subscriptionExpiresAt
  });
  
  // Verificar si tiene suscripción activa basándose solo en los campos especificados
  if (!doctor.subscriptionStatus || doctor.subscriptionStatus !== 'active') {
    console.log(`❌ Subscription status not active: ${doctor.subscriptionStatus}`);
    return 'free';
  }

  // Verificar si la suscripción no ha expirado
  if (doctor.subscriptionExpiresAt) {
    const expirationDate = doctor.subscriptionExpiresAt.toDate 
      ? doctor.subscriptionExpiresAt.toDate() 
      : new Date(doctor.subscriptionExpiresAt);
    
    const isExpired = expirationDate <= new Date();
    console.log(`📅 Expiration check:`, {
      expirationDate: expirationDate.toISOString(),
      now: new Date().toISOString(),
      isExpired: isExpired
    });
    
    if (isExpired) {
      console.log(`❌ Subscription expired`);
      return 'free';
    }
  }

  // Mapear basándose solo en subscriptionPlan (ignorar subscriptionPlanId)
  const planName = doctor.subscriptionPlan?.toLowerCase() || '';
  console.log(`📝 Plan name (lowercase): '${planName}'`);
  
  if (planName.includes('plus') || planName.includes('premium')) {
    console.log(`✅ Plan indicates PLUS`);
    return 'plus';
  }
  
  if (planName.includes('medium') || planName.includes('medio')) {
    console.log(`✅ Plan indicates MEDIUM`);
    return 'medium';
  }
  
  // Por defecto, plan free
  console.log(`❓ No plan match, defaulting to FREE`);
  return 'free';
};

/**
 * Determina la clave del plan basada en el precio y nombre del plan (para suscripciones legacy)
 * @param {string} planId - ID del plan
 * @param {string} planName - Nombre del plan
 * @param {number} price - Precio del plan
 * @returns {string} - Clave del plan (free, medium, plus)
 */
const determinePlanKey = (planId, planName, price = 0) => {
  console.log(`🔍 determinePlanKey called with:`, { planId, planName, price });
  
  // Si el precio es 0, es plan free
  if (price === 0) {
    console.log(`💰 Price is 0, returning 'free'`);
    return 'free';
  }
  
  // Primero intentar con el ID del plan si existe en el mapeo
  if (PLAN_MAPPING[planId]) {
    console.log(`🔑 Found planId in mapping: ${planId} -> ${PLAN_MAPPING[planId]}`);
    return PLAN_MAPPING[planId];
  }
  
  // Luego intentar con el nombre del plan (convertir a lowercase)
  const lowerPlanName = planName?.toLowerCase() || '';
  console.log(`📝 Checking plan name (lowercase): '${lowerPlanName}'`);
  
  if (lowerPlanName.includes('free') || lowerPlanName.includes('gratis') || price === 0) {
    console.log(`✅ Plan name indicates FREE plan`);
    return 'free';
  }
  
  if (lowerPlanName.includes('medium') || lowerPlanName.includes('medio')) {
    console.log(`✅ Plan name indicates MEDIUM plan`);
    return 'medium';
  }
  
  if (lowerPlanName.includes('plus') || lowerPlanName.includes('premium')) {
    console.log(`✅ Plan name indicates PLUS plan`);
    return 'plus';
  }
  
  console.log(`❓ No plan match found, defaulting to 'free'`);
  return 'free';
};

/**
 * Obtiene el nombre legible del plan del usuario basándose en los datos del doctor
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @returns {string} - Nombre del plan
 */
export const getUserPlanNameFromDoctor = (doctor) => {
  try {
    const planKey = determinePlanKeyFromDoctor(doctor);
    
    switch (planKey) {
      case 'medium':
        return 'Medium';
      case 'plus':
        return 'Plus';
      default:
        return 'Free';
    }
    
  } catch (error) {
    console.error('Error getting user plan name from doctor:', error);
    return 'Free';
  }
};

/**
 * Verifica si el doctor tiene una suscripción activa basándose en sus datos directos
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @returns {boolean} - true si tiene suscripción activa
 */
export const isSubscriptionActiveFromDoctor = (doctor) => {
  try {
    // Verificar si tiene suscripción activa basándose solo en los campos especificados
    if (!doctor.subscriptionStatus || doctor.subscriptionStatus !== 'active') {
      return false;
    }

    // Verificar si la suscripción no ha expirado
    if (doctor.subscriptionExpiresAt) {
      const expirationDate = doctor.subscriptionExpiresAt.toDate 
        ? doctor.subscriptionExpiresAt.toDate() 
        : new Date(doctor.subscriptionExpiresAt);
      
      return expirationDate > new Date();
    }

    return true;
    
  } catch (error) {
    console.error('Error checking subscription status from doctor:', error);
    return false;
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
