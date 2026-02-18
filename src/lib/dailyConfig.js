// Configuración de Daily.co para videoconsultas
// Reemplaza la configuración anterior de Jitsi Meet

export const DAILY_CONFIG = {
  // API Key (server-side only - usada en /api/video/create-room)
  // Se accede via process.env.DAILY_API_KEY en el backend
  
  // Configuración por defecto para las salas
  defaultRoomProperties: {
    // Privacidad
    privacy: 'public', // 'public' = cualquiera con el link puede entrar
    
    // Expiración automática de la sala (24 horas)
    exp: () => Math.round(Date.now() / 1000) + 86400, // 24h desde ahora
    
    // Configuración de video/audio
    enable_chat: true,
    enable_screenshare: true,
    enable_recording: false, // Solo en planes pagos de Daily
    enable_knocking: false, // No requiere aprobación para entrar
    
    // Participantes
    max_participants: 10,
    
    // Auto-join settings
    start_video_off: false,
    start_audio_off: false,
    
    // Idioma
    lang: 'es',
  },

  // Configuración del iframe por rol
  doctorIframeConfig: {
    showLeaveButton: true,
    showFullscreenButton: true,
    showLocalVideo: true,
    showParticipantsBar: true,
    iframeStyle: {
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '0',
    },
  },

  patientIframeConfig: {
    showLeaveButton: true,
    showFullscreenButton: true,
    showLocalVideo: true,
    showParticipantsBar: true,
    iframeStyle: {
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '0',
    },
  },

  // Tipos de consulta (mismos que antes)
  consultationTypes: {
    general: {
      name: 'Consulta General',
      maxParticipants: 2,
      chatEnabled: true,
    },
    emergency: {
      name: 'Consulta de Emergencia',
      maxParticipants: 5,
      chatEnabled: true,
      priority: 'high',
    },
    followup: {
      name: 'Seguimiento',
      maxParticipants: 2,
      chatEnabled: true,
    },
    specialist: {
      name: 'Consulta con Especialista',
      maxParticipants: 3,
      chatEnabled: true,
    },
  },
};

// Obtener propiedades de sala según tipo de consulta
export const getRoomPropertiesForType = (consultationType = 'general') => {
  const typeConfig = DAILY_CONFIG.consultationTypes[consultationType] || 
                     DAILY_CONFIG.consultationTypes.general;
  
  return {
    privacy: 'public',
    exp: DAILY_CONFIG.defaultRoomProperties.exp(),
    enable_chat: typeConfig.chatEnabled,
    enable_screenshare: true,
    enable_knocking: false,
    max_participants: typeConfig.maxParticipants,
    start_video_off: false,
    start_audio_off: false,
    lang: 'es',
  };
};

// Obtener config del iframe según rol
export const getIframeConfigForRole = (role = 'patient') => {
  if (role === 'doctor' || role === 'admin') {
    return DAILY_CONFIG.doctorIframeConfig;
  }
  return DAILY_CONFIG.patientIframeConfig;
};

export default DAILY_CONFIG;
