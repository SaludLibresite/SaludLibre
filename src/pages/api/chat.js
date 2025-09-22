import { geminiService } from '../../lib/geminiService';
import { 
  searchDoctorsByLocation,
  searchDoctorsBySpecialty, 
  searchDoctorsBySpecialtyAndLocation,
  getDoctorInfo, 
  getTopRatedDoctors, 
  getAvailableSpecialties,
  getAvailableNeighborhoods
} from '../../lib/chatbotFunctionsSimple';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log('Procesando consulta del chatbot:', message);

    // Detectar función directamente
    let functionToExecute = detectDirectFunction(message, chatHistory);
    let finalResponse = '';

    if (functionToExecute) {
      console.log('Función detectada:', functionToExecute.name);
      
      try {
        let functionResult = await executeChatbotFunction(functionToExecute);
        console.log('Resultado de función:', functionResult);

        finalResponse = await geminiService.generateResponseWithFunctionResult(
          message,
          functionToExecute.name,
          functionResult,
          chatHistory
        );

      } catch (functionError) {
        console.error('Error ejecutando función:', functionError);
        finalResponse = 'Tuve problemas para buscar esa información. ¿Podrías ser más específico?';
      }
    } else {
      // Usar Gemini para procesar
      const availableFunctions = getFunctionDefinitions();
      
      const aiResponse = await geminiService.processUserQuery(
        message,
        availableFunctions,
        chatHistory
      );

      if (aiResponse.requiresFunction && aiResponse.functionCall) {
        console.log('Gemini detectó función:', aiResponse.functionCall.name);
        
        try {
          let functionResult = await executeChatbotFunction(aiResponse.functionCall);

          finalResponse = await geminiService.generateResponseWithFunctionResult(
            message,
            aiResponse.functionCall.name,
            functionResult,
            chatHistory
          );

        } catch (functionError) {
          console.error('Error ejecutando función desde Gemini:', functionError);
          finalResponse = aiResponse.text || 'Tuve problemas para procesar tu consulta.';
        }
      } else {
        finalResponse = aiResponse.text || 'Lo siento, no pude entender tu consulta.';
      }
    }

    return res.status(200).json({ 
      response: finalResponse,
      success: true 
    });

  } catch (error) {
    console.error('Error en API chat:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

function detectDirectFunction(query, chatHistory = []) {
  const queryLower = query.toLowerCase();
  
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

  // Detectar nombres de doctores comunes (sin título)
  const commonDoctorNames = [
    'gonzález', 'rodríguez', 'fernández', 'garcía', 'martínez', 'lópez', 'pérez',
    'sánchez', 'ramírez', 'torres', 'flores', 'rivera', 'gómez', 'díaz', 'morales'
  ];
  
  // Si contiene un apellido común y parece búsqueda de persona
  const hasCommonName = commonDoctorNames.some(name => queryLower.includes(name));
  const looksLikeName = /[a-záéíóúñ]+\s+[a-záéíóúñ]+/i.test(query);
  
  if (hasCommonName && looksLikeName && !queryLower.includes('especialidad')) {
    return {
      name: 'getDoctorInfo',
      parameters: { doctorName: query.trim() }
    };
  }
  
  const locationKeywords = [
    'palermo', 'recoleta', 'belgrano', 'centro', 'microcentro',
    'san isidro', 'vicente lópez', 'tigre', 'núñez', 'villa urquiza'
  ];
  
  const specialtyKeywords = [
    'dermatólogo', 'cardiólogo', 'pediatra', 'ginecólogo', 'traumatólogo',
    'neurólogo', 'psiquiatra', 'psicólogo', 'oftalmólogo'
  ];
  
  const hasSpecialty = specialtyKeywords.some(keyword => queryLower.includes(keyword));
  const hasLocation = locationKeywords.some(keyword => queryLower.includes(keyword));
  
  if (hasSpecialty && hasLocation) {
    const specialty = specialtyKeywords.find(keyword => queryLower.includes(keyword));
    const location = locationKeywords.find(keyword => queryLower.includes(keyword));
    
    if (specialty && location) {
      return {
        name: 'searchDoctorsBySpecialtyAndLocation',
        parameters: { specialty, location }
      };
    }
  }
  
  if (hasLocation && (queryLower.includes('doctores') || queryLower.includes('médicos'))) {
    const location = locationKeywords.find(keyword => queryLower.includes(keyword));
    return {
      name: 'searchDoctorsByLocation',
      parameters: { location }
    };
  }
  
  if (hasSpecialty) {
    const specialty = specialtyKeywords.find(keyword => queryLower.includes(keyword));
    return {
      name: 'searchDoctorsBySpecialty',
      parameters: { specialty }
    };
  }
  
  if (queryLower.includes('especialidades')) {
    return {
      name: 'getAvailableSpecialties',
      parameters: {}
    };
  }
  
  if (queryLower.includes('barrios') || queryLower.includes('zonas')) {
    return {
      name: 'getAvailableNeighborhoods',
      parameters: {}
    };
  }
  
  if (queryLower.includes('mejores doctores') || queryLower.includes('top doctores')) {
    return {
      name: 'getTopRatedDoctors',
      parameters: {}
    };
  }
  
  return null;
}

async function executeChatbotFunction(functionCall) {
  const { name, parameters } = functionCall;
  
  switch (name) {
    case 'searchDoctorsByLocation':
      return await searchDoctorsByLocation(parameters.location, 10);
      
    case 'searchDoctorsBySpecialty':
      return await searchDoctorsBySpecialty(parameters.specialty, 10);
      
    case 'searchDoctorsBySpecialtyAndLocation':
      return await searchDoctorsBySpecialtyAndLocation(
        parameters.specialty,
        parameters.location,
        10
      );
      
    case 'getDoctorInfo':
      return await getDoctorInfo(parameters.doctorName);
      
    case 'getTopRatedDoctors':
      return await getTopRatedDoctors(5);
      
    case 'getAvailableSpecialties':
      return await getAvailableSpecialties();
      
    case 'getAvailableNeighborhoods':
      return await getAvailableNeighborhoods();
      
    default:
      throw new Error(`Función no reconocida: ${name}`);
  }
}

function getFunctionDefinitions() {
  return [
    {
      name: 'searchDoctorsByLocation',
      description: 'Busca doctores por ubicación'
    },
    {
      name: 'searchDoctorsBySpecialty',
      description: 'Busca doctores por especialidad'
    },
    {
      name: 'searchDoctorsBySpecialtyAndLocation',
      description: 'Busca doctores por especialidad y ubicación'
    },
    {
      name: 'getAvailableSpecialties',
      description: 'Lista especialidades disponibles'
    },
    {
      name: 'getAvailableNeighborhoods',
      description: 'Lista barrios disponibles'
    },
    {
      name: 'getTopRatedDoctors',
      description: 'Doctores mejor calificados'
    }
  ];
}
