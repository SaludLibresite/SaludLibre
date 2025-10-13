import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * Servicio para interactuar con Gemini 2.0 Flash
 */
export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Procesa una consulta del usuario y determina si necesita ejecutar funciones
   * @param {string} userQuery - La consulta del usuario
   * @param {Array} availableFunctions - Lista de funciones disponibles
   * @param {Array} chatHistory - Historial de conversación
   * @returns {Object} Resultado del procesamiento
   */
  async processUserQuery(userQuery, availableFunctions, chatHistory = []) {
    try {
      // Primero intentar detectar directamente si necesita una función específica
      const directFunction = this.detectDirectFunction(userQuery, chatHistory);
      
      if (directFunction) {
        return {
          text: null,
          functionCall: directFunction,
          requiresFunction: true
        };
      }

      // Construir contexto de conversación
      let conversationContext = '';
      if (chatHistory && chatHistory.length > 0) {
        const recentMessages = chatHistory.slice(-4); // Solo los últimos 4 mensajes
        conversationContext = '\n\nContexto de conversación previa:\n' + 
          recentMessages.map(msg => 
            `${msg.isBot ? 'Asistente' : 'Usuario'}: ${msg.content}`
          ).join('\n');
      }

      // Si no hay función directa, usar Gemini para procesar
      const systemPrompt = `
Eres un asistente virtual médico amigable de Salud Libre en Argentina. Tu trabajo es ayudar a encontrar doctores.

Consulta del usuario: "${userQuery}"
${conversationContext}

REGLAS CRÍTICAS:
1. NUNCA menciones "funciones", "búsquedas", "procesos técnicos" o "sistemas internos" al usuario
2. Cuando el usuario mencione UNA ubicación específica, NO preguntes por la ubicación de nuevo
3. Si el usuario da una ubicación, intenta buscar doctores ahí INMEDIATAMENTE
4. Si no hay resultados en esa zona, di claramente "No tengo doctores disponibles en [zona]" y sugiere ver zonas disponibles
5. Sé DIRECTO - no des vueltas preguntando lo mismo repetidamente
6. Si falta información crítica (especialidad O ubicación), pregunta UNA sola vez de forma natural
7. Responde en español de Argentina, de forma cálida pero eficiente

Ejemplos CORRECTOS:
- Usuario: "Busco dermatólogo en Palermo" → Buscar inmediatamente, no preguntar de nuevo por ubicación
- Usuario: "Puebla" (tras pedir ubicación) → Buscar ahí, si no hay resultados decir claramente
- Usuario: "Busco médico clínico" → "¿En qué zona lo necesitas?"

Ejemplos INCORRECTOS (NO hacer):
- ❌ "¿Hay alguna zona en particular que te venga mejor?"
- ❌ "necesitaré usar la función..."
- ❌ Preguntar por ubicación cuando ya la dieron

Responde ahora de forma natural y DIRECTA:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      // Analizar si la respuesta indica que necesita usar alguna función
      const functionToCall = this.extractFunctionCall(text, availableFunctions);

      return {
        text: text,
        functionCall: functionToCall,
        requiresFunction: !!functionToCall
      };

    } catch (error) {
      console.error('Error procesando consulta con Gemini:', error);
      throw new Error('Error procesando tu consulta. Por favor intenta de nuevo.');
    }
  }

  /**
   * Detecta directamente qué función necesita basada en la consulta del usuario
   * @param {string} query - Consulta del usuario
   * @param {Array} chatHistory - Historial de conversación para contexto
   * @returns {Object|null} Función a llamar o null
   */
  detectDirectFunction(query, chatHistory = []) {
    const queryLower = query.toLowerCase();
    
    // NUEVO: Detectar si el usuario está respondiendo con una ubicación en contexto
    // Buscar en el historial si el bot preguntó por ubicación recientemente
    if (chatHistory.length > 0) {
      const lastBotMessage = chatHistory[chatHistory.length - 1];
      if (lastBotMessage && lastBotMessage.isBot) {
        const botMessageLower = lastBotMessage.content.toLowerCase();
        
        // Si el bot preguntó por zona/ubicación y el usuario responde
        if ((botMessageLower.includes('zona') || 
             botMessageLower.includes('ubicación') || 
             botMessageLower.includes('dónde') ||
             botMessageLower.includes('en qué parte')) &&
            !queryLower.includes('doctor') && 
            !queryLower.includes('médico') &&
            query.length < 50) { // Probablemente es solo una ubicación
          
          // Buscar si hay una especialidad mencionada en mensajes anteriores
          let specialty = null;
          for (let i = chatHistory.length - 1; i >= 0; i--) {
            const msg = chatHistory[i];
            if (!msg.isBot) {
              const msgLower = msg.content.toLowerCase();
              const specialtyKeywords = [
                'dermatólogo', 'cardiólogo', 'pediatra', 'ginecólogo', 'traumatólogo',
                'neurólogo', 'psiquiatra', 'psicólogo', 'oftalmólogo', 'otorrinolaringólogo',
                'urólogo', 'gastroenterólogo', 'endocrinólogo', 'nutricionista',
                'médico clínico', 'médico general', 'clínico'
              ];
              specialty = specialtyKeywords.find(kw => msgLower.includes(kw));
              if (specialty) break;
            }
          }
          
          // Si encontramos especialidad en el historial, hacer búsqueda combinada
          if (specialty) {
            return {
              name: 'searchDoctorsBySpecialtyAndLocation',
              parameters: { specialty, location: query.trim() }
            };
          } else {
            // Si no hay especialidad, buscar solo por ubicación
            return {
              name: 'searchDoctorsByLocation',
              parameters: { location: query.trim() }
            };
          }
        }
      }
    }
    
    // Detectar referencia numérica a doctores de listas anteriores (ej: "2", "el 3", "número 1")
    const numberMatch = query.match(/^(?:el\s+)?(\d+)$|^número\s+(\d+)$|me\s+interesa\s+el\s+(\d+)|quiero\s+(?:información\s+)?del?\s+(\d+)|(?:más\s+)?(?:info|información)\s+del?\s+(\d+)/i);
    if (numberMatch && chatHistory.length > 0) {
      const number = parseInt(numberMatch[1] || numberMatch[2] || numberMatch[3] || numberMatch[4] || numberMatch[5]);
      // Buscar en el historial una respuesta que contenga una lista numerada
      const lastBotMessage = chatHistory.slice().reverse().find(msg => 
        msg.isBot && msg.content.includes(`${number}.`) && msg.content.includes('**')
      );
      
      if (lastBotMessage) {
        // Extraer el nombre del doctor de la lista numerada
        const doctorMatch = lastBotMessage.content.match(new RegExp(`${number}\\. \\*\\*([^*]+)\\*\\*`));
        if (doctorMatch) {
          const doctorName = doctorMatch[1].trim();
          return {
            name: 'getDoctorInfo',
            parameters: { doctorName }
          };
        }
      }
    }
    
    // Detectar búsqueda de doctor específico por nombre
    if (queryLower.includes('doctor ') || queryLower.includes('dr ') || queryLower.includes('dra ')) {
      // Extraer el nombre del doctor
      const doctorMatch = query.match(/(?:doctor|dr\.?|dra\.?)\s+([a-záéíóúñ\s]+)/i);
      if (doctorMatch) {
        const doctorName = doctorMatch[1].trim();
        return {
          name: 'getDoctorInfo',
          parameters: { doctorName }
        };
      }
    }
    
    // Detectar nombres de doctores comunes (sin título)
    const commonDoctorNames = [
      'gonzález', 'rodríguez', 'fernández', 'garcía', 'martínez', 'lópez', 'pérez',
      'sánchez', 'ramírez', 'torres', 'flores', 'rivera', 'gómez', 'díaz', 'morales'
    ];
    
    // Detectar patrones de "Vivo en/Estoy en {location}"
    const locationPatterns = [
      /vivo\s+en\s+([a-záéíóúñ\s]+)/i,
      /estoy\s+en\s+([a-záéíóúñ\s]+)/i,
      /me\s+encuentro\s+en\s+([a-záéíóúñ\s]+)/i,
      /soy\s+de\s+([a-záéíóúñ\s]+)/i,
      /estoy\s+ubicado\s+en\s+([a-záéíóúñ\s]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = queryLower.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        return {
          name: 'searchDoctorsByLocation',
          parameters: { location }
        };
      }
    }

    // Si contiene un apellido común y parece búsqueda de persona
    const hasCommonName = commonDoctorNames.some(name => queryLower.includes(name));
    const looksLikeName = /[a-záéíóúñ]+\s+[a-záéíóúñ]+/i.test(query);
    
    if (hasCommonName && looksLikeName && !queryLower.includes('especialidad')) {
      return {
        name: 'getDoctorInfo',
        parameters: { doctorName: query.trim() }
      };
    }
    
    // Detectar búsqueda combinada de especialidad + ubicación
    const locationKeywords = [
      'en ', 'cerca de ', 'por ', 'zona ', 'barrio ', 'área ',
      'palermo', 'recoleta', 'belgrano', 'centro', 'microcentro',
      'san isidro', 'vicente lópez', 'tigre', 'martínez', 'olivos',
      'núñez', 'coghlan', 'saavedra', 'villa urquiza', 'caballito',
      'flores', 'almagro', 'balvanera', 'san telmo', 'la boca',
      'constitución', 'barracas', 'retiro', 'puerto madero',
      'villa crespo', 'villa del parque', 'devoto', 'villa pueyrredón',
      'paternal', 'chacarita', 'colegiales', 'agronomía', 'villa ortúzar'
    ];
    
    const specialtyKeywords = [
      'dermatólogo', 'cardiólogo', 'pediatra', 'ginecólogo', 'traumatólogo',
      'neurólogo', 'psiquiatra', 'psicólogo', 'oftalmólogo', 'otorrinolaringólogo',
      'urólogo', 'gastroenterólogo', 'endocrinólogo', 'nutricionista',
      'médico clínico', 'médico general', 'especialista'
    ];
    
    // Detectar si hay especialidad y ubicación en la misma consulta
    const hasSpecialty = specialtyKeywords.some(keyword => queryLower.includes(keyword));
    const hasLocation = locationKeywords.some(keyword => queryLower.includes(keyword));
    
    if (hasSpecialty && hasLocation) {
      // Extraer especialidad
      const specialty = specialtyKeywords.find(keyword => queryLower.includes(keyword));
      
      // Extraer ubicación (buscar después de palabras clave de ubicación)
      let location = '';
      for (const locKeyword of ['en ', 'cerca de ', 'por ', 'zona ', 'barrio ']) {
        if (queryLower.includes(locKeyword)) {
          const parts = queryLower.split(locKeyword);
          if (parts.length > 1) {
            location = parts[1].trim().split(' ')[0]; // Tomar la primera palabra después
            break;
          }
        }
      }
      
      // Si no se extrajo ubicación con palabras clave, buscar nombres de barrios directamente
      if (!location) {
        location = locationKeywords.find(keyword => 
          queryLower.includes(keyword) && 
          !['en ', 'cerca de ', 'por ', 'zona ', 'barrio ', 'área '].includes(keyword)
        );
      }
      
      if (specialty && location) {
        return {
          name: 'searchDoctorsBySpecialtyAndLocation',
          parameters: { specialty, location }
        };
      }
    }
    
    // Detectar búsqueda solo por ubicación
    if (hasLocation && !hasSpecialty && 
        (queryLower.includes('doctores') || queryLower.includes('médicos'))) {
      let location = '';
      
      // Extraer ubicación
      for (const locKeyword of ['doctores en ', 'médicos en ', 'profesionales en ', 'cerca de ', 'en zona ', 'en barrio ']) {
        if (queryLower.includes(locKeyword)) {
          const parts = queryLower.split(locKeyword);
          if (parts.length > 1) {
            location = parts[1].trim();
            break;
          }
        }
      }
      
      // Si no se extrajo con palabras clave, buscar nombres de barrios directamente
      if (!location) {
        location = locationKeywords.find(keyword => 
          queryLower.includes(keyword) && 
          !['en ', 'cerca de ', 'por ', 'zona ', 'barrio ', 'área '].includes(keyword)
        );
      }
      
      if (location) {
        return {
          name: 'searchDoctorsByLocation',
          parameters: { location }
        };
      }
    }
    
    // Detectar búsqueda por especialidad solamente
    if (hasSpecialty) {
      const specialty = specialtyKeywords.find(keyword => queryLower.includes(keyword));
      return {
        name: 'searchDoctorsBySpecialty',
        parameters: { specialty }
      };
    }
    
    // Detectar solicitud de especialidades disponibles
    if (queryLower.includes('especialidades') || 
        queryLower.includes('qué especialidades') ||
        queryLower.includes('lista de especialidades')) {
      return {
        name: 'getAvailableSpecialties',
        parameters: {}
      };
    }
    
    // Detectar solicitud de barrios/zonas disponibles
    if (queryLower.includes('barrios') || 
        queryLower.includes('zonas') ||
        queryLower.includes('dónde tienen doctores') ||
        queryLower.includes('qué zonas cubren')) {
      return {
        name: 'getAvailableNeighborhoods',
        parameters: {}
      };
    }
    
    // Detectar solicitud de top doctores
    if (queryLower.includes('mejores doctores') || 
        queryLower.includes('top doctores') ||
        queryLower.includes('doctores mejor calificados') ||
        queryLower.includes('doctores más recomendados')) {
      return {
        name: 'getTopRatedDoctors',
        parameters: {}
      };
    }
    
    return null;
  }

  /**
   * Extrae la llamada a función del texto de respuesta
   */
  extractFunctionCall(text, availableFunctions) {
    // Buscar patrones de llamada a función en el texto
    for (const func of availableFunctions) {
      if (text.toLowerCase().includes(func.name.toLowerCase())) {
        return {
          name: func.name,
          parameters: {}
        };
      }
    }
    return null;
  }

  /**
   * Genera una respuesta usando el contexto de función ejecutada
   * @param {string} originalQuery - Consulta original del usuario
   * @param {string} functionName - Nombre de la función ejecutada
   * @param {Object} functionResult - Resultado de la función
   * @param {Array} chatHistory - Historial de conversación
   * @returns {string} Respuesta formateada
   */
  async generateResponseWithFunctionResult(originalQuery, functionName, functionResult, chatHistory = []) {
    try {
      // Si es búsqueda de doctores, formatear con enlaces
      if ((functionName === 'searchDoctorsBySpecialty' || 
           functionName === 'searchDoctorsByLocation' ||
           functionName === 'searchDoctorsBySpecialtyAndLocation') && 
          Array.isArray(functionResult) && functionResult.length > 0) {
        return this.formatDoctorsResponse(functionResult, originalQuery, functionName);
      }
      
      // Si es lista de especialidades
      if (functionName === 'getAvailableSpecialties' && Array.isArray(functionResult)) {
        return this.formatSpecialtiesResponse(functionResult);
      }
      
      // Si es lista de barrios
      if (functionName === 'getAvailableNeighborhoods' && Array.isArray(functionResult)) {
        return this.formatNeighborhoodsResponse(functionResult);
      }
      
      // Si es top doctores
      if (functionName === 'getTopRatedDoctors' && Array.isArray(functionResult)) {
        return this.formatTopDoctorsResponse(functionResult);
      }
      
      // Si es información de doctor específico
      if (functionName === 'getDoctorInfo' && functionResult && !functionResult.error) {
        return this.formatDoctorInfoResponse(functionResult);
      }

      // Si no hay resultados
      if (Array.isArray(functionResult) && functionResult.length === 0) {
        return this.formatNoResultsResponse(originalQuery, functionName);
      }

      // Construir contexto de conversación
      let conversationContext = '';
      if (chatHistory && chatHistory.length > 0) {
        const recentMessages = chatHistory.slice(-3); // Solo los últimos 3 mensajes
        conversationContext = '\n\nContexto de conversación:\n' + 
          recentMessages.map(msg => 
            `${msg.isBot ? 'Asistente' : 'Usuario'}: ${msg.content}`
          ).join('\n');
      }

      // Para otros casos, usar Gemini
      const prompt = `
Usuario preguntó: "${originalQuery}"
${conversationContext}

Se ejecutó la función: ${functionName}
Resultado: ${JSON.stringify(functionResult, null, 2)}

Genera una respuesta natural y útil en español para el usuario basada en estos resultados y el contexto de la conversación.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error generando respuesta con resultado de función:', error);
      return 'Tuve problemas para procesar tu consulta. Por favor intenta de nuevo.';
    }
  }

  /**
   * Formatea respuesta de lista de doctores con enlaces clickeables
   */
  formatDoctorsResponse(doctors, query, functionName) {
    let contextText = '';
    
    if (functionName === 'searchDoctorsBySpecialty') {
      contextText = 'especialistas para ti';
    } else if (functionName === 'searchDoctorsByLocation') {
      contextText = 'doctores en esa zona';
    } else if (functionName === 'searchDoctorsBySpecialtyAndLocation') {
      contextText = 'especialistas en esa zona';
    }
    
    // Si hay solo un doctor, mostrar formato especial con botones de contacto
    if (doctors.length === 1) {
      return this.formatSingleDoctorWithContact(doctors[0], contextText);
    }
    
    let response = `¡Encontré ${doctors.length} ${contextText}! 🩺\n\n`;
    
    doctors.forEach((doctor, index) => {
      const rating = doctor.rating > 0 ? `⭐ ${doctor.rating.toFixed(1)}` : 'Sin calificación';
      const reviewText = doctor.reviewCount > 0 ? ` (${doctor.reviewCount} reseñas)` : '';
      
      response += `${index + 1}. **${doctor.name}**\n`;
      response += `🏥 ${doctor.specialty}\n`;
      response += `${rating}${reviewText}\n`;
      
      if (doctor.consultationFee) {
        response += `💰 Consulta: $${doctor.consultationFee}\n`;
      }
      
      if (doctor.barrio && doctor.barrio !== 'Otros') {
        response += `📍 ${doctor.barrio}\n`;
      } else if (doctor.neighborhood || doctor.city) {
        response += `📍 ${doctor.neighborhood || doctor.city}\n`;
      }
      
      // Agregar enlace clickeable
      if (doctor.slug) {
        response += `👉 [Ver perfil completo](/doctores/${doctor.slug})\n`;
      }
      
      response += '\n';
    });
    
    response += '¿Te interesa alguno en particular? ¡Puedo darte más información! 😊';
    
    return response;
  }

  /**
   * Formatea respuesta de doctor único con botones de contacto
   */
  formatSingleDoctorWithContact(doctor, contextText = '') {
    let response = `¡Perfecto! Encontré ${contextText ? 'el ' + contextText : 'este doctor'} para ti: 🎯\n\n`;
    
    response += `**${doctor.name}**\n`;
    response += `🏥 ${doctor.specialty}\n`;
    
    if (doctor.rating > 0) {
      response += `⭐ ${doctor.rating.toFixed(1)}`;
      if (doctor.reviewCount > 0) {
        response += ` (${doctor.reviewCount} reseñas)`;
      }
      response += '\n';
    }
    
    if (doctor.consultationFee) {
      response += `💰 Consulta: $${doctor.consultationFee}\n`;
    }
    
    if (doctor.barrio && doctor.barrio !== 'Otros') {
      response += `📍 ${doctor.barrio}\n`;
    } else if (doctor.address) {
      response += `📍 ${doctor.address}\n`;
    }
    
    if (doctor.description) {
      response += `📝 ${doctor.description}\n`;
    }
    
    response += '\n**¿Cómo te gustaría contactarlo?**\n\n';
    
    // Botones de contacto - SIEMPRE mostrar
    if (doctor.phone) {
      const phoneClean = doctor.phone.replace(/[^0-9]/g, '');
      response += `📞 [Llamar ahora](tel:+54${phoneClean})\n`;
      response += `💬 [WhatsApp](https://wa.me?phone=54${phoneClean}&text=Hola%2C%20me%20interesa%20agendar%20una%20consulta)\n`;
    } else {
      // Mostrar botones genéricos si no hay teléfono específico
      response += `📞 [Llamar ahora](tel:+541143218765)\n`;
      response += `💬 [WhatsApp](https://wa.me?phone=541143218765&text=Hola%2C%20me%20interesa%20información%20médica)\n`;
    }
    
    // Enlace al perfil completo
    if (doctor.slug) {
      response += `👨‍⚕️ [Ver perfil completo y agendar online](/doctores/${doctor.slug})\n`;
    }
    
    response += '\n¿Necesitas ayuda con algo más? 😊';
    
    return response;
  }

  /**
   * Formatea respuesta de información de doctor específico - CON DEBUG
   */
  formatDoctorInfoResponse(doctor) {
    // DEBUG: Verificar qué datos estamos recibiendo
    console.log('🔍 DEBUG formatDoctorInfoResponse - Doctor data:', {
      name: doctor.name,
      phone: doctor.phone,
      hasPhone: !!doctor.phone,
      slug: doctor.slug,
      allData: doctor
    });
    
    let response = `¡Aquí tienes la información de **${doctor.name}**! 👨‍⚕️\n\n`;
    
    response += `🏥 **Especialidad:** ${doctor.specialty}\n`;
    
    if (doctor.rating > 0) {
      response += `⭐ **Calificación:** ${doctor.rating.toFixed(1)}`;
      if (doctor.reviewCount > 0) {
        response += ` (${doctor.reviewCount} reseñas)`;
      }
      response += '\n';
    }
    
    if (doctor.consultationFee) {
      response += `💰 **Consulta:** $${doctor.consultationFee}\n`;
    }
    
    if (doctor.barrio && doctor.barrio !== 'Otros') {
      response += `📍 **Zona:** ${doctor.barrio}\n`;
    } else if (doctor.address) {
      response += `📍 **Ubicación:** ${doctor.address}\n`;
    }
    
    if (doctor.description) {
      response += `📝 **Descripción:** ${doctor.description}\n`;
    }
    
    response += '\n**¿Cómo te gustaría contactarlo?**\n\n';
    
    // Botones de contacto - SIEMPRE mostrar botones
    if (doctor.phone) {
      const phoneClean = doctor.phone.replace(/[^0-9]/g, '');
      console.log('📞 DEBUG - Teléfono encontrado:', doctor.phone, '-> limpio:', phoneClean);
      response += `📞 [Llamar ahora](tel:+54${phoneClean})\n`;
      response += `💬 [WhatsApp](https://wa.me?phone=54${phoneClean}&text=Hola%2C%20me%20interesa%20agendar%20una%20consulta%20con%20${encodeURIComponent(doctor.name)})\n`;
    } else {
      console.log('⚠️ DEBUG - No se encontró teléfono para el doctor:', doctor.name);
      // Mostrar botones genéricos si no hay teléfono específico
      response += `📞 [Llamar ahora](tel:+541143218765)\n`;
      response += `💬 [WhatsApp](https://wa.me?phone=541143218765&text=Hola%2C%20me%20interesa%20información%20sobre%20el%20Dr.%20${encodeURIComponent(doctor.name)})\n`;
    }
    
    // Enlace al perfil completo
    if (doctor.slug) {
      response += `👨‍⚕️ [Ver perfil completo y agendar online](/doctores/${doctor.slug})\n`;
    }
    
    response += '\n¿Te gustaría que te ayude con algo más? 😊';
    
    return response;
  }

  /**
   * Formatea respuesta cuando no hay resultados
   */
  formatNoResultsResponse(query, functionName) {
    const queryLower = query.toLowerCase();
    
    if (functionName === 'searchDoctorsByLocation') {
      return `Lo siento, no tengo doctores disponibles en esa zona. 😔\n\nPero tengo doctores en estas zonas de Argentina:\n• Palermo\n• Recoleta\n• Belgrano\n• Núñez\n• Centro\n• Caballito\n• Y más...\n\n¿Querés ver todas las zonas disponibles? Preguntame: "¿En qué zonas tienen doctores?"`;
    } else if (functionName === 'searchDoctorsBySpecialty') {
      return `No encontré doctores de esa especialidad. 😔\n\n¿Te gustaría ver todas las especialidades disponibles?\n\nPreguntame: "¿Qué especialidades tienen?"`;
    } else if (functionName === 'searchDoctorsBySpecialtyAndLocation') {
      return `No tengo doctores de esa especialidad en esa zona. 😔\n\nTe sugiero:\n• Ver todas las zonas disponibles: "¿En qué zonas tienen doctores?"\n• Buscar solo la especialidad sin zona: "Busco [especialidad]"\n• Ver todas las especialidades: "¿Qué especialidades tienen?"`;
    }
    
    return `No encontré resultados para tu búsqueda. 😔\n\n¿Podrías intentar con otros términos?`;
  }

  /**
   * Formatea respuesta de especialidades disponibles
   */
  formatSpecialtiesResponse(specialties) {
    let response = `Tenemos ${specialties.length} especialidades médicas disponibles: 🩺\n\n`;
    
    specialties.forEach((specialty, index) => {
      // Si es un objeto con title, formatear apropiadamente
      if (typeof specialty === 'object' && specialty.title) {
        response += `${index + 1}. **${specialty.title}**`;
        if (specialty.description) {
          response += ` - ${specialty.description}`;
        }
        response += '\n';
      } else if (typeof specialty === 'object' && specialty.name) {
        // Fallback por si viene con name
        response += `${index + 1}. ${specialty.name}\n`;
      } else {
        // Fallback para strings simples
        response += `${index + 1}. ${specialty}\n`;
      }
    });
    
    response += '\n¿Qué especialidad te interesa? Puedes preguntarme "Necesito un cardiólogo" o "Busco dermatólogos en Palermo" 😊';
    
    return response;
  }

  /**
   * Formatea respuesta de barrios disponibles
   */
  formatNeighborhoodsResponse(neighborhoods) {
    let response = `Tenemos doctores en ${neighborhoods.length} zonas: 📍\n\n`;
    
    neighborhoods.forEach((neighborhood, index) => {
      // Si es un objeto con name y count, formatear apropiadamente
      if (typeof neighborhood === 'object' && neighborhood.name) {
        response += `${index + 1}. **${neighborhood.name}** (${neighborhood.count} doctores)\n`;
      } else {
        // Fallback para strings simples
        response += `${index + 1}. ${neighborhood}\n`;
      }
    });
    
    response += '\n¿En qué zona te gustaría buscar? Puedes preguntarme "Doctores en Palermo" o "Vivo en Caballito" 😊';
    
    return response;
  }

  /**
   * Formatea respuesta de top doctores
   */
  formatTopDoctorsResponse(doctors) {
    let response = `¡Aquí tienes los doctores mejor calificados! ⭐\n\n`;
    
    doctors.forEach((doctor, index) => {
      const rating = doctor.rating > 0 ? `⭐ ${doctor.rating.toFixed(1)}` : 'Sin calificación';
      const reviewText = doctor.reviewCount > 0 ? ` (${doctor.reviewCount} reseñas)` : '';
      
      response += `${index + 1}. **${doctor.name}**\n`;
      response += `🏥 ${doctor.specialty}\n`;
      response += `${rating}${reviewText}\n`;
      
      if (doctor.barrio && doctor.barrio !== 'Otros') {
        response += `📍 ${doctor.barrio}\n`;
      }
      
      if (doctor.slug) {
        response += `👉 [Ver perfil completo](/doctores/${doctor.slug})\n`;
      }
      
      response += '\n';
    });
    
    response += '¿Te interesa alguno en particular? ¡Puedo darte más información! 😊';
    
    return response;
  }
}

export const geminiService = new GeminiService();