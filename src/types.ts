export type MoodType =
  | 'Very Happy'
  | 'Happy'
  | 'Neutral'
  | 'Sad'
  | 'Very Sad'
  | 'Anxious'
  | 'Angry'
  | 'Stressed';

export interface MoodConfig {
  type: MoodType;
  label: string;
  score: number; // 1 to 5 scale
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export const MOOD_DEFINITIONS: Record<MoodType, MoodConfig> = {
  'Very Happy': {
    type: 'Very Happy',
    label: 'Very Happy',
    score: 5,
    emoji: '✨',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    description: 'Radiant, fulfilled, or joyful',
  },
  Happy: {
    type: 'Happy',
    label: 'Happy',
    score: 4,
    emoji: '🌱',
    color: '#059669',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-300',
    description: 'Content, hopeful, or peaceful',
  },
  Neutral: {
    type: 'Neutral',
    label: 'Neutral',
    score: 3,
    emoji: '🌤️',
    color: '#6B7280',
    bgColor: 'bg-slate-50 dark:bg-slate-900/40',
    borderColor: 'border-slate-200 dark:border-slate-700',
    textColor: 'text-slate-700 dark:text-slate-300',
    description: 'Balanced, steady, or okay',
  },
  Sad: {
    type: 'Sad',
    label: 'Sad',
    score: 2,
    emoji: '🌧️',
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
    description: 'Down, melancholy, or lonely',
  },
  'Very Sad': {
    type: 'Very Sad',
    label: 'Very Sad',
    score: 1,
    emoji: '🌊',
    color: '#1D4ED8',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    description: 'Deep sorrow, grief, or exhausted',
  },
  Anxious: {
    type: 'Anxious',
    label: 'Anxious',
    score: 2.2,
    emoji: '⚡',
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
    description: 'Worried, restless, or uneasy',
  },
  Angry: {
    type: 'Angry',
    label: 'Angry',
    score: 1.8,
    emoji: '🔥',
    color: '#EF4444',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-700 dark:text-rose-300',
    description: 'Frustrated, irritated, or upset',
  },
  Stressed: {
    type: 'Stressed',
    label: 'Stressed',
    score: 2.0,
    emoji: '🌪️',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300',
    description: 'Pressured, overwhelmed, or strained',
  },
};

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface MoodEntry {
  id?: string;
  mood_id: string;
  user_id: string;
  mood: MoodType;
  note?: string;
  created_at: string;
}

export interface JournalEntry {
  id?: string;
  journal_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface SentimentAnalysis {
  id?: string;
  analysis_id: string;
  journal_id: string;
  user_id: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentiment_score: number; // -1.0 to 1.0
  emotional_insight: string;
  detected_emotions?: string[];
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  chat_id: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
  crisis_info?: {
    isCrisisDetected: boolean;
    severity: 'none' | 'moderate' | 'high';
    message: string | null;
  };
}

export interface CrisisResource {
  name: string;
  contact: string;
  description: string;
  type: 'phone' | 'text' | 'web';
}

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
