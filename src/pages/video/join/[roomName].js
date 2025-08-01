import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  VideoCameraIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function JoinVideoConsultation() {
  const router = useRouter();
  const { roomName, patientName, patientEmail, fromPanel } = router.query;
  const [guestName, setGuestName] = useState('');
  const [showNameForm, setShowNameForm] = useState(true);
  const [canJoin, setCanJoin] = useState(false);
  const jitsiContainerRef = useRef(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [error, setError] = useState(null);
  const jitsiApiRef = useRef(null); // Para mantener referencia del API

  useEffect(() => {
    // Si viene del panel del paciente con el nombre, saltar el formulario
    if (fromPanel === 'true' && patientName) {
      const decodedName = decodeURIComponent(patientName);
      setGuestName(decodedName);
      setShowNameForm(false);
      setCanJoin(true);
    }
  }, [fromPanel, patientName]);

  useEffect(() => {
    if (roomName && canJoin) {
      // Conectar directamente al servidor privado
      checkNetworkConnectivity();
    }
    
    // Cleanup al desmontar el componente
    return () => {
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
  }, [roomName, canJoin]);

  const checkNetworkConnectivity = async () => {
    try {
      console.log('Checking connectivity to private server...');
      
      // Primero validar acceso como paciente/invitado
      const requestBody = {
        roomName,
        userRole: fromPanel === 'true' ? 'patient' : 'guest'
      };

      // Si viene del panel, incluir información adicional
      if (fromPanel === 'true' && patientEmail) {
        requestBody.patientEmail = decodeURIComponent(patientEmail);
        requestBody.patientName = guestName;
      }

      const response = await fetch('/api/video/validate-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error validating access');
      }
      
      const { valid, message } = await response.json();
      
      if (!valid) {
        setError(message || 'No se puede acceder a la videoconsulta');
        setJitsiLoaded(true);
        return;
      }
      
      loadJitsi();
    } catch (error) {
      console.error('Network connectivity issue:', error);
      setError(error.message || 'El servidor de videoconsultas está temporalmente saturado. Por favor, intente nuevamente en unos minutos.');
      setJitsiLoaded(true);
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
        // Siempre usar el servidor privado
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
    console.log('Initializing Jitsi with private server...');
    
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
      // Con tu servidor privado configurado para acceso anónimo
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
          // Configuraciones básicas para servidor privado con acceso anónimo
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
          // Configuraciones de privacidad
          analytics: { disabled: true },
          disableDeepLinking: true,
          // Configuraciones de audio/video optimizadas
          enableNoiseCancellation: true,
          startScreenSharing: false,
          channelLastN: -1, // Mostrar todos los participantes
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'hangup', 'chat', 'desktop',
            'fullscreen', 'fodeviceselection', 'profile'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          APP_NAME: 'Doctores AR - Salud Libre',
          PROVIDER_NAME: 'Salud Libre',
          DEFAULT_LANGUAGE: 'es',
          // Configuraciones de interfaz limpias
          SHOW_CHROME_EXTENSION_BANNER: false,
          LANG_DETECTION: false,
        },
        userInfo: {
          displayName: guestName || 'Participante',
          email: fromPanel === 'true' && patientEmail ? decodeURIComponent(patientEmail) : undefined
        }
      };

      console.log('Creating Jitsi API with private server:', 'video.saludlibre.com.ar');
      const api = new window.JitsiMeetExternalAPI('video.saludlibre.com.ar', options);
      
      // Guardar referencia del API
      jitsiApiRef.current = api;
      
      api.addEventListener('readyToClose', () => {
        console.log('Video conference ended');
        router.push('/');
      });

      api.addEventListener('videoConferenceJoined', () => {
        console.log('Joined video conference successfully on private server');
        setJitsiLoaded(true);
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('Left video conference');
        router.push('/');
      });

      // Eventos básicos de manejo
      api.addEventListener('participantJoined', (participant) => {
        console.log('Participant joined:', participant);
      });

      api.addEventListener('participantKickedOut', () => {
        console.log('Participant was kicked out');
        setError('Ha sido removido de la videoconsulta.');
        setJitsiLoaded(true);
      });

      // Timeout de seguridad
      setTimeout(() => {
        console.log('Timeout reached, removing loading screen');
        setJitsiLoaded(true);
      }, 8000); // 8 seconds timeout

      console.log('Jitsi API created successfully with private server');
    } catch (error) {
      console.error('Error creating Jitsi API with private server:', error);
      setError('El servidor de videoconsultas está temporalmente saturado. Por favor, intente nuevamente en unos minutos.');
      setJitsiLoaded(true);
    }
  };

  const handleJoinClick = () => {
    if (guestName.trim()) {
      setCanJoin(true);
      setShowNameForm(false);
      setError(null);
      setJitsiLoaded(false);
    }
  };

  const openInNewTab = () => {
    // Para servidor privado, usar directamente el nombre de sala
    const displayName = guestName || 'Participante';
    const userInfo = fromPanel === 'true' && patientEmail ? 
      `${encodeURIComponent(displayName)}&userInfo.email=${encodeURIComponent(decodeURIComponent(patientEmail))}` :
      encodeURIComponent(displayName);
    
    const jitsiUrl = `https://video.saludlibre.com.ar/${roomName}#userInfo.displayName="${userInfo}"`;
    window.open(jitsiUrl, '_blank');
    router.push('/');
  };

  const handleRetry = () => {
    setError(null);
    setJitsiLoaded(false);
    if (roomName && canJoin) {
      checkNetworkConnectivity();
    }
  };

  if (showNameForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unirse a la videoconsulta
            </h2>
            <p className="text-gray-600 mb-6">
              {fromPanel === 'true' ? 
                'Accediendo desde tu panel de paciente...' :
                'Por favor ingrese su nombre para unirse'
              }
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Su nombre completo"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinClick()}
              />
              
              <button
                onClick={handleJoinClick}
                disabled={!guestName.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                Unirse a la videoconsulta
              </button>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ {fromPanel === 'true' ? 
                    'Acceso directo desde panel de paciente' :
                    'Servidor privado configurado para acceso directo'
                  }
                </p>
              </div>
            </div>
          </div>
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
                Video Consulta Médica - Salud Libre
              </h1>
              <p className="text-sm text-gray-500">
                {fromPanel === 'true' ? 'Paciente' : 'Participante'}: {guestName} | Sala: {roomName}
              </p>
              <p className="text-xs text-green-600">
                🔒 {fromPanel === 'true' ? 
                  'Acceso seguro desde panel de paciente' :
                  'Servidor privado configurado'
                }
              </p>
            </div>
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
            <h3 className="text-lg font-semibold mb-2">
              {fromPanel === 'true' ? 'Conectando automáticamente...' : 'Conectando...'}
            </h3>
            <p className="text-gray-300 mb-4">
              {fromPanel === 'true' ? 
                'Accediendo desde su panel de paciente' :
                'Conectando al servidor privado seguro'
              }
            </p>
            <div className="w-64 mx-auto bg-gray-700 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              {fromPanel === 'true' ? 
                '🔐 Información del paciente verificada' :
                '🔒 Servidor privado de Salud Libre configurado'
              }
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white max-w-md mx-4">
            {error.includes('doctor aún no ha iniciado') ? (
              <>
                <UserIcon className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                <h3 className="text-lg font-semibold mb-2">Esperando al Doctor</h3>
                <p className="text-gray-300 mb-6">{error}</p>
                <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-200">
                    💡 El doctor debe iniciar la videoconsulta primero. Una vez que se una, podrá acceder automáticamente.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleRetry}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Verificar nuevamente
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Volver al inicio
                  </button>
                </div>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-amber-400" />
                <h3 className="text-lg font-semibold mb-2">Problema de Conexión</h3>
                <p className="text-gray-300 mb-6">{error}</p>
                <div className="bg-amber-900 bg-opacity-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-amber-200">
                    ⚠️ Nuestro servidor privado está experimentando alta demanda. Esto garantiza la máxima seguridad de sus datos médicos.
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
                    onClick={() => router.push('/')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Volver al inicio
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
