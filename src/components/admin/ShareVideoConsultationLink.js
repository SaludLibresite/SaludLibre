import { useState } from 'react';
import { 
  ClipboardDocumentIcon, 
  CheckIcon, 
  ShareIcon, 
  QrCodeIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

const ShareVideoConsultationLink = ({ roomName, patientName, scheduledTime }) => {
  const [copied, setCopied] = useState(false);
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const videoLink = `${baseUrl}/video/join/${roomName}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent('Enlace para Video Consulta Médica - Doctores AR');
    const body = encodeURIComponent(
      `Estimado/a ${patientName},\n\n` +
      `Su video consulta médica está programada${scheduledTime ? ` para el ${new Date(scheduledTime.toDate()).toLocaleString()}` : ' ahora'}.\n\n` +
      `Para unirse a la consulta, haga clic en el siguiente enlace:\n` +
      `${videoLink}\n\n` +
      `Instrucciones:\n` +
      `1. Haga clic en el enlace 5 minutos antes de la hora programada\n` +
      `2. Permita el acceso a su cámara y micrófono cuando se le solicite\n` +
      `3. Asegúrese de tener una conexión estable a internet\n\n` +
      `Si tiene problemas técnicos, contacte a nuestro equipo de soporte.\n\n` +
      `Atentamente,\n` +
      `Equipo Médico - Doctores AR`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareViaSMS = () => {
    const message = encodeURIComponent(
      `Video consulta médica${scheduledTime ? ` - ${new Date(scheduledTime.toDate()).toLocaleString()}` : ''}\n` +
      `Enlace: ${videoLink}\n` +
      `Únase 5 min antes. Doctores AR`
    );
    
    window.open(`sms:?body=${message}`, '_blank');
  };

  const handleShareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🏥 *Video Consulta Médica - Doctores AR*\n\n` +
      `Estimado/a ${patientName},\n\n` +
      `Su consulta está programada${scheduledTime ? ` para el *${new Date(scheduledTime.toDate()).toLocaleString()}*` : ' *ahora*'}.\n\n` +
      `📹 *Enlace de acceso:*\n${videoLink}\n\n` +
      `📋 *Instrucciones:*\n` +
      `• Únase 5 minutos antes\n` +
      `• Permita acceso a cámara/micrófono\n` +
      `• Conexión estable a internet\n\n` +
      `¿Preguntas? Contáctenos.`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ShareIcon className="h-5 w-5 mr-2 text-blue-500" />
          Compartir Enlace de Video Consulta
        </h3>
      </div>

      {/* Patient Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Paciente:</strong> {patientName}
        </p>
        {scheduledTime && (
          <p className="text-sm text-blue-800">
            <strong>Programada para:</strong> {new Date(scheduledTime.toDate()).toLocaleString()}
          </p>
        )}
      </div>

      {/* Link Display and Copy */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enlace de la Video Consulta:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={videoLink}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              copied 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sharing Options */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Compartir por:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleShareViaEmail}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <EnvelopeIcon className="h-6 w-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">Email</span>
          </button>
          
          <button
            onClick={handleShareViaWhatsApp}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="h-6 w-6 mb-1 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <span className="text-xs text-gray-600">WhatsApp</span>
          </button>
          
          <button
            onClick={handleShareViaSMS}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">SMS</span>
          </button>
          
          <button
            onClick={() => {
              // Generar QR code (implementar con library si es necesario)
              alert('Función de QR code en desarrollo');
            }}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <QrCodeIcon className="h-6 w-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">QR Code</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="text-sm font-medium text-yellow-800 mb-2">
          Instrucciones para el paciente:
        </h5>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Unirse 5 minutos antes de la hora programada</li>
          <li>• Permitir acceso a cámara y micrófono cuando se solicite</li>
          <li>• Asegurar conexión estable a internet</li>
          <li>• Tener a mano documentos médicos relevantes</li>
          <li>• Ubicarse en un lugar tranquilo y bien iluminado</li>
        </ul>
      </div>
    </div>
  );
};

export default ShareVideoConsultationLink;
