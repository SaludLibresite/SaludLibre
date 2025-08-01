import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { XMarkIcon, VideoCameraIcon, CalendarIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { getDoctorByUserId } from '../../lib/doctorsService';
import { getPatientsByDoctorId } from '../../lib/patientsService';

const NewVideoConsultationModal = ({ isOpen, onClose, onCreateRoom }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    selectedPatient: null,
    scheduledTime: '',
    appointmentId: '',
    isInstant: false,
    consultationType: 'general',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctorData, setDoctorData] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Cargar datos del doctor y pacientes
  useEffect(() => {
    if (isOpen && currentUser) {
      loadDoctorData();
    }
  }, [isOpen, currentUser]);

  const loadDoctorData = async () => {
    try {
      setLoadingPatients(true);
      
      // Obtener datos del doctor
      const doctor = await getDoctorByUserId(currentUser.uid);
      if (doctor) {
        setDoctorData(doctor);
        
        // Cargar pacientes del doctor
        const patientsList = await getPatientsByDoctorId(doctor.id);
        setPatients(patientsList);
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Crear opciones para el selector de pacientes
  const patientOptions = useMemo(() => {
    return patients.map((patient) => ({
      value: patient.id,
      label: `${patient.name || 'Sin nombre'} - ${patient.phone || 'Sin teléfono'}`,
      patient: {
        id: patient.id,
        name: patient.name,
        fullName: patient.name,
        phone: patient.phone,
        email: patient.email,
      }
    }));
  }, [patients]);

  // Estilos personalizados para react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      },
      minHeight: '48px',
      fontSize: '14px'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#3B82F6' 
        : state.isFocused 
        ? '#EFF6FF' 
        : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3B82F6' : '#EFF6FF'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9CA3AF'
    })
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.selectedPatient) {
      alert('Por favor seleccione un paciente');
      return;
    }

    setLoading(true);

    try {
      const roomData = {
        patientId: formData.selectedPatient.patient.id,
        patientName: formData.selectedPatient.patient.name,
        patientEmail: formData.selectedPatient.patient.email,
        appointmentId: formData.appointmentId || null,
        scheduledTime: formData.isInstant ? null : new Date(formData.scheduledTime),
        consultationType: formData.consultationType,
        notes: formData.notes
      };

      await onCreateRoom(roomData);
      
      // Reset form
      setFormData({
        selectedPatient: null,
        scheduledTime: '',
        appointmentId: '',
        isInstant: false,
        consultationType: 'general',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePatientSelect = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      selectedPatient: selectedOption
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <VideoCameraIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nueva Video Consulta
              </h3>
              <p className="text-sm text-gray-500">
                Crear una nueva sala de videoconsulta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de consulta */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isInstant"
                checked={formData.isInstant}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Consulta inmediata (iniciar ahora)
              </span>
            </label>
          </div>

          {/* Selector de Paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Seleccionar Paciente *
            </label>
            
            {loadingPatients ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500">Cargando pacientes...</span>
                </div>
              </div>
            ) : (
              <Select
                value={formData.selectedPatient}
                onChange={handlePatientSelect}
                options={patientOptions}
                styles={selectStyles}
                placeholder="Buscar paciente por nombre..."
                isSearchable
                isClearable
                noOptionsMessage={({ inputValue }) => 
                  inputValue ? `No se encontraron pacientes con "${inputValue}"` : 'No hay pacientes disponibles'
                }
                loadingMessage={() => 'Buscando...'}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            )}
            
            {formData.selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      {formData.selectedPatient.patient.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      {formData.selectedPatient.patient.phone} • {formData.selectedPatient.patient.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Consulta
            </label>
            <select
              name="consultationType"
              value={formData.consultationType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            >
              <option value="general">Consulta General</option>
              <option value="followup">Seguimiento</option>
              <option value="emergency">Emergencia</option>
              <option value="specialist">Consulta con Especialista</option>
            </select>
          </div>

          {/* ID de Cita (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID de Cita (opcional)
            </label>
            <input
              type="text"
              name="appointmentId"
              value={formData.appointmentId}
              onChange={handleInputChange}
              placeholder="ID de la cita médica asociada"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Fecha y Hora Programada */}
          {!formData.isInstant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Fecha y Hora Programada *
              </label>
              <input
                type="datetime-local"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                required={!formData.isInstant}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          )}

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Información adicional sobre la consulta..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <VideoCameraIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información importante:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Se generará un enlace único para la videoconsulta</li>
                  <li>• Solo el doctor y el paciente seleccionado podrán acceder</li>
                  <li>• {formData.isInstant ? 'La consulta iniciará inmediatamente' : 'La consulta se activará en la fecha programada'}</li>
                  <li>• El paciente recibirá una notificación con el enlace de acceso</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.selectedPatient}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <VideoCameraIcon className="h-4 w-4" />
                  <span>{formData.isInstant ? 'Crear e Iniciar' : 'Programar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVideoConsultationModal;
