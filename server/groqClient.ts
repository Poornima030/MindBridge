import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;

// User provided Groq key with fallback to ensure instant high-speed inference
const DEFAULT_GROQ_KEY = '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';

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY;
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  if (!groqInstance) {
    try {
      groqInstance = new Groq({ apiKey: apiKey.trim() });
    } catch (err) {
      console.warn('Failed to initialize Groq client:', err);
      return null;
    }
  }
  return groqInstance;
}

// Recommended fast models in order of preference
export const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

export async function generateGroqChatCompletion(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}): Promise<string | null> {
  const groq = getGroqClient();
  if (!groq) return null;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 1024,
        response_format: params.response_format,
      });

      const reply = completion.choices[0]?.message?.content;
      if (reply) {
        return reply.trim();
      }
    } catch (err: any) {
      console.warn(`Groq model ${model} attempt failed:`, err?.message || err);
      // Try next model
    }
  }
  return null;
}
