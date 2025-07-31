// Configuración global de Jitsi Meet
export const JITSI_CONFIG = {
  // Dominio del servidor privado - ÚNICO servidor a usar
  domain: 'video.saludlibre.com.ar',
  
  // Configuración por defecto
  defaultConfig: {
    // Audio/Video settings
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    enableClosePage: false,
    prejoinPageEnabled: false,
    
    // UI/UX settings
    disableModeratorIndicator: false,
    disableProfile: false,
    hideDisplayName: false,
    
    // Features
    enableLipSync: false,
    enableNoiseCancellation: true,
    enableTalkWhileMuted: false,
    
    // Recording
    fileRecordingsEnabled: true,
    liveStreamingEnabled: false,
    
    // Chat and messaging
    enableChat: true,
    enablePrivateChat: true,
    
    // Screen sharing
    desktopSharingEnabled: true,
    
    // Layout
    channelLastN: 4,
    startVideoMuted: 10, // Mute video for participants beyond this number
    startAudioMuted: 10, // Mute audio for participants beyond this number
    
    // Analytics (disable for privacy)
    analytics: {
      disabled: true
    },
    
    // P2P (for 1-on-1 calls)
    p2p: {
      enabled: true,
      preferH264: true,
      disableH264: false,
      useStunTurn: true
    }
  },

  // Configuración de la interfaz
  defaultInterfaceConfig: {
    TOOLBAR_BUTTONS: [
      'microphone', 'camera', 'desktop', 'fullscreen',
      'fodeviceselection', 'hangup', 'profile', 'chat',
      'recording', 'settings', 'raisehand', 'videoquality',
      'filmstrip', 'tileview', 'download', 'help'
    ],
    
    SETTINGS_SECTIONS: [
      'devices', 'language', 'moderator', 'profile'
    ],
    
    // Branding
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: '',
    SHOW_POWERED_BY: false,
    
    // App info
    APP_NAME: 'Doctores AR',
    NATIVE_APP_NAME: 'Doctores AR Video Consulta',
    PROVIDER_NAME: 'Doctores AR',
    
    // Welcome page
    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
    DISPLAY_WELCOME_PAGE_CONTENT: false,
    
    // Language
    LANG_DETECTION: true,
    DEFAULT_LANGUAGE: 'es',
    
    // Connection indicator
    CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
    CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
    CONNECTION_INDICATOR_DISABLED: false,
    
    // Video layout
    VIDEO_LAYOUT_FIT: 'nocrop',
    TILE_VIEW_MAX_COLUMNS: 5,
    
    // Thumbnails
    LOCAL_THUMBNAIL_RATIO: 16 / 9,
    REMOTE_THUMBNAIL_RATIO: 1,
    
    // Disable promotional content
    MOBILE_APP_PROMO: false,
    
    // Recording
    LIVE_STREAMING_HELP_LINK: 'https://doctores-ar.com/help/streaming',
    
    // Notifications
    ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 15000
  },

  // Configuraciones específicas por rol
  doctorConfig: {
    // Los doctores son moderadores por defecto
    userInfo: {
      role: 'moderator'
    },
    configOverwrite: {
      // Configuración de moderador automático
      enableUserRolesBasedOnToken: false,
      moderatedRoomServiceUrl: '',
      
      // Deshabilitar diálogo de moderador
      disableModeratorIndicator: false,
      
      // Auto-promover a moderador
      enableAutomaticUrlCopy: false,
      
      // Permitir grabación
      fileRecordingsEnabled: true,
      fileRecordingsServiceEnabled: false, // Deshabilitar servicio de grabación automática
      
      // Control de participantes
      enableLobby: false,
      
      // Configuración de audio/video
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      
      // Deshabilitar página de bienvenida y configuración inicial
      enableWelcomePage: false,
      enableClosePage: false,
      prejoinPageEnabled: false,
      
      // Configuración de moderador
      enableInsecureRoomNameWarning: false,
      enableNoAudioSignal: true,
      enableNoisyMicDetection: true,
      
      // Calidad de video alta para doctores
      constraints: {
        video: {
          height: {
            ideal: 720,
            max: 1080,
            min: 240
          }
        }
      }
    },
    toolbarButtons: [
      'microphone', 'camera', 'desktop', 'fullscreen',
      'fodeviceselection', 'hangup', 'profile', 'chat',
      'recording', 'settings', 'raisehand', 'videoquality',
      'filmstrip', 'invite', 'tileview', 'download', 'help',
      'mute-everyone', 'mute-video-everyone'
    ]
  },

  patientConfig: {
    userInfo: {
      role: 'participant'
    },
    configOverwrite: {
      // Configuración básica para pacientes
      fileRecordingsEnabled: false,
      
      // Calidad de video estándar para pacientes
      constraints: {
        video: {
          height: {
            ideal: 480,
            max: 720,
            min: 240
          }
        }
      }
    },
    toolbarButtons: [
      'microphone', 'camera', 'fullscreen',
      'hangup', 'chat', 'settings', 'raisehand',
      'filmstrip', 'tileview'
    ]
  },

  // Configuración para diferentes tipos de consulta
  consultationTypes: {
    general: {
      name: 'Consulta General',
      maxParticipants: 2,
      recordingEnabled: true,
      chatEnabled: true
    },
    emergency: {
      name: 'Consulta de Emergencia',
      maxParticipants: 5,
      recordingEnabled: true,
      chatEnabled: true,
      priority: 'high'
    },
    followup: {
      name: 'Seguimiento',
      maxParticipants: 2,
      recordingEnabled: false,
      chatEnabled: true
    },
    specialist: {
      name: 'Consulta con Especialista',
      maxParticipants: 3,
      recordingEnabled: true,
      chatEnabled: true,
      screenSharingRequired: true
    }
  }
};

