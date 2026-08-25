import React, { useState, useEffect } from 'react';
import {
  Heart,
  Smile,
  BookOpen,
  MessageCircleHeart,
  Sparkles,
  TrendingUp,
  Wind,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Zap,
  AlertCircle,
  Mic,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getMoodEntries,
  getJournalEntries,
  getSentimentAnalyses,
  addMoodEntry,
} from '../firebase/firestoreService.ts';
import {
  MoodEntry,
  JournalEntry,
  SentimentAnalysis,
  MoodType,
  MOOD_DEFINITIONS,
} from '../types.ts';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenBreathingModal: (type?: 'breathing-box' | 'breathing-478') => void;
  onOpenGroundingModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenBreathingModal,
  onOpenGroundingModal,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [sentiments, setSentiments] = useState<SentimentAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Mood Log state
  const [selectedQuickMood, setSelectedQuickMood] = useState<MoodType | null>(null);
  const [quickNote, setQuickNote] = useState<string>('');
  const [isSubmittingMood, setIsSubmittingMood] = useState<boolean>(false);
  const [moodSuccess, setMoodSuccess] = useState<boolean>(false);
  const [moodError, setMoodError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [userMoods, userJournals, userSentiments] = await Promise.all([
        getMoodEntries(currentUser.uid),
        getJournalEntries(currentUser.uid),
        getSentimentAnalyses(currentUser.uid),
      ]);
      setMoods(userMoods);
      setJournals(userJournals);
      setSentiments(userSentiments);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMoodSubmit = async () => {
    if (!currentUser || !selectedQuickMood) return;
    setIsSubmittingMood(true);
    setMoodError(null);
    try {
      const newEntry = await addMoodEntry(currentUser.uid, selectedQuickMood, quickNote);
      setMoods((prev) => [newEntry, ...prev]);
      setMoodSuccess(true);
      setSelectedQuickMood(null);
      setQuickNote('');
      setTimeout(() => setMoodSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to log mood:', err);
      setMoodError(err?.message || 'Failed to log mood. Please check your Firestore connection.');
    } finally {
      setIsSubmittingMood(false);
    }
  };

  const recentMood = moods.length > 0 ? moods[0] : null;
  const recentJournal = journals.length > 0 ? journals[0] : null;
  const recentSentiment =
    recentJournal && sentiments.length > 0
      ? sentiments.find((s) => s.journal_id === recentJournal.journal_id) || sentiments[0]
      : null;

  // Greeting time of day (IST aware)
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Calculate mood stats
  const totalMoods = moods.length;
  const averageScore =
    totalMoods > 0
      ? (
          moods.reduce((acc, m) => acc + (MOOD_DEFINITIONS[m.mood]?.score || 3), 0) /
          totalMoods
        ).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Bento Row: Hero Welcome (Col 8) + Live Sanctuary Quick Stats (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Welcome Hero Bento Box */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-tr from-teal-700 via-teal-600 to-sky-600 text-white p-7 sm:p-9 shadow-xl shadow-teal-700/15 flex flex-col justify-between">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white mb-4 border border-white/25">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Daily Emotional Sanctuary</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {timeGreeting}, {userProfile?.name || currentUser?.displayName || 'Friend'} ✨
            </h1>
            <p className="mt-2 text-sm text-teal-50/90 leading-relaxed font-medium">
              Take a gentle breath. This is your safe space to reflect on how you're feeling, dictate or write your private journal, or talk through whatever is on your mind.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3">
            <button
              id="dashboard-start-chat-btn"
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal-900 hover:bg-teal-50 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <MessageCircleHeart className="w-4 h-4 text-teal-600" />
              <span>Talk to AI Companion</span>
            </button>
            <button
              id="dashboard-quick-breathe-btn"
              onClick={() => onOpenBreathingModal('breathing-box')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl text-xs sm:text-sm font-bold border border-white/30 transition-all active:scale-95"
            >
              <Wind className="w-4 h-4 text-sky-200" />
              <span>3-Min Box Breathing</span>
            </button>
          </div>

          {/* Ambient background decoration */}
          <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Quick Sanctuary Summary Bento Box (Col 4) */}
        <div className="lg:col-span-4 rounded-3xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Emotional Pulse
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Sanctuary
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Check-ins</span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                  {totalMoods}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200">
                <span className="text-[10px] uppercase font-bold text-teal-700 block">Avg Mood</span>
                <span className="text-xl font-extrabold text-teal-700 mt-0.5 block">
                  {averageScore} <span className="text-[10px] font-normal text-slate-500">/ 5</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-teal-600" />
                  Latest State
                </span>
                <span className="font-bold">
                  {recentMood ? `${MOOD_DEFINITIONS[recentMood.mood]?.emoji || ''} ${recentMood.mood}` : 'Not logged today'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Privacy protected</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Bento Grid: Mood Check-In + Journal + AI Companion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bento 1: Today's Mood Snapshot & Quick Logger */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    How are you feeling?
                  </h2>
                  <span className="text-[10px] text-slate-500 block font-medium">Quick 1-tap check-in</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('mood')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                Timeline <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {moodSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mood entry saved to your private record.</span>
              </div>
            )}

            {moodError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{moodError}</span>
              </div>
            )}

            {/* Quick Mood Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(Object.keys(MOOD_DEFINITIONS) as MoodType[]).map((moodKey) => {
                const def = MOOD_DEFINITIONS[moodKey];
                const isSelected = selectedQuickMood === moodKey;
                return (
                  <button
                    key={moodKey}
                    id={`quick-mood-${moodKey.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setSelectedQuickMood(moodKey)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/30 scale-102 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 hover:border-teal-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl mb-1">{def.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center">
                      {def.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedQuickMood && (
              <div className="space-y-3 animate-in fade-in duration-200 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Optional note (e.g. peaceful morning coffee)..."
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex gap-2">
                  <button
                    id="save-quick-mood-btn"
                    onClick={handleQuickMoodSubmit}
                    disabled={isSubmittingMood}
                    className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingMood ? 'Recording...' : `Log ${selectedQuickMood}`}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQuickMood(null);
                      setQuickNote('');
                    }}
                    className="py-2 px-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Latest Recorded Mood Info */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Latest check-in:</span>
            {recentMood ? (
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>{MOOD_DEFINITIONS[recentMood.mood]?.emoji}</span>
                <span>{recentMood.mood}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({new Date(recentMood.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">No check-in yet</span>
            )}
          </div>
        </div>

        {/* Bento 2: Latest Private Journal Reflection & Voice Entry */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    Journal & Voice Logs
                  </h2>
                  <span className="text-[10px] text-slate-500 block font-medium">Text & voice reflections</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('journal')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                Journal <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentJournal ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-teal-600" />
                    {new Date(recentJournal.created_at).toLocaleDateString()}
                  </span>
                  {recentSentiment && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        recentSentiment.sentiment === 'Positive'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : recentSentiment.sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {recentSentiment.sentiment} Tone
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed">
                  {recentJournal.entry_type === 'voice' || recentJournal.audio_url
                    ? `🎙️ Recorded Voice Note: ${recentJournal.audio_analysis?.comfortNote || recentJournal.content}`
                    : `"${recentJournal.content}"`}
                </p>

                {recentSentiment?.emotional_insight && recentJournal.entry_type !== 'voice' && (
                  <p className="text-[11px] text-teal-900 italic bg-teal-50/70 p-2 rounded-xl border border-teal-200">
                    💡 {recentSentiment.emotional_insight}
                  </p>
                )}

                {recentJournal.audio_analysis?.emotionalTone && (
                  <p className="text-[11px] text-teal-900 italic bg-teal-50/70 p-2 rounded-xl border border-teal-200">
                    🎧 Spoken Tone: {recentJournal.audio_analysis.emotionalTone}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                <BookOpen className="w-6 h-6 text-teal-600 mx-auto opacity-70" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  You haven't written a reflection yet. Speak or type your thoughts in peace.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('journal')}
              className="w-full py-2.5 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Mic className="w-3.5 h-3.5 text-teal-600" />
              <span>Open Voice & Text Journal</span>
            </button>
          </div>
        </div>

        {/* Bento 3: AI Companion Direct Portal */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-xs">
                  <MessageCircleHeart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    {userProfile?.persona_settings?.botName || 'AI Companion'}
                  </h2>
                  <span className="text-[10px] text-slate-500 block font-medium">Context & Reflection Aware</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('chat')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                Chat <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                "I analyze your recent mood check-ins and journal insights so you never have to repeat yourself. What's on your mind today?"
              </p>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  ⚡ Always Active
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
                  🤗 Customizable Vibe
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('chat')}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircleHeart className="w-3.5 h-3.5" />
              <span>Start Conversation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grounding & Wellness Quick Trays */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Feeling overwhelmed or tense right now?
            </h3>
            <p className="text-xs text-slate-500">
              Try the 5-4-3-2-1 sensory grounding exercise to center your mind in under 2 minutes.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenGroundingModal}
          className="px-5 py-2.5 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap"
        >
          Open 5-4-3-2-1 Grounding Tool
        </button>
      </div>
    </div>
  );
};
