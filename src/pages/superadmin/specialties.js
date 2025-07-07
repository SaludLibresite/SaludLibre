import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import {
  getAllSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  uploadSpecialtyImage,
} from "../../lib/specialtiesService";
import { createInitialSpecialties } from "../../lib/initializeSpecialties";

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function SpecialtiesManagement() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      // Si no hay usuario logueado, redirigir al login
      if (!currentUser) {
        router.push("/superadmin");
        return;
      }

      // Si hay usuario logueado, verificar si es superadmin
      if (!SUPERADMIN_EMAILS.includes(currentUser.email)) {
        // Si no es superadmin, redirigir al dashboard principal
        router.push("/superadmin");
        return;
      }

      // Si es superadmin, cargar las especialidades
      loadSpecialties();
    }
  }, [currentUser, authLoading, router]);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      const allSpecialties = await getAllSpecialties();
      setSpecialties(allSpecialties);
    } catch (error) {
      console.error("Error loading specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpecialty = async (specialtyData) => {
    try {
      if (editingSpecialty) {
        const oldImagePath = editingSpecialty.imagePath;
        await updateSpecialty(editingSpecialty.id, specialtyData, oldImagePath);
        setSpecialties((prev) =>
          prev.map((specialty) =>
            specialty.id === editingSpecialty.id
              ? { ...specialty, ...specialtyData }
              : specialty
          )
        );
      } else {
        const newSpecialty = await createSpecialty(specialtyData);
        setSpecialties((prev) => [...prev, newSpecialty]);
      }
      setShowSpecialtyModal(false);
      setEditingSpecialty(null);
    } catch (error) {
      console.error("Error saving specialty:", error);
      alert("Error al guardar la especialidad");
    }
  };

  const handleDeleteSpecialty = async (specialtyId) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta especialidad?")) {
      try {
        const specialty = specialties.find((s) => s.id === specialtyId);
        const imagePath = specialty?.imagePath;
        await deleteSpecialty(specialtyId, imagePath);
        setSpecialties((prev) => prev.filter((s) => s.id !== specialtyId));
      } catch (error) {
        console.error("Error deleting specialty:", error);
        alert("Error al eliminar la especialidad");
      }
    }
  };

  const handleEditSpecialty = (specialty) => {
    setEditingSpecialty(specialty);
    setShowSpecialtyModal(true);
  };

  const handleAddSpecialty = () => {
    setEditingSpecialty(null);
    setShowSpecialtyModal(true);
  };

  const handleCreateInitialSpecialties = async () => {
    try {
      const result = await createInitialSpecialties();
      if (result.success) {
        alert(result.message);
        await loadSpecialties(); // Reload specialties
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error creating initial specialties:", error);
      alert("Error al crear especialidades por defecto");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Especialidades
              </h1>
              <p className="text-gray-600">
                Administra las especialidades médicas disponibles
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/superadmin")}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => router.push("/superadmin/doctors")}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Doctores
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Ver Sitio Público
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Total Especialidades
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {specialties.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Activas</h3>
            <p className="text-3xl font-bold text-green-600">
              {specialties.filter((s) => s.isActive !== false).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Inactivas</h3>
            <p className="text-3xl font-bold text-red-600">
              {specialties.filter((s) => s.isActive === false).length}
            </p>
          </div>
        </div>

        {/* Specialties Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Lista de Especialidades
          </h2>
          <div className="flex gap-2">
            {specialties.length === 0 && (
              <button
                onClick={handleCreateInitialSpecialties}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Crear Especialidades por Defecto
              </button>
            )}
            <button
              onClick={handleAddSpecialty}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              + Nueva Especialidad
            </button>
          </div>
        </div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty) => (
            <div
              key={specialty.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative h-48">
                <img
                  src={specialty.imageUrl || "/img/doctor-1.jpg"}
                  alt={specialty.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/img/doctor-1.jpg";
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      specialty.isActive !== false
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {specialty.isActive !== false ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {specialty.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {specialty.description}
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleEditSpecialty(specialty)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteSpecialty(specialty.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {specialties.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No hay especialidades registradas</p>
              <button
                onClick={handleAddSpecialty}
                className="mt-4 text-purple-600 hover:text-purple-800"
              >
                Crear la primera especialidad
              </button>
            </div>
          )}
        </div>

        {/* Specialty Modal */}
        {showSpecialtyModal && (
          <SpecialtyModal
            specialty={editingSpecialty}
            onSave={handleSaveSpecialty}
            onClose={() => {
              setShowSpecialtyModal(false);
              setEditingSpecialty(null);
            }}
            uploadSpecialtyImage={uploadSpecialtyImage}
          />
        )}
      </div>
    </div>
  );
}

// Modal component for editing/creating specialties
function SpecialtyModal({ specialty, onSave, onClose, uploadSpecialtyImage }) {
  const [formData, setFormData] = useState({
    title: specialty?.title || "",
    description: specialty?.description || "",
    imageUrl: specialty?.imageUrl || "",
    imagePath: specialty?.imagePath || "",
    isActive: specialty?.isActive !== false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(specialty?.imageUrl || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Por favor, completa todos los campos requeridos");
      return;
    }

    try {
      let finalFormData = { ...formData };

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        setUploadingImage(true);
        const uploadResult = await uploadSpecialtyImage(selectedFile);

        if (uploadResult.success) {
          finalFormData.imageUrl = uploadResult.url;
          finalFormData.imagePath = uploadResult.path;
        } else {
          alert(`Error al subir la imagen: ${uploadResult.error}`);
          return;
        }
      }

      onSave(finalFormData);
    } catch (error) {
      console.error("Error saving specialty:", error);
      alert("Error al guardar la especialidad");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG o WebP"
        );
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("El archivo es demasiado grande. Máximo 5MB");
        return;
      }

      setSelectedFile(file);

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedFile(null);
    setImagePreview(formData.imageUrl || "");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {specialty ? "Editar Especialidad" : "Nueva Especialidad"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: Cardiología"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe la especialidad médica..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen de la Especialidad
            </label>

            {/* Preview de la imagen */}
            {imagePreview && (
              <div className="mb-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md border"
                  onError={(e) => {
                    e.target.src = "/img/doctor-1.jpg";
                  }}
                />
                {selectedFile && (
                  <button
                    type="button"
                    onClick={clearImageSelection}
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Cancelar nueva imagen
                  </button>
                )}
              </div>
            )}

            {/* Input para subir archivo */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="w-full border-2 border-dashed border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Formatos permitidos: JPG, PNG, WebP. Máximo 5MB.
              </p>
            </div>

            {/* URL manual como alternativa */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                O ingresa una URL (opcional):
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                placeholder="https://ejemplo.com/imagen.jpg"
                disabled={selectedFile !== null}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Especialidad activa (visible en el sitio web)
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center"
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo imagen...
                </>
              ) : specialty ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
