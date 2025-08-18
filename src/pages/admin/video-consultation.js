import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [notification, setNotification] = useState(null);

  // Zustand store - ya no se usa para manejo de estado local
  const { 
    setMeetingEnded
  } = useVideoConsultationStore();

  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      loadDoctorRooms();
      loadTodayRooms();
    }
  }, [currentUser]);

  // Detectar si estamos en localhost
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
  }, []);

  const loadDoctorRooms = async () => {
    try {
      const rooms = await videoConsultationService.getDoctorRooms(currentUser.uid);
      setScheduledRooms(rooms.filter(room => room.status === 'scheduled'));
    } catch (error) {
      console.error('Error loading doctor rooms:', error);
    }
  };

  const loadTodayRooms = async () => {
    try {
      const rooms = await videoConsultationService.getTodayScheduledRooms(currentUser.uid);
      setTodayRooms(rooms);
    } catch (error) {
      console.error('Error loading today rooms:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Función para eliminar una sala específica (solo localhost)
  const handleDeleteRoom = async (roomId) => {
    if (!isLocalhost) {
      alert('Esta función solo está disponible en localhost');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta sala?')) {
      try {
        await videoConsultationService.deleteVideoRoom(roomId);
        
        // Recargar las listas
        loadDoctorRooms();
        loadTodayRooms();
        
        showNotification('¡Sala eliminada!', 'error');
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error al eliminar la sala');
      }
    }
  };

  // Función para eliminar todas las salas activas (solo localhost)
  const handleDeleteAllActiveRooms = async () => {
    if (!isLocalhost) {
      alert('Esta función solo está disponible en localhost');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar TODAS las salas activas? Esta acción no se puede deshacer.')) {
      try {
        const deletedCount = await videoConsultationService.deleteAllActiveRooms();
        
        // Recargar las listas
        loadDoctorRooms();
        loadTodayRooms();
        
        showNotification(`¡${deletedCount} salas eliminadas!`, 'error');
      } catch (error) {
        console.error('Error deleting all active rooms:', error);
        alert('Error al eliminar las salas: ' + error.message);
      }
    }
  };

  // Función para eliminar todas las salas del doctor (solo localhost)
  const handleDeleteAllDoctorRooms = async () => {
    if (!isLocalhost) {
      alert('Esta función solo está disponible en localhost');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar TODAS tus salas? Esta acción no se puede deshacer.')) {
      try {
        const deletedCount = await videoConsultationService.deleteAllDoctorRooms(currentUser.uid);
        
        // Recargar las listas
        loadDoctorRooms();
        loadTodayRooms();
        
        showNotification(`¡${deletedCount} salas eliminadas!`, 'error');
      } catch (error) {
        console.error('Error deleting all doctor rooms:', error);
        alert('Error al eliminar las salas: ' + error.message);
      }
    }
  };

  // Interfaz principal (dashboard)
  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="video-consultation">
        <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <VideoCameraIcon className="h-7 w-7 mr-3 text-blue-600" />
                  Video Consultas
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tus consultas médicas virtuales
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl px-6 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Sistema activo</span>
                  </div>
                </div>
                
                {/* Botones de desarrollo - Solo en localhost */}
                {isLocalhost && (
                  <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl p-2">
                    <span className="text-xs text-red-600 font-medium">DEV:</span>
                    <button
                      onClick={handleDeleteAllDoctorRooms}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors flex items-center space-x-1"
                      title="Eliminar todas mis salas"
                    >
                      <TrashIcon className="h-3 w-3" />
                      <span>Mis salas</span>
                    </button>
                    <button
                      onClick={handleDeleteAllActiveRooms}
                      className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-800 transition-colors flex items-center space-x-1"
                      title="Eliminar todas las salas activas"
                    >
                      <TrashIcon className="h-3 w-3" />
                      <span>Todas activas</span>
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setShowNewRoomModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Nueva Consulta</span>
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
                        {isLocalhost && (
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Eliminar sala (Solo desarrollo)"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
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
                        {isLocalhost && (
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Eliminar sala (Solo desarrollo)"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
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
