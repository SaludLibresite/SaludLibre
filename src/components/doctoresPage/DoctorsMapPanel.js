import React, { useState, useEffect, useRef, Suspense } from 'react';
import { getDoctorRank, cleanDoctorName } from '../../lib/subscriptionUtils';

// Utility function to safely create bounds for Google Maps
const createSafeBounds = (coordinates) => {
  // If we have a LatLngBounds object with toJSON method, extract coordinates
  if (coordinates && typeof coordinates.toJSON === 'function') {
    const boundsJSON = coordinates.toJSON();
    return {
      south: boundsJSON.south,
      west: boundsJSON.west,
      north: boundsJSON.north,
      east: boundsJSON.east
    };
  }
  
  // If we already have a bounds literal object
  if (coordinates && 
      typeof coordinates.south === 'number' && 
      typeof coordinates.west === 'number' && 
      typeof coordinates.north === 'number' && 
      typeof coordinates.east === 'number') {
    return {
      south: coordinates.south,
      west: coordinates.west,
      north: coordinates.north,
      east: coordinates.east
    };
  }
  
  // Default bounds (centered on Argentina)
  return {
    south: -41.0,
    west: -71.0,
    north: -21.0,
    east: -53.0
  };
};

// Dynamic import para evitar problemas con Turbopack
const GoogleMapComponent = React.lazy(() =>
  import('@react-google-maps/api').then(module => ({
    default: ({ children, ...props }) => {
      const { GoogleMap, LoadScript, Marker, InfoWindow } = module;
      
      // Si Google Maps ya está cargado, no usar LoadScript
      if (window.google && window.google.maps) {
        return (
          <GoogleMap {...props}>
            {children}
          </GoogleMap>
        );
      }
      
      return (
        <LoadScript 
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
          loadingElement={<div>Cargando mapa...</div>}
          preventGoogleFontsLoading={true}
        >
          <GoogleMap {...props}>
            {children}
          </GoogleMap>
        </LoadScript>
      );
    }
  }))
);

const MarkerComponent = React.lazy(() =>
  import('@react-google-maps/api').then(module => ({ default: module.Marker }))
);

const InfoWindowComponent = React.lazy(() =>
  import('@react-google-maps/api').then(module => ({ default: module.InfoWindow }))
);

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 120px)' // Altura casi completa menos header y controles
};

const defaultCenter = {
  lat: -34.6037,
  lng: -58.3816 // Buenos Aires, Argentina
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  scrollwheel: true,
  gestureHandling: 'greedy'
};

