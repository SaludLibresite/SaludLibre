import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPinIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Global loader instance to avoid multiple initializations
let globalLoader = null;

const getGoogleMapsLoader = () => {
  if (!globalLoader && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    globalLoader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geocoding"],
    });
  }
  return globalLoader;
};

export default function GoogleMapsLocationPicker({
  initialLocation,
  onLocationSelect,
  className = "",
}) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {
      lat: -34.6037, // Buenos Aires default
      lng: -58.3816,
      address: "",
    }
  );

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loader = getGoogleMapsLoader();
        if (!loader) {
          throw new Error("Google Maps API key not configured");
        }

        const google = await loader.load();

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
          ],
        });

        // Create marker
        const markerInstance = new google.maps.Marker({
          position: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          },
          map: mapInstance,
          draggable: true,
          title: "Tu ubicación del consultorio",
        });

        // Initialize autocomplete
        if (searchInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              types: ["address"],
              componentRestrictions: { country: "AR" }, // Restrict to Argentina
              fields: ["place_id", "geometry", "name", "formatted_address"],
            }
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address;

              updateLocation(lat, lng, address, mapInstance, markerInstance);
            }
          });

          autocompleteRef.current = autocomplete;
        }

        // Add click listener to map
        mapInstance.addListener("click", (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          markerInstance.setPosition({ lat, lng });
          reverseGeocode(lat, lng, google);
        });

        // Add drag listener to marker
        markerInstance.addListener("dragend", (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          reverseGeocode(lat, lng, google);
        });

        setMap(mapInstance);
        setMarker(markerInstance);

        // If we have initial location, get its address
        if (initialLocation && !initialLocation.address) {
          reverseGeocode(initialLocation.lat, initialLocation.lng, google);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      initializeMap();
    } else {
      console.error("Google Maps API key not found");
      setIsLoading(false);
    }
  }, []);

  // Helper function to update location
  const updateLocation = (lat, lng, address, mapInstance, markerInstance) => {
    const locationData = { lat, lng, address };
    
    setSelectedLocation(locationData);
    onLocationSelect(locationData);
    
    // Update map and marker
    if (mapInstance && markerInstance) {
      mapInstance.setCenter({ lat, lng });
      markerInstance.setPosition({ lat, lng });
      mapInstance.setZoom(16);
    }
    
    setSearchQuery(address);
    setShowSuggestions(false);
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat, lng, google) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng },
      });

      if (response.results[0]) {
        const address = response.results[0].formatted_address;
        const locationData = {
          lat,
          lng,
          address,
        };

        setSelectedLocation(locationData);
        onLocationSelect(locationData);
        setSearchQuery(address);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  // Search for suggestions as user types
  const searchSuggestions = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const google = await new Promise((resolve, reject) => {
        if (window.google) {
          resolve(window.google);
        } else {
          const loader = getGoogleMapsLoader();
          if (loader) {
            loader.load().then(resolve).catch(reject);
          } else {
            reject(new Error("Google Maps API key not configured"));
          }
        }
      });

      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "AR" },
          types: ["address"],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setSuggestions(predictions || []);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error("Error getting suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    try {
      const google = window.google;
      const service = new google.maps.places.PlacesService(map);
      
      service.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ["geometry", "formatted_address"],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const address = place.formatted_address;

            updateLocation(lat, lng, address, map, marker);
          }
        }
      );
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    searchSuggestions(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Search for location (fallback for manual search)
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return;

    try {
      const google = window.google || await getGoogleMapsLoader().load();
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        address: searchQuery + ", Argentina",
      });

      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const address = response.results[0].formatted_address;

        updateLocation(lat, lng, address, map, marker);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (map && marker) {
            map.setCenter({ lat, lng });
            marker.setPosition({ lat, lng });
            map.setZoom(16);

            // Get address for current location
            if (window.google) {
              reverseGeocode(lat, lng, window.google);
            } else {
              const loader = getGoogleMapsLoader();
              if (loader) {
                loader
                  .load()
                  .then((google) => {
                    reverseGeocode(lat, lng, google);
                  })
                  .catch((error) => {
                    console.error(
                      "Error loading Google Maps for geocoding:",
                      error
                    );
                  });
              }
            }
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting current location:", error);
          setIsLoading(false);
        }
      );
    }
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`border-2 border-gray-300 rounded-lg p-8 text-center ${className}`}
      >
        <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Configuración de Google Maps requerida</p>
        <p className="text-sm text-gray-500 mt-2">
          Contacta al administrador para configurar la API de Google Maps
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar with Autocomplete */}
      <div className="relative">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Buscar dirección (ej: Av. Corrientes 1234, CABA)"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Usar mi ubicación actual"
          >
            <MapPinIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {suggestion.structured_formatting?.secondary_text || ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation.address && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <MapPinIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Ubicación seleccionada:
              </p>
              <p className="text-sm text-amber-700">
                {selectedLocation.address}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng:{" "}
                {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-96"
          style={{ minHeight: "384px" }}
        />
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          • Escribe en el campo de búsqueda para ver sugerencias de direcciones
        </p>
        <p>
          • Haz clic en el mapa o arrastra el marcador para ajustar tu ubicación
        </p>
        <p>• Usa el botón de ubicación para detectar tu posición actual</p>
      </div>
    </div>
  );
}
