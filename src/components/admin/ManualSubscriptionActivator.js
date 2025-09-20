import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getUserSubscription } from '../../lib/subscriptionsService';
import { getFixedPlans } from '../../lib/fixedPlansService';
import { useAuth } from '../../context/AuthContext';

const ManualSubscriptionActivator = ({ userId, userEmail, onActivated, isEmbedded = false }) => {
  const { refreshUserData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [formData, setFormData] = useState({
    planId: '',
    planName: '',
    price: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
  });

  // Cargar datos cuando se abre el panel o cuando se cambia el userId (en modo embedded)
  useEffect(() => {
    if ((isOpen && userId) || (isEmbedded && userId)) {
      loadUserSubscriptionData();
    }
  }, [isOpen, userId, isEmbedded]);

  const loadUserSubscriptionData = async () => {
    setLoadingData(true);
    try {
      const [subscription, plans] = await Promise.all([
        getUserSubscription(userId),
        getFixedPlans()
      ]);
      
      setCurrentSubscription(subscription);
      setAvailablePlans(plans);
      
      // Set default form values with first available plan
      if (plans.length > 0) {
        const defaultPlan = plans.find(p => p.name === 'Medium') || plans[0];
        setFormData(prev => ({
          ...prev,
          planId: defaultPlan.id,
          planName: defaultPlan.name,
          price: defaultPlan.price,
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setLoadingData(false);
    }
  };

  const handlePlanChange = (planId) => {
    const plan = availablePlans.find(p => p.id === planId);
    if (plan) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Always 30 days
      
      setFormData({
        ...formData,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        endDate: endDate.toISOString().split('T')[0],
      });
    }
  };

  const handleDateChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/superadmin/activate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          activatedBy: 'juan@jhernandez.mx', // Email del superadmin
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Suscripción activada exitosamente');
        
        // Refresh user data to reflect subscription changes
        if (refreshUserData) {
          await refreshUserData();
        }
        
        if (!isEmbedded) {
          setIsOpen(false);
        }
        if (onActivated) onActivated();
      } else {
        toast.error(result.message || 'Error al activar suscripción');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al activar suscripción');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES');
    }
    
    return new Date(timestamp).toLocaleDateString('es-ES');
  };

  // Render content for embedded mode
  const renderSubscriptionContent = () => (
    <div className="h-full overflow-y-auto p-6">
      {loadingData ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Información del Doctor</h4>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium text-gray-900 break-all">{userEmail}</p>
              </div>
              <div>
                <span className="text-gray-600">ID de Usuario:</span>
                <p className="font-mono text-xs text-gray-700 break-all">{userId}</p>
              </div>
            </div>
          </div>

          {/* Current Subscription Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Estado Actual de Suscripción</h4>
            {currentSubscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900">{currentSubscription.planName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentSubscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : currentSubscription.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentSubscription.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Precio:</span>
                  <span className="font-medium text-gray-900">${currentSubscription.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Creada:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(currentSubscription.createdAt)}
                  </span>
                </div>
                {currentSubscription.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Vence:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(currentSubscription.expiresAt)}
                    </span>
                  </div>
                )}
                {currentSubscription.activationType && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tipo de activación:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {currentSubscription.activationType}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Sin suscripción activa</p>
                <p className="text-sm text-gray-400 mt-1">Este doctor no tiene una suscripción registrada</p>
              </div>
            )}
          </div>

          {/* New Subscription Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Activar Nueva Suscripción</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de Suscripción
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar plan...</option>
                  {availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price} (30 días)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio (ARS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Plan
                  </label>
                  <input
                    type="text"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Advertencia:</strong> Esta acción activará inmediatamente la suscripción 
                  y actualizará el perfil del doctor. Se reemplazará cualquier suscripción existente.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !formData.planId}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? 'Activando...' : 'Activar Suscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // If embedded, return content directly without button/modal
  if (isEmbedded) {
    return renderSubscriptionContent();
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        title="Activar suscripción manualmente"
      >
         Activar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" onClick={() => setIsOpen(false)} />
          
          {/* Sidepanel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform ease-in-out duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Gestión Manual de Suscripciones
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Activar o modificar suscripción del doctor
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-blue-100 p-2 rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando datos...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Información del Doctor</h4>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900 break-all">{userEmail}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">ID de Usuario:</span>
                          <p className="font-mono text-xs text-gray-700 break-all">{userId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Current Subscription Status */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Estado Actual de Suscripción</h4>
                      {currentSubscription ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Plan:</span>
                            <span className="font-medium text-gray-900">{currentSubscription.planName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Estado:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              currentSubscription.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : currentSubscription.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {currentSubscription.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Precio:</span>
                            <span className="font-medium text-gray-900">${currentSubscription.price}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Creada:</span>
                            <span className="font-medium text-gray-900">
                              {formatDate(currentSubscription.createdAt)}
                            </span>
                          </div>
                          {currentSubscription.expiresAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Vence:</span>
                              <span className="font-medium text-gray-900">
                                {formatDate(currentSubscription.expiresAt)}
                              </span>
                            </div>
                          )}
                          {currentSubscription.activationType && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Tipo de activación:</span>
                              <span className="font-medium text-gray-900 capitalize">
                                {currentSubscription.activationType}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">Sin suscripción activa</p>
                          <p className="text-sm text-gray-400 mt-1">Este doctor no tiene una suscripción registrada</p>
                        </div>
                      )}
                    </div>

                    {/* New Subscription Form */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Activar Nueva Suscripción</h4>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan de Suscripción
                          </label>
                          <select
                            value={formData.planId}
                            onChange={(e) => handlePlanChange(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Seleccionar plan...</option>
                            {availablePlans.map(plan => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} - ${plan.price} (30 días)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Precio (ARS)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre del Plan
                            </label>
                            <input
                              type="text"
                              value={formData.planName}
                              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de Inicio
                            </label>
                            <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => handleDateChange('startDate', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de Vencimiento
                            </label>
                            <input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => handleDateChange('endDate', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Advertencia:</strong> Esta acción activará inmediatamente la suscripción 
                            y actualizará el perfil del doctor. Se reemplazará cualquier suscripción existente.
                          </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading || !formData.planId}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {isLoading ? 'Activando...' : 'Activar Suscripción'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManualSubscriptionActivator;
