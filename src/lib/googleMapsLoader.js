// Global Google Maps loader to prevent duplicate API loading
let isGoogleMapsLoaded = false;
let googleMapsPromise = null;

export const loadGoogleMaps = () => {
  // If already loaded, return resolved promise
  if (isGoogleMapsLoaded && window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  // Reset if promise exists but Google Maps is not actually loaded
  if (googleMapsPromise && (!window.google || !window.google.maps)) {
    googleMapsPromise = null;
    isGoogleMapsLoaded = false;
  }

  // If loading is in progress, return the existing promise
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  // Start loading Google Maps API
  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      resolve(window.google);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait a bit for the Google Maps API to fully initialize
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds maximum wait
      
      const checkGoogleMaps = () => {
        attempts++;
        
        if (window.google && window.google.maps) {
          isGoogleMapsLoaded = true;
          resolve(window.google);
        } else if (attempts < maxAttempts) {
          // Retry after a short delay
          setTimeout(checkGoogleMaps, 100);
        } else {
          // Reset state on failure
          googleMapsPromise = null;
          isGoogleMapsLoaded = false;
          reject(new Error('Google Maps API failed to fully initialize'));
        }
      };
      checkGoogleMaps();
    };

    script.onerror = () => {
      // Reset state on error
      googleMapsPromise = null;
      isGoogleMapsLoaded = false;
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const isGoogleMapsReady = () => {
  return isGoogleMapsLoaded && window.google && window.google.maps;
};