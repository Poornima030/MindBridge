import { analyzeCrisisIndicators } from './crisisService.ts';
import { getAI, generateContentWithFallback } from './geminiClient.ts';
import { generateGroqChatCompletion } from './groqClient.ts';

export interface SentimentAnalysisResult {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore: number; // Range -1.0 to 1.0
  emotionalInsight: string;
  detectedEmotions: string[];
  crisisDetected: boolean;
}

export async function analyzeJournalSentiment(content: string): Promise<SentimentAnalysisResult> {
  const crisis = analyzeCrisisIndicators(content);
  const fallbackResult = fallbackSentimentAnalysis(content, crisis.isCrisisDetected);

  const prompt = `You are a certified psychological sentiment and emotional tone evaluator for a mental wellness journal.
Analyze the following journal entry text and provide a structured emotional evaluation.

CRITICAL GUIDELINES:
- This is NOT a medical diagnosis.
- Determine the overall sentiment as "Positive", "Neutral", or "Negative".
- Provide a numeric sentiment score between -1.0 (deeply distressed/negative) and +1.0 (uplifting/joyful/peaceful).
- Identify 2-4 primary felt emotions (e.g. "Grateful", "Reflective", "Anxious", "Fatigued", "Hopeful").
- Write a short, empathetic 1-2 sentence non-diagnostic emotional insight reflecting what the user wrote with validation and warmth.

Return STRICT JSON matching this schema:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "sentimentScore": number (between -1.0 and 1.0),
  "emotionalInsight": string,
  "detectedEmotions": string[]
}

Journal Entry to analyze:
"${content.replace(/"/g, '\\"')}"`;

  // 1. Try Groq first for ultra-fast JSON analysis
  try {
    const groqResponse = await generateGroqChatCompletion({
      messages: [
        { role: 'system', content: 'You are an emotional sentiment evaluator. Always respond in valid JSON matching the requested schema.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    if (groqResponse) {
      const parsed = JSON.parse(groqResponse);
      const validSentiment = ['Positive', 'Neutral', 'Negative'].includes(parsed.sentiment)
        ? parsed.sentiment
        : fallbackResult.sentiment;

      const rawScore = typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : fallbackResult.sentimentScore;
      const clampedScore = Math.max(-1.0, Math.min(1.0, Number(rawScore.toFixed(2))));

      return {
        sentiment: validSentiment,
        sentimentScore: clampedScore,
        emotionalInsight: parsed.emotionalInsight || fallbackResult.emotionalInsight,
        detectedEmotions: Array.isArray(parsed.detectedEmotions) && parsed.detectedEmotions.length > 0
          ? parsed.detectedEmotions.slice(0, 5)
          : fallbackResult.detectedEmotions,
        crisisDetected: crisis.isCrisisDetected,
      };
    }
  } catch (groqErr) {
    console.warn('Groq sentiment evaluation failed, falling back to Gemini:', groqErr);
  }

  // 2. Fallback to Gemini
  const ai = getAI();
  if (ai) {
    try {
      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        const validSentiment = ['Positive', 'Neutral', 'Negative'].includes(parsed.sentiment)
          ? parsed.sentiment
          : fallbackResult.sentiment;

        const rawScore = typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : fallbackResult.sentimentScore;
        const clampedScore = Math.max(-1.0, Math.min(1.0, Number(rawScore.toFixed(2))));

        return {
          sentiment: validSentiment,
          sentimentScore: clampedScore,
          emotionalInsight: parsed.emotionalInsight || fallbackResult.emotionalInsight,
          detectedEmotions: Array.isArray(parsed.detectedEmotions) && parsed.detectedEmotions.length > 0
            ? parsed.detectedEmotions.slice(0, 5)
            : fallbackResult.detectedEmotions,
          crisisDetected: crisis.isCrisisDetected,
        };
      }
    } catch (error) {
      console.error('Gemini sentiment analysis error, utilizing rule engine fallback:', error);
    }
  }

  return fallbackResult;
}

// Rule-based heuristic fallback if AI key is unavailable or service times out
function fallbackSentimentAnalysis(content: string, isCrisis: boolean): SentimentAnalysisResult {
  const text = content.toLowerCase();
  
  const positiveWords = ['happy', 'grateful', 'peaceful', 'joy', 'good', 'great', 'love', 'excited', 'calm', 'hopeful', 'proud', 'energized', 'relaxed', 'accomplished', 'smile', 'blessed'];
  const negativeWords = ['sad', 'anxious', 'stress', 'angry', 'lonely', 'exhausted', 'tired', 'worried', 'scared', 'hurt', 'frustrated', 'depressed', 'overwhelmed', 'crying', 'awful', 'pain'];
  
  let posCount = 0;
  let negCount = 0;

  positiveWords.forEach(w => {
    const matches = text.match(new RegExp(`\\b${w}`, 'g'));
    if (matches) posCount += matches.length;
  });

  negativeWords.forEach(w => {
    const matches = text.match(new RegExp(`\\b${w}`, 'g'));
    if (matches) negCount += matches.length;
  });

  let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
  let sentimentScore = 0.0;
  const detectedEmotions: string[] = [];

  if (isCrisis || negCount > posCount + 1) {
    sentiment = 'Negative';
    sentimentScore = Math.max(-0.9, -0.3 - (negCount * 0.15));
    detectedEmotions.push('Overwhelmed', 'Reflective');
  } else if (posCount > negCount + 1) {
    sentiment = 'Positive';
    sentimentScore = Math.min(0.9, 0.3 + (posCount * 0.15));
    detectedEmotions.push('Grateful', 'Optimistic');
  } else {
    sentiment = 'Neutral';
    sentimentScore = 0.05;
    detectedEmotions.push('Balanced', 'Thoughtful');
  }

  let emotionalInsight = 'Your reflections show thoughtful awareness of your daily experiences and current emotional state.';
  if (sentiment === 'Positive') {
    emotionalInsight = 'Your entry carries an uplifting tone and grounded appreciation for your positive experiences.';
  } else if (sentiment === 'Negative') {
    emotionalInsight = 'Your journal reflects meaningful vulnerability and acknowledges difficult emotions you are navigating.';
  }

  return {
    sentiment,
    sentimentScore: Number(sentimentScore.toFixed(2)),
    emotionalInsight,
    detectedEmotions,
    crisisDetected: isCrisis,
  };
}
