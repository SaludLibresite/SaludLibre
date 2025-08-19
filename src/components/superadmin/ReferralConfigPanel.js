import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getReferralConfiguration,
  updateReferralConfiguration,
  toggleDoctorReferralStatus,
  getAllDoctorsWithSettings,
} from '../../lib/referralConfigService';
import {
  CogIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from '@heroicons/react/24/outline';

export default function ReferralConfigPanel() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  
  // Form state
  const [formData, setFormData] = useState({
    referralsPerReward: 3,
    rewardDays: 30,
    systemEnabled: true,
    allowNewReferrals: true,
    maxRewardsPerDoctor: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, doctorsData] = await Promise.all([
        getReferralConfiguration(),
        getAllDoctorsWithSettings(),
      ]);
      
      setConfig(configData);
      setDoctors(doctorsData);
      setFormData({
        referralsPerReward: configData.referralsPerReward || 3,
        rewardDays: configData.rewardDays || 30,
        systemEnabled: configData.systemEnabled !== false,
        allowNewReferrals: configData.allowNewReferrals !== false,
        maxRewardsPerDoctor: configData.maxRewardsPerDoctor || null,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      const updates = {
        ...formData,
        maxRewardsPerDoctor: formData.maxRewardsPerDoctor === '' ? null : parseInt(formData.maxRewardsPerDoctor),
      };
      
      await updateReferralConfiguration(updates, currentUser.uid);
      
      alert('✅ Configuración actualizada exitosamente');
      await loadData();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ Error al guardar configuración: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDoctor = async (doctorId, currentStatus) => {
    const reason = !currentStatus ? null : prompt('Motivo para deshabilitar referidos (opcional):');
    
    if (!currentStatus && reason === null) return; // User cancelled
    
    try {
      await toggleDoctorReferralStatus(doctorId, !currentStatus, currentUser.uid);
      
      if (!currentStatus && reason) {
        // Also update the reason
        // This would need an additional function to update the reason
      }
      
      alert(`✅ Estado de referidos ${!currentStatus ? 'habilitado' : 'deshabilitado'} para el doctor`);
      await loadData();
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      alert('❌ Error al cambiar estado: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CogIcon className="h-4 w-4 inline mr-2" />
            Configuración General
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'doctors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon className="h-4 w-4 inline mr-2" />
            Control por Doctor ({doctors.length})
          </button>
        </nav>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Configuración del Sistema de Referidos
            </h3>
            <p className="text-sm text-gray-600">
              Configura los parámetros globales del sistema de recompensas por referidos.
            </p>
          </div>

          <div className="space-y-6">
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Sistema de Referidos</h4>
                  <p className="text-sm text-gray-600">Habilitar/deshabilitar globalmente</p>
                </div>
                <button
                  onClick={() => setFormData({...formData, systemEnabled: !formData.systemEnabled})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.systemEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.systemEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Nuevos Referidos</h4>
                  <p className="text-sm text-gray-600">Permitir registros con códigos</p>
                </div>
                <button
                  onClick={() => setFormData({...formData, allowNewReferrals: !formData.allowNewReferrals})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.allowNewReferrals ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.allowNewReferrals ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Reward Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referidos por Recompensa
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.referralsPerReward}
                  onChange={(e) => setFormData({...formData, referralsPerReward: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad de referidos confirmados necesarios para ganar una recompensa
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Recompensa
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.rewardDays}
                  onChange={(e) => setFormData({...formData, rewardDays: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Días gratis de suscripción por cada recompensa
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite por Doctor
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxRewardsPerDoctor || ''}
                  onChange={(e) => setFormData({...formData, maxRewardsPerDoctor: e.target.value})}
                  placeholder="Sin límite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo de recompensas por doctor (vacío = ilimitado)
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Vista Previa de Configuración</h4>
              <p className="text-sm text-blue-800">
                <strong>Regla actual:</strong> Cada {formData.referralsPerReward} referidos confirmados = {formData.rewardDays} días gratis
                {formData.maxRewardsPerDoctor && (
                  <span> (máximo {formData.maxRewardsPerDoctor} recompensas por doctor)</span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Estado: {formData.systemEnabled ? '✅ Activo' : '❌ Deshabilitado'} | 
                Nuevos referidos: {formData.allowNewReferrals ? '✅ Permitidos' : '❌ Bloqueados'}
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CheckIcon className="h-4 w-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Control Individual de Doctores
            </h3>
            <p className="text-sm text-gray-600">
              Habilita o deshabilita la capacidad de referir por doctor individual.
            </p>
          </div>

          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">
                        Dr. {doctor.displayName}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doctor.canRefer 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.canRefer ? 'Puede referir' : 'Bloqueado'}
                      </span>
                      {doctor.referralStats?.approvedRewards > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                          {doctor.referralStats.approvedRewards} recompensas aprobadas
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600">
                      <p><strong>Email:</strong> {doctor.email}</p>
                      <p><strong>Referidos confirmados:</strong> {doctor.referralStats?.confirmedReferrals || 0}</p>
                      <p><strong>Código:</strong> {doctor.referralCode}</p>
                      {!doctor.canRefer && doctor.referralBlockReason && (
                        <p className="text-red-600 mt-1">
                          <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                          {doctor.referralBlockReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => handleToggleDoctor(doctor.id, doctor.referralSettings.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        doctor.referralSettings.enabled ? 'bg-green-600' : 'bg-red-400'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        doctor.referralSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {doctors.length === 0 && (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay doctores con códigos de referido
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Los doctores aparecerán aquí cuando generen sus códigos de referido.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
