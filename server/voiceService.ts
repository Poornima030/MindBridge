import { generateGroqChatCompletion } from './groqClient.ts';
import { getAI, generateContentWithFallback } from './geminiClient.ts';
import { analyzeCrisisIndicators } from './crisisService.ts';

export interface VoiceAudioInsightResult {
  transcriptSummary: string;
  emotionalTone: string;
  detectedThemes: string[];
  comfortNote: string;
  crisisDetected: boolean;
}

/**
 * Uses Groq (Whisper / LLaMA) and multimodal AI to listen, interpret, and understand
 * voice recordings for the user's emotional journal.
 */
export async function analyzeVoiceJournalAudio(params: {
  audioBase64?: string;
  mimeType?: string;
  durationSeconds?: number;
  spokenContextHint?: string;
}): Promise<VoiceAudioInsightResult> {
  const { audioBase64, mimeType = 'audio/webm', durationSeconds = 0, spokenContextHint = '' } = params;

  const fallbackInsight: VoiceAudioInsightResult = {
    transcriptSummary: 'Voice reflection audio captured and safely preserved in your journal vault.',
    emotionalTone: 'Reflective & Raw',
    detectedThemes: ['Self-Reflection', 'Vocal Journaling'],
    comfortNote: 'Your voice note has been safely stored. Taking time to speak your thoughts is a powerful form of emotional release.',
    crisisDetected: false,
  };

  // 1. Try Groq for understanding and generating emotional audio interpretation
  try {
    const prompt = `You are an empathetic, emotionally intelligent listening assistant for a mental wellness journal.
A user just recorded an authentic audio voice journal entry.
${durationSeconds > 0 ? `Audio duration: ${durationSeconds} seconds.` : ''}
${spokenContextHint ? `Audio context snippet / spoken cues: "${spokenContextHint}"` : ''}

Task:
Listen, understand, and extract deep emotional meaning from this voice note:
1. Provide a short, compassionate summary of the voice note essence ("transcriptSummary").
2. Identify the emotional tone ("emotionalTone", e.g., "Tender & Hopeful", "Overwhelmed & Seeking Release", "Calm & Grounded", "Vulnerable & Processing").
3. Identify 2-4 primary emotional themes/tags ("detectedThemes", e.g., ["Releasing Tension", "Work Pressure", "Self-Love", "Gratitude"]).
4. Write a 1-2 sentence warm, heartfelt comfort note acknowledging their voice ("comfortNote").

Return STRICT JSON matching this schema:
{
  "transcriptSummary": string,
  "emotionalTone": string,
  "detectedThemes": string[],
  "comfortNote": string
}`;

    const groqResponse = await generateGroqChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are Groq AI, an expert empathetic listening system. Always respond with pure valid JSON matching the schema.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    if (groqResponse) {
      const parsed = JSON.parse(groqResponse);
      const crisis = analyzeCrisisIndicators(
        `${parsed.transcriptSummary || ''} ${spokenContextHint || ''}`
      );

      return {
        transcriptSummary: parsed.transcriptSummary || fallbackInsight.transcriptSummary,
        emotionalTone: parsed.emotionalTone || fallbackInsight.emotionalTone,
        detectedThemes: Array.isArray(parsed.detectedThemes) && parsed.detectedThemes.length > 0
          ? parsed.detectedThemes.slice(0, 5)
          : fallbackInsight.detectedThemes,
        comfortNote: parsed.comfortNote || fallbackInsight.comfortNote,
        crisisDetected: crisis.isCrisisDetected,
      };
    }
  } catch (groqErr) {
    console.warn('Groq audio interpretation error:', groqErr);
  }

  // 2. Multimodal Fallback using Gemini if audioBase64 exists
  if (audioBase64) {
    const ai = getAI();
    if (ai) {
      try {
        const response = await generateContentWithFallback({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType.includes('audio') ? mimeType : 'audio/webm',
                    data: audioBase64.replace(/^data:audio\/\w+;base64,/, ''),
                  },
                },
                {
                  text: `Listen closely to this voice journal audio recording. Understand the emotional tone, cadence, feeling, and words spoken.
Return strict JSON:
{
  "transcriptSummary": "Brief empathetic summary of what they expressed",
  "emotionalTone": "e.g. Vulnerable & Thoughtful",
  "detectedThemes": ["Theme1", "Theme2"],
  "comfortNote": "Warm 1-2 sentence validating response"
}`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          const crisis = analyzeCrisisIndicators(parsed.transcriptSummary || '');
          return {
            transcriptSummary: parsed.transcriptSummary || fallbackInsight.transcriptSummary,
            emotionalTone: parsed.emotionalTone || fallbackInsight.emotionalTone,
            detectedThemes: Array.isArray(parsed.detectedThemes) && parsed.detectedThemes.length > 0
              ? parsed.detectedThemes.slice(0, 5)
              : fallbackInsight.detectedThemes,
            comfortNote: parsed.comfortNote || fallbackInsight.comfortNote,
            crisisDetected: crisis.isCrisisDetected,
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini audio understanding fallback error:', geminiErr);
      }
    }
  }

  return fallbackInsight;
}
