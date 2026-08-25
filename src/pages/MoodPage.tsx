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
    return acc;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <Smile className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Emotional Self-Awareness
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Daily Mood Tracker
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Check in with yourself daily. Naming and acknowledging emotions builds emotional resilience.
          </p>
        </div>

        {/* Bento Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Logs</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{totalLogs}</span>
          </div>
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Emotion</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[110px] block">
              {topMood}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Logging Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Logger Bento Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Record New Check-in</span>
          </h2>

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateMood} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select Your Core Emotion:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(MOOD_DEFINITIONS) as MoodType[]).map((moodKey) => {
                  const def = MOOD_DEFINITIONS[moodKey];
                  const isSelected = selectedMood === moodKey;
                  return (
                    <button
                      key={moodKey}
                      type="button"
                      id={`mood-select-${moodKey.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedMood(moodKey)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30 scale-102 shadow-xs'
                          : 'border-slate-100 dark:border-slate-800 bg-[#F8FAF9] dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl mb-1">{def.emoji}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {def.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Mood explanation */}
              <div className="mt-3 p-3.5 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-lg">{MOOD_DEFINITIONS[selectedMood].emoji}</span>
                <span>
                  <strong>{selectedMood}:</strong> {MOOD_DEFINITIONS[selectedMood].description}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contextual Note (Optional)
              </label>
              <textarea
                id="mood-note-input"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What contributed to how you feel? (e.g., Finished a long project, peaceful coffee with a friend...)"
                className="w-full text-xs p-3 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <button
              id="submit-mood-entry-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Today's Mood</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span>Mood Timeline ({filteredMoods.length})</span>
            </h2>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="mood-filter-select"
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Moods</option>
                {(Object.keys(MOOD_DEFINITIONS) as MoodType[]).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Loading mood history...
            </div>
          ) : filteredMoods.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Smile className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No mood check-ins found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {filterMood !== 'all'
                  ? `You haven't logged any "${filterMood}" moods yet.`
                  : 'Start tracking your emotional trajectory by recording your first mood on the left.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMoods.map((entry) => {
                const config = MOOD_DEFINITIONS[entry.mood] || MOOD_DEFINITIONS['Neutral'];
                const entryDate = new Date(entry.created_at);

                return (
                  <div
                    key={entry.id || entry.mood_id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-700 shrink-0">
                        {config.emoji}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${config.textColor}`}>
                            {entry.mood}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entryDate.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {entry.note ? (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            "{entry.note}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No notes attached</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMood(entry.id || entry.mood_id)}
                      className="p-2 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
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
