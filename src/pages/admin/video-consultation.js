import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/admin/AdminLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import FeatureProtectedRoute from "../../components/FeatureProtectedRoute";
import NewVideoConsultationModal from "../../components/admin/NewVideoConsultationModal";
import { useAuth } from "../../context/AuthContext";
import { videoConsultationService } from "../../lib/videoConsultationService";
import useVideoConsultationStore from "../../store/videoConsultationStore";
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function VideoConsultationPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [scheduledRooms, setScheduledRooms] = useState([]);
  const [todayRooms, setTodayRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [deletingRoomId, setDeletingRoomId] = useState(null);

  // Zustand store - ya no se usa para manejo de estado local
  const { 
    setMeetingEnded
  } = useVideoConsultationStore();

  const loadDoctorRooms = useCallback(async () => {
    try {
      const rooms = await videoConsultationService.getDoctorRooms(currentUser.uid);
      setAllRooms(rooms);
      setScheduledRooms(rooms.filter(room => room.status === 'scheduled'));
    } catch (error) {
      console.error('Error loading doctor rooms:', error);
    }
  }, [currentUser.uid]);

  const loadTodayRooms = useCallback(async () => {
    try {
      const rooms = await videoConsultationService.getTodayScheduledRooms(currentUser.uid);
      setTodayRooms(rooms);
    } catch (error) {
      console.error('Error loading today rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid]);

  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      loadDoctorRooms();
      loadTodayRooms();
    }
  }, [currentUser, loadDoctorRooms, loadTodayRooms]);

  const handleCreateNewRoom = async (roomData) => {
    try {
      const roomName = videoConsultationService.generateRoomName(
        currentUser.uid,
        roomData.patientId,
        roomData.appointmentId || 'instant'
      );

      const newRoom = await videoConsultationService.createVideoRoom({
        doctorId: currentUser.uid,
        patientId: roomData.patientId,
        patientName: roomData.patientName,
        patientEmail: roomData.patientEmail,
        appointmentId: roomData.appointmentId,
        roomName,
        scheduledTime: roomData.scheduledTime,
        consultationType: roomData.consultationType || 'general',
        notes: roomData.notes || ''
      });

      const roomWithFullData = {
        ...newRoom,
        patientName: roomData.patientName,
        patientEmail: roomData.patientEmail,
        consultationType: roomData.consultationType || 'general'
      };

      setShowNewRoomModal(false);
      
      // Redirigir directamente a la videoconsulta
      router.push(`/admin/video-consultation/${roomName}`);
      
      loadDoctorRooms();
      loadTodayRooms();
      
    } catch (error) {
      console.error('Error creating room:', error);
      
      // Mostrar diferentes mensajes según el error
      if (error.message.includes('videoconsulta activa')) {
        alert('No se puede crear la sala: ' + error.message);
      } else {
        alert('Error al crear la sala de videoconsulta');
      }
    }
  };

  const handleJoinRoom = (room) => {
    // Redirigir directamente a la página de videoconsulta del doctor
    router.push(`/admin/video-consultation/${room.roomName}`);
  };

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const copyRoomLink = (room) => {
    const link = `${window.location.origin}/video/join/${room.roomName}`;
    navigator.clipboard.writeText(link);
    showNotification('¡Enlace copiado!', 'success');
  };

  const handleDeleteRoom = async (room) => {
    if (!confirm(`¿Eliminar la consulta con ${room.patientName || 'este paciente'}?`)) return;
    
    setDeletingRoomId(room.id);
    try {
      await videoConsultationService.deleteVideoRoom(room.id);
      
      // Also delete from Daily.co if possible
      try {
        const sanitizedName = room.roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 41);
        await fetch('/api/video/create-room', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: sanitizedName }),
        }).catch(() => {});
      } catch {}

      showNotification('Consulta eliminada', 'success');
      loadDoctorRooms();
      loadTodayRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      showNotification('Error al eliminar la consulta', 'error');
    } finally {
      setDeletingRoomId(null);
    }
  };



  // Interfaz principal (dashboard)
  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="video-consultation">
        <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <VideoCameraIcon className="h-6 w-6 sm:h-7 sm:w-7 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Video Consultas</span>
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Gestiona tus consultas médicas virtuales
                </p>
              </div>

              <div className="flex items-center justify-end flex-shrink-0">
                <button
                  onClick={() => setShowNewRoomModal(true)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 w-full sm:w-auto text-sm sm:text-base"
                >
                  <PlusIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Nueva Consulta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consultas de hoy */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Consultas de Hoy
                </h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {todayRooms.length}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="animate-pulse bg-gray-100 rounded-lg p-4 h-16"></div>
                  ))}
                </div>
              ) : todayRooms.length > 0 ? (
                <div className="space-y-3">
                  {todayRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {room.patientName || `Paciente ID: ${room.patientId}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {room.scheduledTime 
                              ? new Date(room.scheduledTime.toDate()).toLocaleTimeString()
                              : 'Inmediata'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyRoomLink(room)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Copiar enlace para paciente"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          disabled={deletingRoomId === room.id}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Eliminar consulta"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleJoinRoom(room)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Unirse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay consultas programadas para hoy</p>
                </div>
              )}
            </div>

            {/* Consultas programadas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-purple-500" />
                  Próximas Consultas
                </h3>
                <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                  {scheduledRooms.length}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="animate-pulse bg-gray-100 rounded-lg p-4 h-16"></div>
                  ))}
                </div>
              ) : scheduledRooms.length > 0 ? (
                <div className="space-y-3">
                  {scheduledRooms.slice(0, 5).map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <VideoCameraIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {room.patientName || `Paciente ID: ${room.patientId}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {room.scheduledTime 
                              ? new Date(room.scheduledTime.toDate()).toLocaleString()
                              : 'No programada'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyRoomLink(room)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Copiar enlace para paciente"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          disabled={deletingRoomId === room.id}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Eliminar consulta"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleJoinRoom(room)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          Unirse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay consultas programadas</p>
                  <button
                    onClick={() => setShowNewRoomModal(true)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Crear primera consulta
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Historial de consultas */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <VideoCameraIcon className="h-5 w-5 mr-2 text-gray-500" />
                Historial de Consultas
              </h3>
              <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                {allRooms.length} total
              </span>
            </div>

            {allRooms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allRooms.map((room) => {
                      const statusLabel = room.status === 'scheduled' ? 'Programada' 
                        : room.status === 'active' ? 'Activa' 
                        : room.status === 'completed' ? 'Completada' 
                        : room.status === 'cancelled' ? 'Cancelada' 
                        : room.status;
                      const statusColor = room.status === 'scheduled' ? 'bg-blue-100 text-blue-800' 
                        : room.status === 'active' ? 'bg-green-100 text-green-800' 
                        : room.status === 'completed' ? 'bg-gray-100 text-gray-800' 
                        : room.status === 'cancelled' ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800';
                      const createdDate = room.createdAt?.toDate ? room.createdAt.toDate() : (room.createdAt ? new Date(room.createdAt) : null);
                      
                      return (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {room.patientName || `ID: ${room.patientId?.substring(0, 8)}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {createdDate ? createdDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {room.consultationType || 'general'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {(room.status === 'scheduled' || room.status === 'active') && (
                                <>
                                  <button
                                    onClick={() => copyRoomLink(room)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copiar enlace"
                                  >
                                    <ShareIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleJoinRoom(room)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                  >
                                    Unirse
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteRoom(room)}
                                disabled={deletingRoomId === room.id}
                                className="p-1.5 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="Eliminar"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <VideoCameraIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay consultas en el historial</p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Consultas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{todayRooms.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Programadas</p>
                  <p className="text-2xl font-bold text-gray-900">{scheduledRooms.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scheduledRooms.filter(r => r.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
          <NewVideoConsultationModal
            isOpen={showNewRoomModal}
            onClose={() => setShowNewRoomModal(false)}
            onCreateRoom={handleCreateNewRoom}
          />

          {/* Notification */}
          {notification && (
            <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white ${
              notification.type === 'success' ? 'bg-green-500' : 
              notification.type === 'error' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}>
              {notification.message}
            </div>
          )}
        </div>
      </AdminLayout>
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}
