import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasFeatureAccess, getUserPlanName } from '../lib/subscriptionPermissions';
import { LockClosedIcon, StarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

/**
 * Componente que restringe acceso a funcionalidades basado en la suscripción
 * @param {Object} props
 * @param {string} props.feature - Nombre de la funcionalidad requerida
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene acceso
 * @param {React.ReactNode} props.fallback - Contenido alternativo si no tiene acceso
 * @param {boolean} props.showUpgrade - Si mostrar mensaje de upgrade (default: true)
 */
export default function SubscriptionGuard({ 
  feature, 
  children, 
  fallback,
  showUpgrade = true 
}) {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState('Free');

  useEffect(() => {
    checkAccess();
  }, [currentUser, feature]);

  const checkAccess = async () => {
    if (!currentUser) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [access, planName] = await Promise.all([
        hasFeatureAccess(currentUser.uid, feature),
        getUserPlanName(currentUser.uid)
      ]);
      
      setHasAccess(access);
      setUserPlan(planName);
    } catch (error) {
      console.error('Error checking subscription access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Si hay un fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no debe mostrar upgrade, no mostrar nada
  if (!showUpgrade) {
    return null;
  }

  // Determinar qué plan necesita para esta funcionalidad
  const getRequiredPlan = () => {
    const mediumFeatures = ['nuevo-paciente', 'patients', 'appointments', 'reviews'];
    const plusFeatures = ['video-consultation'];
    
    if (plusFeatures.includes(feature)) {
      return 'Plus';
    } else if (mediumFeatures.includes(feature)) {
      return 'Medium';
    }
    return 'Medium';
  };

  const requiredPlan = getRequiredPlan();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <LockClosedIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Funcionalidad Premium
        </h3>
        
        <p className="text-gray-600 mb-4">
          Esta funcionalidad requiere el plan <span className="font-semibold text-blue-600">{requiredPlan}</span> o superior.
        </p>
        
        <div className="bg-white rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-gray-600">Tu plan actual</p>
              <p className="font-semibold text-gray-900">{userPlan}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Plan requerido</p>
              <p className="font-semibold text-blue-600 flex items-center">
                <StarIcon className="h-4 w-4 mr-1" />
                {requiredPlan}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/admin/subscription">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Actualizar Plan
            </button>
          </Link>
          
          <p className="text-xs text-gray-500">
            Accede a todas las funcionalidades actualizando tu suscripción
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para verificar si el usuario tiene acceso a una funcionalidad
 * @param {string} feature - Nombre de la funcionalidad
 * @returns {Object} - { hasAccess, loading, userPlan }
 */
export const useSubscriptionAccess = (feature) => {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState('Free');

  useEffect(() => {
    checkAccess();
  }, [currentUser, feature]);

  const checkAccess = async () => {
    if (!currentUser) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [access, planName] = await Promise.all([
        hasFeatureAccess(currentUser.uid, feature),
        getUserPlanName(currentUser.uid)
      ]);
      
      setHasAccess(access);
      setUserPlan(planName);
    } catch (error) {
      console.error('Error checking subscription access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasAccess, loading, userPlan, recheckAccess: checkAccess };
};
