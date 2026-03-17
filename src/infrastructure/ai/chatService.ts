import { GoogleGenerativeAI, SchemaType, type Part, type FunctionDeclarationSchema } from '@google/generative-ai';
import { getDoctorService, getSpecialtyService, getReviewService } from '@/src/infrastructure/container';
import type { Doctor } from '@/src/modules/doctors/domain/DoctorEntity';

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

const toolDeclarations = [
  {
    name: 'searchDoctors',
    description:
      'Busca doctores/médicos filtrando por especialidad, ubicación/barrio/zona, o ambos. Usar siempre que el usuario quiera encontrar un profesional médico.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        specialty: {
          type: SchemaType.STRING,
          description:
            'Especialidad médica buscada. Normalizar siempre al nombre de la especialidad.',
        },
        location: {
          type: SchemaType.STRING,
          description: 'Ubicación, barrio o zona geográfica donde buscar.',
        },
      },
    } as FunctionDeclarationSchema,
  },
  {
    name: 'getDoctorInfo',
    description:
      'Obtiene información detallada de un doctor específico por su nombre. Usar cuando el usuario pregunta por un doctor en particular.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        doctorName: {
          type: SchemaType.STRING,
          description: 'Nombre completo o parcial del doctor a buscar.',
        },
      },
      required: ['doctorName'],
    } as FunctionDeclarationSchema,
  },
  {
    name: 'getAvailableSpecialties',
    description:
      'Lista todas las especialidades médicas disponibles en la plataforma.',
  },
  {
    name: 'getTopRatedDoctors',
    description:
      'Obtiene los doctores mejor calificados de la plataforma. Usar cuando el usuario pide recomendaciones.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: 'Cantidad máxima de doctores a retornar. Default: 5.',
        },
      },
    } as FunctionDeclarationSchema,
  },
];

interface ChatMessage {
  id?: number;
  content: string;
  isBot: boolean;
}

interface GeminiResponse {
  text: string | null;
  functionCall: {
    name: string;
    args: Record<string, unknown>;
    _modelParts?: Part[];
  } | null;
}

function getModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: toolDeclarations }],
  });
}

function buildContents(chatHistory: ChatMessage[], currentMessage: string) {
  const contents: Array<{ role: string; parts: Part[] }> = [];
  const recent = (chatHistory || []).slice(-10);

  for (const msg of recent) {
    if (msg.id === 1 && msg.isBot) continue;
    contents.push({
      role: msg.isBot ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  contents.push({ role: 'user', parts: [{ text: currentMessage }] });
  return contents;
}

export async function processMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
): Promise<GeminiResponse> {
  const model = getModel();
  const contents = buildContents(chatHistory, userMessage);

  const result = await model.generateContent({ contents });
  const response = result.response;

  const functionCall = response.functionCalls()?.[0];
  if (functionCall) {
    const modelParts = response.candidates?.[0]?.content?.parts || [];
    return {
      text: null,
      functionCall: {
        name: functionCall.name,
        args: (functionCall.args || {}) as Record<string, unknown>,
        _modelParts: modelParts,
      },
    };
  }

  return { text: response.text(), functionCall: null };
}

export async function generateResponseWithData(
  userMessage: string,
  chatHistory: ChatMessage[],
  functionCall: NonNullable<GeminiResponse['functionCall']>,
  functionResult: unknown,
): Promise<GeminiResponse> {
  const model = getModel();
  const contents = buildContents(chatHistory, userMessage);

  // Preserve model parts (includes thought_signature for Gemini chain-of-thought)
  if (functionCall._modelParts && functionCall._modelParts.length > 0) {
    contents.push({ role: 'model', parts: functionCall._modelParts });
  } else {
    contents.push({
      role: 'model',
      parts: [
        { functionCall: { name: functionCall.name, args: functionCall.args } },
      ],
    });
  }

  // Add function response
  contents.push({
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: functionCall.name,
          response: { result: functionResult },
        },
      },
    ],
  });

  try {
    const result = await model.generateContent({ contents });
    const response = result.response;

    const nextFunctionCall = response.functionCalls()?.[0];
    if (nextFunctionCall) {
      const modelParts = response.candidates?.[0]?.content?.parts || [];
      return {
        text: null,
        functionCall: {
          name: nextFunctionCall.name,
          args: (nextFunctionCall.args || {}) as Record<string, unknown>,
          _modelParts: modelParts,
        },
      };
    }

    return { text: response.text(), functionCall: null };
  } catch {
    return {
      text: fallbackFormat(functionCall.name, functionResult),
      functionCall: null,
    };
  }
}

