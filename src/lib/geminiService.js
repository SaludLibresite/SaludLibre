import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * Declaraciones de funciones para Gemini Function Calling.
 * Gemini decide automáticamente cuál llamar según el contexto de la conversación.
 */
const toolDeclarations = [
  {
    name: "searchDoctors",
    description: "Busca doctores/médicos filtrando por especialidad, ubicación/barrio/zona, o ambos. Usar siempre que el usuario quiera encontrar un profesional médico. Ejemplos: 'busco cardiologo', 'medicos en palermo', 'necesito un dermatologo en belgrano', 'busco pediatra'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        specialty: {
          type: SchemaType.STRING,
          description: "Especialidad médica buscada. Normalizar siempre al nombre de la especialidad (ej: 'cardiologo' → 'cardiología', 'dermatologo' → 'dermatología', 'dentista' → 'odontología', 'médico clínico' → 'medicina general').",
        },
        location: {
          type: SchemaType.STRING,
          description: "Ubicación, barrio o zona geográfica donde buscar. Ejemplos: Palermo, Recoleta, Belgrano, Caballito, San Isidro.",
        },
      },
    },
  },
  {
    name: "getDoctorInfo",
    description: "Obtiene información detallada de un doctor específico por su nombre. Usar cuando el usuario pregunta por un doctor en particular, menciona un nombre propio, o selecciona un número de una lista previa.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        doctorName: {
          type: SchemaType.STRING,
          description: "Nombre completo o parcial del doctor a buscar.",
        },
      },
      required: ["doctorName"],
    },
  },
  {
    name: "getAvailableSpecialties",
    description: "Lista todas las especialidades médicas disponibles en la plataforma. Usar cuando el usuario pregunta qué especialidades hay, qué tipos de doctores tienen, etc.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "getAvailableNeighborhoods",
    description: "Lista todos los barrios/zonas donde hay doctores disponibles, con la cantidad de doctores en cada uno. Usar cuando el usuario pregunta en qué zonas hay doctores, qué barrios cubren, etc.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "getTopRatedDoctors",
    description: "Obtiene los doctores mejor calificados de la plataforma. Usar cuando el usuario pide recomendaciones, los mejores, los más valorados, etc.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: "Cantidad máxima de doctores a retornar. Default: 5.",
        },
      },
    },
  },
];

const SYSTEM_INSTRUCTION = `Eres el asistente virtual de Salud Libre, una plataforma de salud en Argentina.

Tu trabajo principal es ayudar a los usuarios a encontrar doctores y profesionales de la salud.

REGLAS:
1. Respondé siempre en español de Argentina, de forma cálida y profesional.
2. Usá las funciones disponibles para buscar información real - NUNCA inventes datos de doctores.
3. Sé directo y eficiente. No preguntes lo que ya sabés.
4. Si el usuario menciona una especialidad (con o sin acento, con o sin "logo/logía"), mapeala correctamente.
5. Si el usuario da una ubicación, buscá ahí inmediatamente.
6. Si falta información necesaria (especialidad O ubicación), preguntá UNA vez de forma natural.
7. Cuando muestres resultados de doctores, usá el formato con enlaces al perfil: [Ver perfil](/doctores/SLUG)
8. Si no hay resultados, decilo claramente y sugerí alternativas.
9. NUNCA menciones funciones internas, APIs, procesos técnicos o herramientas internas al usuario.
10. Si el usuario selecciona un número de una lista previa (ej: "el 2", "3", "quiero el primero"), buscá el nombre del doctor correspondiente en la conversación anterior y usá getDoctorInfo.

FORMATO DE RESPUESTAS CON DOCTORES:
Cuando recibas datos de doctores, formateá así:
- Usá **negrita** para nombres
- Usá emojis relevantes (🏥 especialidad, ⭐ rating, 📍 ubicación, 💰 precio, 👉 enlace)
- Incluí enlace al perfil: [Ver perfil completo](/doctores/SLUG)
- Si hay teléfono, incluí: [Llamar](tel:+54NUMERO) y [WhatsApp](https://wa.me/54NUMERO?text=Hola%2C%20me%20interesa%20agendar%20una%20consulta)

MAPEO DE ESPECIALIDADES (usuario → búsqueda):
- cardiologo/cardióloga/corazón → cardiología
- dermatologo/piel → dermatología  
- pediatra/niños → pediatría
- ginecologo → ginecología
- traumatologo/huesos/traumatismo → traumatología
- neurologo/cerebro/nervios → neurología
- psiquiatra/salud mental → psiquiatría
- psicologo → psicología
- oftalmologo/ojos/vista → oftalmología
- urologo → urología
- gastroenterologo/estómago/digestivo → gastroenterología
- endocrinologo/hormonas/tiroides → endocrinología
- nutricionista/nutrición → nutrición
- dentista/odontólogo/dientes/muelas → odontología
- médico clínico/médico general/clínico → medicina general`;

/**
 * Servicio de IA con Function Calling nativo de Gemini
 */
