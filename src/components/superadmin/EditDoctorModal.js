import React, { useState, useEffect, useRef, useCallback } from 'react';
import { updateDoctor } from '../../lib/doctorsService';
import { getAllSpecialties } from '../../lib/specialtiesService';
import { loadGoogleMaps } from '../../lib/googleMapsLoader';

const EditDoctorModal = ({ isOpen, onClose, doctor, onDoctorUpdated }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    ubicacion: '',
    dni: '',
    telefono: '',
    descripcion: '',
    experiencia: '',
    graduacion: '',
    universidad: '',
    slug: ''
  });
  const [locationData, setLocationData] = useState({
    formattedAddress: '',
    latitude: null,
    longitude: null
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const locationInputRef = useRef(null);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize form data when doctor changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        nombre: doctor.nombre || '',
        email: doctor.email || '',
        especialidad: doctor.especialidad || '',
        ubicacion: doctor.formattedAddress || doctor.ubicacion || '',
        dni: doctor.dni || '',
        telefono: doctor.telefono || '',
        descripcion: doctor.descripcion || '',
        experiencia: doctor.experiencia || '',
        graduacion: doctor.graduacion || '',
        universidad: doctor.universidad || '',
        slug: doctor.slug || ''
      });

      // Initialize location data
      setLocationData({
        formattedAddress: doctor.formattedAddress || doctor.ubicacion || '',
        latitude: doctor.latitude || null,
        longitude: doctor.longitude || null
      });
    }
  }, [doctor]);

  // Load specialties
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const allSpecialties = await getAllSpecialties();
        const activeSpecialties = allSpecialties.filter(s => s.isActive !== false);
        setSpecialties(activeSpecialties);
      } catch (error) {
        console.error('Error loading specialties:', error);
      }
    };

    if (isOpen) {
      loadSpecialties();
    }
  }, [isOpen]);

  // Create or update marker on map
  const createMarker = useCallback((map, lat, lng) => {
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create new marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Ubicación del consultorio',
      draggable: true
    });

    // Handle marker drag
    marker.addListener('dragend', (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();

      // Reverse geocode to get new address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          
          setFormData(prev => ({
            ...prev,
            ubicacion: address
          }));

          setLocationData({
            formattedAddress: address,
            latitude: newLat,
            longitude: newLng
          });

          // Update input value
          if (locationInputRef.current) {
            locationInputRef.current.value = address;
          }
        }
      });
    });

    markerRef.current = marker;
  }, []);

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = useCallback(() => {
    if (!locationInputRef.current || !window.google || autocompleteRef.current) return;

    try {
      // Clear any existing autocomplete first
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'ar' }, // Restrict to Argentina
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address;

          // Update both form data and location data
          setFormData(prev => ({
            ...prev,
            ubicacion: address
          }));

          setLocationData({
            formattedAddress: address,
            latitude: lat,
            longitude: lng
          });

          // Provide visual feedback that location was selected
          console.log('Location selected:', address, { lat, lng });
        }
      });

      autocompleteRef.current = autocomplete;
      console.log('Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, []);

  // Initialize the mini map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || mapInstanceRef.current) return;

    try {
      console.log('Initializing map with locationData:', locationData);
      
      const defaultCenter = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires
      const center = locationData.latitude && locationData.longitude 
        ? { lat: locationData.latitude, lng: locationData.longitude }
        : defaultCenter;

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: locationData.latitude && locationData.longitude ? 15 : 11,
        center: center,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      mapInstanceRef.current = map;
      console.log('Map initialized successfully');

      // Add marker if we have coordinates
      if (locationData.latitude && locationData.longitude) {
        createMarker(map, locationData.latitude, locationData.longitude);
      }

      // Allow clicking on map to set location
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            
            setFormData(prev => ({
              ...prev,
              ubicacion: address
            }));

            setLocationData({
              formattedAddress: address,
              latitude: lat,
              longitude: lng
            });

            // Update input value
            if (locationInputRef.current) {
              locationInputRef.current.value = address;
            }
          }
        });
      });

      // Trigger resize to ensure proper rendering
      setTimeout(() => {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [locationData, createMarker]);

  // Update map location when coordinates change
  const updateMapLocation = useCallback(() => {
    if (!mapInstanceRef.current || !locationData.latitude || !locationData.longitude) return;

    const newCenter = { lat: locationData.latitude, lng: locationData.longitude };
    mapInstanceRef.current.setCenter(newCenter);
    mapInstanceRef.current.setZoom(15);

    // Create/update marker
    createMarker(mapInstanceRef.current, locationData.latitude, locationData.longitude);
  }, [locationData, createMarker]);

  // Load Google Maps and initialize autocomplete
  useEffect(() => {
    if (isOpen && !mapsLoaded) {
      loadGoogleMaps()
        .then(() => {
          setMapsLoaded(true);
        })
        .catch(error => {
          console.error('Error loading Google Maps:', error);
        });
    }
  }, [isOpen, mapsLoaded]);

  // Initialize autocomplete only once when modal opens and maps are loaded
  useEffect(() => {
    if (isOpen && mapsLoaded && !autocompleteRef.current) {
      setTimeout(() => {
        initializeAutocomplete();
      }, 100);
    }
  }, [isOpen, mapsLoaded, initializeAutocomplete]);

  // Initialize map when it becomes visible
  useEffect(() => {
    if (isOpen && mapsLoaded && mapRef.current && !mapInstanceRef.current) {
      setTimeout(() => {
        initializeMap();
      }, 200);
    }
  }, [isOpen, mapsLoaded, initializeMap]);

  // Update map when location changes
  useEffect(() => {
    if (mapsLoaded && locationData.latitude && locationData.longitude) {
      updateMapLocation();
    }
  }, [locationData, mapsLoaded, updateMapLocation]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Cleanup autocomplete when modal closes
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          console.warn('Error clearing autocomplete listeners:', error);
        }
        autocompleteRef.current = null;
      }
      
      // Cleanup map
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      
      // Cleanup marker
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch (error) {
          console.warn('Error clearing marker:', error);
        }
        markerRef.current = null;
      }

      // Reset maps loaded state to force re-initialization next time
      setMapsLoaded(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e) => {
    // Prevent form submission when pressing Enter in any input field
    // EXCEPT when it's the location input (let Google Maps autocomplete handle it)
    if (e.key === 'Enter' && e.target !== locationInputRef.current) {
      e.preventDefault();
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.nombre.trim()) {
        alert('El nombre es requerido');
        return;
      }

      if (!formData.email.trim()) {
        alert('El email es requerido');
        return;
      }

      if (!formData.especialidad) {
        alert('La especialidad es requerida');
        return;
      }

      // Prepare update data (only include fields that have values)
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (key !== 'ubicacion' && formData[key] && formData[key].trim() !== '') {
          updateData[key] = formData[key].trim();
        }
      });

      // Always include these required fields even if empty
      updateData.nombre = formData.nombre.trim();
      updateData.email = formData.email.trim();
      updateData.especialidad = formData.especialidad;

      // Add location data properly
      if (locationData.formattedAddress) {
        updateData.formattedAddress = locationData.formattedAddress;
        updateData.ubicacion = locationData.formattedAddress; // For backward compatibility
      }
      
      if (locationData.latitude !== null && locationData.longitude !== null) {
        updateData.latitude = locationData.latitude;
        updateData.longitude = locationData.longitude;
      }

      await updateDoctor(doctor.id, updateData);
      
      alert('Doctor actualizado exitosamente');
      onDoctorUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Error al actualizar el doctor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Doctor
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="doctor@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad *
              </label>
              <select
                name="especialidad"
                value={formData.especialidad}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar especialidad</option>
                {specialties.map(specialty => (
                  <option key={specialty.id} value={specialty.title}>
                    {specialty.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="dr-juan-perez"
              />
            </div>
          </div>

          {/* Location with Google Maps Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              ref={locationInputRef}
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Comenzar a escribir una dirección..."
              key={`location-${isOpen ? 'open' : 'closed'}`} // Force re-render when modal opens/closes
            />
            <p className="text-xs text-gray-500 mt-1">
              Comienza a escribir para ver sugerencias de ubicación. Usa las flechas ↑↓ para navegar y Enter para seleccionar.
            </p>
            
            {/* Mini Map */}
            {mapsLoaded && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Vista previa de ubicación
                    </span>
                    {locationData.latitude && locationData.longitude && (
                      <span className="text-xs text-gray-500">
                        Lat: {locationData.latitude.toFixed(6)}, Lng: {locationData.longitude.toFixed(6)}
                      </span>
                    )}
                  </div>
                </div>
                <div 
                  ref={mapRef} 
                  className="w-full h-48 bg-gray-100"
                  style={{ minHeight: '192px' }}
                  key={`map-${isOpen ? 'open' : 'closed'}`} // Force re-render when modal opens/closes
                >
                  {!mapInstanceRef.current && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando mapa...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    💡 {locationData.latitude && locationData.longitude 
                      ? 'Puedes hacer clic en el mapa o arrastrar el marcador para ajustar la ubicación exacta'
                      : 'Escribe una dirección arriba para ver la ubicación en el mapa'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Años de Experiencia
              </label>
              <input
                type="number"
                name="experiencia"
                value={formData.experiencia}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año de Graduación
              </label>
              <input
                type="number"
                name="graduacion"
                value={formData.graduacion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2015"
                min="1950"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <input
              type="text"
              name="universidad"
              value={formData.universidad}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Universidad de Buenos Aires"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción Profesional
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Breve descripción sobre la práctica médica, especialización, etc."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              onKeyDown={(e) => {
                // Allow Enter key on the submit button
                if (e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDoctorModal;