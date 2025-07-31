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
  const jitsiContainerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Obtener configuración basada en el rol del usuario
  const userRole = currentUser?.role || 'patient';
  const jitsiConfig = getConfigForUser(userRole, consultationType);

  // Información del usuario para Jitsi
  const userInfo = {
    displayName: currentUser?.displayName || currentUser?.email || 'Usuario',
    email: currentUser?.email || '',
    avatarURL: currentUser?.photoURL || '',
    ...jitsiConfig.userInfo
  };

  useEffect(() => {
    let mounted = true;

    const initializeRoom = async () => {
      if (!roomName || !currentUser) return;

      try {
        setIsLoading(true);
        setError(null);

        // Validar acceso a la sala
        const userRole = currentUser.role || 'patient';
        const validation = await videoConsultationService.validateRoomAccess(
          roomName, 
          currentUser.uid, 
          userRole
        );

        if (!validation.valid) {
          setError(validation.message);
          return;
        }

        if (mounted) {
          setRoomData(validation.room);

          // Suscribirse a cambios en tiempo real
          unsubscribeRef.current = videoConsultationService.subscribeToRoom(
            validation.room.id,
            (updatedRoom) => {
              if (mounted) {
                setRoomData(updatedRoom);
                setParticipants(updatedRoom.participants || []);
              }
            }
          );
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
    };
  }, [roomName, currentUser]);

  // Manejar eventos de Jitsi
  const handleApiReady = (apiObj) => {
    console.log('Jitsi API ready');
    
    // Eventos de participantes
    apiObj.addEventListeners({
      participantJoined: (participant) => {
        console.log('Participant joined:', participant);
        
        // Actualizar en Firebase
        if (roomData && currentUser) {
          videoConsultationService.joinRoom(roomData.id, {
            userId: currentUser.uid,
            displayName: participant.displayName || userInfo.displayName,
            email: currentUser.email,
            role: currentUser.role || 'patient'
          });
        }

        if (onParticipantJoined) {
          onParticipantJoined(participant);
        }
      },

      participantLeft: (participant) => {
        console.log('Participant left:', participant);
        
        // Actualizar en Firebase
        if (roomData && currentUser) {
          videoConsultationService.leaveRoom(roomData.id, currentUser.uid);
        }

        if (onParticipantLeft) {
          onParticipantLeft(participant);
        }
      },

      videoConferenceJoined: () => {
        console.log('Video conference joined');
        setMeetingStarted(true);
        
        // Marcar sala como activa
        if (roomData) {
          videoConsultationService.updateRoomStatus(roomData.id, 'active');
        }
      },

      videoConferenceLeft: () => {
        console.log('Video conference left');
        setMeetingStarted(false);
        
        // Actualizar estado al salir
        if (roomData && currentUser) {
          videoConsultationService.leaveRoom(roomData.id, currentUser.uid);
        }

        if (onMeetingEnd) {
          onMeetingEnd();
        }
      },

      readyToClose: () => {
        console.log('Ready to close');
        if (onMeetingEnd) {
          onMeetingEnd();
        }
      }
    });
  };

  const handleGetIFrameRef = (iframeRef) => {
    if (iframeRef) {
      iframeRef.style.height = '100%';
      iframeRef.style.width = '100%';
      iframeRef.style.border = 'none';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center text-white">
          <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-lg font-medium mb-2">Iniciando videoconsulta...</p>
          <p className="text-sm text-gray-300">Por favor espere</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="text-center text-red-700">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2">Error en la videoconsulta</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center text-gray-700">
          <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Sala no encontrada</p>
          <p className="text-sm text-gray-500">Verifique el enlace de la videoconsulta</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full ${className}`}>
      {/* Información de la sala */}
      {roomData && (
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {participants.length} participante{participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Componente de Jitsi */}
      <div ref={jitsiContainerRef} className="h-full w-full">
        <JitsiMeeting
          domain={jitsiConfig.domain}
          roomName={roomName}
          configOverwrite={jitsiConfig.configOverwrite}
          interfaceConfigOverwrite={jitsiConfig.interfaceConfigOverwrite}
          userInfo={userInfo}
          onApiReady={handleApiReady}
          getIFrameRef={handleGetIFrameRef}
          lang="es"
        />
      </div>
    </div>
  );
};

export default VideoConsultationComponent;
