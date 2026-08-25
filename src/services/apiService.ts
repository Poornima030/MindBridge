import { WellnessRecommendation, CrisisResource } from '../types.ts';

export interface ChatApiPayload {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  userName?: string;
}

export interface ChatApiResponse {
  reply: string;
  crisisInfo: {
    isCrisisDetected: boolean;
    severity: 'none' | 'moderate' | 'high';
    message: string | null;
    resources: CrisisResource[];
  };
}

export interface SentimentApiResponse {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore: number;
  emotionalInsight: string;
  detectedEmotions: string[];
  crisisDetected: boolean;
}

export async function sendChatMessage(payload: ChatApiPayload): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(err.error || 'Server error communicating with AI companion');
  }

  return response.json();
}

export async function analyzeJournalText(content: string): Promise<SentimentApiResponse> {
  const response = await fetch('/api/sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Sentiment analysis failed' }));
    throw new Error(err.error || 'Failed to analyze journal sentiment');
  }

  return response.json();
}

export async function fetchPersonalizedRecommendations(
  recentMoods: string[] = [],
  recentSentiments: string[] = []
): Promise<WellnessRecommendation[]> {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recentMoods, recentSentiments }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to fetch recommendations' }));
    throw new Error(err.error || 'Failed to generate recommendations');
  }

  const data = await response.json();
  return data.recommendations || [];
}

export async function checkCrisisIndicators(text: string) {
  const response = await fetch('/api/crisis-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    return { isCrisisDetected: false, severity: 'none', message: null, resources: [] };
  }

  return response.json();
}
