import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import {
  processMessage,
  generateResponseWithData,
  executeFunction,
} from '@/src/infrastructure/ai/chatService';

const MAX_ITERATIONS = 3;

// POST /api/chat — AI chatbot with Gemini function calling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, chatHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return jsonError('message is required', 400);
    }

    let aiResponse = await processMessage(message, chatHistory);
    let finalResponse = aiResponse.text;

    // Function calling loop — Gemini may chain multiple function calls
    let iterations = 0;
    while (aiResponse.functionCall && iterations < MAX_ITERATIONS) {
      iterations++;
      const { name, args } = aiResponse.functionCall;

      try {
        const functionResult = await executeFunction(name, args);

        aiResponse = await generateResponseWithData(
          message,
          chatHistory,
          aiResponse.functionCall,
          functionResult,
        );

        finalResponse = aiResponse.text;
      } catch {
        finalResponse =
          'Tuve problemas buscando esa información. ¿Podrías intentar de otra forma?';
        break;
      }
    }

    if (!finalResponse) {
      finalResponse =
        'Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?';
    }

    return jsonOk({ response: finalResponse, success: true });
  } catch (error) {
    console.error('[Chat API Error]', error);
    return jsonError('Error interno del servidor', 500);
  }
}
