import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    if (!aiInstance) {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiInstance;
  }
  return null;
}

// Ordered list of active production models based on @google/genai guidelines
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateContentWithFallback(
  params: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  const ai = getAI();
  if (!ai) {
    throw new Error('Gemini API client not initialized (missing GEMINI_API_KEY)');
  }

  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || '').toLowerCase();
        const isQuotaExhausted =
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('resource_exhausted') ||
          err?.status === 'RESOURCE_EXHAUSTED';
        const isTemporary503 =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('unavailable') ||
          err?.status === 'UNAVAILABLE' ||
          err?.code === 503;

        console.warn(`Gemini model ${model} (attempt ${attempt + 1}) encountered: ${err?.message || err}.`);

        // If quota is exhausted on this specific model, immediately switch to next model without wasting attempts
        if (isQuotaExhausted) {
          break;
        }

        if (isTemporary503 && attempt === 0) {
          await sleep(600);
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini fallback models exhausted');
}
