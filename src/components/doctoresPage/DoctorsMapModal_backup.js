import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, LoadScript } from '@react-google-maps/api';
import { getDoctorRank, cleanDoctorName } from '../../lib/subscriptionUtils';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 140px)'
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
  gestureHandling: 'greedy',
  controlSize: 32,
  zoomControlOptions: {
    position: 9 // TOP_RIGHT position
  }
};

// Helper functions for markers
const getMarkerIcon = (doctor) => {
  const rank = getDoctorRank(doctor);
  const baseSize = rank === 'VIP' ? 40 : rank === 'Intermedio' ? 35 : 30;
  
  return {
    url: rank === 'VIP' 
      ? 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="${baseSize}" height="${baseSize}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#f97316;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#vipGradient)" stroke="white" stroke-width="3"/>
          <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">★</text>
        </svg>
      `)
      : rank === 'Intermedio'
      ? 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="${baseSize}" height="${baseSize}" viewBox="0 0 35 35" xmlns="http://www.w3.org/2000/svg">
          <circle cx="17.5" cy="17.5" r="15" fill="#3b82f6" stroke="white" stroke-width="3"/>
          <text x="17.5" y="22" text-anchor="middle" fill="white" font-size="14" font-weight="bold">+</text>
        </svg>
      `)
      : 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="${baseSize}" height="${baseSize}" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="basicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="15" cy="15" r="12" fill="url(#basicGradient)" stroke="white" stroke-width="2"/>
        </svg>
      `),
    scaledSize: window.google?.maps ? new window.google.maps.Size(baseSize, baseSize) : undefined,
    anchor: window.google?.maps ? new window.google.maps.Point(baseSize / 2, baseSize / 2) : undefined
  };
};

const getUserLocationIcon = () => {
  return {
    url: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
        <circle cx="15" cy="15" r="6" fill="white"/>
      </svg>
    `),
    scaledSize: window.google?.maps ? new window.google.maps.Size(30, 30) : undefined,
    anchor: window.google?.maps ? new window.google.maps.Point(15, 15) : undefined
  };
};

export default function DoctorsMapModal({ isOpen, onClose, doctors, userLocation }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef(null);

  // Simple filter for doctors with valid coordinates
  const doctorsWithLocation = doctors.filter(doctor => {
    const lat = parseFloat(doctor.latitude);
    const lng = parseFloat(doctor.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  // Map load handler with auto-fit to show all points
  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
    
    // Auto-adjust view to show all available points
    if (doctorsWithLocation.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add all doctor locations to bounds
      doctorsWithLocation.forEach(doctor => {
        bounds.extend(new window.google.maps.LatLng(
          parseFloat(doctor.latitude), 
          parseFloat(doctor.longitude)
        ));
      });
      
      // Add user location if available
      if (userLocation) {
        const userLat = userLocation.latitude || userLocation.lat;
        const userLng = userLocation.longitude || userLocation.lng;
        if (userLat && userLng) {
          bounds.extend(new window.google.maps.LatLng(userLat, userLng));
        }
      }
      
      // Fit map to show all points with padding
      mapInstance.fitBounds(bounds, { padding: 50 });
    }
  };

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Search places function
  const searchPlace = async (query) => {
    if (!map || !window.google || !query.trim()) return;

    setIsSearching(true);
    
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      query: query,
      fields: ['place_id', 'name', 'geometry', 'formatted_address'],
    };

    service.textSearch(request, (results, status) => {
      setIsSearching(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results.slice(0, 5));
      } else {
        setSearchResults([]);
      }
    });
  };

  // Go to selected place
  const goToPlace = (place) => {
    if (map && place.geometry) {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 2) {
      searchPlace(value);
    } else {
      setSearchResults([]);
    }
  };

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDoctor(null);
      setSearchResults([]);
      setSearchQuery('');
      setIsSearching(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4" style={{ zIndex: 1000 }}>
      <div className="bg-white shadow-2xl w-full max-w-[95vw] h-[95vh] rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="pt-4 md:pt-6 px-4 md:px-6 border-b border-gray-200 flex-shrink-0">
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
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Legend */}
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
                  <div className="w-2 h-2 rounded-full bg-green-500 border border-white shadow-sm"></div>
                  <span className="text-gray-700 font-medium hidden sm:inline">Tu ubicación</span>
                  <span className="text-gray-700 font-medium sm:hidden">📍</span>
                </div>
              )}
            </div>
            
            {/* Search bar */}
            <div className="relative flex-1 max-w-md order-1 md:order-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar ubicación..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
              </div>
              
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

        {/* Map Container */}
        <div className="flex-1 relative">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <LoadScript 
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              onLoad={() => setIsLoaded(true)}
              libraries={['places']}
            >
              {isLoaded && (
                <GoogleMap
                  ref={mapRef}
                  mapContainerStyle={mapContainerStyle}
                  center={userLocation ? {
                    lat: userLocation.latitude || userLocation.lat,
                    lng: userLocation.longitude || userLocation.lng
                  } : defaultCenter}
                  zoom={12}
                  options={mapOptions}
                  onLoad={handleMapLoad}
                >
                  {/* User location marker */}
                  {userLocation && (
                    <Marker
                      position={{
                        lat: userLocation.latitude || userLocation.lat,
                        lng: userLocation.longitude || userLocation.lng
                      }}
                      icon={getUserLocationIcon()}
                      title="Tu ubicación"
                    />
                  )}

                  {/* Doctor markers */}
                  {doctorsWithLocation.map((doctor) => (
                    <Marker
                      key={doctor.id}
                      position={{ 
                        lat: parseFloat(doctor.latitude), 
                        lng: parseFloat(doctor.longitude) 
                      }}
                      icon={getMarkerIcon(doctor)}
                      title={cleanDoctorName(doctor.nombre, doctor.genero)}
                      onClick={() => setSelectedDoctor(doctor)}
                    />
                  ))}

                  {/* Info window for selected doctor */}
                  {selectedDoctor && (
                    <InfoWindow
                      position={{ 
                        lat: parseFloat(selectedDoctor.latitude), 
                        lng: parseFloat(selectedDoctor.longitude) 
                      }}
                      onCloseClick={() => setSelectedDoctor(null)}
                    >
                      <div className="p-4 max-w-sm bg-white rounded-lg shadow-lg">
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
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {selectedDoctor.experiencia} años
                                </p>
                              )}

                              {selectedDoctor.rating && (
                                <div className="flex items-center gap-1">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <svg 
                                        key={i} 
                                        className={`w-3 h-3 ${i < Math.floor(selectedDoctor.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-600">({selectedDoctor.rating})</span>
                                </div>
                              )}

                              {selectedDoctor.precio && (
                                <p className="text-xs text-green-600 font-semibold">
                                  💰 Consulta desde ${selectedDoctor.precio}
                                </p>
                              )}
                            </div>

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
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </LoadScript>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                <p className="text-gray-600">Google Maps no está disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}