import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const MapPanel = ({ isOpen, onClose, doctors = [] }) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [map, setMap] = useState(null);

  // Configuración del mapa centrado en Argentina
  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const center = {
    lat: -34.6037, // Buenos Aires
    lng: -58.3816
  };

  const onLoad = useCallback((map) => {
    setMap(map);
    
    // Auto-ajustar el mapa para mostrar todos los doctores
    const doctorsWithCoords = doctors.filter(doctor => 
      doctor.latitude && doctor.longitude && !isNaN(doctor.latitude) && !isNaN(doctor.longitude)
    );
    
    if (doctorsWithCoords.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      doctorsWithCoords.forEach(doctor => {
        bounds.extend({
          lat: parseFloat(doctor.latitude),
          lng: parseFloat(doctor.longitude)
        });
      });
      map.fitBounds(bounds);
    }
  }, [doctors]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-semibold">
              Doctores en el Mapa
            </h2>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {doctors.filter(doctor => 
                doctor.latitude && doctor.longitude && !isNaN(doctor.latitude) && !isNaN(doctor.longitude)
              ).length} ubicaciones
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map Container */}
        <div className="h-full">
          <LoadScript 
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            loadingElement={
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            }
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={10}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {/* Markers for doctors */}
              {doctors
                .filter(doctor => doctor.latitude && doctor.longitude && !isNaN(doctor.latitude) && !isNaN(doctor.longitude))
                .map((doctor, index) => (
                <Marker
                  key={doctor.id || index}
                  position={{
                    lat: parseFloat(doctor.latitude),
                    lng: parseFloat(doctor.longitude)
                  }}
                  onClick={() => setSelectedDoctor(doctor)}
                  icon={{
                    url: '/img/doctor-marker.png', // Puedes crear un icono personalizado
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                />
              ))}

              {/* Info Window */}
              {selectedDoctor && (
                <InfoWindow
                  position={{
                    lat: parseFloat(selectedDoctor.latitude),
                    lng: parseFloat(selectedDoctor.longitude)
                  }}
                  onCloseClick={() => setSelectedDoctor(null)}
                >
                  <div className="p-2 max-w-xs">
                    <div className="flex items-start gap-3">
                      {selectedDoctor.photoURL && (
                        <img
                          src={selectedDoctor.photoURL}
                          alt={selectedDoctor.nombre}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 text-sm">
                          {selectedDoctor.nombre}
                        </h3>
                        <p className="text-blue-700 text-xs mb-1">
                          {selectedDoctor.especialidad}
                        </p>
                        {selectedDoctor.ubicacion && (
                          <p className="text-gray-600 text-xs">
                            📍 {selectedDoctor.ubicacion}
                          </p>
                        )}
                        {selectedDoctor.telefono && (
                          <p className="text-gray-600 text-xs">
                            📞 {selectedDoctor.telefono}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
