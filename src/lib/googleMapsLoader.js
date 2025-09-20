// Global Google Maps loader to prevent duplicate API loading
let isGoogleMapsLoaded = false;
let googleMapsPromise = null;

export const loadGoogleMaps = () => {
  // If already loaded, return resolved promise
  if (isGoogleMapsLoaded && window.google && window.google.maps) {
    return Promise.resolve(window.google);
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        isGoogleMapsLoaded = true;
        resolve(window.google);
      } else {
        reject(new Error('Google Maps API failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const isGoogleMapsReady = () => {
  return isGoogleMapsLoaded && window.google && window.google.maps;
};