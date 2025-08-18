import { useState } from "react";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { searchAllPatients, assignPatientToDoctor } from "../../lib/patientsService";

export default function PatientSearchModal({
  isOpen,
  onClose,
  doctorData,
  onPatientAssigned,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setMessage("");
    setHasSearched(true);

    try {
      const results = await searchAllPatients(searchTerm);
      setSearchResults(results);
      
      if (results.length === 0) {
        setMessage("No se encontraron pacientes con ese criterio de búsqueda");
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      setMessage("Error al buscar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPatient = async (patient) => {
    if (!doctorData) {
      setMessage("Error: No se encontraron datos del doctor");
      return;
    }

    setAssigning(true);
    setMessage("");

    try {
      const result = await assignPatientToDoctor(
        patient.id,
        doctorData.id,
        doctorData
      );

      if (result.success) {
        setMessage("✅ Paciente asignado exitosamente");
        onPatientAssigned && onPatientAssigned(result.patient);
        
        // Close modal after success
        setTimeout(() => {
          onClose();
          setSearchTerm("");
          setSearchResults([]);
          setMessage("");
          setHasSearched(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error assigning patient:", error);
      setMessage(`Error: ${error.message || "No se pudo asignar el paciente"}`);
    } finally {
      setAssigning(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("es-ES");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isPatientAlreadyAssigned = (patient) => {
    if (!doctorData) return false;
    
    // Check legacy doctorId field
    if (patient.doctorId === doctorData.id) return true;
    
    // Check doctors array
    if (patient.doctors && Array.isArray(patient.doctors)) {
      return patient.doctors.some(doc => doc.doctorId === doctorData.id);
    }
    
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-lg transition-opacity -z-1" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Buscar Paciente Existente
                  </h3>
                  <p className="text-sm text-gray-600">
                    Busque y asigne un paciente ya registrado en la plataforma
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-3">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono o ID de paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="px-6 py-3">
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes("Error")
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : message.includes("✅")
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                }`}
              >
                {message}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Buscando pacientes...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((patient) => {
                  const isAssigned = isPatientAlreadyAssigned(patient);
                  
                  return (
                    <div
                      key={patient.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isAssigned
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {patient.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "?"}
                            </span>
                          </div>

                          {/* Patient Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">
                                {patient.name}
                              </h4>
                              {patient.patientId && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  {patient.patientId}
                                </span>
                              )}
                              {isAssigned && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  Ya asignado
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-1 space-y-1 text-sm text-gray-600">
                              {patient.email && (
                                <div className="flex items-center space-x-1">
                                  <EnvelopeIcon className="h-3 w-3" />
                                  <span>{patient.email}</span>
                                </div>
                              )}
                              
                              {patient.phone && (
                                <div className="flex items-center space-x-1">
                                  <PhoneIcon className="h-3 w-3" />
                                  <span>{patient.phone}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                {patient.dateOfBirth && (
                                  <span>
                                    {calculateAge(patient.dateOfBirth)} años
                                  </span>
                                )}
                                
                                {patient.gender && (
                                  <span>{patient.gender}</span>
                                )}
                                
                                {patient.createdAt && (
                                  <div className="flex items-center space-x-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>
                                      Registrado: {formatDate(patient.createdAt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Current Doctors */}
                            {patient.doctors && patient.doctors.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">
                                  Doctores con acceso:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {patient.doctors.map((doc, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                                    >
                                      {doc.doctorName}
                                      {doc.isPrimary && " (Principal)"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {isAssigned ? (
                            <div className="text-green-600 text-sm font-medium">
                              ✓ Asignado
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAssignPatient(patient)}
                              disabled={assigning}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <UserPlusIcon className="h-4 w-4" />
                              <span>
                                {assigning ? "Asignando..." : "Asignar"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : hasSearched && !loading ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron pacientes
                </h3>
                <p className="text-sm text-gray-500">
                  No hay pacientes registrados que coincidan con "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Buscar Pacientes
                </h3>
                <p className="text-sm text-gray-500">
                  Ingrese un nombre, email, teléfono o ID para buscar pacientes existentes
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
