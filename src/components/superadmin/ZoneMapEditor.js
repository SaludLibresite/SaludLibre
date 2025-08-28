import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

// Global loader instance
let globalLoader = null;

const getGoogleMapsLoader = () => {
  if (!globalLoader && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    globalLoader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "drawing", "geometry"],
    });
  }
  return globalLoader;
};

export default function ZoneMapEditor({
  type,
  center,
  radius,
  coordinates,
  color,
  onCenterChange,
  onRadiusChange,
  onCoordinatesChange,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [circle, setCircle] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (map) {
      updateMapShape();
    }
  }, [map, type, center, radius, coordinates, color]);

  const initializeMap = async () => {
    try {
      const loader = getGoogleMapsLoader();
      if (!loader) {
        setError("Google Maps no está configurado");
        setIsLoading(false);
        return;
      }

      const google = await loader.load();
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: center || { lat: -34.6037, lng: -58.3816 },
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Initialize drawing manager
      const drawingManagerInstance = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.CIRCLE,
            google.maps.drawing.OverlayType.POLYGON,
          ],
        },
        circleOptions: {
          fillColor: color,
          fillOpacity: 0.2,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: false,
          editable: true,
          zIndex: 1,
        },
        polygonOptions: {
          fillColor: color,
          fillOpacity: 0.2,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: false,
          editable: true,
          zIndex: 1,
        },
      });

      drawingManagerInstance.setMap(mapInstance);

      // Handle drawing completion
      google.maps.event.addListener(drawingManagerInstance, 'circlecomplete', (newCircle) => {
        // Remove previous circle
        if (circle) {
          circle.setMap(null);
        }
        
        setCircle(newCircle);
        
        const center = newCircle.getCenter();
        const radius = newCircle.getRadius() / 1000; // Convert to km
        
        onCenterChange({ lat: center.lat(), lng: center.lng() });
        onRadiusChange(Math.round(radius * 100) / 100);
        
        // Add listeners for changes
        google.maps.event.addListener(newCircle, 'center_changed', () => {
          const newCenter = newCircle.getCenter();
          onCenterChange({ lat: newCenter.lat(), lng: newCenter.lng() });
        });
        
        google.maps.event.addListener(newCircle, 'radius_changed', () => {
          const newRadius = newCircle.getRadius() / 1000;
          onRadiusChange(Math.round(newRadius * 100) / 100);
        });
        
        // Stop drawing
        drawingManagerInstance.setDrawingMode(null);
      });

      google.maps.event.addListener(drawingManagerInstance, 'polygoncomplete', (newPolygon) => {
        // Remove previous polygon
        if (polygon) {
          polygon.setMap(null);
        }
        
        setPolygon(newPolygon);
        
        const path = newPolygon.getPath();
        const coordinates = [];
        
        for (let i = 0; i < path.getLength(); i++) {
          const vertex = path.getAt(i);
          coordinates.push({ lat: vertex.lat(), lng: vertex.lng() });
        }
        
        onCoordinatesChange(coordinates);
        
        // Add listener for path changes
        google.maps.event.addListener(path, 'set_at', () => {
          const newCoordinates = [];
          for (let i = 0; i < path.getLength(); i++) {
            const vertex = path.getAt(i);
            newCoordinates.push({ lat: vertex.lat(), lng: vertex.lng() });
          }
          onCoordinatesChange(newCoordinates);
        });
        
        google.maps.event.addListener(path, 'insert_at', () => {
          const newCoordinates = [];
          for (let i = 0; i < path.getLength(); i++) {
            const vertex = path.getAt(i);
            newCoordinates.push({ lat: vertex.lat(), lng: vertex.lng() });
          }
          onCoordinatesChange(newCoordinates);
        });
        
        // Stop drawing
        drawingManagerInstance.setDrawingMode(null);
      });

      setMap(mapInstance);
      setDrawingManager(drawingManagerInstance);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Error al cargar el mapa");
      setIsLoading(false);
    }
  };

  const updateMapShape = async () => {
    if (!map) return;

    const loader = getGoogleMapsLoader();
    const google = await loader.load();

    // Clear existing shapes
    if (circle) {
      circle.setMap(null);
      setCircle(null);
    }
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }

    if (type === "circle" && center) {
      const newCircle = new google.maps.Circle({
        center: center,
        radius: (radius || 10) * 1000, // Convert km to meters
        fillColor: color,
        fillOpacity: 0.2,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        editable: true,
        map: map,
      });

      // Add listeners for changes
      google.maps.event.addListener(newCircle, 'center_changed', () => {
        const newCenter = newCircle.getCenter();
        onCenterChange({ lat: newCenter.lat(), lng: newCenter.lng() });
      });
      
      google.maps.event.addListener(newCircle, 'radius_changed', () => {
        const newRadius = newCircle.getRadius() / 1000;
        onRadiusChange(Math.round(newRadius * 100) / 100);
      });

      setCircle(newCircle);
      
      // Center map on circle
      map.setCenter(center);
      map.setZoom(12);
    } else if (type === "polygon" && coordinates && coordinates.length > 0) {
      const newPolygon = new google.maps.Polygon({
        paths: coordinates,
        fillColor: color,
        fillOpacity: 0.2,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        editable: true,
        map: map,
      });

      const path = newPolygon.getPath();
      
      // Add listeners for path changes
      google.maps.event.addListener(path, 'set_at', () => {
        const newCoordinates = [];
        for (let i = 0; i < path.getLength(); i++) {
          const vertex = path.getAt(i);
          newCoordinates.push({ lat: vertex.lat(), lng: vertex.lng() });
        }
        onCoordinatesChange(newCoordinates);
      });
      
      google.maps.event.addListener(path, 'insert_at', () => {
        const newCoordinates = [];
        for (let i = 0; i < path.getLength(); i++) {
          const vertex = path.getAt(i);
          newCoordinates.push({ lat: vertex.lat(), lng: vertex.lng() });
        }
        onCoordinatesChange(newCoordinates);
      });

      setPolygon(newPolygon);
      
      // Fit map to polygon bounds
      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds);
    }
  };

  const clearShape = () => {
    if (circle) {
      circle.setMap(null);
      setCircle(null);
    }
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    
    if (type === "circle") {
      onCenterChange({ lat: -34.6037, lng: -58.3816 });
      onRadiusChange(10);
    } else {
      onCoordinatesChange([]);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          if (map) {
            map.setCenter(newCenter);
            map.setZoom(14);
          }
          
          if (type === "circle") {
            onCenterChange(newCenter);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("No se pudo obtener tu ubicación actual");
        }
      );
    } else {
      alert("Geolocalización no está disponible en tu navegador");
    }
  };

  if (error) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {type === "circle" 
            ? "Crea o arrastra el círculo para definir la zona" 
            : "Dibuja un polígono para definir la zona"}
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            📍 Mi ubicación
          </button>
          <button
            type="button"
            onClick={clearShape}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
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
          className="w-full h-96"
          style={{ minHeight: "384px" }}
        />
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 space-y-1">
        {type === "circle" && center && (
          <>
            <p>📍 Centro: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</p>
            <p>📏 Radio: {radius || 10} km</p>
          </>
        )}
        {type === "polygon" && coordinates.length > 0 && (
          <p>🔷 Polígono con {coordinates.length} puntos</p>
        )}
        <p className="text-gray-400">
          💡 Tip: Puedes usar las herramientas de dibujo en el mapa o editar las formas directamente arrastrando los puntos
        </p>
      </div>
    </div>
  );
}