/**
 * Execute a function requested by Gemini using V2 domain services.
 */
export async function executeFunction(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const doctorService = getDoctorService();
  const specialtyService = getSpecialtyService();

  switch (name) {
    case 'searchDoctors': {
      const specialty = args.specialty as string | undefined;
      const doctors = await doctorService.listVerified({
        specialty,
        // location filtering handled at service level if supported,
        // otherwise we filter here
      });

      const location = (args.location as string | undefined)?.toLowerCase();
      const filtered = location
        ? doctors.filter((d) => {
            const addr = (d.location?.formattedAddress ?? '').toLowerCase();
            return addr.includes(location);
          })
        : doctors;

      return filtered.slice(0, 10).map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        address: d.location?.formattedAddress,
        phone: d.phone,
        slug: d.slug,
        onlineConsultation: d.onlineConsultation,
      }));
    }

    case 'getDoctorInfo': {
      const doctorName = (args.doctorName as string).toLowerCase();
      const allDoctors = await doctorService.listVerified();
      const match = allDoctors.find((d) =>
        d.name.toLowerCase().includes(doctorName),
      );
      if (!match) return { error: 'Doctor not found', name: args.doctorName };
      const summary = await getReviewService().getDoctorSummary(match.id);
      return {
        id: match.id,
        name: match.name,
        specialty: match.specialty,
        description: match.description,
        address: match.location?.formattedAddress,
        rating: summary.averageRating,
        reviewCount: summary.totalReviews,
        phone: match.phone,
        slug: match.slug,
        onlineConsultation: match.onlineConsultation,
        schedule: match.schedule,
      };
    }

    case 'getAvailableSpecialties': {
      const specialties = await specialtyService.listActive();
      return specialties.map((s) => ({ title: s.title, description: s.description }));
    }

    case 'getTopRatedDoctors': {
      const limit = (args.limit as number) || 5;
      const allDoctors = await doctorService.listVerified();
      // Get ratings for all doctors via review service
      const reviewService = getReviewService();
      const doctorsWithRatings = await Promise.all(
        allDoctors.map(async (d) => {
          const s = await reviewService.getDoctorSummary(d.id);
          return { ...d, rating: s.averageRating, reviewCount: s.totalReviews };
        }),
      );
      const sorted = doctorsWithRatings.sort((a, b) => b.rating - a.rating);
      return sorted.slice(0, limit).map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        rating: d.rating,
        reviewCount: d.reviewCount,
        slug: d.slug,
      }));
    }

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

function fallbackFormat(functionName: string, data: unknown): string {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return 'No encontré resultados para tu búsqueda. 😔\n\n¿Querés intentar con otra especialidad o zona?';
  }

  if (functionName === 'searchDoctors' && Array.isArray(data)) {
    let response = `¡Encontré ${data.length} doctores! 🩺\n\n`;
    data.forEach(
      (doc: { name: string; specialty: string; rating: number; barrio?: string; slug?: string }, i: number) => {
        response += `${i + 1}. **${doc.name}**\n🏥 ${doc.specialty}\n`;
        if (doc.rating > 0) response += `⭐ ${doc.rating.toFixed(1)}\n`;
        if (doc.barrio) response += `📍 ${doc.barrio}\n`;
        if (doc.slug) response += `👉 [Ver perfil](/doctores/${doc.slug})\n`;
        response += '\n';
      },
    );
    return response;
  }

  return 'Encontré información pero tuve problemas formateándola. ¿Podrías intentar de nuevo?';
}
