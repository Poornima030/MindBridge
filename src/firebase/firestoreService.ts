import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.ts';
import {
  UserProfile,
  MoodEntry,
  JournalEntry,
  SentimentAnalysis,
  ChatMessage,
  MoodType,
} from '../types.ts';

/**
 * Utility to strip undefined values recursively so Firestore setDoc never throws
 * "Unsupported field value: undefined"
 */
function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = cleanForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

function handleFirestoreError(err: any, context: string) {
  console.warn(`Firestore [${context}]:`, err?.message || err);
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('permission') || msg.includes('insufficient') || err?.code === 'permission-denied') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-permission-denied'));
    }
  }
}

// User Profile
export async function createUserProfile(
  userId: string,
  name: string,
  email: string
): Promise<UserProfile> {
  const userRef = doc(db, 'users', userId);
  const now = new Date().toISOString();
  const profile: UserProfile = {
    user_id: userId,
    name: name || 'Friend',
    email: email || '',
    created_at: now,
  };
  await setDoc(userRef, cleanForFirestore({
    ...profile,
    timestamp: serverTimestamp(),
  }));
  return profile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        user_id: data.user_id || userId,
        name: data.name || 'Friend',
        email: data.email || '',
        created_at: data.created_at || new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'getUserProfile');
    return null;
  }
}

// Mood Entries
export async function addMoodEntry(
  userId: string,
  mood: MoodType,
  note?: string
): Promise<MoodEntry> {
  const moodId = `mood_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const moodDocRef = doc(db, 'mood_entries', moodId);

  const entry: MoodEntry = {
    mood_id: moodId,
    user_id: userId,
    mood,
    note: (note || '').trim(),
    created_at: now,
  };

  try {
    await setDoc(moodDocRef, cleanForFirestore({
      ...entry,
      timestamp: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, 'addMoodEntry');
    throw error;
  }

  return { ...entry, id: moodId };
}

export async function getMoodEntries(userId: string): Promise<MoodEntry[]> {
  try {
    const q = query(
      collection(db, 'mood_entries'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    const entries: MoodEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as MoodEntry;
      entries.push({
        id: docSnap.id,
        mood_id: data.mood_id || docSnap.id,
        user_id: data.user_id,
        mood: data.mood,
        note: data.note || '',
        created_at: data.created_at || new Date().toISOString(),
      });
    });

    // Sort by created_at descending (newest first)
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return entries;
  } catch (error) {
    handleFirestoreError(error, 'getMoodEntries');
    return [];
  }
}

export async function deleteMoodEntry(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'mood_entries', docId));
}

// Journal Entries
export async function addJournalEntry(
  userId: string,
  content: string
): Promise<JournalEntry> {
  const journalId = `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const journalDocRef = doc(db, 'journal_entries', journalId);

  const entry: JournalEntry = {
    journal_id: journalId,
    user_id: userId,
    content: (content || '').trim(),
    created_at: now,
  };

  try {
    await setDoc(journalDocRef, cleanForFirestore({
      ...entry,
      timestamp: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, 'addJournalEntry');
    throw error;
  }

  return { ...entry, id: journalId };
}

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  try {
    const q = query(
      collection(db, 'journal_entries'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    const entries: JournalEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as JournalEntry;
      entries.push({
        id: docSnap.id,
        journal_id: data.journal_id || docSnap.id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at || new Date().toISOString(),
      });
    });

    // Sort by created_at descending
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return entries;
  } catch (error) {
    handleFirestoreError(error, 'getJournalEntries');
    return [];
  }
}

export async function deleteJournalEntry(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'journal_entries', docId));
}

// Sentiment Analysis
export async function saveSentimentAnalysis(
  userId: string,
  journalId: string,
  sentiment: 'Positive' | 'Neutral' | 'Negative',
  sentimentScore: number,
  emotionalInsight: string,
  detectedEmotions: string[] = []
): Promise<SentimentAnalysis> {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const docRef = doc(db, 'sentiment_analysis', analysisId);

  const analysis: SentimentAnalysis = {
    analysis_id: analysisId,
    journal_id: journalId,
    user_id: userId,
    sentiment: sentiment || 'Neutral',
    sentiment_score: typeof sentimentScore === 'number' && !isNaN(sentimentScore) ? sentimentScore : 0,
    emotional_insight: emotionalInsight || '',
    detected_emotions: Array.isArray(detectedEmotions) ? detectedEmotions : [],
    created_at: now,
  };

  try {
    await setDoc(docRef, cleanForFirestore({
      ...analysis,
      timestamp: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, 'saveSentimentAnalysis');
    throw error;
  }

  return { ...analysis, id: analysisId };
}

export async function getSentimentAnalyses(userId: string): Promise<SentimentAnalysis[]> {
  try {
    const q = query(
      collection(db, 'sentiment_analysis'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    const entries: SentimentAnalysis[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as SentimentAnalysis;
      entries.push({
        id: docSnap.id,
        analysis_id: data.analysis_id || docSnap.id,
        journal_id: data.journal_id,
        user_id: data.user_id,
        sentiment: data.sentiment,
        sentiment_score: data.sentiment_score,
        emotional_insight: data.emotional_insight,
        detected_emotions: data.detected_emotions || [],
        created_at: data.created_at || new Date().toISOString(),
      });
    });

    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return entries;
  } catch (error) {
    handleFirestoreError(error, 'getSentimentAnalyses');
    return [];
  }
}

// Chat History
export async function saveChatMessage(
  userId: string,
  userMessage: string,
  aiResponse: string,
  crisisInfo?: ChatMessage['crisis_info']
): Promise<ChatMessage> {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const docRef = doc(db, 'chat_history', chatId);

  const cleanCrisisInfo = crisisInfo
    ? {
        isCrisisDetected: Boolean(crisisInfo.isCrisisDetected),
        severity: crisisInfo.severity || 'none',
        message: crisisInfo.message || null,
      }
    : null;

  const message: ChatMessage = {
    chat_id: chatId,
    user_id: userId,
    user_message: userMessage,
    ai_response: aiResponse,
    created_at: now,
    ...(cleanCrisisInfo ? { crisis_info: cleanCrisisInfo } : {}),
  };

  try {
    await setDoc(docRef, cleanForFirestore({
      ...message,
      timestamp: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, 'saveChatMessage');
    throw error;
  }

  return { ...message, id: chatId };
}

export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  try {
    const q = query(
      collection(db, 'chat_history'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    const entries: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ChatMessage;
      entries.push({
        id: docSnap.id,
        chat_id: data.chat_id || docSnap.id,
        user_id: data.user_id,
        user_message: data.user_message,
        ai_response: data.ai_response,
        created_at: data.created_at || new Date().toISOString(),
        crisis_info: data.crisis_info,
      });
    });

    // Sort ascending for chronological chat flow
    entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return entries;
  } catch (error) {
    handleFirestoreError(error, 'getChatHistory');
    return [];
  }
}

export async function clearUserChatHistory(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'chat_history'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
}
