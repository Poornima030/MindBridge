import { analyzeCrisisIndicators, CrisisCheckResult } from './crisisService.ts';
import { getAI, generateContentWithFallback } from './geminiClient.ts';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface ChatServiceResponse {
  reply: string;
  crisisInfo: CrisisCheckResult;
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

const SYSTEM_INSTRUCTION = `You are "MindBridge Buddy", a warm, empathetic, and super friendly AI best friend and wellness companion.

YOUR CHAT PERSONALITY:
- Talk like a real, caring, supportive friend on chat / messaging (warm, casual, genuine, and relatable).
- Use cute and comforting emojis naturally in every response (e.g. ✨, 💛, 🤗, 🌸, 🫂, ☕, 🌿, 🥺, 💬).
- KEEP IT SHORT & CONVERSATIONAL: Max 1 to 3 short sentences or a brief 2-line thought! NEVER write long clinical essays, lists of bullet points, or multiple heavy paragraphs. Friends text each other concisely!
- Active listening & validation: Acknowledge what they share with heartfelt empathy and ask a caring, open-ended question or share a quick encouraging word.

TIMEZONE & LOCATION (INDIA - IST):
- You and the user are located in India operating on Indian Standard Time (IST, UTC+5:30).
- Strictly adhere to the provided current Indian Standard Time (IST) for any time greetings (e.g. morning, afternoon, evening, or night). NEVER guess or assume it is night unless the IST time is actually night.

SAFETY & BOUNDARIES:
- You are a caring friend and emotional support companion, not a medical doctor or clinical therapist. Do not give medical diagnoses or drug prescriptions.
- If the user expresses self-harm or suicidal thoughts, respond with deep compassion and immediately share 24/7 free Indian helplines: Tele-MANAS (14416 or 1800-891-4416), KIRAN (1800-599-0019), or Vandrevala Foundation (+91 9999 666 555).`;

export async function generateCompanionResponse(
  userMessage: string,
  history: ChatHistoryItem[] = [],
  userName: string = 'Friend'
): Promise<ChatServiceResponse> {
  // Check for crisis indicators
  const crisisCheck = analyzeCrisisIndicators(userMessage);
  const indiaTime = getIndiaTimeContext();

  const ai = getAI();
  if (!ai) {
    // Fallback if API key is not configured
    let fallbackReply = `Hey ${userName} 🤗 I'm right here with you! Whatever is on your mind this ${indiaTime.timeOfDay}, I'm listening. Tell me what's going on? 💛✨`;
    if (crisisCheck.isCrisisDetected) {
      fallbackReply = `I'm holding space for you, and you are not alone 🫂 Please connect right now with free caring 24/7 counselors in India at Tele-MANAS (14416 or 1800-891-4416) or Vandrevala Foundation (+91 9999 666 555). Sending you love and care 💛`;
    }
    return {
      reply: fallbackReply,
      crisisInfo: crisisCheck,
    };
  }

  try {
    // Build context-rich history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Include recent history (last 8 messages for context)
    const recentHistory = history.slice(-8);
    for (const item of recentHistory) {
      contents.push({
        role: item.role,
        parts: [{ text: item.text }],
      });
    }

    // Add current user message with explicit Indian Standard Time context
    contents.push({
      role: 'user',
      parts: [
        {
          text: `[Context: User Name="${userName}", Current India Time (IST)=${indiaTime.timeString}, ${indiaTime.dateString}, Time of Day in India="${indiaTime.timeOfDay}"]\nUser: ${userMessage}`,
        },
      ],
    });

    const response = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
      },
    });

    const replyText =
      response.text?.trim() ||
      `Hey ${userName} 🤗 I'm right here with you! Tell me what's on your mind? 💛✨`;

    return {
      reply: replyText,
      crisisInfo: crisisCheck,
    };
  } catch (error) {
    console.error('Error generating companion response with Gemini:', error);
    
    // Provide a short, friendly, emoji-rich fallback
    let contextAwareFallback = `Hey ${userName} 🤗 I hear you and I'm right here with you this ${indiaTime.timeOfDay}. Take a gentle breath... how are you holding up right now? 💛✨`;
    
    if (crisisCheck.isCrisisDetected) {
      contextAwareFallback = `I hear how tough things are right now, and I care about you deeply 🫂 Please reach out to kind, 24/7 counselors in India at Tele-MANAS (dial 14416 or 1800-891-4416) or Vandrevala Foundation (+91 9999 666 555). You don't have to carry this alone 💛`;
    }

    return {
      reply: contextAwareFallback,
      crisisInfo: crisisCheck,
    };
  }
}

