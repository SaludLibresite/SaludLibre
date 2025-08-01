import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { videoConsultationService } from '../../../lib/videoConsultationService';
import {
  VideoCameraIcon,
  UserIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function DoctorVideoConsultation() {
  const router = useRouter();
  const { roomName } = router.query;
  const { currentUser } = useAuth();
  const jitsiContainerRef = useRef(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const jitsiApiRef = useRef(null); // Para mantener referencia del API

  useEffect(() => {
    if (roomName && currentUser) {
      validateAndJoin();
    }
    
    // Cleanup al desmontar el componente
    return () => {
      console.log('Component unmounting, cleaning up...');
      
      // Marcar que el doctor salió
      if (roomData && currentUser) {
        videoConsultationService.markDoctorLeft(roomData.id, currentUser.uid)
          .catch(error => console.error('Error marking doctor left on unmount:', error));
      }
      
      // Limpiar Jitsi API
      if (jitsiApiRef.current) {
        console.log('Cleaning up Jitsi API on unmount');
        try {
          jitsiApiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
        jitsiApiRef.current = null;
      }
    };
  }, [roomName, currentUser, roomData]);

  const validateAndJoin = async () => {
    try {
      setIsValidating(true);
      console.log('Validating room access for doctor:', roomName);
      
      // Validar acceso del doctor a la sala
      const validation = await videoConsultationService.validateRoomAccess(
        roomName, 
        currentUser.uid,
        'doctor'
      );

      if (!validation.valid) {
        setError('No tienes acceso a esta sala de videoconsulta.');
        setIsValidating(false);
        return;
      }

      setRoomData(validation.room);
      setIsValidating(false);
      
      // Cargar Jitsi después de validar
      loadJitsi();
    } catch (error) {
      console.error('Error validating room access:', error);
      setError('Error al acceder a la sala. Por favor, verifica el enlace.');
      setIsValidating(false);
    }
  };

  const loadJitsi = async () => {
    try {
      console.log('Loading Jitsi Meet API from private server...');
      
      if (!window.JitsiMeetExternalAPI) {
        // Verificar si ya hay un script cargándose
        const existingScript = document.querySelector('script[src="https://video.saludlibre.com.ar/external_api.js"]');
        if (existingScript) {
          console.log('Jitsi script already loading, waiting...');
          // Esperar a que termine de cargar
          existingScript.onload = () => {
            console.log('Existing script loaded successfully');
            initializeJitsi();
          };
          return;
        }
        
        console.log('Jitsi API not found, loading script from private server...');
        const script = document.createElement('script');
        script.src = 'https://video.saludlibre.com.ar/external_api.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Jitsi script loaded successfully from private server');
          initializeJitsi();
        };
        
        script.onerror = (error) => {
          console.error('Error loading Jitsi script from private server:', error);
          setError('El servidor de videoconsultas está temporalmente saturado. Por favor, intente nuevamente en unos minutos.');
          setJitsiLoaded(true);
        };
        
        document.head.appendChild(script);
      } else {
        console.log('Jitsi API already available');
        initializeJitsi();
      }
    } catch (error) {
      console.error('Error loading Jitsi:', error);
      setError('El servidor de videoconsultas está temporalmente saturado. Por favor, intente nuevamente en unos minutos.');
      setJitsiLoaded(true);
    }
  };

  const initializeJitsi = () => {
    console.log('Initializing Jitsi with private server for doctor...');
    
    // Limpiar cualquier instancia previa
    if (jitsiApiRef.current) {
      console.log('Disposing previous Jitsi API instance');
      try {
        jitsiApiRef.current.dispose();
      } catch (error) {
        console.error('Error disposing previous Jitsi API:', error);
      }
      jitsiApiRef.current = null;
    }
    
    if (!jitsiContainerRef.current) {
      console.error('Jitsi container not found');
      setError('Error: No se pudo inicializar el contenedor de video.');
      setJitsiLoaded(true);
      return;
    }

    // Limpiar el contenedor
    jitsiContainerRef.current.innerHTML = '';

    if (!window.JitsiMeetExternalAPI) {
      console.error('JitsiMeetExternalAPI not available');
      setError('Error: API de Jitsi no disponible.');
      setJitsiLoaded(true);
      return;
    }

    if (!roomName) {
      console.error('Room name not available');
      setError('Error: Nombre de sala no disponible.');
      setJitsiLoaded(true);
      return;
    }

    console.log('Initializing Jitsi with room:', roomName);

    try {
      const finalRoomName = roomName;
      console.log('Using room name for private server:', finalRoomName);

      const options = {
        roomName: finalRoomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
          // Configuraciones adicionales para doctor
          enableNoiseCancellation: true,
          startScreenSharing: false,
          channelLastN: -1,
          analytics: { disabled: true },
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'hangup', 'chat', 'desktop',
            'fullscreen', 'fodeviceselection', 'profile', 'raisehand',
            'settings', 'videoquality', 'filmstrip'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          APP_NAME: 'Doctores AR - Salud Libre',
          PROVIDER_NAME: 'Salud Libre',
          DEFAULT_LANGUAGE: 'es',
          SHOW_CHROME_EXTENSION_BANNER: false,
          LANG_DETECTION: false,
        },
        userInfo: {
          displayName: currentUser?.displayName || currentUser?.email || 'Doctor'
        }
      };

      console.log('Creating Jitsi API with private server:', 'video.saludlibre.com.ar');
      const api = new window.JitsiMeetExternalAPI('video.saludlibre.com.ar', options);
      
      // Guardar referencia del API
      jitsiApiRef.current = api;
      
      api.addEventListener('videoConferenceJoined', async () => {
        console.log('Doctor joined video conference successfully on private server');
        setJitsiLoaded(true);
        
        // Marcar que el doctor se unió a la sala
        if (roomData) {
          try {
            await videoConsultationService.markDoctorJoined(roomData.id, currentUser.uid);
            await videoConsultationService.joinRoom(roomData.id, {
              userId: currentUser.uid,
              name: currentUser.displayName || currentUser.email || 'Doctor',
              role: 'doctor',
              email: currentUser.email
            });
            console.log('Doctor presence marked in room');
          } catch (error) {
            console.error('Error marking doctor presence:', error);
          }
        }
      });

      api.addEventListener('videoConferenceLeft', async () => {
        console.log('Doctor left video conference');
        
        // Marcar que el doctor salió y finalizar la sala
        if (roomData) {
          try {
            await videoConsultationService.markDoctorLeft(roomData.id, currentUser.uid);
            console.log('Doctor departure marked, room finalized');
          } catch (error) {
            console.error('Error marking doctor departure:', error);
          }
        }
        
        router.push('/admin/video-consultation');
      });

      api.addEventListener('readyToClose', async () => {
        console.log('Video conference ended');
        
        // Asegurar que la sala se marca como finalizada
        if (roomData) {
          try {
            await videoConsultationService.markDoctorLeft(roomData.id, currentUser.uid);
          } catch (error) {
            console.error('Error finalizing room on close:', error);
          }
        }
        
        router.push('/admin/video-consultation');
      });

      // Eventos de participantes
      api.addEventListener('participantJoined', (participant) => {
        console.log('Participant joined:', participant);
      });

      api.addEventListener('participantLeft', (participant) => {
        console.log('Participant left:', participant);
      });

      // Timeout de seguridad
      setTimeout(() => {
        console.log('Timeout reached, removing loading screen');
        setJitsiLoaded(true);
      }, 8000);

      console.log('Jitsi API created successfully with private server');
    } catch (error) {
      console.error('Error creating Jitsi API with private server:', error);
      setError('El servidor de videoconsultas está temporalmente saturado. Por favor, intente nuevamente en unos minutos.');
      setJitsiLoaded(true);
    }
  };

  const handleRetry = () => {
    setError(null);
    setJitsiLoaded(false);
    if (roomName && currentUser) {
      loadJitsi();
    }
  };

  const openInNewTab = () => {
    const jitsiUrl = `https://video.saludlibre.com.ar/${roomName}#userInfo.displayName="${encodeURIComponent(currentUser?.displayName || currentUser?.email || 'Doctor')}"`;
    window.open(jitsiUrl, '_blank');
    router.push('/admin/video-consultation');
  };

  // Loading validation
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Validando acceso...</h3>
          <p className="text-gray-600">Verificando permisos de la sala</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <VideoCameraIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Video Consulta Médica - Panel Doctor
              </h1>
              {roomData && (
                <div className="text-sm text-gray-500">
                  <p>Paciente: {roomData.patientName} | Sala: {roomName}</p>
                  <p className="text-xs text-green-600">
                    🔒 Servidor privado de Salud Libre
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/video-consultation')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al Panel
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={jitsiContainerRef}
        className="h-[calc(100vh-80px)] bg-gray-900"
        style={{ width: '100%', height: 'calc(100vh - 80px)' }}
      />

      {!jitsiLoaded && !error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-blue-400 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Conectando...</h3>
            <p className="text-gray-300 mb-4">Conectando al servidor privado seguro</p>
            <div className="w-64 mx-auto bg-gray-700 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              🔒 Servidor privado de Salud Libre configurado
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white max-w-md mx-4">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-amber-400" />
            <h3 className="text-lg font-semibold mb-2">Error de Conexión</h3>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="bg-amber-900 bg-opacity-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-amber-200">
                ⚠️ Servidor privado de Salud Libre - Máxima seguridad para datos médicos
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar conexión
              </button>
              <button
                onClick={openInNewTab}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Abrir en nueva pestaña
              </button>
              <button
                onClick={() => router.push('/admin/video-consultation')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Volver al Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
