import { getAI, generateContentWithFallback } from './geminiClient.ts';

export interface WellnessRecommendation {
  id: string;
  title: string;
  category: 'Breathing' | 'Mindfulness' | 'Movement' | 'Journaling' | 'Connection' | 'Rest';
  durationMinutes: number;
  description: string;
  actionType?: 'breathing-box' | 'breathing-478' | 'grounding-54321' | 'journal' | 'walk' | 'chat';
  guidanceSteps: string[];
  tag: string;
}

const DEFAULT_RECOMMENDATIONS: WellnessRecommendation[] = [
  {
    id: 'box-breathing',
    title: '4x4 Box Breathing',
    category: 'Breathing',
    durationMinutes: 3,
    description: 'Regulate your autonomic nervous system with a balanced, calming rhythmic breathing cycle.',
    actionType: 'breathing-box',
    guidanceSteps: [
      'Inhale slowly through your nose for 4 seconds',
      'Gently hold your breath with relaxed shoulders for 4 seconds',
      'Exhale smoothly through your mouth for 4 seconds',
      'Pause and rest at the bottom of your breath for 4 seconds',
    ],
    tag: 'Quick Stress Relief',
  },
  {
    id: 'grounding-54321',
    title: '5-4-3-2-1 Sensory Grounding',
    category: 'Mindfulness',
    durationMinutes: 5,
    description: 'Anchor yourself in the present moment by engaging your five senses step-by-step.',
    actionType: 'grounding-54321',
    guidanceSteps: [
      'Name 5 things you can see around you right now',
      'Notice 4 physical textures you can feel or touch',
      'Listen for 3 distinct ambient sounds in your environment',
      'Identify 2 subtle scents you can smell',
      'Acknowledge 1 pleasant taste or take a mindful sip of water',
    ],
    tag: 'Anxiety Calming',
  },
  {
    id: 'relaxing-478',
    title: '4-7-8 Deep Relaxation Breath',
    category: 'Breathing',
    durationMinutes: 4,
    description: 'Slow your heart rate and prepare your mind and body for peaceful rest or de-escalation.',
    actionType: 'breathing-478',
    guidanceSteps: [
      'Inhale quietly through your nose for 4 counts',
      'Hold your breath comfortably for 7 counts',
      'Exhale completely through open lips making a soft whoosh for 8 counts',
      'Repeat for 4 mindful cycles',
    ],
    tag: 'Deep Calming',
  },
  {
    id: 'gratitude-spark',
    title: 'Three Micro-Moments of Gratitude',
    category: 'Journaling',
    durationMinutes: 5,
    description: 'Shift your cognitive focus toward positive or neutral moments from your day.',
    actionType: 'journal',
    guidanceSteps: [
      'Recall one small pleasant sensory experience today (e.g. warm tea, fresh breeze)',
      'Reflect on one kind word or interaction you experienced or witnessed',
      'Acknowledge one personal effort you made today, regardless of outcome',
    ],
    tag: 'Mood Elevation',
  },
  {
    id: 'mindful-movement',
    title: 'Gentle Shoulder & Neck Reset',
    category: 'Movement',
    durationMinutes: 3,
    description: 'Release physical tension held in the upper body from screen time or stress.',
    actionType: 'walk',
    guidanceSteps: [
      'Roll your shoulders backwards 5 times in slow, wide circles',
      'Gently tilt your right ear toward your right shoulder for 15 seconds',
      'Slowly tilt your left ear toward your left shoulder for 15 seconds',
      'Shake out your hands and take a deep, grounding breath',
    ],
    tag: 'Physical Ease',
  },
  {
    id: 'supportive-checkin',
    title: 'Connection Outreach',
    category: 'Connection',
    durationMinutes: 5,
    description: 'Send a brief, low-pressure message to a trusted friend, family member, or colleague.',
    actionType: 'chat',
    guidanceSteps: [
      'Pick one person whose presence brings you comfort or smiles',
      'Send a short check-in message: "Thinking of you today, hope your week is going gently"',
      'Notice the warmth that comes with extending connection',
    ],
    tag: 'Emotional Social Support',
  },
];

export async function generatePersonalizedRecommendations(
  recentMoods: string[],
  recentSentiments: string[]
): Promise<WellnessRecommendation[]> {
  const ai = getAI();
  if (!ai) {
    return selectTailoredDefaults(recentMoods);
  }

  try {
    const prompt = `You are a supportive, non-clinical wellness practitioner for an emotional wellness app called MindBridge.
Recent user logged moods: [${recentMoods.join(', ') || 'No recent logs'}]
Recent journal sentiment patterns: [${recentSentiments.join(', ') || 'Neutral'}]

Generate 3 personalized, realistic, non-medical wellness practices tailored to their recent state.
Each practice must be an actionable micro-habit (3-10 minutes) focused on calming, reflection, mindful movement, breathing, rest, or connection.
DO NOT provide clinical diagnosis or medical prescriptions.

Return STRICT JSON matching this schema:
[
  {
    "id": "string-unique-kebab",
    "title": "string",
    "category": "Breathing" | "Mindfulness" | "Movement" | "Journaling" | "Connection" | "Rest",
    "durationMinutes": number,
    "description": "string",
    "actionType": "breathing-box" | "breathing-478" | "grounding-54321" | "journal" | "walk" | "chat",
    "guidanceSteps": ["step 1", "step 2", "step 3", "step 4"],
    "tag": "Short 2-3 word tag"
  }
]`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) return selectTailoredDefaults(recentMoods);

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 4);
    }
    return selectTailoredDefaults(recentMoods);
  } catch (err) {
    console.error('Error generating AI recommendations:', err);
    return selectTailoredDefaults(recentMoods);
  }
}

function selectTailoredDefaults(recentMoods: string[]): WellnessRecommendation[] {
  const isStressedOrAnxious = recentMoods.some(m => ['Anxious', 'Stressed', 'Angry', 'Very Sad'].includes(m));
  if (isStressedOrAnxious) {
    return [
      DEFAULT_RECOMMENDATIONS[0], // Box breathing
      DEFAULT_RECOMMENDATIONS[1], // Grounding
      DEFAULT_RECOMMENDATIONS[2], // 4-7-8 Breath
      DEFAULT_RECOMMENDATIONS[4], // Physical reset
    ];
  }
  return DEFAULT_RECOMMENDATIONS.slice(0, 4);
}
