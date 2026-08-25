import React, { useState, useEffect } from 'react';
import {
  Smile,
  Calendar,
  Clock,
  Trash2,
  Filter,
  Plus,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  addMoodEntry,
  getMoodEntries,
  deleteMoodEntry,
} from '../firebase/firestoreService.ts';
import { MoodEntry, MoodType, MOOD_DEFINITIONS } from '../types.ts';

export const MoodPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state
  const [selectedMood, setSelectedMood] = useState<MoodType>('Happy');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string>('all');

  useEffect(() => {
    if (!currentUser) return;
    loadMoods();
  }, [currentUser]);

  const loadMoods = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getMoodEntries(currentUser.uid);
      setMoods(data);
    } catch (err: any) {
      console.error('Error loading mood entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const newEntry = await addMoodEntry(currentUser.uid, selectedMood, note);
      setMoods((prev) => [newEntry, ...prev]);
      setNote('');
      setSuccessMessage(`Recorded mood: ${selectedMood}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error adding mood:', err);
      setErrorMessage(err?.message || 'Failed to save mood entry. Please check your Firestore connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMood = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Delete this mood entry?')) {
      try {
        await deleteMoodEntry(id);
        setMoods((prev) => prev.filter((m) => m.id !== id && m.mood_id !== id));
      } catch (err) {
        console.error('Error deleting mood:', err);
      }
    }
  };

  const filteredMoods =
    filterMood === 'all'
      ? moods
      : moods.filter((m) => m.mood === filterMood);

  // Quick stats
  const totalLogs = moods.length;
  const moodCounts = moods.reduce((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
  }, {} as Record<string, number>);

  let topMood = 'None';
  let topCount = 0;
  Object.entries(moodCounts).forEach(([m, count]) => {
    const numCount = Number(count);
    if (numCount > topCount) {
      topCount = numCount;
      topMood = m;
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <Smile className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Daily Emotional Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mood History & Patterns
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily emotional shifts to understand triggers and cultivate lasting mental balance.
          </p>
        </div>

        {/* Bento Quick Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Logs</span>
            <span className="text-lg font-extrabold text-slate-900">{totalLogs}</span>
          </div>
          <div className="px-4 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Dominant Mood</span>
            <span className="text-sm font-bold text-teal-600 truncate max-w-[100px] block">
              {topMood}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Mood Creator (Bento Card) + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Mood Log Form (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Plus className="w-4 h-4" />
                </div>
                <span>Log Current State</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Real-time sync</span>
            </div>

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateMood} className="space-y-4">
              {/* Mood Select Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select your mood:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(MOOD_DEFINITIONS) as MoodType[]).map((moodKey) => {
                    const def = MOOD_DEFINITIONS[moodKey];
                    const isSelected = selectedMood === moodKey;
                    return (
                      <button
                        key={moodKey}
                        type="button"
                        id={`mood-select-${moodKey.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setSelectedMood(moodKey)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500/30 scale-102 shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:border-teal-300'
                        }`}
                      >
                        <span className="text-2xl mb-1">{def.emoji}</span>
                        <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center">
                          {def.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Reflection Note */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Add context / notes (optional):
                </label>
                <textarea
                  id="mood-note-textarea"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What influenced this mood? (e.g. had a good conversation, finished a project, felt tired)..."
                  className="w-full text-xs sm:text-sm p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none transition-all"
                />
              </div>

              <button
                id="submit-mood-entry-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Entry...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Mood Check-In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Mood History List & Filter (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">
                History Timeline ({filteredMoods.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">All Moods</option>
                {Object.keys(MOOD_DEFINITIONS).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
              Loading mood history...
            </div>
          ) : filteredMoods.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
              <Smile className="w-8 h-8 text-teal-600 mx-auto opacity-60" />
              <p className="text-sm font-bold text-slate-900">No mood check-ins found</p>
              <p className="text-xs text-slate-500">
                Log your current feeling using the form to start discovering your wellness patterns.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMoods.map((entry) => {
                const def = MOOD_DEFINITIONS[entry.mood];
                const date = new Date(entry.created_at);

                return (
                  <div
                    key={entry.id || entry.mood_id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                        {def?.emoji || '😐'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">
                            {entry.mood}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {date.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {entry.note ? (
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                            "{entry.note}"
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No note added</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMood(entry.id || entry.mood_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
