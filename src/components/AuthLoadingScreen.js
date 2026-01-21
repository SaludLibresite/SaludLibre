import { useEffect, useState } from 'react';

/**
 * Loading screen component that shows during authentication and user type detection
 */
export default function AuthLoadingScreen({ message = "Verificando acceso...", showDetails = false }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo/Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <svg
            className="animate-spin h-10 w-10 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>

        {/* Main message */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {message}{dots}
        </h2>
        
        {/* Additional details */}
        {showDetails && (
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>Validando credenciales y permisos</p>
            <p>Por favor espere un momento...</p>
          </div>
        )}

        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full animate-pulse" style={{ width: '70%' }}></div>
        </div>

        {/* Additional info */}
        <p className="text-xs text-gray-500">
          Este proceso normalmente toma unos pocos segundos
        </p>
      </div>
    </div>
  );
}