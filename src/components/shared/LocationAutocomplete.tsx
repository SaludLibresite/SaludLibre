'use client';

import { useRef, useCallback } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const LIBRARIES: ('places')[] = ['places'];

export interface LocationResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface LocationAutocompleteProps {
  defaultValue?: string;
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  defaultValue = '',
  onSelect,
  placeholder = 'Escribí una dirección...',
  className = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50',
}: LocationAutocompleteProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  });

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    onSelect({
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      formattedAddress: place.formatted_address ?? '',
    });
  }, [onSelect]);

  if (!isLoaded) {
    return (
      <input
        type="text"
        defaultValue={defaultValue}
        readOnly
        placeholder="Cargando mapa..."
        className={`${className} bg-gray-50 text-gray-500`}
      />
    );
  }

  return (
    <Autocomplete
      onLoad={(ac) => { autocompleteRef.current = ac; }}
      onPlaceChanged={onPlaceChanged}
      options={{ componentRestrictions: { country: 'ar' }, types: ['address'] }}
    >
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={className}
      />
    </Autocomplete>
  );
}
