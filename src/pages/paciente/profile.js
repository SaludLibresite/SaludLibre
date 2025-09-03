import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePatientStore } from "../../store/patientStore";
import PatientLayout from "../../components/paciente/PatientLayout";
import FamilyManagement from "../../components/paciente/FamilyManagement";
import { validateArgentinePhone } from "../../lib/validations";
import { updatePatient } from "../../lib/patientsService";
import {
  UserIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  HeartIcon,
  ShieldCheckIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function PatientProfile() {
  const { currentUser } = useAuth();
  const { activePatient, primaryPatient } = usePatientStore();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [errors, setErrors] = useState({});

  // Default empty profile data
  const getEmptyProfileData = () => ({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    insuranceProvider: "",
    insuranceNumber: "",
    allergies: "",
    currentMedications: "",
    medicalHistory: "",
    bloodType: "",
    weight: "",
    height: "",
  });

  const [profileData, setProfileData] = useState(getEmptyProfileData());

  const [editData, setEditData] = useState(profileData);

  // Load profile data from activePatient
  useEffect(() => {
    if (activePatient) {
      const patientData = {
        name: activePatient.name || "",
        email: activePatient.email || "",
        phone: activePatient.phone || "",
        dateOfBirth: activePatient.dateOfBirth || "",
        gender: activePatient.gender || "",
        address: activePatient.address || "",
        emergencyContact: activePatient.emergencyContact || "",
        emergencyPhone: activePatient.emergencyPhone || "",
        insuranceProvider: activePatient.insuranceProvider || "",
        insuranceNumber: activePatient.insuranceNumber || "",
        allergies: activePatient.allergies || "",
        currentMedications: activePatient.currentMedications || "",
        medicalHistory: activePatient.medicalHistory || "",
        bloodType: activePatient.bloodType || "",
        weight: activePatient.weight || "",
        height: activePatient.height || "",
      };

      setProfileData(patientData);
      if (!editing) {
        setEditData(patientData);
      }
    } else {
      const emptyData = getEmptyProfileData();
      setProfileData(emptyData);
      if (!editing) {
        setEditData(emptyData);
      }
    }
  }, [activePatient, editing]);

  const handleEdit = () => {
    setEditData(profileData);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setEditing(false);
    setMessage("");
    setErrors({});
  };

  const validateProfileData = () => {
    const newErrors = {};

    // Validate phone if provided
    if (editData.phone && editData.phone.trim()) {
      if (!validateArgentinePhone(editData.phone.trim())) {
        newErrors.phone = "Formato de teléfono argentino inválido. Use: +54 XX XXXX-XXXX";
      }
    }

    // Validate emergency phone if provided
    if (editData.emergencyPhone && editData.emergencyPhone.trim()) {
      if (!validateArgentinePhone(editData.emergencyPhone.trim())) {
        newErrors.emergencyPhone = "Formato de teléfono argentino inválido. Use: +54 XX XXXX-XXXX";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfileData()) {
      return;
    }

    if (!activePatient) {
      console.error("No active patient found for saving");
      setMessage("No se pudo identificar al paciente activo");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Save to Firestore using the patientsService
      await updatePatient(activePatient.id, editData);

      // Update local state
      setProfileData(editData);
      setEditing(false);
      setMessage("Perfil actualizado correctamente");

      // Reload the page after successful save to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Give user time to see the success message
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateAge = (dateOfBirth) => {
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

  return (
    <PatientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mr-4">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600">
                  Gestiona tu información personal y médica
                </p>
              </div>
            </div>
            {!editing ? (
              <button
                onClick={handleEdit}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Editar Perfil
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-2 rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all duration-200 flex items-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.includes("Error")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Tab Navigation - Only show for primary patient */}
        {primaryPatient && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "profile"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <UserIcon className="h-5 w-5 inline mr-2" />
                  Mi Perfil
                </button>
                <button
                  onClick={() => setActiveTab("family")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "family"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5 inline mr-2" />
                  Gestión de Familiares
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "profile" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="h-24 w-24 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-white">
                        {profileData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <CameraIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {profileData.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{profileData.email}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">Edad</div>
                      <div className="text-amber-600">
                        {calculateAge(profileData.dateOfBirth)} años
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">Género</div>
                      <div className="text-blue-600">{profileData.gender}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">
                        Tipo de Sangre
                      </div>
                      <div className="text-green-600">
                        {profileData.bloodType}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">Seguro</div>
                      <div className="text-purple-600">
                        {profileData.insuranceProvider}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Información Personal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    {editing ? (
                      <>
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                            errors.phone ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="+54 11 1234-5678"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={editData.dateOfBirth}
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>
                          {new Date(profileData.dateOfBirth).toLocaleDateString(
                            "es-ES"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Información Médica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alergias
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.allergies}
                        onChange={(e) =>
                          handleInputChange("allergies", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Penicilina, Polen, etc."
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.allergies || "Ninguna"}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicaciones Actuales
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.currentMedications}
                        onChange={(e) =>
                          handleInputChange(
                            "currentMedications",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Losartán 50mg, etc."
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>
                          {profileData.currentMedications || "Ninguna"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.weight}
                        onChange={(e) =>
                          handleInputChange("weight", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg">
                        <span>{profileData.weight} kg</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura (cm)
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.height}
                        onChange={(e) =>
                          handleInputChange("height", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg">
                        <span>{profileData.height} cm</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Historial Médico
                    </label>
                    {editing ? (
                      <textarea
                        value={editData.medicalHistory}
                        onChange={(e) =>
                          handleInputChange("medicalHistory", e.target.value)
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Condiciones médicas relevantes..."
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg">
                        <span>
                          {profileData.medicalHistory ||
                            "Sin historial registrado"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Contacto de Emergencia
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Contacto
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.emergencyContact}
                        onChange={(e) =>
                          handleInputChange("emergencyContact", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.emergencyContact}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Emergencia
                    </label>
                    {editing ? (
                      <>
                        <input
                          type="tel"
                          value={editData.emergencyPhone}
                          onChange={(e) =>
                            handleInputChange("emergencyPhone", e.target.value)
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                            errors.emergencyPhone ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="+54 11 1234-5678"
                        />
                        {errors.emergencyPhone && (
                          <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.emergencyPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Información del Seguro
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Obra Social/Prepaga
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.insuranceProvider}
                        onChange={(e) =>
                          handleInputChange("insuranceProvider", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.insuranceProvider}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Afiliado
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.insuranceNumber}
                        onChange={(e) =>
                          handleInputChange("insuranceNumber", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{profileData.insuranceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Family Management Tab */
          <FamilyManagement primaryPatientId={primaryPatient?.id} />
        )}
      </div>
    </PatientLayout>
  );
}
