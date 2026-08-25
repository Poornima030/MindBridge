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

  // Greeting time of day
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Calculate mood stats
  const totalMoods = moods.length;
  const averageScore =
    totalMoods > 0
      ? (
          moods.reduce((acc, m) => acc + (MOOD_DEFINITIONS[m.mood]?.score || 3), 0) /
          totalMoods
        ).toFixed(1)
      : 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Bento Row: Hero Welcome (Col 8) + Live Sanctuary Quick Stats (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Welcome Hero Bento Box */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white p-7 sm:p-9 shadow-lg shadow-emerald-900/10 flex flex-col justify-between">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Daily Emotional Sanctuary</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {timeGreeting}, {userProfile?.name || currentUser?.displayName || 'Friend'}
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed font-normal">
              Take a gentle breath. This is your safe space to reflect on how you're feeling, unload your thoughts in a private journal, or talk through whatever is on your mind.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3">
            <button
              id="dashboard-start-chat-btn"
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <MessageCircleHeart className="w-4 h-4 text-emerald-600" />
              <span>Talk to AI Companion</span>
            </button>
            <button
              id="dashboard-quick-breathe-btn"
              onClick={() => onOpenBreathingModal('breathing-box')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-2xl text-xs sm:text-sm font-medium border border-white/20 transition-all active:scale-95"
            >
              <Wind className="w-4 h-4 text-emerald-200" />
              <span>3-Min Box Breathing</span>
            </button>
          </div>

          {/* Ambient background decoration */}
          <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Quick Sanctuary Summary Bento Box (Col 4) */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                Emotional Pulse
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Sanctuary
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-ins</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {totalMoods}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Mood</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {averageScore} <span className="text-[10px] font-normal text-slate-400">/ 5</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
                <span className="font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-600" />
                  Latest State
                </span>
                <span className="font-bold">
                  {recentMood ? `${MOOD_DEFINITIONS[recentMood.mood]?.emoji || ''} ${recentMood.mood}` : 'Not logged today'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Privacy protected</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Bento Grid: Mood Check-In + Journal + AI Companion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bento 1: Today's Mood Snapshot & Quick Logger */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    How are you feeling?
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-medium">Quick 1-tap check-in</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('mood')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1"
              >
                Timeline <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {moodSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mood entry saved to your private record.</span>
              </div>
            )}

            {moodError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
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
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30 scale-102 shadow-xs'
                        : 'border-slate-100 dark:border-slate-800 bg-[#F8FAF9] dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl mb-1">{def.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                      {def.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedQuickMood && (
              <div className="space-y-3 animate-in fade-in duration-200 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                <input
                  type="text"
                  placeholder="Optional note (e.g. peaceful morning coffee)..."
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    id="save-quick-mood-btn"
                    onClick={handleQuickMoodSubmit}
                    disabled={isSubmittingMood}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingMood ? 'Recording...' : `Log ${selectedQuickMood}`}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQuickMood(null);
                      setQuickNote('');
                    }}
                    className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Latest Recorded Mood Info */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Latest check-in:</span>
            {recentMood ? (
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span>{MOOD_DEFINITIONS[recentMood.mood]?.emoji}</span>
                <span>{recentMood.mood}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({new Date(recentMood.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">No mood logged yet today</span>
            )}
          </div>
        </div>

        {/* Bento 2: Digital Journal Quick Reflection */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Private Digital Journal
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-medium">Reflective journaling</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('journal')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 flex items-center gap-1"
              >
                Open <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentJournal ? (
              <div className="p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3 h-3 text-teal-600" />
                    {new Date(recentJournal.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {recentSentiment && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        recentSentiment.sentiment === 'Positive'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          : recentSentiment.sentiment === 'Negative'
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {recentSentiment.sentiment} Tone
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed italic">
                  "{recentJournal.content}"
                </p>
                {recentSentiment?.emotional_insight && (
                  <p className="text-[11px] text-teal-800 dark:text-teal-300 pt-1.5 font-medium border-t border-slate-200/80 dark:border-slate-700">
                    💡 {recentSentiment.emotional_insight}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Your journal is empty. Unloading your thoughts brings cognitive clarity.
                </p>
                <button
                  id="dashboard-write-journal-first-btn"
                  onClick={() => onNavigate('journal')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Write First Entry
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total reflections:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {/* Bento 3: Empathetic AI Companion */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                  <MessageCircleHeart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Empathetic AI Chat
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-medium">Safe sounding board</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('chat')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
              >
                Chat <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Need a sounding board or feeling overwhelmed? Tap a suggested reflection to start:
            </p>

            <div className="space-y-2">
              {[
                'I am feeling a bit stressed with my workload today.',
                'Can you guide me through a quick mindfulness exercise?',
                'I had a challenging conversation and want to process it.',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate('chat')}
                  className="w-full text-left p-2.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 border border-indigo-100/80 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 transition-all flex items-center justify-between group"
                >
                  <span className="truncate pr-2 font-medium">"{prompt}"</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Response mode:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Empathetic Listener
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bento Row: Analytics Snapshot (Col 8) + Micro-Practice (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Emotional Trends Bento Box (Col 8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Emotional Trend & Activity Snapshot
                  </h3>
                  <span className="text-[10px] text-slate-400 block font-medium">Aggregated from your private check-ins</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1"
              >
                Full Analytics <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-4">
              <div className="p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Mood Logs
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">
                  {totalMoods}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Average Mood
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {averageScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Journal Entries
                </span>
                <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 block">
                  {journals.length}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Sentiment Logs
                </span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                  {sentiments.length}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
            {totalMoods > 2
              ? 'Your logging habit provides valuable emotional self-awareness. Check the Analytics tab for detailed interactive trends and distribution charts.'
              : 'Log at least 3 moods and write a journal entry to unlock rich emotional trend analysis and chart visualizations.'}
          </p>
        </div>

        {/* Daily Wellness Practice Bento Box (Col 4) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-teal-50 via-emerald-50/60 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-6 sm:p-7 border border-teal-200/70 dark:border-teal-900/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 mb-2">
              <Zap className="w-5 h-5 text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Micro-Practice of the Day
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              5-4-3-2-1 Sensory Grounding
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Feeling scattered or anxious? Step through your five senses to ground your awareness safely into the present moment.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-teal-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
              ⏱️ 5 Minutes
            </span>
            <button
              id="dashboard-start-grounding-btn"
              onClick={onOpenGroundingModal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors"
            >
              Start Grounding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
