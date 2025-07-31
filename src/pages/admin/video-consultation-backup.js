import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import VideoConsultationComponent from "../../components/admin/VideoConsultationComponent";
import NewVideoConsultationModal from "../../components/admin/NewVideoConsultationModal";
import ShareVideoConsultationLink from "../../components/admin/ShareVideoConsultationLink";
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
  UsersIcon,
  ShareIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

// Video Call Interface Skeleton - usado cuando no hay sala activa
const VideoCallSkeleton = () => (
  <div className="bg-gray-900 rounded-xl overflow-hidden h-96 flex items-center justify-center">
    <div className="text-center text-white">
      <VideoCameraIcon className="h-24 w-24 mx-auto mb-4 text-gray-500" />
      <h3 className="text-xl font-semibold mb-2">No hay videoconsulta activa</h3>
      <p className="text-gray-400 mb-6">Crea una nueva consulta para comenzar</p>
    </div>
  </div>
);

export default function VideoConsultationPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("live");
  const [scheduledRooms, setScheduledRooms] = useState([]);
  const [todayRooms, setTodayRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Zustand store
  const { 
    currentRoom, 
    setCurrentRoom, 
    setMeetingEnded,
    isInMeeting,
    meetingStatus,
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

      // Asegurar que tenemos todos los datos necesarios
      const roomWithFullData = {
        ...newRoom,
        patientName: roomData.patientName,
        patientEmail: roomData.patientEmail,
        consultationType: roomData.consultationType || 'general'
      };

      setCurrentRoom(roomWithFullData);
      setActiveTab('live');
      setShowNewRoomModal(false);
      
      // Recargar listas
      loadDoctorRooms();
      loadTodayRooms();

      // TODO: Enviar notificación al paciente con el enlace
      console.log('Enlace para el paciente:', `${window.location.origin}/video/join/${roomName}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error al crear la sala de videoconsulta');
    }
  };

  const handleJoinRoom = (room) => {
    setCurrentRoom(room);
    setActiveTab('live');
  };

  const handleMeetingEnd = () => {
    setMeetingEnded(); // Limpiar el store de Zustand
    setActiveTab('scheduled'); // Cambiar a vista de programadas
    // Recargar datos después de terminar la reunión
    loadDoctorRooms();
    loadTodayRooms();
  };

  const tabs = [
    { id: "live", name: "En Vivo", icon: VideoCameraIcon },
    { id: "scheduled", name: "Programadas", icon: CalendarIcon },
  ];

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

              {/* Coming Soon Banner - Removed */}
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl px-6 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">
                      Sistema activo y funcional
                    </span>
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

          {/* Tab Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content con Layout Dinámico */}
          {activeTab === "live" && (
            <>
              {currentRoom && (isInMeeting || meetingStatus === 'active') ? (
                // MODO VIDEOCONSULTA ACTIVA - 90% de la pantalla para video
                <div className="min-h-screen -m-6 bg-gray-900">
                  {/* Mini header compacto */}
                  <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <h2 className="text-lg font-semibold">
                          Consulta con {currentRoom.patientName || 'Paciente'}
                        </h2>
                        <p className="text-sm text-gray-300">
                          {currentRoom.consultationType || 'General'} • {participants.length} participantes
                        </p>
                      </div>
                    </div>
                    
                    {/* Controles compactos */}
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-300">
                        {new Date().toLocaleTimeString()}
                      </div>
                      
                      {/* Botón copiar enlace compacto */}
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}/video/join/${currentRoom.roomName}`;
                          navigator.clipboard.writeText(link);
                          // Mostrar feedback visual
                          const btn = event.target.closest('button');
                          const originalText = btn.innerHTML;
                          btn.innerHTML = '✓ Copiado';
                          setTimeout(() => btn.innerHTML = originalText, 2000);
                        }}
                        className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
                      >
                        📱 Enlace
                      </button>
                      
                      {/* Botón minimizar */}
                      <button
                        onClick={() => {
                          setActiveTab('live');
                          // Opcional: cambiar a modo normal
                        }}
                        className="text-sm bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded transition-colors"
                      >
                        ⬇️ Minimizar
                      </button>
                      
                      {/* Botón finalizar */}
                      <button
                        onClick={handleMeetingEnd}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center"
                      >
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        Finalizar
                      </button>
                    </div>
                  </div>

                  {/* Video principal - 90% de la pantalla */}
                  <div className="px-2 py-2">
                    <VideoConsultationComponent
                      roomName={currentRoom.roomName}
                      onMeetingEnd={handleMeetingEnd}
                      roomData={currentRoom}
                      className="h-[calc(100vh-100px)] w-full" // Ocupa casi toda la pantalla
                    />
                  </div>

                  {/* Panel lateral flotante con información esencial */}
                  <div className={`fixed top-20 right-4 transition-all duration-300 z-10 ${
                    sidebarCollapsed ? 'w-12' : 'w-80'
                  }`}>
                    {/* Botón toggle sidebar */}
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="absolute top-4 -left-4 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-20"
                    >
                      {sidebarCollapsed ? '→' : '←'}
                    </button>

                    {!sidebarCollapsed && (
                      <div className="max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200">
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                            Información del Paciente
                          </h4>
                          
                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-gray-600">Nombre:</p>
                              <p className="font-medium">{currentRoom.patientName || 'Paciente'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Email:</p>
                              <p className="font-medium">{currentRoom.patientEmail || 'No disponible'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Tipo de consulta:</p>
                              <p className="font-medium">{currentRoom.consultationType || 'General'}</p>
                            </div>
                            {currentRoom.scheduledTime && (
                              <div>
                                <p className="text-gray-600">Hora programada:</p>
                                <p className="font-medium">
                                  {new Date(currentRoom.scheduledTime.toDate()).toLocaleTimeString()}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Participantes activos */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                              <UsersIcon className="h-4 w-4 mr-2 text-green-500" />
                              Participantes ({participants.length})
                            </h5>
                            <div className="space-y-2">
                              {participants.slice(0, 5).map((participant, index) => (
                                <div key={index} className="flex items-center text-sm">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                  <span>{participant.name}</span>
                                </div>
                              ))}
                              {participants.length > 5 && (
                                <p className="text-xs text-gray-500">+{participants.length - 5} más</p>
                              )}
                            </div>
                          </div>

                          {/* Acciones rápidas */}
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                            <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                              📋 Tomar notas
                            </button>
                            <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                              📁 Ver historial
                            </button>
                            <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                              💊 Prescribir medicamento
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                        Información del Paciente
                      </h4>
                      
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600">Nombre:</p>
                          <p className="font-medium">{currentRoom.patientName || 'Paciente'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email:</p>
                          <p className="font-medium">{currentRoom.patientEmail || 'No disponible'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tipo de consulta:</p>
                          <p className="font-medium">{currentRoom.consultationType || 'General'}</p>
                        </div>
                        {currentRoom.scheduledTime && (
                          <div>
                            <p className="text-gray-600">Hora programada:</p>
                            <p className="font-medium">
                              {new Date(currentRoom.scheduledTime.toDate()).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Participantes activos */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <UsersIcon className="h-4 w-4 mr-2 text-green-500" />
                          Participantes ({participants.length})
                        </h5>
                        <div className="space-y-2">
                          {participants.slice(0, 5).map((participant, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span>{participant.name}</span>
                            </div>
                          ))}
                          {participants.length > 5 && (
                            <p className="text-xs text-gray-500">+{participants.length - 5} más</p>
                          )}
                        </div>
                      </div>

                      {/* Acciones rápidas */}
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                          📋 Tomar notas
                        </button>
                        <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                          📁 Ver historial
                        </button>
                        <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                          � Prescribir medicamento
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODO NORMAL - Layout estándar */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Video Area */}
                  <div className="lg:col-span-2 space-y-6">
                    {currentRoom ? (
                      <div className="bg-gray-900 rounded-xl overflow-hidden h-96">
                        <VideoConsultationComponent
                          roomName={currentRoom.roomName}
                          onMeetingEnd={handleMeetingEnd}
                          roomData={currentRoom}
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <VideoCallSkeleton />
                    )}
                    
                    {/* Today's Scheduled Rooms */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                          Consultas de Hoy
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {todayRooms.length} programadas
                        </span>
                      </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="animate-pulse">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                              <div>
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                            <div className="h-8 w-20 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : todayRooms.length > 0 ? (
                    <div className="space-y-4">
                      {todayRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserGroupIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {room.patientName || `Paciente ID: ${room.patientId}`}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <ClockIcon className="h-4 w-4" />
                                <span>
                                  {room.scheduledTime 
                                    ? new Date(room.scheduledTime.toDate()).toLocaleTimeString()
                                    : 'Inmediata'
                                  }
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  room.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : room.status === 'scheduled'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {room.status === 'active' ? 'Activa' : 
                                   room.status === 'scheduled' ? 'Programada' : room.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleJoinRoom(room)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                              <VideoCameraIcon className="h-4 w-4" />
                              <span>Unirse</span>
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
                  </div>



              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <VideoCameraIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Acciones Rápidas
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowNewRoomModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Nueva Consulta
                    </button>
                    <button 
                      onClick={() => setActiveTab('scheduled')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Ver Programadas
                    </button>
                  </div>
                </div>

                {/* Current Room Info */}
                {currentRoom && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-green-500" />
                      Consulta Actual
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Paciente:</p>
                        <p className="font-medium">{currentRoom.patientName || currentRoom.patientId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo:</p>
                        <p className="font-medium capitalize">{currentRoom.consultationType || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estado:</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          currentRoom.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentRoom.status === 'active' ? 'En curso' : 'Programada'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const roomUrl = `${window.location.origin}/video/join/${currentRoom.roomName}`;
                          navigator.clipboard.writeText(roomUrl);
                          alert('Enlace copiado al portapapeles');
                        }}
                        className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        Copiar enlace para paciente
                      </button>
                    </div>
                  </div>
                )}

                {/* Share Component */}
                {currentRoom && (
                  <ShareVideoConsultationLink
                    roomName={currentRoom.roomName}
                    patientName={currentRoom.patientName || currentRoom.patientId}
                    scheduledTime={currentRoom.scheduledTime}
                  />
                )}

                {/* Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Estadísticas</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hoy:</span>
                      <span className="font-medium">{todayRooms.length} consultas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Programadas:</span>
                      <span className="font-medium">{scheduledRooms.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Activas:</span>
                      <span className="font-medium text-green-600">
                        {scheduledRooms.filter(r => r.status === 'active').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
                </div>
          )}
          </> 
          )

          {activeTab === "scheduled" && (
            <div className="space-y-6">
              {/* Scheduled Consultations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Video Consultas Programadas
                  </h3>
                  <button
                    onClick={() => setShowNewRoomModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Nueva</span>
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="animate-pulse">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                            <div>
                              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : scheduledRooms.length > 0 ? (
                  <div className="space-y-4">
                    {scheduledRooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <VideoCameraIcon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {room.patientName || `Paciente ID: ${room.patientId}`}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <ClockIcon className="h-4 w-4" />
                              <span>
                                {room.scheduledTime 
                                  ? new Date(room.scheduledTime.toDate()).toLocaleString()
                                  : 'No programada'
                                }
                              </span>
                              {room.consultationType && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                  {room.consultationType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            room.status === 'scheduled' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : room.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {room.status === 'scheduled' ? 'Programada' : 
                             room.status === 'active' ? 'Activa' : room.status}
                          </span>
                          <button
                            onClick={() => handleJoinRoom(room)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <VideoCameraIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay consultas programadas</p>
                    <button
                      onClick={() => setShowNewRoomModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Crear primera consulta
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Consultas Hoy",
                    value: todayRooms.length.toString(),
                    icon: CalendarIcon,
                    color: "blue",
                  },
                  {
                    title: "Total Programadas",
                    value: scheduledRooms.length.toString(),
                    icon: ClockIcon,
                    color: "green",
                  },
                  {
                    title: "En Progreso",
                    value: scheduledRooms.filter(r => r.status === 'active').length.toString(),
                    icon: UserGroupIcon,
                    color: "purple",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                      >
                        <stat.icon
                          className={`h-6 w-6 text-${stat.color}-600`}
                        />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        {/* New Video Consultation Modal */}
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
