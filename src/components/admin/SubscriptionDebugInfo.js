import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserStore } from '../../store/userStore';
import { getDoctorByUserId } from '../../lib/doctorsService';

export default function SubscriptionDebugInfo() {
  const { currentUser } = useAuth();
  const { userProfile } = useUserStore();
  const [freshData, setFreshData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFreshData() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const doctor = await getDoctorByUserId(currentUser.uid);
        setFreshData(doctor);
      } catch (error) {
        console.error('Error loading fresh data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFreshData();
  }, [currentUser]);

  if (!currentUser) return null;

  const now = new Date();
  const storeExpiration = userProfile?.subscriptionExpiresAt 
    ? (typeof userProfile.subscriptionExpiresAt === 'string' 
        ? new Date(userProfile.subscriptionExpiresAt) 
        : userProfile.subscriptionExpiresAt)
    : null;
    
  const freshExpiration = freshData?.subscriptionExpiresAt 
    ? (typeof freshData.subscriptionExpiresAt === 'string' 
        ? new Date(freshData.subscriptionExpiresAt) 
        : freshData.subscriptionExpiresAt)
    : null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-2xl max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-blue-900">🔍 Debug de Suscripción</h3>
        <span className="text-xs text-gray-500">UID: {currentUser.uid.slice(0, 8)}...</span>
      </div>
      
      <div className="space-y-3 text-sm">
        {/* Datos del Store */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
          <div className="font-semibold text-yellow-900 mb-1">📦 Datos del Store (cached):</div>
          <div className="space-y-1 text-xs">
            <div>Status: <span className="font-mono">{userProfile?.subscriptionStatus || 'N/A'}</span></div>
            <div>Plan: <span className="font-mono">{userProfile?.subscriptionPlan || 'N/A'}</span></div>
            <div>Expira: <span className="font-mono">{storeExpiration?.toLocaleString('es-AR') || 'N/A'}</span></div>
            <div>Tipo: <span className="font-mono text-xs">{typeof userProfile?.subscriptionExpiresAt}</span></div>
            {storeExpiration && (
              <div>¿Expirado?: <span className={`font-bold ${storeExpiration <= now ? 'text-red-600' : 'text-green-600'}`}>
                {storeExpiration <= now ? 'SÍ ❌' : 'NO ✅'}
              </span></div>
            )}
          </div>
        </div>

        {/* Datos Frescos de Firebase */}
        <div className="bg-green-50 border border-green-200 rounded p-2">
          <div className="font-semibold text-green-900 mb-1">🔥 Datos de Firebase (fresh):</div>
          {loading ? (
            <div className="text-xs text-gray-500">Cargando...</div>
          ) : freshData ? (
            <div className="space-y-1 text-xs">
              <div>Status: <span className="font-mono">{freshData.subscriptionStatus || 'N/A'}</span></div>
              <div>Plan: <span className="font-mono">{freshData.subscriptionPlan || 'N/A'}</span></div>
              <div>Expira: <span className="font-mono">{freshExpiration?.toLocaleString('es-AR') || 'N/A'}</span></div>
              <div>Tipo: <span className="font-mono text-xs">{typeof freshData.subscriptionExpiresAt}</span></div>
              {freshExpiration && (
                <div>¿Expirado?: <span className={`font-bold ${freshExpiration <= now ? 'text-red-600' : 'text-green-600'}`}>
                  {freshExpiration <= now ? 'SÍ ❌' : 'NO ✅'}
                </span></div>
              )}
            </div>
          ) : (
            <div className="text-xs text-red-600">No se encontraron datos</div>
          )}
        </div>

        {/* Comparación */}
        {storeExpiration && freshExpiration && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="font-semibold text-blue-900 mb-1">⚖️ Comparación:</div>
            <div className="text-xs space-y-1">
              <div>¿Datos iguales?: <span className={`font-bold ${
                userProfile?.subscriptionStatus === freshData?.subscriptionStatus &&
                userProfile?.subscriptionPlan === freshData?.subscriptionPlan
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {userProfile?.subscriptionStatus === freshData?.subscriptionStatus &&
                 userProfile?.subscriptionPlan === freshData?.subscriptionPlan ? 'SÍ ✅' : 'NO ❌'}
              </span></div>
              
              {(userProfile?.subscriptionStatus !== freshData?.subscriptionStatus ||
                userProfile?.subscriptionPlan !== freshData?.subscriptionPlan) && (
                <div className="text-red-600 font-semibold mt-2">
                  ⚠️ Los datos del store están desactualizados!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fecha actual */}
        <div className="text-xs text-gray-500 border-t pt-2">
          🕐 Ahora: {now.toLocaleString('es-AR')}
        </div>
      </div>
    </div>
  );
}
