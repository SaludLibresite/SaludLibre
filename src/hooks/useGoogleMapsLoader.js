import { useState, useRef, useEffect } from 'react';

export const useGoogleMapsLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadingPromise = useRef(null);

  const loadGoogleMaps = async () => {
    // Si ya está cargado globalmente, resolver inmediatamente
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      setError(null);
      return Promise.resolve(window.google);
    }

    // Si ya hay una carga en progreso, retornar esa promesa
    if (loadingPromise.current) {
      return loadingPromise.current;
    }

    setIsLoading(true);
    setError(null);

    // Verificar si ya existe un script de Google Maps
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
      // Script existe, esperar a que se cargue
      loadingPromise.current = new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 segundos
        
        const checkGoogleMaps = () => {
          attempts++;
          if (window.google && window.google.maps) {
            setIsLoaded(true);
            setIsLoading(false);
            setError(null);
            loadingPromise.current = null;
            resolve(window.google);
          } else if (attempts < maxAttempts) {
            setTimeout(checkGoogleMaps, 100);
          } else {
            const errorMsg = 'Timeout esperando Google Maps';
            setError(errorMsg);
            setIsLoading(false);
            loadingPromise.current = null;
            reject(new Error(errorMsg));
          }
        };
        
        checkGoogleMaps();
      });
    } else {
      // Crear nuevo script
      loadingPromise.current = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          let attempts = 0;
          const maxAttempts = 50;
          
          const checkGoogleMaps = () => {
            attempts++;
            if (window.google && window.google.maps) {
              setIsLoaded(true);
              setIsLoading(false);
              setError(null);
              loadingPromise.current = null;
              resolve(window.google);
            } else if (attempts < maxAttempts) {
              setTimeout(checkGoogleMaps, 100);
            } else {
              const errorMsg = 'Google Maps no se inicializó correctamente';
              setError(errorMsg);
              setIsLoading(false);
              loadingPromise.current = null;
              reject(new Error(errorMsg));
            }
          };
          
          checkGoogleMaps();
        };

        script.onerror = () => {
          const errorMsg = 'Error al cargar el script de Google Maps';
          setError(errorMsg);
          setIsLoading(false);
          loadingPromise.current = null;
          reject(new Error(errorMsg));
        };

        document.head.appendChild(script);
      });
    }

    return loadingPromise.current;
  };

  // Verificar si Google Maps ya está disponible al montar
  useEffect(() => {
    if (window.google && window.google.maps && !isLoaded) {
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
    }

    // Escuchar evento global de LoadScript (para compatibilidad con otras páginas)
    const handleGoogleMapsLoad = () => {
      if (window.google && window.google.maps && !isLoaded) {
        setIsLoaded(true);
        setIsLoading(false);
        setError(null);
      }
    };

    window.addEventListener('google-maps-loaded', handleGoogleMapsLoad);
    
    return () => {
      window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad);
    };
  }, [isLoaded]);

  return {
    isLoaded,
    isLoading,
    error,
    loadGoogleMaps,
    google: isLoaded ? window.google : null
  };
};