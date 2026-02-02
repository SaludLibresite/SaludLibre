import { useState, useEffect } from "react";
import { updateDoctorProfileCompletion } from "../../lib/doctorsService";
import { getAllSpecialties } from "../../lib/specialtiesService";
import GoogleMapsLocationPicker from "./GoogleMapsLocationPicker";

export default function CompleteProfileModal({ doctor, onComplete, onError }) {
  const [formData, setFormData] = useState({
    nombre: doctor?.nombre || "",
    telefono: doctor?.telefono || "",
    especialidad: doctor?.especialidad || "",
    descripcion: doctor?.descripcion || "",
    horario: doctor?.horario || "",
    genero: doctor?.genero || "",
    ubicacion: doctor?.ubicacion || "",
    latitude: doctor?.latitude || null,
    longitude: doctor?.longitude || null,
    formattedAddress: doctor?.formattedAddress || "",
    consultaOnline: doctor?.consultaOnline || false,
  });

  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [errors, setErrors] = useState({});

  // Load specialties
  useEffect(() => {
    async function loadSpecialties() {
      try {
        const specialtiesData = await getAllSpecialties();
        setSpecialties(specialtiesData);
      } catch (error) {
        console.error("Error loading specialties:", error);
      } finally {
        setLoadingSpecialties(false);
      }
    }

    loadSpecialties();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      latitude: locationData.lat,
      longitude: locationData.lng,
      formattedAddress: locationData.address,
      // Keep the old ubicacion field for backward compatibility
      ubicacion: locationData.address,
    }));

    // Clear location error if it exists
    if (errors.ubicacion) {
      setErrors(prev => ({
        ...prev,
        ubicacion: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = "Formato de teléfono inválido";
    }

    if (!formData.especialidad.trim()) {
      newErrors.especialidad = "La especialidad es requerida";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (formData.descripcion.length < 50) {
      newErrors.descripcion = "La descripción debe tener al menos 50 caracteres";
    }

    if (!formData.horario.trim()) {
      newErrors.horario = "El horario de atención es requerido";
    }

    if (!formData.genero) {
      newErrors.genero = "El género es requerido";
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = "La ubicación es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await updateDoctorProfileCompletion(doctor.id, formData);
      onComplete(formData);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (onError) {
        onError("Error al actualizar el perfil. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8 relative max-h-[80dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Completa tu perfil profesional
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Para continuar, necesitamos completar tu información profesional
              </p>
            </div>
            <div className="flex items-center text-amber-600">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Perfil Requerido</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                    errors.nombre ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Dr. Juan Pérez"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                    errors.telefono ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+54 11 1234-5678"
                />
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                )}
              </div>

              <div>
                <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-2">
                  Género *
                </label>
                <select
                  id="genero"
                  name="genero"
                  value={formData.genero}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                    errors.genero ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona un género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.genero && (
                  <p className="mt-1 text-sm text-red-600">{errors.genero}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación del Consultorio */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ubicación del Consultorio
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona la ubicación de tu consultorio *
              </label>
              <GoogleMapsLocationPicker
                initialLocation={
                  formData.latitude && formData.longitude
                    ? {
                        lat: formData.latitude,
                        lng: formData.longitude,
                        address: formData.formattedAddress || formData.ubicacion,
                      }
                    : null
                }
                onLocationSelect={handleLocationSelect}
                className="mb-4"
              />
              {errors.ubicacion && (
                <p className="mt-1 text-sm text-red-600">{errors.ubicacion}</p>
              )}
            </div>
          </div>

          {/* Información Profesional */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información Profesional
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad *
                </label>
                {loadingSpecialties ? (
                  <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
                ) : (
                  <select
                    id="especialidad"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                      errors.especialidad ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona una especialidad</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.title || specialty.name}>
                        {specialty.title || specialty.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.especialidad && (
                  <p className="mt-1 text-sm text-red-600">{errors.especialidad}</p>
                )}
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Profesional * (mínimo 50 caracteres)
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={4}
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none ${
                    errors.descripcion ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe tu experiencia, educación, áreas de especialización y enfoque en el tratamiento de pacientes..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.descripcion && (
                    <p className="text-sm text-red-600">{errors.descripcion}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {formData.descripcion.length}/50 mínimo
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="horario" className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Atención *
                </label>
                <input
                  type="text"
                  id="horario"
                  name="horario"
                  value={formData.horario}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                    errors.horario ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Lunes a Viernes 9:00 - 18:00"
                />
                {errors.horario && (
                  <p className="mt-1 text-sm text-red-600">{errors.horario}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="consultaOnline"
                  name="consultaOnline"
                  checked={formData.consultaOnline}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="consultaOnline" className="ml-2 block text-sm text-gray-700">
                  Ofrezco consultas online
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando perfil...
                </div>
              ) : (
                "Completar Perfil"
              )}
            </button>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Información importante
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Esta información será visible en tu perfil público y ayudará a los pacientes a encontrarte y conocer tus servicios.
                    Una vez completado, podrás editar estos datos desde tu panel de administración.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
