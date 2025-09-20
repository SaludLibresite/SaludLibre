import { useState, useEffect, useRef } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { formatDoctorName } from "../../lib/dataUtils";
import { loadGoogleMaps } from "../../lib/googleMapsLoader";

export default function DoctorLocationMap({ doctor, className = "" }) {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if doctor has location data
        if (!doctor.latitude || !doctor.longitude) {
          setError("Ubicación no disponible");
          setIsLoading(false);
          return;
        }

        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          setError("Google Maps no configurado");
          setIsLoading(false);
          return;
        }

        const google = await loadGoogleMaps();
        
        // Import the marker library for AdvancedMarkerElement
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: {
            lat: doctor.latitude,
            lng: doctor.longitude,
          },
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: false,
          zoomControl: true,
          mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
          ],
        });

        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
            <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">+</text>
          </svg>
        `;
        markerElement.style.cursor = 'pointer';

        // Create advanced marker with doctor info
        const marker = new AdvancedMarkerElement({
          position: {
            lat: doctor.latitude,
            lng: doctor.longitude,
          },
          map: mapInstance,
          title: `Consultorio del ${formatDoctorName(doctor.nombre, doctor.genero)}`,
          content: markerElement,
        });

        // Info window with doctor information
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 16px; font-weight: 600;">
                ${formatDoctorName(doctor.nombre, doctor.genero)}
              </h3>
              <p style="margin: 0 0 4px 0; color: #3B82F6; font-size: 14px; font-weight: 500;">
                ${doctor.especialidad}
              </p>
              ${
                doctor.formattedAddress || doctor.ubicacion
                  ? `<p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px;">
                  📍 ${doctor.formattedAddress || doctor.ubicacion}
                </p>`
                  : ""
              }
              ${
                doctor.telefono
                  ? `<p style="margin: 0; color: #374151; font-size: 13px;">
                  📞 ${doctor.telefono}
                </p>`
                  : ""
              }
            </div>
          `,
        });

        // Show info window on marker click
        marker.addListener("click", () => {
          infoWindow.open({
            anchor: marker,
            map: mapInstance,
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setError("Error al cargar el mapa");
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      initializeMap();
    } else {
      setError("Google Maps no configurado");
      setIsLoading(false);
    }
  }, [doctor]);

  // Function to open in Google Maps
  const openInGoogleMaps = () => {
    if (doctor.latitude && doctor.longitude) {
      const url = `https://www.google.com/maps?q=${doctor.latitude},${doctor.longitude}`;
      window.open(url, "_blank");
    }
  };

  // Function to get directions
  const getDirections = () => {
    if (doctor.latitude && doctor.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${doctor.latitude},${doctor.longitude}`;
      window.open(url, "_blank");
    }
  };

  if (error) {
    return (
      <div
        className={`border border-gray-200 rounded-lg p-6 text-center bg-gray-50 ${className}`}
      >
        <MapPinIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-gray-600 text-sm">{error}</p>
        {doctor.ubicacion && (
          <p className="text-gray-500 text-xs mt-1">📍 {doctor.ubicacion}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Ubicación del Consultorio
            </h3>
            {(doctor.formattedAddress || doctor.ubicacion) && (
              <p className="text-gray-600 text-xs mt-1">
                {doctor.formattedAddress || doctor.ubicacion}
              </p>
            )}
          </div>
          <MapPinIcon className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Cargando mapa...</p>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-64"
          style={{ minHeight: "256px" }}
        />
      </div>

      {/* Actions */}
      {doctor.latitude && doctor.longitude && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={openInGoogleMaps}
              className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              Ver en Google Maps
            </button>
            <button
              onClick={getDirections}
              className="flex-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
            >
              Cómo llegar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
