import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HeartHandshake,
  Tag,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  addJournalEntry,
  getJournalEntries,
  deleteJournalEntry,
  saveSentimentAnalysis,
  getSentimentAnalyses,
} from '../firebase/firestoreService.ts';
import { analyzeJournalText } from '../services/apiService.ts';
import { JournalEntry, SentimentAnalysis } from '../types.ts';

interface JournalPageProps {
  onOpenCrisisModal: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({ onOpenCrisisModal }) => {
  const { currentUser } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [sentiments, setSentiments] = useState<SentimentAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastAnalysis, setLastAnalysis] = useState<SentimentAnalysis | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const journalingPrompts = [
    'What is one small moment from today that brought you a sense of ease or peace?',
    'What difficult emotion are you holding onto that you would like to release onto the page?',
    'What is something you wish someone would tell you right now? Write it to yourself.',
    'Describe a challenge you faced today and how you showed up for yourself through it.',
  ];

  useEffect(() => {
    if (!currentUser) return;
    loadJournalData();
  }, [currentUser]);

  const loadJournalData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [entries, analyses] = await Promise.all([
        getJournalEntries(currentUser.uid),
        getSentimentAnalyses(currentUser.uid),
      ]);
      setJournals(entries);
      setSentiments(analyses);
    } catch (err: any) {
      console.error('Error loading journal entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser || isSaving) return;

    setIsSaving(true);
    setLastAnalysis(null);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const journalText = content.trim();

      // 1. Save entry to Firestore first
      const savedEntry = await addJournalEntry(currentUser.uid, journalText);
      setJournals((prev) => [savedEntry, ...prev]);

      // 2. Perform sentiment & emotional tone analysis (with try/catch fallback)
      let analysisResult;
      try {
        analysisResult = await analyzeJournalText(journalText);
      } catch (sentimentErr) {
        console.warn('AI Sentiment analysis skipped/fallback:', sentimentErr);
        analysisResult = {
          sentiment: 'Neutral' as const,
          sentimentScore: 0,
          emotionalInsight: 'Your reflection has been safely recorded in your private journal.',
          detectedEmotions: ['Reflective'],
          crisisDetected: false,
        };
      }

      // 3. Store sentiment analysis record in Firestore
      try {
        const savedAnalysis = await saveSentimentAnalysis(
          currentUser.uid,
          savedEntry.journal_id,
          analysisResult.sentiment,
          analysisResult.sentimentScore,
          analysisResult.emotionalInsight,
          analysisResult.detectedEmotions
        );
        setSentiments((prev) => [savedAnalysis, ...prev]);
        setLastAnalysis(savedAnalysis);
      } catch (err) {
        console.error('Error storing sentiment analysis record:', err);
      }

      // Check if crisis was detected
      if (analysisResult.crisisDetected) {
        onOpenCrisisModal();
      }

      setContent('');
      setSelectedPrompt('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving journal entry:', err);
      setSaveError(
        err?.message ||
          'Unable to save journal reflection. Please ensure your Firestore connection is active.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (journalId?: string, docId?: string) => {
    const idToDelete = docId || journalId;
    if (!idToDelete) return;

    if (window.confirm('Are you sure you want to delete this private journal reflection?')) {
      try {
        await deleteJournalEntry(idToDelete);
        setJournals((prev) => prev.filter((j) => j.id !== idToDelete && j.journal_id !== idToDelete));
        setSentiments((prev) => prev.filter((s) => s.journal_id !== journalId));
      } catch (err) {
        console.error('Error deleting journal entry:', err);
      }
    }
  };

  const filteredJournals = journals.filter((entry) => {
    if (!searchQuery.trim()) return true;
    return entry.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 mb-1">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Private Digital Journal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Mindful Reflections
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Express your unfiltered thoughts in complete privacy. Each reflection is automatically accompanied by supportive emotional tone insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Entries</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{journals.length}</span>
          </div>
        </div>
      </div>

      {/* Editor & Prompt Guide Bento Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Write New Reflection</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {content.length} characters
          </span>
        </div>

        {/* Prompt Selector Pills */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Need inspiration? Tap a prompt to begin:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {journalingPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPrompt(p);
                  if (!content.trim()) setContent(`Prompt: ${p}\n\n`);
                }}
                className={`text-xs px-3.5 py-2 rounded-2xl border transition-all text-left ${
                  selectedPrompt === p
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-semibold shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-700 bg-[#F8FAF9] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your journal reflection has been saved securely to Firestore.</span>
          </div>
        )}

        {saveError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveEntry} className="space-y-4">
          <textarea
            id="journal-content-textarea"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write whatever is on your heart and mind without filtering or judging yourself..."
            className="w-full text-xs sm:text-sm p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 leading-relaxed resize-y"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>🔒 Encrypted in Firestore</span>
              <span>•</span>
              <span>AI Emotional Tone Insight on Save</span>
            </div>

            <button
              id="save-journal-entry-btn"
              type="submit"
              disabled={!content.trim() || isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing & Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Journal Entry</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Emotional Insight Feedback Banner on recent save */}
        {lastAnalysis && (
          <div className="p-4 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Sentiment Tone Analyzed: {lastAnalysis.sentiment} (Score: {lastAnalysis.sentiment_score > 0 ? `+${lastAnalysis.sentiment_score}` : lastAnalysis.sentiment_score})
              </span>
              {lastAnalysis.detected_emotions && lastAnalysis.detected_emotions.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {lastAnalysis.detected_emotions.map((em, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full font-bold text-[10px]"
                    >
                      {em}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-teal-800 dark:text-teal-300 leading-relaxed font-medium">
              💡 {lastAnalysis.emotional_insight}
            </p>
          </div>
        )}
      </div>

      {/* Journal History & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Previous Reflections ({filteredJournals.length})</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-full sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Loading your private journal...
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No journal reflections found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No entries matched "${searchQuery}".`
                : 'Write your thoughts above. Every entry helps bring emotional self-clarity.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJournals.map((entry) => {
              const analysis = sentiments.find((s) => s.journal_id === entry.journal_id);
              const date = new Date(entry.created_at);

              return (
                <div
                  key={entry.id || entry.journal_id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {date.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {analysis && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            analysis.sentiment === 'Positive'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              : analysis.sentiment === 'Negative'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {analysis.sentiment} Tone ({analysis.sentiment_score > 0 ? `+${analysis.sentiment_score}` : analysis.sentiment_score})
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteEntry(entry.journal_id, entry.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete journal entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>

                  {/* Sentiment & Insight details */}
                  {analysis && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {analysis.emotional_insight && (
                        <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed font-medium bg-[#F8FAF9] dark:bg-teal-950/30 p-3 rounded-2xl border border-teal-100/60 dark:border-teal-900/40">
                          💡 <strong>Emotional Insight:</strong> {analysis.emotional_insight}
                        </p>
                      )}

                      {analysis.detected_emotions && analysis.detected_emotions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400 mr-1">Felt tones:</span>
                          {analysis.detected_emotions.map((emotion, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-medium"
                            >
                              {emotion}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
