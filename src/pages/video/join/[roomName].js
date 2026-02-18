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
  const iframeRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [dailyUrl, setDailyUrl] = useState(null);
  const [error, setError] = useState(null);
  const hasInitialized = useRef(false);

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
    if (roomName && canJoin && !hasInitialized.current) {
      hasInitialized.current = true;
      checkAndJoin();
    }
  }, [roomName, canJoin]);

  const checkAndJoin = async () => {
    try {
      console.log('Validating access for patient/guest...');
      
      const requestBody = {
        roomName,
        userRole: fromPanel === 'true' ? 'patient' : 'guest'
      };

      if (fromPanel === 'true' && patientEmail) {
        requestBody.patientEmail = decodeURIComponent(patientEmail);
        requestBody.patientName = guestName;
      }

      const response = await fetch('/api/video/validate-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error validating access');
      }
      
      const { valid, message } = await response.json();
      
      if (!valid) {
        setError(message || 'No se puede acceder a la videoconsulta');
        setVideoLoaded(true);
        return;
      }
      
      // Create/get room in Daily.co
      await createAndJoinDailyRoom();
    } catch (error) {
      console.error('Access validation error:', error);
      setError(error.message || 'Error al acceder a la videoconsulta. Por favor, intente nuevamente.');
      setVideoLoaded(true);
    }
  };

  const createAndJoinDailyRoom = async () => {
    try {
      const response = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });

      if (!response.ok) {
        throw new Error('Error al preparar la sala de video');
      }

      const { room } = await response.json();
      console.log('Daily.co room ready:', room.url);
      
      // Set URL - iframe renders via React
      setDailyUrl(room.url);
    } catch (error) {
      console.error('Error creating Daily room:', error);
      setError('Error al preparar la sala de video. Por favor, intente nuevamente.');
      setVideoLoaded(true);
    }
  };

  const handleIframeLoad = () => {
    console.log('Daily.co iframe loaded successfully for patient');
    setVideoLoaded(true);
  };

  const handleJoinClick = () => {
    if (guestName.trim()) {
      setCanJoin(true);
      setShowNameForm(false);
      setError(null);
      setVideoLoaded(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setVideoLoaded(false);
    setDailyUrl(null);
    hasInitialized.current = false;
    if (roomName && canJoin) {
      checkAndJoin();
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
                    'Conexión segura configurada'
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
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
                  'Conexión segura'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video iframe container */}
      <div className="flex-1 relative">
        {dailyUrl && (
          <iframe
            ref={iframeRef}
            src={dailyUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            onLoad={handleIframeLoad}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        )}
      </div>

      {/* Loading overlay */}
      {!videoLoaded && !error && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-blue-400 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">
              {fromPanel === 'true' ? 'Conectando automáticamente...' : 'Conectando...'}
            </h3>
            <p className="text-gray-300 mb-4">
              {fromPanel === 'true' ? 
                'Accediendo desde su panel de paciente' :
                'Preparando sala de videoconsulta'
              }
            </p>
            <div className="w-64 mx-auto bg-gray-700 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              🔒 Conexión segura de Salud Libre
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
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
                    ⚠️ Si el problema persiste, recargue la página o intente en unos minutos.
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