export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: toolDeclarations }],
    });
  }

  /**
   * Procesa un mensaje del usuario usando Gemini con function calling.
   * Retorna { text, functionCall } donde functionCall es null si Gemini respondió directamente,
   * o un objeto { name, args } si Gemini quiere ejecutar una función.
   */
  async processMessage(userMessage, chatHistory = []) {
    try {
      // Construir historial de conversación para Gemini
      const contents = this._buildContents(chatHistory, userMessage);

      const result = await this.model.generateContent({ contents });
      const response = result.response;

      // Verificar si Gemini quiere llamar a una función
      const functionCall = response.functionCalls()?.[0];

      if (functionCall) {
        // Capturar las parts completas del modelo (incluye thought_signature)
        const modelParts = response.candidates?.[0]?.content?.parts || [];

        return {
          text: null,
          functionCall: {
            name: functionCall.name,
            args: functionCall.args || {},
          },
          // Preservar las parts originales para reenviarlas con el function response
          _modelParts: modelParts,
        };
      }

      // Gemini respondió directamente con texto
      return {
        text: response.text(),
        functionCall: null,
      };
    } catch (error) {
      console.error("Error en Gemini processMessage:", error);
      throw new Error("Error procesando tu consulta. Por favor intenta de nuevo.");
    }
  }

  /**
   * Después de ejecutar una función, envía el resultado a Gemini
   * para que genere una respuesta natural con los datos.
   */
  async generateResponseWithData(userMessage, chatHistory, functionCall, functionResult) {
    try {
      const contents = this._buildContents(chatHistory, userMessage);

      // Agregar las parts originales del modelo (incluye thought + thought_signature + functionCall)
      // Esto es requerido por Gemini 3 Flash para mantener la cadena de pensamiento
      if (functionCall._modelParts && functionCall._modelParts.length > 0) {
        contents.push({
          role: "model",
          parts: functionCall._modelParts,
        });
      } else {
        // Fallback si no hay parts originales
        contents.push({
          role: "model",
          parts: [{ functionCall: { name: functionCall.name, args: functionCall.args } }],
        });
      }

      // Agregar el resultado de la función
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: { result: functionResult },
            },
          },
        ],
      });

      const result = await this.model.generateContent({ contents });
      const response = result.response;

      // Verificar si quiere llamar otra función (encadenamiento)
      const nextFunctionCall = response.functionCalls()?.[0];
      if (nextFunctionCall) {
        const modelParts = response.candidates?.[0]?.content?.parts || [];
        return {
          text: null,
          functionCall: {
            name: nextFunctionCall.name,
            args: nextFunctionCall.args || {},
            _modelParts: modelParts,
          },
        };
      }

      return {
        text: response.text(),
        functionCall: null,
      };
    } catch (error) {
      console.error("Error generando respuesta con datos:", error?.message || error);
      console.error("Function call info:", { name: functionCall.name, hasModelParts: !!(functionCall._modelParts?.length) });
      // Fallback: generar respuesta formateada sin Gemini
      return {
        text: this._fallbackFormat(functionCall.name, functionResult),
        functionCall: null,
      };
    }
  }

  /**
   * Construye el array de contents para Gemini a partir del historial
   */
  _buildContents(chatHistory, currentMessage) {
    const contents = [];

    // Convertir historial (solo los últimos 10 mensajes para no exceder contexto)
    const recentHistory = (chatHistory || []).slice(-10);
    for (const msg of recentHistory) {
      // Ignorar el mensaje inicial del bot
      if (msg.id === 1 && msg.isBot) continue;

      contents.push({
        role: msg.isBot ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    // Agregar mensaje actual
    contents.push({
      role: "user",
      parts: [{ text: currentMessage }],
    });

    return contents;
  }

  /**
   * Formato de respuesta de emergencia si Gemini falla al generar texto
   */
  _fallbackFormat(functionName, data) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return "No encontré resultados para tu búsqueda. 😔\n\n¿Querés intentar con otra especialidad o zona?";
    }

    if (functionName === "searchDoctors" && Array.isArray(data)) {
      let response = `¡Encontré ${data.length} doctores! 🩺\n\n`;
      data.forEach((doc, i) => {
        response += `${i + 1}. **${doc.name}**\n`;
        response += `🏥 ${doc.specialty}\n`;
        if (doc.rating > 0) response += `⭐ ${doc.rating.toFixed(1)}\n`;
        if (doc.barrio) response += `📍 ${doc.barrio}\n`;
        if (doc.slug) response += `👉 [Ver perfil](/doctores/${doc.slug})\n`;
        response += "\n";
      });
      return response;
    }

    if (functionName === "getDoctorInfo" && data && !data.error) {
      let response = `**${data.name}** 👨‍⚕️\n`;
      response += `🏥 ${data.specialty}\n`;
      if (data.rating > 0) response += `⭐ ${data.rating.toFixed(1)}\n`;
      if (data.barrio) response += `📍 ${data.barrio}\n`;
      if (data.slug) response += `👉 [Ver perfil](/doctores/${data.slug})\n`;
      return response;
    }

    if (functionName === "getAvailableSpecialties" && Array.isArray(data)) {
      let response = `Especialidades disponibles: 🩺\n\n`;
      data.forEach((s, i) => {
        const name = typeof s === "object" ? s.title || s.name : s;
        response += `${i + 1}. ${name}\n`;
      });
      return response;
    }

    if (functionName === "getAvailableNeighborhoods" && Array.isArray(data)) {
      let response = `Zonas con doctores: 📍\n\n`;
      data.forEach((n, i) => {
        const name = typeof n === "object" ? n.name : n;
        const count = typeof n === "object" ? ` (${n.count} doctores)` : "";
        response += `${i + 1}. ${name}${count}\n`;
      });
      return response;
    }

    if (functionName === "getTopRatedDoctors" && Array.isArray(data)) {
      let response = `Doctores mejor calificados: ⭐\n\n`;
      data.forEach((doc, i) => {
        response += `${i + 1}. **${doc.name}** - ${doc.specialty}`;
        if (doc.rating > 0) response += ` ⭐ ${doc.rating.toFixed(1)}`;
        response += "\n";
      });
      return response;
    }

    return JSON.stringify(data, null, 2);
  }
}

export const geminiService = new GeminiService();
