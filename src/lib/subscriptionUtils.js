/**
 * Utilidades para el manejo de suscripciones
 */

/**
 * Formats a doctor's name with proper title based on gender
 * @param {string} nombre - Doctor's name
 * @param {string} genero - Doctor's gender
 * @returns {string} - Formatted name with proper title
 */
export const cleanDoctorName = (nombre, genero) => {
  if (!nombre) return '';

  // Import the formatDoctorName function dynamically to avoid circular dependencies
  const { formatDoctorName } = require('./dataUtils');
  return formatDoctorName(nombre, genero);
};

/**
 * Mapea el plan de suscripción actual a un rango para compatibilidad
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @returns {string} - Rango mapeado (VIP, Intermedio, Normal)
 */
export const getDoctorRank = (doctor) => {
  // Solo verificar si tiene suscripción activa basándose en los campos especificados
  if (!hasActiveSubscription(doctor)) {
    return 'Normal';
  }

  // Mapear solo por subscriptionPlan (ignorar subscriptionPlanId)
  switch (doctor.subscriptionPlan) {
    case 'Plan Plus':
      return 'VIP';
    case 'Plan Medium':
      return 'Intermedio';
    case 'Plan Free':
    default:
      return 'Normal';
  }
};

/**
 * Verifica si un doctor tiene una suscripción activa
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @returns {boolean} - true si tiene suscripción activa
 */
export const hasActiveSubscription = (doctor) => {
  // Solo verificar subscriptionStatus y subscriptionExpiresAt
  if (!doctor.subscriptionStatus || doctor.subscriptionStatus !== 'active') {
    return false;
  }

  if (doctor.subscriptionExpiresAt) {
    let expirationDate;
    if (typeof doctor.subscriptionExpiresAt.toDate === 'function') {
      // Firestore Timestamp object
      expirationDate = doctor.subscriptionExpiresAt.toDate();
    } else if (typeof doctor.subscriptionExpiresAt === 'object' && 'seconds' in doctor.subscriptionExpiresAt) {
      // Timestamp serialized as {seconds, nanoseconds}
      expirationDate = new Date(doctor.subscriptionExpiresAt.seconds * 1000);
    } else if (typeof doctor.subscriptionExpiresAt === 'object' && '_seconds' in doctor.subscriptionExpiresAt) {
      // Timestamp with internal format {_seconds, _nanoseconds}
      expirationDate = new Date(doctor.subscriptionExpiresAt._seconds * 1000);
    } else {
      // ISO string or other parseable date format
      expirationDate = new Date(doctor.subscriptionExpiresAt);
    }
    
    return expirationDate > new Date();
  }

  return false;
};

/**
 * Obtiene el nombre del plan de manera legible
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @returns {string} - Nombre del plan
 */
export const getDoctorPlanName = (doctor) => {
  if (hasActiveSubscription(doctor)) {
    return doctor.subscriptionPlan || 'Plan Free';
  }
  return 'Plan Free';
};

/**
 * Verifica si un doctor tiene acceso a una funcionalidad específica
 * @param {Object} doctor - Objeto doctor con información de suscripción
 * @param {string} feature - Funcionalidad a verificar
 * @returns {boolean} - true si tiene acceso
 */
export const hasFeatureAccess = (doctor, feature) => {
  const rank = getDoctorRank(doctor);
  
  const featuresByRank = {
    'Normal': ['profile', 'schedule', 'basic'], // Plan Free
    'Intermedio': ['profile', 'schedule', 'basic', 'patients', 'appointments', 'reviews'], // Plan Medium
    'VIP': ['profile', 'schedule', 'basic', 'patients', 'appointments', 'reviews', 'video', 'advanced', 'priority'] // Plan Plus
  };

  return featuresByRank[rank]?.includes(feature) || false;
};
