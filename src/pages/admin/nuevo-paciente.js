import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/admin/AdminLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { createPatient } from "../../lib/patientsService";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NuevoPacientePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    insuranceProvider: "",
    insuranceNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState(null);

  // Helper function to detect field-specific errors
  const handleFieldError = (errorMessage) => {
    // Email errors
    if (
      errorMessage.includes("Ya existe una cuenta con este correo") ||
      errorMessage.includes("email address is already in use") ||
      errorMessage.includes("email-already-exists") ||
      errorMessage.includes("correo electrónico ya está registrado")
    ) {
      return {
        field: "email",
        fieldError: "Este correo electrónico ya está registrado",
        generalMessage:
          "Error: Ya existe una cuenta con este correo electrónico",
      };
    } else if (
      errorMessage.includes("correo electrónico no es válido") ||
      errorMessage.includes("invalid-email") ||
      errorMessage.includes("email no es válido")
    ) {
      return {
        field: "email",
        fieldError: "El formato del correo electrónico no es válido",
        generalMessage: "Error: El formato del correo electrónico no es válido",
      };
    }

    // Password errors
    else if (
      errorMessage.includes("contraseña es muy débil") ||
      errorMessage.includes("weak-password")
    ) {
      return {
        field: "password", // aunque no tenemos campo password en este form
        fieldError: "La contraseña generada es muy débil",
        generalMessage:
          "Error: La contraseña generada es muy débil. Intente nuevamente.",
      };
    }

    return null;
  };

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

    // Clear general message when user starts typing in specific fields
    if (
      field === "email" &&
      message &&
      (message.includes("correo electrónico") || message.includes("email"))
    ) {
      setMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "La fecha de nacimiento es requerida";
    }

    if (!formData.gender) {
      newErrors.gender = "El género es requerido";
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
      setMessage("");
      setErrors({}); // Limpiar errores previos antes de enviar

      // Get doctor data
      const doctor = await getDoctorByUserId(currentUser.uid);
      if (!doctor) {
        setMessage("Error: No se encontró el perfil del doctor");
        return;
      }

      // Create patient with Firebase Auth user and email notification
      const result = await createPatient(
        {
          ...formData,
          doctorName: doctor.nombre,
          medicalHistory: formData.medicalHistory
            ? [
                {
                  id: Date.now(),
                  date: new Date(),
                  notes: formData.medicalHistory,
                  type: "initial_notes",
                },
              ]
            : [],
        },
        doctor.id,
        currentUser.uid
      );

      if (result.success) {
        setMessage("success");
        setCredentials({
          email: formData.email,
          temporaryPassword: result.temporaryPassword || "Se envió por correo",
          patientId: result.patientId,
          userId: result.userId,
        });

        // Redirect to patients list after success
        setTimeout(() => {
          router.push("/admin/patients");
        }, 5000); // Más tiempo para ver las credenciales
      }
    } catch (error) {
      console.error("Error creating patient:", error);

      // Limpiar errores previos
      setErrors({});

      // Detectar si es un error relacionado con algún campo específico
      const fieldError = handleFieldError(error.message || "");

      if (fieldError) {
        // Resaltar el campo específico
        setErrors({
          [fieldError.field]: fieldError.fieldError,
        });
        setMessage(fieldError.generalMessage);
      } else {
        // Para otros errores, mostrar solo el mensaje general
        setMessage(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Volver
              </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Agregar Nuevo Paciente
            </h1>
            <p className="text-gray-600">
              Complete la información del paciente para agregarlo a su lista.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {/* Message */}
              {message && (
                <div className="mb-6">
                  {message === "success" ? (
                    <div className="bg-green-100 text-green-700 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <svg
                          className="h-5 w-5 text-green-500 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="font-medium">
                          ¡Paciente creado exitosamente!
                        </h3>
                      </div>

                      {credentials && (
                        <div className="bg-white border border-green-200 rounded-lg p-4 mt-4">
                          <h4 className="font-medium text-green-800 mb-3">
                            📧 Credenciales de acceso del paciente:
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {credentials.email}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">
                                Contraseña temporal:
                              </span>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {credentials.temporaryPassword}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">
                                ID del paciente:
                              </span>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                {credentials.patientId}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              <strong>📨 Email enviado:</strong> Se ha enviado
                              un correo de bienvenida al paciente con sus
                              credenciales de acceso y un enlace directo para
                              iniciar sesión.
                            </p>
                          </div>

                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>🔒 Seguridad:</strong> El paciente deberá
                              cambiar esta contraseña temporal en su primer
                              inicio de sesión.
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-sm mt-3">
                        Redirigiendo a la lista de pacientes en 5 segundos...
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`p-4 rounded-lg ${
                        message.includes("Error")
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-green-100 text-green-700 border border-green-200"
                      }`}
                    >
                      {message}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Juan Pérez"
                        disabled={loading}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            errors.email
                              ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                          placeholder="juan@email.com"
                          disabled={loading}
                        />
                        {errors.email && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg
                              className="h-5 w-5 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="+54 11 1234-5678"
                        disabled={loading}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.dateOfBirth
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        disabled={loading}
                      />
                      {errors.dateOfBirth && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Género *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
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
                        <p className="text-red-500 text-sm mt-1">
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Av. Corrientes 1234, CABA"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Contacto de Emergencia
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) =>
                          handleInputChange("emergencyContact", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="María Pérez"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono de Emergencia
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) =>
                          handleInputChange("emergencyPhone", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+54 11 9876-5432"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Información Médica
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Historial Médico
                      </label>
                      <textarea
                        value={formData.medicalHistory}
                        onChange={(e) =>
                          handleInputChange("medicalHistory", e.target.value)
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Descripción del historial médico relevante..."
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alergias
                        </label>
                        <input
                          type="text"
                          value={formData.allergies}
                          onChange={(e) =>
                            handleInputChange("allergies", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                          onChange={(e) =>
                            handleInputChange(
                              "currentMedications",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Losartán 50mg, Aspirina, etc."
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Información del Seguro
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Obra Social/Prepaga
                      </label>
                      <input
                        type="text"
                        value={formData.insuranceProvider}
                        onChange={(e) =>
                          handleInputChange("insuranceProvider", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        onChange={(e) =>
                          handleInputChange("insuranceNumber", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="123456789"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    {loading ? "Guardando..." : "Guardar Paciente"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
