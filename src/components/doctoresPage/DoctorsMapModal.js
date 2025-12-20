import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { getDoctorRank, cleanDoctorName } from '../../lib/subscriptionUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Estilos CSS para InfoWindow transparente
const infoWindowStyle = `
  .gm-style .gm-style-iw-c {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    border-radius: 24px !important;
    overflow: visible !important;
  }
  .gm-style .gm-style-iw-d {
    overflow: visible !important;
    max-width: none !important;
  }
  .gm-style .gm-style-iw-t::after {
    background: linear-gradient(45deg, rgba(30, 87, 87, 0.95) 50%, transparent 51%, transparent) !important;
    box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.2) !important;
  }
  .gm-ui-hover-effect {
    opacity: 1 !important;
    top: 8px !important;
    right: 8px !important;
    width: 32px !important;
    height: 32px !important;
    background: white !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .gm-ui-hover-effect img {
    margin: 0 !important;
  }
`;

// Google Maps libraries
const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100vh'
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
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            @keyframes pulse {
              0% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.3;
                transform: scale(1.8);
              }
              100% {
                opacity: 0;
                transform: scale(2.2);
              }
            }
            .pulse-ring {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              transform-origin: center;
            }
          </style>
        </defs>
        <!-- Pulse rings -->
        <circle class="pulse-ring" cx="20" cy="20" r="10" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.8"/>
        <circle class="pulse-ring" cx="20" cy="20" r="10" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.6" style="animation-delay: 0.5s"/>
        
        <!-- Outer circle with shadow -->
        <circle cx="20" cy="20" r="10" fill="#3b82f6" opacity="0.2"/>
        
        <!-- Main dot -->
        <circle cx="20" cy="20" r="6" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
        
        <!-- Center highlight -->
        <circle cx="20" cy="20" r="3" fill="#60a5fa"/>
      </svg>
    `),
    scaledSize: window.google?.maps ? new window.google.maps.Size(40, 40) : undefined,
    anchor: window.google?.maps ? new window.google.maps.Point(20, 20) : undefined
  };
};

export default function DoctorsMapModal({ isOpen, onClose, doctors, userLocation, filters }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  // Filtros cerrados por defecto
  const [showFilters, setShowFilters] = useState(false);
  // Estado local para la ubicación actual del usuario (puede venir de props o ser obtenida)
  const [currentUserLocation, setCurrentUserLocation] = useState(userLocation);
  const mapRef = useRef(null);

  // Load Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Simple filter for doctors with valid coordinates
  const doctorsWithLocation = doctors.filter(doctor => {
    const lat = parseFloat(doctor.latitude);
    const lng = parseFloat(doctor.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  // Calculate center with most doctors density
  const getDoctorsDensityCenter = () => {
    if (doctorsWithLocation.length === 0) return defaultCenter;
    
    // Calculate average position (geographic center)
    const sum = doctorsWithLocation.reduce((acc, doctor) => ({
      lat: acc.lat + parseFloat(doctor.latitude),
      lng: acc.lng + parseFloat(doctor.longitude)
    }), { lat: 0, lng: 0 });
    
    return {
      lat: sum.lat / doctorsWithLocation.length,
      lng: sum.lng / doctorsWithLocation.length
    };
  };

  // Initial center based on doctor density
  const initialCenter = getDoctorsDensityCenter();

  // Map load handler - no auto-fit, just set initial position
  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Inject custom styles for InfoWindow
      const styleEl = document.createElement('style');
      styleEl.id = 'custom-infowindow-styles';
      styleEl.textContent = infoWindowStyle;
      document.head.appendChild(styleEl);
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        
        // Remove custom styles
        const existingStyle = document.getElementById('custom-infowindow-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
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

  // Function to center map on user location or request it
  const centerOnUserLocation = () => {
    if (map) {
      if (userLocation || currentUserLocation) {
        // If we already have location, center on it
        const location = currentUserLocation || userLocation;
        const userLat = location.latitude || location.lat;
        const userLng = location.longitude || location.lng;
        if (userLat && userLng) {
          map.panTo({ lat: userLat, lng: userLng });
          map.setZoom(14);
        }
      } else {
        // Request user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              // Save location in state
              setCurrentUserLocation({ lat, lng });
              map.panTo({ lat, lng });
              map.setZoom(14);
            },
            (error) => {
              console.error('Error obteniendo ubicación:', error);
              alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos del navegador.');
            }
          );
        } else {
          alert('Tu navegador no soporta geolocalización.');
        }
      }
    }
  };

  if (!isOpen) return null;

  if (loadError) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Background blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
              style={{ zIndex: 1000 }}
              onClick={onClose}
            />

            {/* Error Card */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-16 md:top-20 rounded-t-3xl overflow-hidden shadow-2xl"
              style={{ zIndex: 1001 }}
            >
              <div className="w-full h-full bg-white rounded-t-3xl flex items-center justify-center">
                <div className="text-center p-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-gray-600 mb-4">Error al cargar Google Maps</p>
                  <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (!isLoaded) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Background blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
              style={{ zIndex: 1000 }}
            />

            {/* Loading Card */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-16 md:top-20 rounded-t-3xl overflow-hidden shadow-2xl"
              style={{ zIndex: 1001 }}
            >
              <div className="w-full h-full bg-white rounded-t-3xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Cargando mapa...</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background blur overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
            style={{ zIndex: 1000 }}
            onClick={onClose}
          />

          {/* Map Card Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-0 md:top-0 rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ zIndex: 9999 }}
          >
            <div className="w-full h-full bg-white rounded-t-3xl overflow-hidden flex flex-col">
              {/* Map Background */}
              <div className="flex-1 relative">
                <GoogleMap
                  ref={mapRef}
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={initialCenter}
                  zoom={10}
                  options={mapOptions}
                  onLoad={handleMapLoad}
                >
            {/* User location marker */}
            {(userLocation || currentUserLocation) && (
              <Marker
                position={{
                  lat: (currentUserLocation?.lat || currentUserLocation?.latitude || userLocation?.latitude || userLocation?.lat),
                  lng: (currentUserLocation?.lng || currentUserLocation?.longitude || userLocation?.longitude || userLocation?.lng)
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
                options={{
                  pixelOffset: new window.google.maps.Size(0, -10)
                }}
              >
                <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ 
                  background: 'rgba(20, 20, 30, 0.65)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  width: '260px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}>
                  {/* Badge Superior */}
                  <div className="absolute top-3 left-3 z-10">
                    {getDoctorRank(selectedDoctor) === 'VIP' && (
                      <div className="px-2.5 py-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xs font-bold rounded-lg shadow-lg">
                         PREMIUM
                      </div>
                    )}
                    {getDoctorRank(selectedDoctor) === 'Intermedio' && (
                      <div className="px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg">
                         PLUS
                      </div>
                    )}
                    {getDoctorRank(selectedDoctor) === 'Normal' && (
                      <div className="px-2.5 py-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold rounded-lg shadow-lg">
                         BÁSICO
                      </div>
                    )}
                  </div>

                  {/* Verificado badge */}
                  {selectedDoctor.verified && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Content Container */}
                  <div className="p-5 pt-12 flex flex-col items-center text-center">
                    {/* Imagen del doctor - estilo cuadrado redondeado centrado */}
                    <div className="mb-4 relative">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      }}>
                        <img
                          src={selectedDoctor.photoURL || selectedDoctor.imagen || "/img/doctor-1.jpg"}
                          alt={selectedDoctor.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/img/doctor-1.jpg";
                          }}
                        />
                      </div>
                    </div>

                    {/* Nombre del doctor - estilo elegante */}
                    <h3 className="font-bold mb-1 text-base leading-tight tracking-wide" style={{ 
                      color: '#fff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      letterSpacing: '0.5px'
                    }}>
                      {cleanDoctorName(selectedDoctor.nombre, selectedDoctor.genero)}
                    </h3>
                    
                    {/* Especialidad */}
                    <p className="text-xs mb-4" style={{ 
                      color: 'rgba(255, 255, 255, 0.75)',
                      fontWeight: '500'
                    }}>
                      {selectedDoctor.especialidad}
                    </p>

                    {/* Info directa sin caja verde */}
                    <div className="w-full mb-4 space-y-2">
                      {selectedDoctor.experiencia && (
                        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#d4a574' }}>
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{selectedDoctor.experiencia} años de experiencia</span>
                        </div>
                      )}
                      
                      {selectedDoctor.rating && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`w-3.5 h-3.5 ${i < Math.floor(selectedDoctor.rating) ? 'text-yellow-400' : 'text-gray-500'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-white">{selectedDoctor.rating}</span>
                        </div>
                      )}

                      {selectedDoctor.precio && (
                        <div className="font-bold text-sm" style={{ color: '#a3e6c7' }}>
                          Desde ${selectedDoctor.precio}
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="w-full flex gap-2">
                      <a
                        href={`/doctores/${selectedDoctor.slug}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        style={{ 
                          background: '#ff8c42',
                          color: 'white'
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Ver perfil
                      </a>
                      {selectedDoctor.telefono && (
                        <a
                          href={`https://wa.me/${selectedDoctor.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${cleanDoctorName(selectedDoctor.nombre, selectedDoctor.genero)}, quisiera agendar una consulta`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                          style={{ 
                            background: '#49c04bff',
                            color: 'white'
                          }}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* Top Bar - Inside the card */}
          <div className="absolute top-0 left-0 right-0 z-10 pt-4 px-4">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-md shadow-lg rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Search bar */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Buscar ubicación..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
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

                {/* Filter toggle button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-shrink-0 p-2.5 rounded-full transition-colors ${
                    showFilters ? 'bg-orange-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>

                {/* Location button */}
                <button
                  onClick={centerOnUserLocation}
                  className="flex-shrink-0 p-2.5 bg-orange-500 text-white rounded-full transition-all duration-200 hover:bg-orange-600 hover:shadow-lg hover:scale-105"
                  title={(userLocation || currentUserLocation) ? "Mi ubicación" : "Obtener mi ubicación"}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Bottom Drawer - Airbnb Style */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: showFilters ? '0%' : 'calc(100% - 125px)' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20"
          >
          <div className="bg-white rounded-t-3xl shadow-2xl border-t-4 border-orange-500">
            {/* Drag Handle - More prominent */}
            <div className="flex justify-center pt-4 pb-2">
              <motion.div 
                className="w-16 h-1.5 bg-gray-400 rounded-full cursor-pointer"
                whileHover={{ scale: 1.2, backgroundColor: '#fb923c' }}
                onClick={() => setShowFilters(!showFilters)}
              />
            </div>

            {/* Summary Header - Always visible with better UX */}
            <div 
              className="px-6 pb-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-3xl"
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {doctorsWithLocation.length} doctores
                    </h3>
                    {!showFilters && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full animate-pulse">
                        Toca para filtrar
                      </span>
                    )}
                  </div>
                  
                  {/* Leyenda más visible */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-sm"></div>
                      <span className="font-medium">Premium</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm"></div>
                      <span className="font-medium">Plus</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-sm"></div>
                      <span className="font-medium">Básico</span>
                    </div>
                  </div>

                  {/* Indicador de filtros activos */}
                  {filters && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {filters.some(f => f.value) ? (
                        <>
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                          </svg>
                          <span className="text-orange-600 font-semibold">
                            {filters.filter(f => f.value).length} filtro{filters.filter(f => f.value).length > 1 ? 's' : ''} activo{filters.filter(f => f.value).length > 1 ? 's' : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span className="text-gray-500">Sin filtros aplicados</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Botón de expandir más visible */}
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ rotate: showFilters ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 bg-orange-100 rounded-full"
                  >
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                  <span className="text-xs text-gray-500 font-medium">
                    {showFilters ? 'Ocultar' : 'Mostrar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters Section - Expandable */}
            <AnimatePresence>
              {showFilters && filters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                          </svg>
                          Filtrar resultados en el mapa
                        </h4>
                        {filters.some(f => f.value) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              filters.forEach(f => f.setter(''));
                            }}
                            className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                        {filters.map((filter) => (
                          <div key={filter.id} className="space-y-1.5">
                            <label className="flex items-center text-xs font-semibold text-gray-700 truncate">
                              {filter.iconPath && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-3.5 h-3.5 mr-1.5 text-orange-500 flex-shrink-0"
                                >
                                  <path d={filter.iconPath} />
                                </svg>
                              )}
                              <span className="truncate">{filter.label}</span>
                            </label>
                            <select
                              value={filter.value}
                              onChange={(e) => {
                                e.stopPropagation();
                                filter.setter(e.target.value);
                              }}
                              className="w-full rounded-lg border-2 border-gray-300 py-2 px-2.5 text-xs text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white hover:border-orange-300 transition-colors"
                            >
                              <option value="">Todos</option>
                              {filter.options.map((opt) => (
                                <option
                                  key={typeof opt === "string" ? opt : opt.value}
                                  value={typeof opt === "string" ? opt : opt.value}
                                >
                                  {typeof opt === "string" ? opt : opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
              </div>
    </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}