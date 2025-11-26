import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChatBubbleLeftEllipsisIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatBubble = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: '¡Hola! Soy tu asistente virtual de Salud Libre. ¿En qué puedo ayudarte hoy? 🩺\n\nPuedo ayudarte a:\n• Encontrar doctores por especialidad médica\n• Buscar profesionales por barrio o zona\n• Mostrar especialidades disponibles\n• Recomendar doctores mejor calificados\n• Responder preguntas sobre nuestros servicios\n\n¿Qué necesitas?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la comunicación con el servidor');
      }

      const data = await response.json();

      setTimeout(() => {
        setIsTyping(false);
        const botMessage = {
          id: Date.now(),
          content: data.response,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setIsTyping(false);
      setIsLoading(false);
      const errorMessage = {
        id: Date.now(),
        content: 'Lo siento, tuve problemas para procesar tu mensaje. Por favor, intenta de nuevo.',
        isBot: true,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Función para renderizar contenido con enlaces clickeables
  const renderMessageContent = (content) => {
    // Regex para detectar enlaces en formato [texto](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // Agregar texto antes del enlace
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Agregar el enlace como elemento clickeable
      const linkText = match[1];
      const linkUrl = match[2];
      
      parts.push(
        <button
          key={match.index}
          onClick={() => {
            if (linkUrl.startsWith('/')) {
              router.push(linkUrl);
              setIsOpen(false); // Cerrar chat al navegar
            } else if (linkUrl.startsWith('tel:')) {
              window.location.href = linkUrl;
            } else if (linkUrl.startsWith('https://wa.me/')) {
              window.open(linkUrl, '_blank');
            } else {
              window.open(linkUrl, '_blank');
            }
          }}
          className={`font-medium transition-colors underline ${
            linkUrl.startsWith('tel:') 
              ? 'text-green-600 hover:text-green-800' 
              : linkUrl.startsWith('https://wa.me/')
              ? 'text-green-600 hover:text-green-800'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {linkText}
        </button>
      );
      
      lastIndex = linkRegex.lastIndex;
    }
    
    // Agregar texto restante
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    // Si no hay enlaces, devolver el contenido original
    if (parts.length === 0) {
      return content;
    }
    
    // Procesar saltos de línea en las partes de texto
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        return part.split('\n').map((line, lineIndex, lines) => (
          <span key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ));
      }
      return part;
    });
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 z-[9999] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Abrir chat de asistencia"
        >
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse">
            1
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-[9999] w-[calc(100%-2rem)] sm:w-96 max-w-md">
          <div className="h-[500px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente Salud Libre</h3>
                <p className="text-xs text-blue-100">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-white transition-all p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Cerrar chat"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl text-sm ${
                    message.isBot
                      ? message.isError
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {renderMessageContent(message.content)}
                  </div>
                  <p className={`text-xs mt-1 ${
                    message.isBot ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-3 sm:px-4 py-2 rounded-2xl shadow-sm border border-gray-200 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                aria-label="Enviar mensaje"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Quick suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {messages.length === 1 && (
                <>
                  <button
                    onClick={() => setInputValue('¿Qué especialidades médicas tienen disponibles?')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors"
                  >
                    Ver especialidades
                  </button>
                  <button
                    onClick={() => setInputValue('Necesito un cardiólogo')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors"
                  >
                    Buscar cardiólogo
                  </button>
                  <button
                    onClick={() => setInputValue('Doctores en Palermo')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors"
                  >
                    Doctores en Palermo
                  </button>
                  <button
                    onClick={() => setInputValue('Vivo en Caballito')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors"
                  >
                    Vivo en Caballito
                  </button>
                  <button
                    onClick={() => setInputValue('Doctor García')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors"
                  >
                    Buscar doctor
                  </button>
                  <button
                    onClick={() => setInputValue('¿Qué barrios tienen doctores?')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors"
                  >
                    Ver zonas
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default ChatBubble;