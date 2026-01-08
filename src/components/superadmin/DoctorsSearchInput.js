import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * Componente de búsqueda aislado para evitar re-renders del componente padre
 * Usa debounce interno y solo notifica al padre cuando termina de escribir
 */
const DoctorsSearchInput = memo(function DoctorsSearchInput({ 
  initialValue = '', 
  onSearch, 
  isSearching = false,
  resultCount = 0 
}) {
  const [inputValue, setInputValue] = useState(initialValue);
  const debounceRef = useRef(null);
  const isFirstRender = useRef(true);

  // Sincronizar con valor inicial (ej: cuando viene de URL)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Solo sincronizar si el valor externo cambió (navegación del historial)
    setInputValue(initialValue);
  }, [initialValue]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce de 400ms
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 400);
  };

  const handleClear = () => {
    setInputValue('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nombre, email, especialidad o DNI..."
          value={inputValue}
          onChange={handleChange}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {inputValue && (
        <div className="mt-2 text-sm text-gray-600">
          {isSearching ? (
            <span className="text-gray-400 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Buscando...
            </span>
          ) : (
            <span>{resultCount} resultado{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}
    </div>
  );
});

export default DoctorsSearchInput;
