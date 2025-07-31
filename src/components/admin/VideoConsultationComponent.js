import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { videoConsultationService } from '../../lib/videoConsultationService';
import { getConfigForUser, JITSI_CONFIG } from '../../lib/jitsiConfig';
import { 
  VideoCameraIcon, 
  PhoneIcon, 
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const VideoConsultationComponent = ({ 
  roomName, 
  onMeetingEnd, 
  onParticipantJoined,
  onParticipantLeft,
  consultationType = 'general',
  className = ""
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [jitsiAPI, setJitsiAPI] = useState(null);
  const jitsiContainerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Cargar script de Jitsi Meet
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://${JITSI_CONFIG.domain}/external_api.js`;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    let mounted = true;

    const initializeRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }

        if (!roomName) {
          throw new Error('Nombre de sala requerido');
        }

        // Validar o crear sala
        const validation = await videoConsultationService.validateRoomAccess(
          roomName, 
          currentUser.uid
        );

        if (!validation.canJoin) {
          throw new Error(validation.error || 'No tienes acceso a esta sala');
        }

        if (mounted) {
          setRoomData(validation.room);
          setParticipants(validation.room.participants || []);

          // Suscribirse a actualizaciones en tiempo real
          unsubscribeRef.current = videoConsultationService.subscribeToRoom(
            validation.room.id,
            (updatedRoom) => {
              if (mounted) {
                setRoomData(updatedRoom);
                setParticipants(updatedRoom.participants || []);
              }
            }
          );

          // Cargar Jitsi y inicializar
          await loadJitsiScript();
          if (mounted) {
            initializeJitsiMeeting(validation.room);
          }
        }

      } catch (err) {
        console.error('Error initializing room:', err);
        if (mounted) {
          setError('Error al inicializar la videoconsulta');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeRoom();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (jitsiAPI) {
        jitsiAPI.dispose();
      }
    };
  }, [roomName, currentUser]);

  const initializeJitsiMeeting = (room) => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      return;
    }

    // Configuración específica del usuario
    const userRole = currentUser?.role || 'patient';
    const userConfig = getConfigForUser(userRole, consultationType);
    
    // Configurar opciones del meeting
    const options = {
      roomName: roomName,
      ...userConfig.configOverwrite,
      parentNode: jitsiContainerRef.current,
      interfaceConfigOverwrite: {
        ...JITSI_CONFIG.defaultInterfaceConfig,
        TOOLBAR_BUTTONS: userConfig.toolbarButtons || JITSI_CONFIG.defaultInterfaceConfig.TOOLBAR_BUTTONS
      },
      userInfo: {
        displayName: currentUser.displayName || currentUser.email || 'Doctor',
        email: currentUser.email,
        avatarURL: currentUser.photoURL || '',
        ...userConfig.userInfo
      }
    };

    // Crear instancia de Jitsi
    const api = new window.JitsiMeetExternalAPI(JITSI_CONFIG.domain, options);
    setJitsiAPI(api);

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      console.log('Video conference joined');
      setMeetingStarted(true);
      
      // Marcar sala como activa
      if (room) {
        videoConsultationService.updateRoomStatus(room.id, 'active');
      }

      if (onParticipantJoined) {
        onParticipantJoined();
      }
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('Video conference left');
      setMeetingStarted(false);
      
      // Actualizar estado al salir
      if (room && currentUser) {
        videoConsultationService.leaveRoom(room.id, currentUser.uid);
      }

      if (onMeetingEnd) {
        onMeetingEnd();
      }

      if (onParticipantLeft) {
        onParticipantLeft();
      }
    });

    api.addEventListener('readyToClose', () => {
      console.log('Ready to close');
      if (onMeetingEnd) {
        onMeetingEnd();
      }
    });

    api.addEventListener('participantJoined', (participant) => {
      console.log('Participant joined:', participant);
      if (onParticipantJoined) {
        onParticipantJoined(participant);
      }
    });

    api.addEventListener('participantLeft', (participant) => {
      console.log('Participant left:', participant);
      if (onParticipantLeft) {
        onParticipantLeft(participant);
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando videoconsulta...</p>
          {roomData && (
            <p className="text-sm text-gray-500 mt-2">
              Sala: {roomData.roomName}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Error en la Videoconsulta</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header con información de la consulta */}
      {roomData && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <VideoCameraIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Videoconsulta: {roomData.patientName}
                </h3>
                <p className="text-sm text-gray-500">
                  Tipo: {roomData.consultationType} • Sala: {roomData.roomName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {roomData.scheduledTime && (
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {new Date(roomData.scheduledTime.toDate()).toLocaleTimeString()}
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-500">
                <UserIcon className="h-4 w-4 mr-1" />
                {participants.length} participante(s)
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                meetingStarted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {meetingStarted ? 'En progreso' : 'Esperando'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de Jitsi Meet */}
      <div className="relative">
        <div 
          ref={jitsiContainerRef}
          className="w-full"
          style={{ height: '600px' }}
        />
        
        {!meetingStarted && roomData && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Preparando videoconsulta
              </h3>
              <p className="text-gray-500 mb-4">
                La videoconsulta se iniciará en unos momentos...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-blue-200 rounded-full w-48 mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con controles adicionales */}
      {roomData && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>Paciente:</strong> {roomData.patientName} | 
              <strong className="ml-2">Doctor:</strong> {roomData.doctorName}
            </div>
            
            <button
              onClick={() => {
                if (jitsiAPI) {
                  jitsiAPI.executeCommand('hangup');
                }
                if (onMeetingEnd) {
                  onMeetingEnd();
                }
              }}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Finalizar Consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultationComponent;
