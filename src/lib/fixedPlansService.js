import { 
  getAllSubscriptionPlans, 
  createSubscriptionPlan, 
  updateSubscriptionPlan 
} from './subscriptionsService';

// Definición de los 3 planes fijos
export const DEFAULT_PLANS = [
  {
    id: 'plan-free',
    name: 'Plan Free',
    description: 'Perfecto para comenzar con funcionalidades básicas',
    price: 0,
    duration: 30,
    isActive: true,
    isPopular: false,
    features: [
      'Administrar perfil profesional',
      'Configurar horarios de atención',
      'Gestión básica de suscripción',
      'Sistema de referidos'
    ]
  },
  {
    id: 'plan-medium',
    name: 'Plan Medium',
    description: 'Ideal para médicos con práctica establecida',
    price: 15000,
    duration: 30,
    isActive: true,
    isPopular: true,
    features: [
      'Todo lo del Plan Free',
      'Registrar nuevos pacientes',
      'Gestión completa de pacientes',
      'Administrar citas y agenda',
      'Sistema de reseñas y testimonios',
      'Estadísticas básicas'
    ]
  },
  {
    id: 'plan-plus',
    name: 'Plan Plus',
    description: 'La solución completa para profesionales',
    price: 25000,
    duration: 30,
    isActive: true,
    isPopular: false,
    features: [
      'Todo lo del Plan Medium',
      'Video consultas ilimitadas',
      'Salas virtuales personalizadas',
      'Estadísticas avanzadas',
      'Soporte prioritario'
    ]
  }
];

/**
 * Inicializa los planes de suscripción por defecto si no existen
 */
export const initializeDefaultPlans = async () => {
  try {
    console.log('Inicializando planes de suscripción...');
    
    const existingPlans = await getAllSubscriptionPlans();
    const existingPlanIds = existingPlans.map(plan => plan.id);
    
    for (const defaultPlan of DEFAULT_PLANS) {
      // Si el plan no existe, crearlo
      if (!existingPlanIds.includes(defaultPlan.id)) {
        console.log(`Creando plan: ${defaultPlan.name}`);
        await createSubscriptionPlan(defaultPlan);
      } else {
        console.log(`Plan ${defaultPlan.name} ya existe`);
      }
    }
    
    console.log('Planes de suscripción inicializados correctamente');
    return true;
  } catch (error) {
    console.error('Error inicializando planes:', error);
    throw error;
  }
};

/**
 * Actualiza un plan existente manteniendo la estructura fija
 * @param {string} planId - ID del plan a actualizar
 * @param {Object} updates - Actualizaciones permitidas (name, description, price, features)
 */
export const updateFixedPlan = async (planId, updates) => {
  try {
    // Verificar que es uno de los planes fijos
    const allowedPlanIds = DEFAULT_PLANS.map(p => p.id);
    if (!allowedPlanIds.includes(planId)) {
      throw new Error('Solo se pueden actualizar los planes fijos predefinidos');
    }
    
    // Solo permitir ciertas actualizaciones
    const allowedUpdates = {};
    
    if (updates.name !== undefined) {
      allowedUpdates.name = updates.name;
    }
    
    if (updates.description !== undefined) {
      allowedUpdates.description = updates.description;
    }
    
    if (updates.price !== undefined) {
      allowedUpdates.price = parseFloat(updates.price);
    }
    
    if (updates.features !== undefined && Array.isArray(updates.features)) {
      allowedUpdates.features = updates.features;
    }
    
    // Mantener siempre activo
    allowedUpdates.isActive = true;
    
    // Mantener isPopular solo para el plan medium
    if (planId === 'plan-medium') {
      allowedUpdates.isPopular = true;
    } else {
      allowedUpdates.isPopular = false;
    }
    
    console.log(`Actualizando plan ${planId}:`, allowedUpdates);
    
    await updateSubscriptionPlan(planId, allowedUpdates);
    
    return { success: true, planId, updates: allowedUpdates };
  } catch (error) {
    console.error('Error actualizando plan fijo:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración de un plan específico
 * @param {string} planId - ID del plan
 */
export const getPlanConfig = (planId) => {
  return DEFAULT_PLANS.find(plan => plan.id === planId);
};

/**
 * Verifica si un plan es uno de los planes fijos
 * @param {string} planId - ID del plan
 */
export const isFixedPlan = (planId) => {
  return DEFAULT_PLANS.some(plan => plan.id === planId);
};

/**
 * Obtiene todos los planes fijos con sus configuraciones actuales
 */
export const getFixedPlans = async () => {
  try {
    const allPlans = await getAllSubscriptionPlans();
    
    // Filtrar solo los planes fijos y ordenarlos
    const fixedPlans = allPlans
      .filter(plan => isFixedPlan(plan.id))
      .sort((a, b) => {
        const order = ['plan-free', 'plan-medium', 'plan-plus'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      });
    
    return fixedPlans;
  } catch (error) {
    console.error('Error obteniendo planes fijos:', error);
    throw error;
  }
};
