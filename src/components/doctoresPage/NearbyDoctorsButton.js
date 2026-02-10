import { useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { getDoctorsNearLocation } from "../../lib/doctorsService";

export default function NearbyDoctorsButton({ onNearbyDoctorsFound, onReset }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFindNearbyDoctors = async () => {
    setLoading(true);
    setError("");

    try {
      // Get user's current location
      if (!navigator.geolocation) {
        throw new Error(
          "La geolocalización no está soportada por este navegador"
        );
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Validar coordenadas
      if (
        typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude)
      ) {
        throw new Error('No se pudo obtener una ubicación válida');
      }

      // Find nearby doctors within 25km
      const nearbyDoctors = await getDoctorsNearLocation(
        latitude,
        longitude,
        25
      );

      if (!Array.isArray(nearbyDoctors) || nearbyDoctors.length === 0) {
        setError(
          "No se encontraron doctores cerca de tu ubicación (en un radio de 25km)"
        );
        return;
      }

      // Call parent callback with nearby doctors
      if (typeof onNearbyDoctorsFound === 'function') {
        onNearbyDoctorsFound(nearbyDoctors, { latitude, longitude });
      }
    } catch (error) {
      console.error("Error finding nearby doctors:", error);

      if (error.code === 1) {
        setError(
          "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación."
        );
      } else if (error.code === 2) {
        setError(
          "No se pudo obtener tu ubicación. Verifica tu conexión a internet."
        );
      } else if (error.code === 3) {
        setError("Tiempo de espera agotado al obtener tu ubicación.");
      } else {
        setError(error.message || "Error al buscar doctores cercanos");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleFindNearbyDoctors}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Buscando...
          </>
        ) : (
          <>
            <MapPinIcon className="h-4 w-4 mr-2" />
            Encontrar cerca de mí
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Reset button - shown by parent when there are nearby results */}
      {onReset && (
        <button
          onClick={onReset}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Ver todos los doctores
        </button>
      )}
    </div>
  );
}
