import { analyzeCrisisIndicators, CrisisCheckResult } from './crisisService.ts';
import { getAI, generateContentWithFallback } from './geminiClient.ts';
import { generateGroqChatCompletion } from './groqClient.ts';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface BotPersonaSettings {
  botName?: string;
  humorLevel?: 'none' | 'subtle' | 'high';
  communicationStyle?: 'bestie' | 'listener' | 'mentor' | 'direct';
  adviceMode?: 'listen' | 'balanced' | 'action';
  emojiLevel?: 'minimal' | 'moderate' | 'expressive';
}

export interface UserEmotionalContext {
  recentMoods?: Array<{ mood: string; note?: string; created_at: string }>;
  recentJournals?: Array<{ snippet: string; created_at: string; sentiment?: string; emotions?: string[] }>;
  moodSummary?: {
    dominantMood?: string;
    averageScore?: number;
    totalLogs?: number;
  };
}

export interface ChatServiceResponse {
  reply: string;
  crisisInfo: CrisisCheckResult;
  engineUsed?: 'groq' | 'gemini' | 'rule_fallback';
}

function getIndiaTimeContext(): { timeString: string; timeOfDay: string; dateString: string } {
  const now = new Date();
  const timeString = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(now);

  const dateString = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(now);

  const hourString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false,
  }).format(now);
  const hour = parseInt(hourString, 10);

  let timeOfDay = 'day';
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  return { timeString, timeOfDay, dateString };
}

function buildSystemPrompt(persona: BotPersonaSettings = {}, userContext?: UserEmotionalContext): string {
  const botName = persona.botName?.trim() || 'MindBridge Buddy';
  const humor = persona.humorLevel || 'subtle';
  const style = persona.communicationStyle || 'bestie';
  const advice = persona.adviceMode || 'balanced';
  const emojis = persona.emojiLevel || 'expressive';

  let humorDirective = 'Include subtle, gentle warmth and lighthearted smiles where appropriate.';
  if (humor === 'none') {
    humorDirective = 'Keep it purely gentle, serene, and grounded without jokes or sarcasm.';
  } else if (humor === 'high') {
    humorDirective = 'Be playful, witty, and subtly humorous like a fun, high-vibe best friend while keeping it emotionally supportive.';
  }

  let styleDirective = 'Talk like an empathetic, ride-or-die best friend on chat (warm, casual, genuine, relatable).';
  if (style === 'listener') {
    styleDirective = 'Be a quiet, deeply patient, calming presence. Focus heavily on mirroring and holding space.';
  } else if (style === 'mentor') {
    styleDirective = 'Be a wise, mindful wellness mentor offering gentle philosophical clarity and perspective.';
  } else if (style === 'direct') {
    styleDirective = 'Be encouraging, honest, and action-oriented with loving clarity and motivating energy.';
  }

  let adviceDirective = 'Blend heartfelt emotional validation with gentle, optional reflection questions.';
  if (advice === 'listen') {
    adviceDirective = 'STRICTLY focus on listening and validating feelings. Do NOT offer unsolicited advice, tips, or solutions.';
  } else if (advice === 'action') {
    adviceDirective = 'Provide 1-2 small, tangible, realistic micro-steps or grounding actions the user can try right now.';
  }

  let emojiDirective = 'Use cute, expressive, comforting emojis naturally in every response (✨, 💛, 🤗, 🌸, 🫂, ☕, 🌿, 🥺, 💬).';
  if (emojis === 'minimal') {
    emojiDirective = 'Use minimal emojis (1 per message max, or none).';
  } else if (emojis === 'moderate') {
    emojiDirective = 'Use 1-2 comforting emojis per message.';
  }

  let contextSnippet = '';
  if (userContext) {
    const parts: string[] = [];
    if (userContext.recentMoods && userContext.recentMoods.length > 0) {
      const moodList = userContext.recentMoods
        .slice(0, 5)
        .map((m) => `${m.mood}${m.note ? ` ("${m.note}")` : ''}`)
        .join(', ');
      parts.push(`Recent Mood Logs: [${moodList}]`);
    }
    if (userContext.moodSummary) {
      if (userContext.moodSummary.dominantMood) {
        parts.push(`Dominant Recent Mood: ${userContext.moodSummary.dominantMood}`);
      }
      if (userContext.moodSummary.averageScore) {
        parts.push(`Avg Mood Score (1-5): ${userContext.moodSummary.averageScore.toFixed(1)}`);
      }
    }
    if (userContext.recentJournals && userContext.recentJournals.length > 0) {
      const journalList = userContext.recentJournals
        .slice(0, 3)
        .map((j) => `"${j.snippet}" (Sentiment: ${j.sentiment || 'Reflective'}, Emotions: ${j.emotions?.join('/') || 'none'})`)
        .join(' | ');
      parts.push(`Recent Journal Entries & Insights: [${journalList}]`);
    }

    if (parts.length > 0) {
      contextSnippet = `\nUSER HOLISTIC EMOTIONAL & JOURNAL DATA (Use this deep context to intuitively understand how they are feeling, reference what they shared if natural, and tailor your tone):\n${parts.join('\n')}\n`;
    }
  }

  return `You are "${botName}", a loving AI mental wellness companion and supportive friend.

YOUR CORE CHARACTERISTICS & PERSONA:
- Name: ${botName}
- Style: ${styleDirective}
- Humor Level: ${humorDirective}
- Advice Mode: ${adviceDirective}
- Emojis: ${emojiDirective}
- LENGTH MANDATE: Keep it short and conversational! 1 to 3 short sentences or a brief 2-line thought. NEVER write long essays, numbered lists, or overwhelming paragraphs. Real friends text naturally!
${contextSnippet}
TIMEZONE & LOCATION (INDIA - IST):
- You and the user are in India operating on Indian Standard Time (IST, UTC+5:30).
- Rely on the explicit IST time passed in the message prompt for any time-of-day references (morning, afternoon, evening, or night).

SAFETY BOUNDARIES:
- You are an emotional support companion, not a clinical doctor or psychiatrist.
- In severe crisis or self-harm mentions, be compassionate and provide free 24/7 Indian helplines: Tele-MANAS (14416 / 1800-891-4416), KIRAN (1800-599-0019), or Vandrevala Foundation (+91 9999 666 555).`;
}