// Función para obtener configuración según el rol del usuario
export const getConfigForUser = (userRole, consultationType = 'general') => {
  const baseConfig = JITSI_CONFIG.defaultConfig;
  const baseInterfaceConfig = JITSI_CONFIG.defaultInterfaceConfig;
  
  let roleConfig = {};
  if (userRole === 'doctor' || userRole === 'admin') {
    roleConfig = JITSI_CONFIG.doctorConfig;
  } else {
    roleConfig = JITSI_CONFIG.patientConfig;
  }

  const consultationConfig = JITSI_CONFIG.consultationTypes[consultationType] || 
                            JITSI_CONFIG.consultationTypes.general;

  return {
    domain: JITSI_CONFIG.domain,
    configOverwrite: {
      ...baseConfig,
      ...roleConfig.configOverwrite,
      // Aplicar configuraciones específicas del tipo de consulta
      fileRecordingsEnabled: consultationConfig.recordingEnabled,
      enableChat: consultationConfig.chatEnabled
    },
    interfaceConfigOverwrite: {
      ...baseInterfaceConfig,
      TOOLBAR_BUTTONS: roleConfig.toolbarButtons || baseInterfaceConfig.TOOLBAR_BUTTONS
    },
    userInfo: {
      ...roleConfig.userInfo
    }
  };
};

// Función para generar nombres de sala seguros
export const generateSecureRoomName = (doctorId, patientId, appointmentId = null) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  if (appointmentId) {
    return `dr-${doctorId}-pt-${patientId}-apt-${appointmentId}-${timestamp}-${randomSuffix}`;
  }
  
  return `dr-${doctorId}-pt-${patientId}-inst-${timestamp}-${randomSuffix}`;
};

// Validaciones de configuración
export const validateJitsiConfig = () => {
  const warnings = [];
  
  if (JITSI_CONFIG.domain === 'meet.jit.si') {
    warnings.push('Usando servidor público de Jitsi. Recomendado cambiar a servidor propio para producción.');
  }
  
  return warnings;
};

export default JITSI_CONFIG;
