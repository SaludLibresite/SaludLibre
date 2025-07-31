import { useState, useEffect, useRef } from 'react';

const SimpleVideoTest = ({ roomName }) => {
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [api, setApi] = useState(null);
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    console.log('SimpleVideoTest: Starting initialization with roomName:', roomName);
    
    const loadJitsi = async () => {
      try {
        // Verificar si ya está cargado
        if (window.JitsiMeetExternalAPI) {
          console.log('Jitsi already loaded');
          initJitsi();
          return;
        }

        console.log('Loading Jitsi script...');
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Jitsi script loaded successfully');
          setJitsiLoaded(true);
          initJitsi();
        };
        
        script.onerror = (err) => {
          console.error('Error loading Jitsi script:', err);
          setError('Error cargando Jitsi Meet');
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error('Error in loadJitsi:', err);
        setError('Error inicializando videoconsulta');
      }
    };

    const initJitsi = () => {
      if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
        console.error('Container or Jitsi API not available');
        return;
      }

      console.log('Initializing Jitsi with container:', jitsiContainerRef.current);
      
      // Limpiar contenedor
      jitsiContainerRef.current.innerHTML = '';

      const options = {
        roomName: roomName || 'test-room',
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          enableWelcomePage: false,
          enableClosePage: false
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_LANGUAGE: 'es'
        },
        userInfo: {
          displayName: 'Usuario Test'
        }
      };

      console.log('Creating Jitsi instance with options:', options);

      try {
        const jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', options);
        setApi(jitsiApi);

        jitsiApi.addEventListener('videoConferenceJoined', (participant) => {
          console.log('Successfully joined conference:', participant);
        });

        jitsiApi.addEventListener('readyToClose', () => {
          console.log('Ready to close');
        });

        console.log('Jitsi API created successfully');
        
      } catch (err) {
        console.error('Error creating Jitsi API:', err);
        setError('Error creando instancia de Jitsi');
      }
    };

    if (roomName) {
      loadJitsi();
    }

    return () => {
      if (api) {
        console.log('Disposing Jitsi API');
        api.dispose();
      }
    };
  }, [roomName]);

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded">
        <h3 className="text-red-800 font-bold">Error:</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded shadow">
        <p className="text-sm">
          Sala: {roomName || 'test-room'}<br/>
          Jitsi cargado: {jitsiLoaded ? '✅' : '⏳'}<br/>
          API creada: {api ? '✅' : '❌'}
        </p>
      </div>
      
      <div 
        ref={jitsiContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default SimpleVideoTest;