export async function generateCompanionResponse(
  userMessage: string,
  history: ChatHistoryItem[] = [],
  userName: string = 'Friend',
  persona: BotPersonaSettings = {},
  userContext?: UserEmotionalContext
): Promise<ChatServiceResponse> {
  const crisisCheck = analyzeCrisisIndicators(userMessage);
  const indiaTime = getIndiaTimeContext();
  const botName = persona.botName || 'MindBridge Buddy';

  const systemInstruction = buildSystemPrompt(persona, userContext);

  // 1. FASTEST PATH: Try Groq LLM first for lightning fast sub-second replies
  try {
    const groqMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemInstruction },
    ];

    const recentHistory = history.slice(-8);
    for (const item of recentHistory) {
      groqMessages.push({
        role: item.role === 'model' ? 'assistant' : 'user',
        content: item.text,
      });
    }

    groqMessages.push({
      role: 'user',
      content: `[Context: User Name="${userName}", Current India Time (IST)=${indiaTime.timeString}, ${indiaTime.dateString}, Period="${indiaTime.timeOfDay}"]\nUser: ${userMessage}`,
    });

    const groqReply = await generateGroqChatCompletion({
      messages: groqMessages,
      temperature: persona.humorLevel === 'high' ? 0.9 : 0.75,
      max_tokens: 300,
    });

    if (groqReply && groqReply.trim().length > 0) {
      return {
        reply: groqReply.trim(),
        crisisInfo: crisisCheck,
        engineUsed: 'groq',
      };
    }
  } catch (groqErr) {
    console.warn('Groq response not available or failed, falling back to Gemini:', groqErr);
  }

  // 2. FALLBACK PATH: Gemini AI
  const ai = getAI();
  if (ai) {
    try {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      const recentHistory = history.slice(-8);
      for (const item of recentHistory) {
        contents.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
      }

      contents.push({
        role: 'user',
        parts: [
          {
            text: `[Context: User Name="${userName}", Current India Time (IST)=${indiaTime.timeString}, ${indiaTime.dateString}, Period="${indiaTime.timeOfDay}"]\nUser: ${userMessage}`,
          },
        ],
      });

      const response = await generateContentWithFallback({
        contents,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      const replyText =
        response.text?.trim() ||
        `Hey ${userName} 🤗 I'm right here with you! Tell me what's on your mind? 💛✨`;

      return {
        reply: replyText,
        crisisInfo: crisisCheck,
        engineUsed: 'gemini',
      };
    } catch (geminiErr) {
      console.error('Gemini fallback failed:', geminiErr);
    }
  }

  // 3. OFFLINE CONVERSATIONAL FALLBACK
  let contextAwareFallback = `Hey ${userName} 🤗 I hear you and I'm right here with you this ${indiaTime.timeOfDay}! Take a gentle breath... how are you holding up right now? 💛✨`;
  if (crisisCheck.isCrisisDetected) {
    contextAwareFallback = `I hear how tough things are right now, and I care about you deeply 🫂 Please reach out to kind, 24/7 counselors in India at Tele-MANAS (dial 14416 or 1800-891-4416) or Vandrevala Foundation (+91 9999 666 555). You don't have to carry this alone 💛`;
  }

  return {
    reply: contextAwareFallback,
    crisisInfo: crisisCheck,
    engineUsed: 'rule_fallback',
  };
}
