import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { videoConsultationService } from '../../../lib/videoConsultationService';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FeatureProtectedRoute from '../../../components/FeatureProtectedRoute';
import {
  VideoCameraIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function DoctorVideoConsultation() {
  const router = useRouter();
  const { roomName } = router.query;
  const { currentUser } = useAuth();
  const iframeRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [dailyUrl, setDailyUrl] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const hasInitialized = useRef(false);
  const hasDoctorJoined = useRef(false);

  // Mark doctor left
  const markDoctorLeftFn = useCallback(async (room) => {
    const rd = room || roomData;
    if (rd && currentUser) {
      try {
        await videoConsultationService.markDoctorLeft(rd.id, currentUser.uid);
        console.log('Doctor departure marked, room finalized');
      } catch (err) {
        console.error('Error marking doctor departure:', err);
      }
    }
  }, [roomData, currentUser]);

  useEffect(() => {
    if (roomName && currentUser && !hasInitialized.current) {
      hasInitialized.current = true;
      validateAndJoin();
    }
    
    return () => {
      markDoctorLeftFn();
    };
  }, [roomName, currentUser]);

  // Handle beforeunload to mark doctor left
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomData && currentUser) {
        navigator.sendBeacon('/api/video/mark-left', JSON.stringify({
          roomId: roomData.id,
          doctorId: currentUser.uid,
        }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomData, currentUser]);

  const validateAndJoin = async () => {
    try {
      setIsValidating(true);
      console.log('Validating room access for doctor:', roomName);
      
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
      
      // Create room via Daily.co API
      await createDailyRoom(validation.room);
    } catch (error) {
      console.error('Error validating room access:', error);
      setError('Error al acceder a la sala. Por favor, verifica el enlace.');
      setIsValidating(false);
    }
  };

  const createDailyRoom = async (room) => {
    try {
      console.log('Creating Daily.co room...');
      
      const response = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName,
          consultationType: room.consultationType || 'general',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating Daily room');
      }

      const { room: dailyRoom } = await response.json();
      console.log('Daily.co room created:', dailyRoom.url);
      
      // Set the URL - the iframe will render via React
      setDailyUrl(dailyRoom.url);

      // Mark doctor as joined in Firestore
      try {
        const displayName = currentUser?.displayName || currentUser?.email || 'Doctor';
        await videoConsultationService.markDoctorJoined(room.id, currentUser.uid);
        await videoConsultationService.joinRoom(room.id, {
          userId: currentUser.uid,
          name: displayName,
          role: 'doctor',
          email: currentUser.email,
        });
        hasDoctorJoined.current = true;
        console.log('Doctor marked as joined in Firestore');
      } catch (err) {
        console.error('Error marking doctor joined:', err);
      }
    } catch (error) {
      console.error('Error creating Daily room:', error);
      setError('Error al crear la sala de video. Por favor, intente nuevamente.');
      setVideoLoaded(true);
    }
  };

  const handleIframeLoad = () => {
    console.log('Daily.co iframe loaded successfully');
    setVideoLoaded(true);
  };

  const handleRetry = () => {
    setError(null);
    setVideoLoaded(false);
    setDailyUrl(null);
    hasInitialized.current = false;
    hasDoctorJoined.current = false;
    if (roomName && currentUser) {
      validateAndJoin();
    }
  };

  const handleLeave = async () => {
    await markDoctorLeftFn();
    router.push('/admin/video-consultation');
  };

  // Loading validation
  if (isValidating) {
    return (
      <ProtectedRoute>
        <FeatureProtectedRoute feature="video-consultation">
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Validando acceso...</h3>
              <p className="text-gray-600">Verificando permisos de la sala</p>
            </div>
          </div>
        </FeatureProtectedRoute>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="video-consultation">
        <div className="min-h-screen bg-gray-900 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
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
                        🔒 Conexión segura - Salud Libre
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Finalizar Consulta
                </button>
                <button
                  onClick={() => router.push('/admin/video-consultation')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Volver al Panel
                </button>
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
                <h3 className="text-lg font-semibold mb-2">Conectando...</h3>
                <p className="text-gray-300 mb-4">Preparando sala de videoconsulta</p>
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
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-amber-400" />
                <h3 className="text-lg font-semibold mb-2">Error de Conexión</h3>
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
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}
