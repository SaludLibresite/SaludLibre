import { useState, useEffect } from "react";
import { usePatientStore } from "../../store/patientStore";
import {
  getFamilyMembersByPrimaryPatientId,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  validateFamilyMemberData,
  RELATIONSHIP_OPTIONS,
} from "../../lib/familyService";
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  HeartIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function FamilyManagement({ primaryPatientId }) {
  const {
    familyMembers,
    setFamilyMembers,
    addFamilyMember,
    updateFamilyMember: updateFamilyMemberStore,
    removeFamilyMember,
    familyMembersLoading,
    setFamilyMembersLoading,
  } = usePatientStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    allergies: "",
    currentMedications: "",
    emergencyContact: "",
    emergencyPhone: "",
    insuranceProvider: "",
    insuranceNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (primaryPatientId) {
      loadFamilyMembers();
    }
  }, [primaryPatientId]);

  const loadFamilyMembers = async () => {
    try {
      setFamilyMembersLoading(true);
      const members = await getFamilyMembersByPrimaryPatientId(
        primaryPatientId
      );
      setFamilyMembers(members);
    } catch (error) {
      console.error("Error loading family members:", error);
      setMessage("Error al cargar los familiares");
    } finally {
      setFamilyMembersLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      relationship: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      email: "",
      allergies: "",
      currentMedications: "",
      emergencyContact: "",
      emergencyPhone: "",
      insuranceProvider: "",
      insuranceNumber: "",
      notes: "",
    });
    setErrors({});
    setMessage("");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAdd = () => {
    resetForm();
    setEditingMember(null);
    setShowAddModal(true);
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name || "",
      relationship: member.relationship || "",
      dateOfBirth: member.dateOfBirth || "",
      gender: member.gender || "",
      phone: member.phone || "",
      email: member.email || "",
      allergies: member.allergies || "",
      currentMedications: member.currentMedications || "",
      emergencyContact: member.emergencyContact || "",
      emergencyPhone: member.emergencyPhone || "",
      insuranceProvider: member.insuranceProvider || "",
      insuranceNumber: member.insuranceNumber || "",
      notes: member.notes || "",
    });
    setEditingMember(member);
    setErrors({});
    setMessage("");
    setShowEditModal(true);
  };

  const handleDelete = async (memberId) => {
    if (!confirm("¿Está seguro de que desea eliminar este familiar?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteFamilyMember(memberId);
      removeFamilyMember(memberId);
      setMessage("Familiar eliminado exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting family member:", error);
      setMessage("Error al eliminar el familiar");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateFamilyMemberData(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const familyMemberData = {
        ...formData,
        primaryPatientId,
        doctorId: primaryPatientId, // Family members inherit doctor from primary patient
      };

      if (editingMember) {
        // Update existing family member
        await updateFamilyMember(editingMember.id, familyMemberData);
        updateFamilyMemberStore(editingMember.id, familyMemberData);
        setMessage("Familiar actualizado exitosamente");
        setShowEditModal(false);
      } else {
        // Create new family member
        const newMember = await createFamilyMember(familyMemberData);
        addFamilyMember(newMember);
        setMessage("Familiar agregado exitosamente");
        setShowAddModal(false);
      }

      resetForm();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving family member:", error);
      setMessage("Error al guardar el familiar");
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
    setEditingMember(null);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return `${age} años`;
  };

  const getRelationshipLabel = (value) => {
    const option = RELATIONSHIP_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Familiares
          </h2>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Agregar Familiar
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.includes("Error")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <div className="flex items-center">
            {message.includes("Error") ? (
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            )}
            {message}
          </div>
        </div>
      )}

      {/* Family Members List */}
      {familyMembersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando familiares...</p>
        </div>
      ) : familyMembers.length === 0 ? (
        <div className="text-center py-8">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay familiares registrados</p>
          <p className="text-sm text-gray-500 mt-1">
            Agregue familiares para gestionar sus citas y historiales médicos
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <HeartIcon className="h-4 w-4 text-pink-500" />
                      <span>{getRelationshipLabel(member.relationship)}</span>
                    </div>

                    {member.dateOfBirth && (
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        <span>
                          {calculateAge(member.dateOfBirth)} • {member.gender}
                        </span>
                      </div>
                    )}

                    {member.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-green-500" />
                        <span>{member.phone}</span>
                      </div>
                    )}

                    {member.email && (
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-4 w-4 text-amber-500" />
                        <span>{member.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar"
                    disabled={loading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {member.allergies && (
                <div className="mt-3 p-2 bg-red-50 rounded-md">
                  <p className="text-xs text-red-700">
                    <strong>Alergias:</strong> {member.allergies}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMember ? "Editar Familiar" : "Agregar Familiar"}
                </h3>
                <button
                  type="button"
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.name ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Ej: María González"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relación Familiar *
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) =>
                          handleInputChange("relationship", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.relationship
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Seleccionar relación</option>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.relationship && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.relationship}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.dateOfBirth
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.dateOfBirth && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Género *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.gender ? "border-red-300" : "border-gray-300"
                        }`}
                      >
                        <option value="">Seleccionar género</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.gender}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Información de Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="+54 11 1234-5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.email ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="email@ejemplo.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Información Médica
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alergias
                      </label>
                      <textarea
                        value={formData.allergies}
                        onChange={(e) =>
                          handleInputChange("allergies", e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ej: Penicilina, polen, mariscos..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medicamentos Actuales
                      </label>
                      <textarea
                        value={formData.currentMedications}
                        onChange={(e) =>
                          handleInputChange(
                            "currentMedications",
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ej: Losartán 50mg, Aspirina..."
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Información del Seguro
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Obra Social/Prepaga
                      </label>
                      <input
                        type="text"
                        value={formData.insuranceProvider}
                        onChange={(e) =>
                          handleInputChange("insuranceProvider", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ej: OSDE, Swiss Medical..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Afiliado
                      </label>
                      <input
                        type="text"
                        value={formData.insuranceNumber}
                        onChange={(e) =>
                          handleInputChange("insuranceNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Contacto de Emergencia
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) =>
                          handleInputChange("emergencyContact", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Nombre del contacto de emergencia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono de Emergencia
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) =>
                          handleInputChange("emergencyPhone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="+54 11 1234-5678"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Información adicional relevante..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading
                    ? "Guardando..."
                    : editingMember
                    ? "Actualizar"
                    : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
