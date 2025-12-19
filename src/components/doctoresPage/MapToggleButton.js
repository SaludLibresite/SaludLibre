import React, { useState } from 'react';

export default function MapToggleButton({ onClick, isMapOpen, doctorsCount }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-xl 
          transition-all duration-300 transform hover:scale-105 active:scale-95
          ${isMapOpen 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
          }
          backdrop-blur-sm border border-white/20
        `}
      >
        {/* Icon */}
        <div className="relative">
          {isMapOpen ? (
            <svg 
              className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg 
              className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          
          {/* Animated dots for map icon */}
          {!isMapOpen && (
            <>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse delay-300"></div>
              <div className="absolute top-0 right-1 w-1 h-1 bg-red-400 rounded-full animate-pulse delay-500"></div>
            </>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col items-start">
          <span className="font-semibold text-xs md:text-sm">
            {isMapOpen ? 'Cerrar Mapa' : 'Ver en Mapa'}
          </span>
          {!isMapOpen && doctorsCount > 0 && (
            <span className="text-[10px] md:text-xs opacity-90">
              {doctorsCount} doctores
            </span>
          )}
        </div>

        {/* Hover glow effect */}
        <div className={`
          absolute inset-0 rounded-2xl transition-opacity duration-300
          ${isMapOpen 
            ? 'bg-gradient-to-r from-red-400/20 to-red-600/20' 
            : 'bg-gradient-to-r from-blue-400/20 to-indigo-600/20'
          }
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}></div>
      </button>

      {/* Tooltip */}
      {isHovered && !isMapOpen && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
          Ver doctores en el mapa
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
