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
  className = "",
  roomData: initialRoomData = null, // Datos de la sala si ya los tenemos
  guestName = null // Nombre para usuarios invitados
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
        script.src = 'https://video.saludlibre.com.ar/external_api.js';
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
          // Para usuarios no autenticados (pacientes), crear un usuario temporal
          console.log('Usuario no autenticado, permitiendo acceso como invitado');
        }

        if (!roomName) {
          throw new Error('Nombre de sala requerido');
        }

        let room;
        
        // Si ya tenemos los datos de la sala, usarlos directamente
        if (initialRoomData && initialRoomData.roomName === roomName) {
          room = initialRoomData;
        } else {
          // Validar acceso con retry para casos de eventual consistency
          let retries = 3;
          let lastError;
          
          while (retries > 0) {
            try {
              const validation = await videoConsultationService.validateRoomAccess(
                roomName, 
                currentUser ? currentUser.uid : 'guest',
                currentUser ? 'doctor' : 'patient' // Asumimos que en el admin es un doctor, sino paciente
              );

              if (!validation.valid) {
                throw new Error(validation.message || 'No tienes acceso a esta sala');
              }
              
              room = validation.room;
              break; // Salir del loop si fue exitoso
            } catch (err) {
              lastError = err;
              retries--;
              
              if (retries > 0) {
                // Esperar antes del siguiente intento (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
              }
            }
          }
          
          if (!room) {
            throw lastError || new Error('No se pudo validar el acceso a la sala');
          }
        }

        if (mounted) {
          setRoomData(room);
          setParticipants(room.participants || []);

          // Suscribirse a actualizaciones en tiempo real
          unsubscribeRef.current = videoConsultationService.subscribeToRoom(
            room.id,
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
            initializeJitsiMeeting(room);
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
  }, [roomName, currentUser, initialRoomData]);

  const initializeJitsiMeeting = (room) => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      console.error('Jitsi container or API not available');
      return;
    }

    // Limpiar el contenedor antes de crear nueva instancia
    jitsiContainerRef.current.innerHTML = '';

    // Configuración específica del usuario
    const userRole = currentUser ? 'doctor' : 'patient'; // Si no hay currentUser, es paciente
    
    // Configurar opciones del meeting con configuración más simple y directa
    const options = {
      roomName: roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false, // Crucial: saltar pre-join
        enableWelcomePage: false,
        enableClosePage: false,
        disablePolls: false,
        disableInviteFunctions: false,
        doNotStoreRoom: false,
        enableAutomaticUrlCopy: false,
        startScreenSharing: false,
        enableEmailInStats: false,
        enableNoAudioDetection: true,
        enableNoisyCancellation: true,
        channelLastN: -1, // Mostrar todos los participantes
        p2p: {
          enabled: true
        },
        analytics: {
          disabled: true
        },
        defaultLanguage: 'es'
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat',
          'settings', 'raisehand', 'videoquality', 'filmstrip'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        DEFAULT_BACKGROUND: '#1a1a1a',
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        LANG_DETECTION: false,
        DEFAULT_LANGUAGE: 'es',
        APP_NAME: 'Doctores AR'
      },
      userInfo: {
        displayName: currentUser ? 
          (currentUser.displayName || currentUser.email || 'Doctor') :
          (guestName || 'Paciente'),
        email: currentUser ? currentUser.email || '' : '',
        avatarURL: currentUser ? currentUser.photoURL || '' : ''
      }
    };

    // Crear instancia de Jitsi
    console.log('Creating Jitsi meeting with options:', { 
      roomName, 
      domain: 'video.saludlibre.com.ar',
      containerReady: !!jitsiContainerRef.current,
      userInfo: options.userInfo
    });
    
    try {
      const api = new window.JitsiMeetExternalAPI('video.saludlibre.com.ar', options);
      setJitsiAPI(api);

      // Immediately remove loading state when API is created
      setIsLoading(false);
      
      console.log('Jitsi API created successfully, iframe should be visible now');

      // Event listeners simplificados
      api.addEventListener('readyToClose', () => {
        console.log('Ready to close');
        if (onMeetingEnd) {
          onMeetingEnd();
        }
      });

      // Evento cuando el usuario se une a la conferencia
      api.addEventListener('videoConferenceJoined', (participant) => {
        console.log('User joined video conference:', participant);
        setMeetingStarted(true);
        
        // Marcar sala como activa y agregar participante
        if (room && currentUser) {
          videoConsultationService.updateRoomStatus(room.id, 'active');
          videoConsultationService.joinRoom(room.id, {
            userId: currentUser.uid,
            name: currentUser.displayName || currentUser.email || 'Doctor',
            role: 'doctor',
            email: currentUser.email
          });
        } else if (room) {
          // Usuario invitado (paciente sin autenticación)
          videoConsultationService.updateRoomStatus(room.id, 'active');
          videoConsultationService.joinRoom(room.id, {
            userId: 'guest_' + Date.now(),
            name: guestName || 'Paciente',
            role: 'patient',
            email: ''
          });
        }

        if (onParticipantJoined) {
          onParticipantJoined(participant);
        }
      });

      // Evento cuando el usuario sale de la conferencia
      api.addEventListener('videoConferenceLeft', () => {
        console.log('User left video conference');
        setMeetingStarted(false);
        
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

      // Eventos básicos para otros participantes
      api.addEventListener('participantJoined', (participant) => {
        console.log('Other participant joined:', participant);
        if (onParticipantJoined) {
          onParticipantJoined(participant);
        }
      });

      api.addEventListener('participantLeft', (participant) => {
        console.log('Other participant left:', participant);
        if (onParticipantLeft) {
          onParticipantLeft(participant);
        }
      });

      // Fallback para asegurar que el loading se quite
      setTimeout(() => {
        console.log('Fallback timeout - ensuring loading is removed');
        setIsLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating Jitsi meeting:', error);
      setError('Error al inicializar la videoconsulta');
      setIsLoading(false);
    }
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

  const isFullscreen = className.includes('calc(100vh');

  return (
    <div className={`bg-white ${isFullscreen ? '' : 'rounded-lg shadow-sm border border-gray-200'} ${className}`}>
      {/* Header con información de la consulta - Solo mostrar si no está en pantalla completa */}
      {roomData && !isFullscreen && (
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
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <div 
          ref={jitsiContainerRef}
          className="w-full bg-gray-900"
          style={{ 
            height: className.includes('calc(100vh') ? 'calc(100vh - 100px)' : '600px',
            minHeight: '400px',
            position: 'relative'
          }}
        />
        
        {/* Overlay de loading solo mientras se inicializa Jitsi */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Iniciando videoconsulta
              </h3>
              <p className="text-gray-400 mb-4">
                Conectando con video.saludlibre.com.ar...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-blue-600 rounded-full w-48 mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con controles adicionales - Solo mostrar si no está en pantalla completa */}
      {roomData && !isFullscreen && (
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
