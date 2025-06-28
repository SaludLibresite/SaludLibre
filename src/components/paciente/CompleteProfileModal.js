import { useState } from "react";
import { updateDoc, doc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function CompleteProfileModal({ 
  isOpen, 
  patientData, 
  onClose, 
  onComplete 
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    phone: patientData.phone || "",
    dateOfBirth: patientData.dateOfBirth || "",
    gender: patientData.gender || "",
    address: patientData.address || "",
    emergencyContact: patientData.emergencyContact || "",
    emergencyPhone: patientData.emergencyPhone || "",
    insuranceProvider: patientData.insuranceProvider || "",
    insuranceNumber: patientData.insuranceNumber || "",
    allergies: patientData.allergies || "",
    currentMedications: patientData.currentMedications || "",
    medicalHistory: patientData.medicalHistory || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "La fecha de nacimiento es requerida";
    }

    if (!formData.gender) {
      newErrors.gender = "El género es requerido";
    }

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }

    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = "El contacto de emergencia es requerido";
    }

    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = "El teléfono de emergencia es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Find the patient document
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", patientData.userId)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (patientsSnapshot.empty) {
        setMessage("No se encontró el perfil del paciente");
        return;
      }

      const patientDoc = patientsSnapshot.docs[0];
      
      // Update patient data
      const updatedData = {
        ...formData,
        dataComplete: true,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "patients", patientDoc.id), updatedData);

      setMessage("¡Perfil completado exitosamente!");

      setTimeout(() => {
        onComplete(updatedData);
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mr-3">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Completar Perfil
                </h3>
                <p className="text-sm text-gray-600">
                  Por favor completa tu información para continuar
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.includes("Error")
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                <div className="flex items-center">
                  {message.includes("Error") ? (
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                  )}
                  <span>{message}</span>
                </div>
              </div>
            )}

            {/* Welcome message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <span className="text-blue-800 font-medium">
                    ¡Bienvenido {patientData.name}!
                  </span>
                  <p className="text-sm text-blue-700 mt-1">
                    Para brindarte la mejor atención médica, necesitamos completar tu perfil con información básica.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Información Personal
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="+54 11 1234-5678"
                        disabled={loading}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento *
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={loading}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                        errors.gender ? "border-red-500" : "border-gray-300"
                      }`}
                      disabled={loading}
                    >
                      <option value="">Seleccionar género</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.address ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Av. Corrientes 1234, CABA"
                        disabled={loading}
                      />
                    </div>
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Contacto de Emergencia
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Contacto *
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                        errors.emergencyContact ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="María Pérez"
                      disabled={loading}
                    />
                    {errors.emergencyContact && (
                      <p className="text-red-500 text-sm mt-1">{errors.emergencyContact}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Emergencia *
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                        errors.emergencyPhone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="+54 11 9876-5432"
                      disabled={loading}
                    />
                    {errors.emergencyPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Medical Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Información Médica (Opcional)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Obra Social/Prepaga
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="OSDE, Swiss Medical, etc."
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Afiliado
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceNumber}
                      onChange={(e) => handleInputChange("insuranceNumber", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="123456789"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alergias
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange("allergies", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="Penicilina, polen, etc."
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicaciones Actuales
                    </label>
                    <input
                      type="text"
                      value={formData.currentMedications}
                      onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="Losartán 50mg, Aspirina, etc."
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Historial Médico Relevante
                  </label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    placeholder="Describa cualquier condición médica relevante..."
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  "Completar Perfil"
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Esta información es necesaria para brindarte una atención médica personalizada y segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 