export default function DoctorsMapPanel({ isOpen, onClose, doctors, userLocation }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasInitializedBounds, setHasInitializedBounds] = useState(false);
  const mapRef = useRef(null);
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setMap(null);
      setHasInitializedBounds(false);
    }
  }, [isOpen]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      
      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar scroll cuando se cierre el modal
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Filter doctors that have location data and clean any extra properties
  const doctorsWithLocation = doctors.filter(doctor => 
    doctor.latitude && doctor.longitude && !isNaN(doctor.latitude) && !isNaN(doctor.longitude)
  ).map(doctor => {
    // Create a clean doctor object with only necessary properties
    return {
      ...doctor,
      latitude: parseFloat(doctor.latitude),
      longitude: parseFloat(doctor.longitude)
    };
  });

  // Debug logs
  console.log('DoctorsMapPanel - Total doctors:', doctors.length);
  console.log('DoctorsMapPanel - Doctors with location:', doctorsWithLocation.length);
  console.log('DoctorsMapPanel - Sample doctor:', doctors[0]);
  console.log('DoctorsMapPanel - Panel open:', isOpen);

    useEffect(() => {
    if (isOpen && window.google && window.google.maps && doctorsWithLocation.length > 0 && map && !hasInitializedBounds) {
      try {
        console.log('Starting bounds calculation...');
        
        // Create bounds with explicit Google Maps constructor
        const bounds = new window.google.maps.LatLngBounds();
        let validCoordinatesCount = 0;
        
        // Add doctor locations with validation
        doctorsWithLocation.forEach((doctor, index) => {
          console.log(`Doctor ${index}:`, doctor);
          
          // Ensure we only use numeric values
          const lat = Number(doctor.latitude);
          const lng = Number(doctor.longitude);
          
          console.log(`Doctor ${index} coordinates:`, { lat, lng });
          
          // Validate coordinates are valid numbers and within valid ranges
          if (Number.isFinite(lat) && Number.isFinite(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            
            try {
              // Create LatLng object explicitly
              const latLng = new window.google.maps.LatLng(lat, lng);
              console.log(`Adding doctor ${index} LatLng:`, latLng);
              
              bounds.extend(latLng);
              validCoordinatesCount++;
            } catch (latLngError) {
              console.error(`Error creating LatLng for doctor ${index}:`, latLngError);
            }
          } else {
            console.warn(`Invalid doctor ${index} coordinates:`, { lat, lng, doctor });
          }
        });
        
        if (userLocation) {
          console.log('UserLocation:', userLocation);
          
          // Convert userLocation from {latitude, longitude} to {lat, lng} format
          const lat = Number(userLocation.latitude || userLocation.lat);
          const lng = Number(userLocation.longitude || userLocation.lng);
          
          console.log('User coordinates:', { lat, lng });
          
          // Validate user location coordinates
          if (Number.isFinite(lat) && Number.isFinite(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            
            try {
              // Create LatLng object explicitly
              const latLng = new window.google.maps.LatLng(lat, lng);
              console.log('Adding user LatLng:', latLng);
              
              bounds.extend(latLng);
              validCoordinatesCount++;
            } catch (latLngError) {
              console.error('Error creating LatLng for user location:', latLngError);
            }
          } else {
            console.warn('Invalid user coordinates:', { lat, lng, userLocation });
          }
        }
        
        console.log('Total valid coordinates:', validCoordinatesCount);
        console.log('Bounds object before fitBounds:', bounds);
        console.log('Bounds object properties:', Object.getOwnPropertyNames(bounds));
        console.log('Bounds object keys:', Object.keys(bounds));
        
        // Check if bounds has any unexpected properties
        for (const prop in bounds) {
          console.log(`Bounds property: ${prop} = `, bounds[prop]);
        }
        
        // Only fit bounds if we have valid coordinates
        if (!bounds.isEmpty() && validCoordinatesCount > 0) {
          console.log('Calling fitBounds...');
          
          // Create a literal bounds object instead of using LatLngBounds
          let north = -90;
          let south = 90;
          let east = -180;
          let west = 180;
          
          // Calculate bounds from doctor coordinates
          doctorsWithLocation.forEach((doctor) => {
            const lat = Number(doctor.latitude);
            const lng = Number(doctor.longitude);
            
            if (Number.isFinite(lat) && Number.isFinite(lng) && 
                lat >= -90 && lat <= 90 && 
                lng >= -180 && lng <= 180) {
              north = Math.max(north, lat);
              south = Math.min(south, lat);
              east = Math.max(east, lng);
              west = Math.min(west, lng);
            }
          });
          
          // Include user location if available
          if (userLocation) {
            const lat = Number(userLocation.latitude || userLocation.lat);
            const lng = Number(userLocation.longitude || userLocation.lng);
            
            if (Number.isFinite(lat) && Number.isFinite(lng) && 
                lat >= -90 && lat <= 90 && 
                lng >= -180 && lng <= 180) {
              north = Math.max(north, lat);
              south = Math.min(south, lat);
              east = Math.max(east, lng);
              west = Math.min(west, lng);
            }
          }
          
          // Create a literal bounds object
          const literalBounds = {
            north,
            south,
            east,
            west
          };
          
          console.log('Literal bounds object:', literalBounds);
          
          // Validate the bounds
          const isValidBounds = 
            north > south && 
            east > west && 
            north >= -90 && north <= 90 && 
            south >= -90 && south <= 90 && 
            east >= -180 && east <= 180 && 
            west >= -180 && west <= 180;
          
          if (!isValidBounds) {
            console.warn('Invalid literal bounds, using fallback');
            map.setCenter(defaultCenter);
            map.setZoom(12);
            return;
          }
          
          try {
            // Use the literal bounds object directly with fitBounds
            map.fitBounds(literalBounds);
            setHasInitializedBounds(true);
            console.log('Map bounds set successfully with literal bounds');
          } catch (error) {
            console.error('Error setting map bounds:', error);
            map.setCenter(defaultCenter);
            map.setZoom(12);
          }
          
          console.log('fitBounds completed successfully');
        } else {
          console.warn('No valid coordinates to fit bounds');
          // Fallback to default center if no valid coordinates
          map.setCenter(defaultCenter);
          map.setZoom(12);
        }
        
        setHasInitializedBounds(true); // Prevent infinite retries
      } catch (error) {
        console.error('Error calculating bounds:', error);
        if (map) {
          map.setCenter(defaultCenter);
          map.setZoom(12);
        }
        
        setHasInitializedBounds(true); // Prevent infinite retries
      }
    }
  }, [isOpen, map, doctorsWithLocation, userLocation, hasInitializedBounds]);

  // Reset bounds flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitializedBounds(false);
      // Reset map state when modal closes
      setMap(null);
      setSelectedDoctor(null);
      setSearchResults([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Función para buscar lugares
  const searchPlace = async (query) => {
    if (!map || !window.google || !window.google.maps || !query.trim()) return;

    setIsSearching(true);
    
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      query: query,
      fields: ['place_id', 'name', 'geometry', 'formatted_address', 'types'],
    };

    service.textSearch(request, (results, status) => {
      setIsSearching(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results.slice(0, 5)); // Máximo 5 resultados
        
        // Centrar el mapa en el primer resultado
        if (results[0] && results[0].geometry) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(14);
        }
      } else {
        setSearchResults([]);
      }
    });
  };

  // Función para ir a una ubicación específica
  const goToPlace = (place) => {
    if (map && place.geometry) {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  // Manejar búsqueda con Enter
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchPlace(searchQuery);
    }
  };

    const getMarkerIcon = (doctor) => {
    if (!window.google || !window.google.maps) {
      return undefined; // Retorna undefined en lugar de null para usar el marcador por defecto
    }

    const rank = getDoctorRank(doctor);
    
    switch (rank) {
      case 'VIP':
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
              <defs>
                <linearGradient id="vipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#FF6B35;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#vipGradient)" stroke="#fff" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">★</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        };
      case 'Intermedio':
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#fff" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">+</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(35, 35),
          anchor: new window.google.maps.Point(17.5, 17.5)
        };
      default:
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
              <defs>
                <linearGradient id="basicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FFA500;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#basicGradient)" stroke="#fff" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">+</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        };
    }
  };

  const getUserLocationIcon = () => {
    if (!window.google || !window.google.maps) {
      return undefined; // Retorna undefined en lugar de null para usar el marcador por defecto
    }

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="8" fill="#EF4444" stroke="#fff" stroke-width="3"/>
          <circle cx="12" cy="12" r="3" fill="#fff"/>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(24, 24),
      anchor: new window.google.maps.Point(12, 12)
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center " style={{ zIndex: 1000 }}>
      <div className="bg-white shadow-2xl w-full h-[90dvh] flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          {/* Fila superior: Título y botón cerrar */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                Doctores en el Mapa
              </h2>
              <span className="px-2 py-1 md:px-3 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm font-medium">
                {doctorsWithLocation.length} doctores
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Fila inferior: Leyenda y búsqueda */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Legend - responsive */}
            <div className="flex items-center gap-2 md:gap-4 text-xs order-2 md:order-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 border border-white shadow-sm"></div>
                <span className="text-gray-700 font-medium hidden sm:inline">Premium</span>
                <span className="text-gray-700 font-medium sm:hidden">★</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white shadow-sm"></div>
                <span className="text-gray-700 font-medium hidden sm:inline">Plus</span>
                <span className="text-gray-700 font-medium sm:hidden">+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 border border-white shadow-sm"></div>
                <span className="text-gray-700 font-medium hidden sm:inline">Básico</span>
                <span className="text-gray-700 font-medium sm:hidden">○</span>
              </div>
              {userLocation && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 border border-white shadow-sm"></div>
                  <span className="text-gray-700 font-medium hidden sm:inline">Tu ubicación</span>
                  <span className="text-gray-700 font-medium sm:hidden">📍</span>
                </div>
              )}
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative flex-1 max-w-md order-1 md:order-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Buscar zona, barrio o dirección..."
                  className="w-full pl-8 md:pl-10 pr-16 md:pr-20 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-2 md:left-3 top-2.5 h-4 w-4 md:h-5 md:w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <button
                  onClick={() => searchPlace(searchQuery)}
                  disabled={isSearching}
                  className="absolute right-1 md:right-2 top-1 md:top-1.5 px-2 md:px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Buscar'}
                </button>
              </div>
              
              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {searchResults.map((place, index) => (
                    <button
                      key={index}
                      onClick={() => goToPlace(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 text-sm">{place.name}</div>
                      <div className="text-xs text-gray-600">{place.formatted_address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="relative">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            }>
              <GoogleMapComponent
                ref={mapRef}
                mapContainerStyle={mapContainerStyle}
                center={userLocation ? {
                  lat: userLocation.latitude || userLocation.lat,
                  lng: userLocation.longitude || userLocation.lng
                } : defaultCenter}
                zoom={12}
                options={mapOptions}
                onLoad={setMap}
              >
                {/* User location marker */}
                {userLocation && window.google && window.google.maps && (
                  <MarkerComponent
                    position={{
                      lat: userLocation.latitude || userLocation.lat,
                      lng: userLocation.longitude || userLocation.lng
                    }}
                    icon={getUserLocationIcon()}
                    title="Tu ubicación"
                  />
                )}

                {/* Doctor markers */}
                {window.google && window.google.maps && doctorsWithLocation.map((doctor) => {
                  const markerIcon = getMarkerIcon(doctor);
                  return (
                    <MarkerComponent
                      key={doctor.id}
                      position={{ lat: doctor.latitude, lng: doctor.longitude }}
                      icon={markerIcon}
                      title={cleanDoctorName(doctor.nombre, doctor.genero)}
                      onClick={() => setSelectedDoctor(doctor)}
                    />
                  );
                })}

                {/* Info window for selected doctor */}
                {selectedDoctor && (
                  <InfoWindowComponent
                    position={{ lat: selectedDoctor.latitude, lng: selectedDoctor.longitude }}
                    onCloseClick={() => setSelectedDoctor(null)}
                  >
                    <div className="p-4 max-w-sm bg-white rounded-lg shadow-lg">
                      {/* Header con badge de rank */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getDoctorRank(selectedDoctor) === 'VIP' && (
                            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                              ⭐ PREMIUM
                            </span>
                          )}
                          {getDoctorRank(selectedDoctor) === 'Intermedio' && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-sm">
                              💎 PLUS
                            </span>
                          )}
                          {getDoctorRank(selectedDoctor) === 'Normal' && (
                            <span className="px-2 py-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold rounded-full shadow-sm">
                              ✓ BÁSICO
                            </span>
                          )}
                        </div>
                        {selectedDoctor.verified && (
                          <span className="text-blue-500 text-sm">✓</span>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        {/* Foto del doctor */}
                        <div className="flex-shrink-0">
                          <img
                            src={selectedDoctor.photoURL || selectedDoctor.imagen || "/img/doctor-1.jpg"}
                            alt={selectedDoctor.nombre}
                            className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                            onError={(e) => {
                              e.target.src = "/img/doctor-1.jpg";
                            }}
                          />
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight">
                            {cleanDoctorName(selectedDoctor.nombre, selectedDoctor.genero)}
                          </h3>
                          
                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-orange-600 font-medium">
                              {selectedDoctor.especialidad}
                            </p>
                            
                            {selectedDoctor.experiencia && (
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {selectedDoctor.experiencia} años de experiencia
                              </p>
                            )}

                            {selectedDoctor.ubicacion && (
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {selectedDoctor.ubicacion}
                              </p>
                            )}

                            {selectedDoctor.distance !== undefined && (
                              <p className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {selectedDoctor.distance} km de distancia
                              </p>
                            )}

                            {/* Rating si está disponible */}
                            {selectedDoctor.rating && (
                              <div className="flex items-center gap-1">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <svg 
                                      key={i} 
                                      className={`w-3 h-3 ${i < Math.floor(selectedDoctor.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                      fill="currentColor" 
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-600">({selectedDoctor.rating})</span>
                              </div>
                            )}

                            {/* Precio si está disponible */}
                            {selectedDoctor.precio && (
                              <p className="text-xs text-green-600 font-semibold">
                                💰 Consulta desde ${selectedDoctor.precio}
                              </p>
                            )}
                          </div>

                          {/* Botones de acción */}
                          <div className="flex gap-2 flex-wrap">
                            <a
                              href={`/doctores/${selectedDoctor.slug}`}
                              className="text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm font-medium"
                            >
                              Ver perfil
                            </a>
                            {selectedDoctor.telefono && (
                              <a
                                href={`https://wa.me/${selectedDoctor.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${cleanDoctorName(selectedDoctor.nombre, selectedDoctor.genero)}, quisiera agendar una consulta`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-full hover:bg-green-600 transition-colors duration-200 shadow-sm font-medium"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </InfoWindowComponent>
                )}
              </GoogleMapComponent>
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center p-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configuración de Google Maps requerida
                </h3>
                <p className="text-gray-600">
                  Para mostrar el mapa, configure la API key de Google Maps en las variables de entorno.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
