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

/**
 * API de chat con Gemini Function Calling nativo.
 * 
 * Flujo:
 * 1. Usuario envía mensaje
 * 2. Gemini analiza y decide: responder directo O llamar una función
 * 3. Si llama función → se ejecuta → resultado vuelve a Gemini → genera respuesta
 * 4. Soporte para encadenamiento (Gemini puede pedir otra función con el resultado)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log('💬 Chat:', message);

    // Paso 1: Enviar mensaje a Gemini
    let aiResponse = await geminiService.processMessage(message, chatHistory);
    let finalResponse = aiResponse.text;

    // Paso 2: Si Gemini quiere ejecutar una función, hacerlo (con soporte de encadenamiento)
    let iterations = 0;
    const MAX_ITERATIONS = 3; // Prevenir loops infinitos

    while (aiResponse.functionCall && iterations < MAX_ITERATIONS) {
      iterations++;
      const { name, args } = aiResponse.functionCall;
      console.log(`🔧 Función: ${name}`, args);

      try {
        // Ejecutar la función solicitada
        const functionResult = await executeFunction(name, args);
        console.log(`✅ Resultado: ${Array.isArray(functionResult) ? functionResult.length + ' items' : 'ok'}`);

        // Enviar resultado a Gemini para que genere la respuesta
        // Pasar el functionCall completo (incluye _modelParts con thought_signature)
        aiResponse = await geminiService.generateResponseWithData(
          message,
          chatHistory,
          aiResponse.functionCall,
          functionResult
        );

        finalResponse = aiResponse.text;

      } catch (functionError) {
        console.error('❌ Error en función:', functionError.message);
        // Si falla la función, Gemini no tiene datos — dar respuesta de error amigable
        finalResponse = 'Tuve problemas buscando esa información. ¿Podrías intentar de otra forma?';
        break;
      }
    }

    // Si después de todo no hay respuesta, fallback
    if (!finalResponse) {
      finalResponse = 'Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?';
    }

    return res.status(200).json({
      response: finalResponse,
      success: true
    });

  } catch (error) {
    console.error('❌ Error en API chat:', error.message);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

/**
 * Ejecuta una función del chatbot según lo que Gemini solicitó.
 * 
 * Mapeo de funciones:
 * - searchDoctors(specialty?, location?) → busca por especialidad, ubicación o ambos
 * - getDoctorInfo(doctorName) → información de un doctor específico
 * - getAvailableSpecialties() → lista de especialidades
 * - getAvailableNeighborhoods() → lista de zonas/barrios
 * - getTopRatedDoctors(limit?) → doctores mejor calificados
 */
async function executeFunction(name, args) {
  switch (name) {
    case 'searchDoctors': {
      const { specialty, location } = args;
      
      if (specialty && location) {
        return await searchDoctorsBySpecialtyAndLocation(specialty, location, 10);
      } else if (specialty) {
        return await searchDoctorsBySpecialty(specialty, 10);
      } else if (location) {
        return await searchDoctorsByLocation(location, 10);
      }
      // Sin parámetros — retornar top rated como default
      return await getTopRatedDoctors(5);
    }

    case 'getDoctorInfo':
      return await getDoctorInfo(args.doctorName);

    case 'getAvailableSpecialties':
      return await getAvailableSpecialties();

    case 'getAvailableNeighborhoods':
      return await getAvailableNeighborhoods();

    case 'getTopRatedDoctors':
      return await getTopRatedDoctors(args.limit || 5);

    default:
      throw new Error(`Función no reconocida: ${name}`);
  }
}
