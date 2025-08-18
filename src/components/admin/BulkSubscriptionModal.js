import { useState } from 'react';
import ManualSubscriptionActivator from './ManualSubscriptionActivator';

const BulkSubscriptionModal = ({ isOpen, onClose, doctors, onDoctorUpdated }) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDoctors = doctors.filter(doctor => 
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Activación Manual de Suscripciones
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  Selecciona un doctor para gestionar su suscripción
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-green-100 p-2 rounded-lg hover:bg-green-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Doctor List */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Seleccionar Doctor</h4>
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredDoctors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron doctores
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredDoctors.map(doctor => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedDoctor?.id === doctor.id
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {doctor.firstName} {doctor.lastName}
                            </p>
                            <p className="text-sm text-gray-600 break-all">
                              {doctor.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                doctor.verified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {doctor.verified ? 'Verificado' : 'Pendiente'}
                              </span>
                              {doctor.subscriptionStatus && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  doctor.subscriptionStatus === 'active' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {doctor.subscriptionPlan || 'Sin plan'}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedDoctor?.id === doctor.id && (
                            <div className="text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Management */}
            <div className="w-1/2 flex flex-col">
              {selectedDoctor ? (
                <div className="flex-1 overflow-hidden">
                  <ManualSubscriptionActivator
                    userId={selectedDoctor.id}
                    userEmail={selectedDoctor.email}
                    isEmbedded={true}
                    onActivated={() => {
                      onDoctorUpdated();
                      // Optionally close modal after activation
                      // onClose();
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Selecciona un doctor
                    </p>
                    <p className="text-gray-600">
                      Elige un doctor de la lista para gestionar su suscripción
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSubscriptionModal;
