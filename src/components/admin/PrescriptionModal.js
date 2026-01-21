import { useState, useEffect } from "react";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { getPatientById } from "../../lib/patientsService";
import { createPrescription } from "../../lib/prescriptionsService";

export default function PrescriptionModal({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  onSuccess,
}) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [message, setMessage] = useState("");
  const [medications, setMedications] = useState([
    {
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser, patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage("");

      // Load doctor data
      const doctor = await getDoctorByUserId(currentUser.uid);
      if (!doctor) {
        throw new Error("No se encontró el perfil del doctor");
      }
      setDoctorData(doctor);

      // Load patient data
      if (patientId) {
        const patient = await getPatientById(patientId);
        if (!patient) {
          setMessage("Paciente no encontrado");
          return;
        }
        setPatientData(patient);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage(error.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, value) => {
    const updatedMedications = medications.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updatedMedications);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    // Check if at least one medication has name and dosage
    const validMedications = medications.filter(
      (med) => med.name.trim() && med.dosage.trim()
    );

    if (validMedications.length === 0) {
      setMessage("Debe agregar al menos un medicamento con nombre y dosis");
      return false;
    }

    // Check that all filled medications have required fields
    for (let med of medications) {
      if (med.name.trim() && (!med.dosage.trim() || !med.frequency.trim())) {
        setMessage(
          "Todos los medicamentos deben tener nombre, dosis y frecuencia"
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Filter out empty medications
      const validMedications = medications.filter(
        (med) => med.name.trim() && med.dosage.trim()
      );

      console.log("Doctor data in prescription modal:", doctorData);

      const prescriptionData = {
        doctorInfo: {
          id: doctorData.id,
          userId: doctorData.userId,
          nombre: doctorData.nombre || "No especificado",
          especialidad: doctorData.especialidad || "No especificado",
          profesion: "Médico",
          telefono: doctorData.telefono || "No especificado",
          domicilio: doctorData.formattedAddress || doctorData.ubicacion || "No especificado",
          matricula: doctorData.matricula || doctorData.referralCode || "N/A",
          signatureURL: doctorData.signatureURL || null,
          stampURL: doctorData.stampURL || null,
        },
        patientInfo: {
          id: patientData.id,
          name: patientData.name,
          age: calculateAge(patientData.dateOfBirth),
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender || "No especificado",
          dni: patientData.dni || "No especificado",
          obraSocial: patientData.obraSocial || patientData.insuranceProvider || "Particular",
        },
        medications: validMedications,
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        createdAt: new Date(),
      };

      const result = await createPrescription(prescriptionData, appointmentId);

      setMessage("Receta médica creada exitosamente");
      setTimeout(() => {
        onSuccess && onSuccess(result);
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating prescription:", error);
      setMessage(error.message || "Error al crear la receta médica");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMedications([
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
    setNotes("");
    setDiagnosis("");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[91vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Crear Receta Médica
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                message.includes("Error")
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-green-50 text-green-800 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {loading && !doctorData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Doctor and Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Información del Doctor
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {doctorData?.nombre}
                    </p>
                    <p>
                      <span className="font-medium">Especialidad:</span>{" "}
                      {doctorData?.especialidad}
                    </p>
                    <p>
                      <span className="font-medium">Teléfono:</span>{" "}
                      {doctorData?.telefono}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Información del Paciente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {patientData?.name}
                    </p>
                    <p>
                      <span className="font-medium">Edad:</span>{" "}
                      {calculateAge(patientData?.dateOfBirth) || "N/A"} años
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {patientData?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Medicamentos
                  </h3>
                  <button
                    onClick={addMedication}
                    className="flex items-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Agregar Medicamento</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {medications.map((medication, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">
                          Medicamento {index + 1}
                        </h4>
                        {medications.length > 1 && (
                          <button
                            onClick={() => removeMedication(index)}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Medicamento *
                          </label>
                          <input
                            type="text"
                            value={medication.name}
                            onChange={(e) =>
                              updateMedication(index, "name", e.target.value)
                            }
                            placeholder="Ej: Ibuprofeno"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dosis *
                          </label>
                          <input
                            type="text"
                            value={medication.dosage}
                            onChange={(e) =>
                              updateMedication(index, "dosage", e.target.value)
                            }
                            placeholder="Ej: 600mg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frecuencia *
                          </label>
                          <input
                            type="text"
                            value={medication.frequency}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "frequency",
                                e.target.value
                              )
                            }
                            placeholder="Ej: Cada 8 horas"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración
                          </label>
                          <input
                            type="text"
                            value={medication.duration}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "duration",
                                e.target.value
                              )
                            }
                            placeholder="Ej: 7 días"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instrucciones Especiales
                          </label>
                          <input
                            type="text"
                            value={medication.instructions}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "instructions",
                                e.target.value
                              )
                            }
                            placeholder="Ej: Tomar con alimentos"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  placeholder="Diagnóstico médico del paciente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones Adicionales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observaciones, recomendaciones o instrucciones adicionales..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 pt-2 pb-10 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !doctorData || !patientData}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Crear Receta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
