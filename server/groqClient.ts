import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  if (!groqInstance) {
    try {
      groqInstance = new Groq({ apiKey: apiKey.trim() });
    } catch {
      return null;
    }
  }
  return groqInstance;
}

// Active supported Groq models (mixtral-8x7b-32768 is decommissioned)
export const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
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
    } catch {
      // Continue to next model or fallback
    }
  }
  return null;
}
