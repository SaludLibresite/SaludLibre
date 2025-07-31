import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import VideoConsultationComponent from '../../../components/admin/VideoConsultationComponent';
import { useAuth } from '../../../context/AuthContext';
import { videoConsultationService } from '../../../lib/videoConsultationService';
import {
  VideoCameraIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function JoinVideoConsultation() {
  const router = useRouter();
  const { roomName } = router.query;
  const { currentUser, loading: authLoading } = useAuth();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (roomName && !authLoading) {
      validateAndLoadRoom();
    }
  }, [roomName, currentUser, authLoading]);

  const validateAndLoadRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!roomName) {
        setError('Nombre de sala no válido');
        return;
      }

      // Obtener información de la sala
      const room = await videoConsultationService.getVideoRoomByName(roomName);
      
      if (!room) {
        setError('Sala de videoconsulta no encontrada');
        return;
      }

      setRoomData(room);

      // Si el usuario está autenticado, validar acceso
      if (currentUser) {
        const userRole = currentUser.role || 'patient';
        const validation = await videoConsultationService.validateRoomAccess(
          roomName,
          currentUser.uid,
          userRole
        );

        if (validation.valid) {
          setAccessGranted(true);
        } else {
          setError(validation.message);
        }
      } else {
        // Si no está autenticado, permitir acceso como invitado
        // (puedes cambiar esta lógica según tus necesidades)
        setAccessGranted(true);
      }

    } catch (err) {
      console.error('Error validating room:', err);
      setError('Error al acceder a la videoconsulta');
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingEnd = () => {
    // Redirigir después de terminar la reunión
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-pulse" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Accediendo a la videoconsulta...
            </h2>
            <p className="text-gray-600">
              Por favor espere mientras verificamos el acceso
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No se puede acceder a la videoconsulta
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al inicio
              </button>
              <button
                onClick={validateAndLoadRoom}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessGranted || !roomData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando acceso...
            </h2>
            <p className="text-gray-600">
              Validando permisos para la videoconsulta
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header con información de la consulta */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <VideoCameraIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Video Consulta Médica
              </h1>
              <p className="text-sm text-gray-500">
                Sala: {roomName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            {roomData.scheduledTime && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span>
                  Programada: {new Date(roomData.scheduledTime.toDate()).toLocaleString()}
                </span>
              </div>
            )}
            
            {user && (
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>{currentUser.displayName || currentUser.email}</span>
              </div>
            )}

            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              roomData.status === 'active'
                ? 'bg-green-100 text-green-800'
                : roomData.status === 'scheduled'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {roomData.status === 'active' ? 'En progreso' :
               roomData.status === 'scheduled' ? 'Programada' : roomData.status}
            </div>
          </div>
        </div>
      </div>

      {/* Video Consultation Component */}
      <div className="h-[calc(100vh-80px)]">
        <VideoConsultationComponent
          roomName={roomName}
          onMeetingEnd={handleMeetingEnd}
          className="h-full"
        />
      </div>
    </div>
  );
}
