import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import VideoConsultationComponent from "../../components/admin/VideoConsultationComponent";
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
  PhoneIcon,
  XMarkIcon,
  ShareIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

export default function VideoConsultationPage() {
  const { currentUser } = useAuth();
  const [scheduledRooms, setScheduledRooms] = useState([]);
  const [todayRooms, setTodayRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [meetingStarted, setMeetingStarted] = useState(false);

  // Zustand store
  const { 
    currentRoom, 
    setCurrentRoom, 
    setMeetingEnded,
    participants
  } = useVideoConsultationStore();

  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      loadDoctorRooms();
      loadTodayRooms();
    }
  }, [currentUser]);

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

      setCurrentRoom(roomWithFullData);
      setShowNewRoomModal(false);
      setMeetingStarted(true);
      
      loadDoctorRooms();
      loadTodayRooms();
      
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error al crear la sala de videoconsulta');
    }
  };

  const handleJoinRoom = (room) => {
    setCurrentRoom(room);
    setMeetingStarted(true);
  };

  const handleMeetingEnd = () => {
    setMeetingEnded();
    setMeetingStarted(false);
    setCurrentRoom(null);
    loadDoctorRooms();
    loadTodayRooms();
  };

  const copyRoomLink = () => {
    if (currentRoom) {
      const link = `${window.location.origin}/video/join/${currentRoom.roomName}`;
      navigator.clipboard.writeText(link);
      
      // Feedback visual
      const message = document.createElement('div');
      message.textContent = '¡Enlace copiado!';
      message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(message);
      setTimeout(() => document.body.removeChild(message), 2000);
    }
  };

  // Mostrar interfaz de videoconsulta activa (90% de pantalla)
  if (currentRoom && meetingStarted) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Header compacto */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h2 className="font-semibold text-sm">
                {currentRoom.patientName || 'Paciente'} • {currentRoom.consultationType || 'General'}
              </h2>
              <p className="text-xs text-gray-300">
                {participants.length} participante(s) • {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botón sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            
            {/* Botón copiar enlace */}
            <button
              onClick={copyRoomLink}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
            
            {/* Botón finalizar */}
            <button
              onClick={handleMeetingEnd}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-1"
            >
              <PhoneIcon className="h-4 w-4" />
              <span className="text-sm">Finalizar</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Video principal - 90% de la pantalla */}
          <div className="flex-1">
            <VideoConsultationComponent
              roomName={currentRoom.roomName}
              onMeetingEnd={handleMeetingEnd}
              roomData={currentRoom}
              className="h-full w-full"
            />
          </div>

          {/* Sidebar flotante */}
          <div className={`transition-all duration-300 bg-white border-l border-gray-300 ${
            sidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}>
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Información de la Consulta</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Información del paciente */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Paciente
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Nombre:</strong> {currentRoom.patientName || 'No disponible'}</p>
                    <p><strong>Email:</strong> {currentRoom.patientEmail || 'No disponible'}</p>
                    <p><strong>Tipo:</strong> {currentRoom.consultationType || 'General'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Participantes ({participants.length})</h4>
                  <div className="space-y-1">
                    {participants.slice(0, 5).map((participant, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>{participant.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="space-y-2">
                  <button
                    onClick={copyRoomLink}
                    className="w-full p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    📱 Copiar enlace para paciente
                  </button>
                  <button className="w-full p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                    📋 Tomar notas
                  </button>
                  <button className="w-full p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                    💊 Prescribir medicamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interfaz principal (dashboard)
  return (
    <ProtectedRoute>
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

          {/* Estado actual */}
          {currentRoom && !meetingStarted && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <VideoCameraIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Sala creada: {currentRoom.patientName || 'Paciente'}
                    </h3>
                    <p className="text-sm text-blue-700">Lista para comenzar la videoconsulta</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyRoomLink}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Copiar enlace
                  </button>
                  <button
                    onClick={() => handleJoinRoom(currentRoom)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Comenzar consulta
                  </button>
                </div>
              </div>
            </div>
          )}

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
                      <button
                        onClick={() => handleJoinRoom(room)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Unirse
                      </button>
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
                      <button
                        onClick={() => handleJoinRoom(room)}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Unirse
                      </button>
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
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
