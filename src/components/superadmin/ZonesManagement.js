import React, { useState, useEffect } from "react";
import {
  getAllZones,
  createZone,
  updateZone,
  deleteZone,
  getZonesWithDoctorCount,
  assignZonesToDoctors,
} from "../../lib/zonesService";
import { getAllDoctors } from "../../lib/doctorsService";
import ZoneMapEditor from "./ZoneMapEditor";

export default function ZonesManagement() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [assigningZones, setAssigningZones] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const zonesData = await getZonesWithDoctorCount();
      setZones(zonesData);
    } catch (error) {
      console.error("Error loading zones:", error);
      alert("Error al cargar las zonas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = () => {
    setEditingZone(null);
    setShowCreateModal(true);
  };

  const handleEditZone = (zone) => {
    setEditingZone(zone);
    setShowCreateModal(true);
  };

  const handleSaveZone = async (zoneData) => {
    try {
      if (editingZone) {
        await updateZone(editingZone.id, zoneData);
      } else {
        await createZone(zoneData);
      }
      
      setShowCreateModal(false);
      setEditingZone(null);
      await loadZones();
    } catch (error) {
      console.error("Error saving zone:", error);
      alert("Error al guardar la zona");
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta zona?")) {
      return;
    }

    try {
      await deleteZone(zoneId);
      await loadZones();
    } catch (error) {
      console.error("Error deleting zone:", error);
      alert("Error al eliminar la zona");
    }
  };

  const handleToggleZoneStatus = async (zone) => {
    try {
      await updateZone(zone.id, { isActive: !zone.isActive });
      await loadZones();
    } catch (error) {
      console.error("Error toggling zone status:", error);
      alert("Error al cambiar el estado de la zona");
    }
  };

  const handleAssignZonesToDoctors = async () => {
    if (!confirm("¿Quieres asignar zonas a todos los doctores basándose en sus coordenadas? Esta operación puede tomar un tiempo.")) {
      return;
    }

    try {
      setAssigningZones(true);
      const doctors = await getAllDoctors();
      const result = await assignZonesToDoctors(doctors);
      setAssignmentResult(result);
      await loadZones();
    } catch (error) {
      console.error("Error assigning zones:", error);
      alert("Error al asignar zonas a los doctores");
    } finally {
      setAssigningZones(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando zonas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Zonas Geográficas
            </h1>
            <p className="text-gray-600 mt-1">
              Administra las zonas para agrupar doctores por ubicación
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAssignZonesToDoctors}
              disabled={assigningZones}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {assigningZones ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Asignando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Asignar Zonas</span>
                </>
              )}
            </button>
            <button
              onClick={handleCreateZone}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Zona</span>
            </button>
          </div>
        </div>

        {/* Assignment Result */}
        {assignmentResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900">Asignación Completada</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>• Doctores asignados: {assignmentResult.assigned}</p>
              <p>• Doctores sin asignar: {assignmentResult.unassigned}</p>
              {assignmentResult.errors.length > 0 && (
                <p>• Errores: {assignmentResult.errors.length}</p>
              )}
            </div>
            <button
              onClick={() => setAssignmentResult(null)}
              className="mt-2 text-green-600 hover:text-green-800 text-sm underline"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Zonas</h3>
          <p className="text-2xl font-bold text-blue-600">{zones.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Zonas Activas</h3>
          <p className="text-2xl font-bold text-green-600">
            {zones.filter(z => z.isActive).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Zonas Inactivas</h3>
          <p className="text-2xl font-bold text-red-600">
            {zones.filter(z => !z.isActive).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Doctores</h3>
          <p className="text-2xl font-bold text-purple-600">
            {zones.reduce((sum, zone) => sum + zone.doctorCount, 0)}
          </p>
        </div>
      </div>

      {/* Zones List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Lista de Zonas</h2>
        </div>
        
        {zones.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay zonas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primera zona geográfica
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateZone}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Zona
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {zone.name}
                        </div>
                        {zone.description && (
                          <div className="text-sm text-gray-500">
                            {zone.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        zone.type === 'polygon' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {zone.type === 'polygon' ? '🔷 Polígono' : '⭕ Círculo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {zone.doctorCount} doctores
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        zone.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.isActive ? '✅ Activa' : '❌ Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditZone(zone)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleZoneStatus(zone)}
                        className={zone.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      >
                        {zone.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <ZoneCreateEditModal
          zone={editingZone}
          onSave={handleSaveZone}
          onClose={() => {
            setShowCreateModal(false);
            setEditingZone(null);
          }}
        />
      )}
    </div>
  );
}

// Modal Component for Creating/Editing Zones
function ZoneCreateEditModal({ zone, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: zone?.name || "",
    description: zone?.description || "",
    type: zone?.type || "circle",
    coordinates: zone?.coordinates || [],
    center: zone?.center || { lat: -34.6037, lng: -58.3816 }, // Buenos Aires default
    radius: zone?.radius || 10,
    color: zone?.color || "#3B82F6",
    isActive: zone?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("El nombre de la zona es obligatorio");
      return;
    }

    if (formData.type === "circle" && (!formData.center.lat || !formData.center.lng)) {
      alert("Debes seleccionar el centro del círculo");
      return;
    }

    if (formData.type === "polygon" && formData.coordinates.length < 3) {
      alert("Un polígono debe tener al menos 3 puntos");
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error("Error saving zone:", error);
      alert("Error al guardar la zona");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {zone ? "Editar Zona" : "Nueva Zona"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre de la Zona *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Capital Federal Norte"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Zona
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="circle">Círculo</option>
                <option value="polygon">Polígono</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción opcional de la zona"
            />
          </div>

          {formData.type === "circle" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Radio (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: parseFloat(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Zona activa
              </label>
            </div>
          </div>

          {/* Map Editor */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Definir Área en el Mapa
            </label>
            <ZoneMapEditor
              type={formData.type}
              center={formData.center}
              radius={formData.radius}
              coordinates={formData.coordinates}
              color={formData.color}
              onCenterChange={(center) => setFormData({ ...formData, center })}
              onRadiusChange={(radius) => setFormData({ ...formData, radius })}
              onCoordinatesChange={(coordinates) => setFormData({ ...formData, coordinates })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{zone ? "Actualizar" : "Crear"} Zona</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
