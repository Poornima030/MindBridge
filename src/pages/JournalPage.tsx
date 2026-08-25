import React, { useState, useEffect, useRef } from 'react';
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
  Tag,
  Search,
  Mic,
  MicOff,
  Volume2,
  Square,
  Flame,
  Play,
  Pause,
  Headphones,
  FileText,
  AudioWaveform,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  addJournalEntry,
  getJournalEntries,
  deleteJournalEntry,
  saveSentimentAnalysis,
  getSentimentAnalyses,
} from '../firebase/firestoreService.ts';
import { analyzeJournalText, understandVoiceAudio } from '../services/apiService.ts';
import { JournalEntry, SentimentAnalysis, JournalAudioAnalysis } from '../types.ts';

interface JournalPageProps {
  onOpenCrisisModal: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({ onOpenCrisisModal }) => {
  const { currentUser } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [sentiments, setSentiments] = useState<SentimentAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form & entry mode states ('text' | 'voice')
  const [entryMode, setEntryMode] = useState<'text' | 'voice'>('text');
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastAnalysis, setLastAnalysis] = useState<SentimentAnalysis | null>(null);
  const [lastAudioInsight, setLastAudioInsight] = useState<JournalAudioAnalysis | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // MediaRecorder Voice State (Captures authentic audio recording)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const journalingPrompts = [
    'What is one small moment from today that brought you a sense of ease or peace? 🌿',
    'What difficult emotion are you holding onto that you would like to release onto the page? 💭',
    'What is something you wish someone would tell you right now? Speak or write it to yourself. 💛',
    'Describe a challenge you faced today and how you showed up for yourself through it. ✨',
  ];

  useEffect(() => {
    if (!currentUser) return;
    loadJournalData();
  }, [currentUser]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

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

  const startVoiceRecording = async () => {
    setVoiceError(null);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setVoiceSeconds(0);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError('Audio recording is not supported in this browser. Please use text journaling.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setVoiceError('Microphone access was denied or not found. Please enable mic permissions.');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping media recorder:', err);
      }
    }
    setIsRecording(false);
  };

  const formatVoiceTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSaveTextEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser || isSaving) return;

    setIsSaving(true);
    setLastAnalysis(null);
    setLastAudioInsight(null);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const journalText = content.trim();

      // 1. Save entry to Firestore
      const savedEntry = await addJournalEntry(currentUser.uid, journalText, {
        entry_type: 'text',
      });
      setJournals((prev) => [savedEntry, ...prev]);

      // 2. Perform sentiment & emotional tone analysis
      let analysisResult;
      try {
        analysisResult = await analyzeJournalText(journalText);
      } catch (sentimentErr) {
        console.warn('AI Sentiment analysis fallback:', sentimentErr);
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

  const handleSaveVoiceEntry = async () => {
    if (!recordedAudioBlob || !currentUser || isSaving) return;

    setIsSaving(true);
    setLastAnalysis(null);
    setLastAudioInsight(null);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. Convert audio blob to base64 for persistent Firestore playback & AI listening
      const audioBase64 = await blobToBase64(recordedAudioBlob);
      const duration = voiceSeconds || 1;

      // 2. Send audio to listen, understand emotions and extract themes
      let audioInsightResult: JournalAudioAnalysis = {
        transcriptSummary: 'Authentic voice reflection audio safely stored in your private journal.',
        emotionalTone: 'Expressive & Authentic',
        detectedThemes: ['Voice Reflection', 'Emotional Release'],
        comfortNote: 'Your spoken words and authentic tone have been safely preserved in your journal.',
      };

      try {
        const audioInsight = await understandVoiceAudio({
          audioBase64,
          mimeType: recordedAudioBlob.type || 'audio/webm',
          durationSeconds: duration,
        });

        audioInsightResult = {
          transcriptSummary: audioInsight.transcriptSummary,
          emotionalTone: audioInsight.emotionalTone,
          detectedThemes: audioInsight.detectedThemes,
          comfortNote: audioInsight.comfortNote,
        };

        if (audioInsight.crisisDetected) {
          onOpenCrisisModal();
        }
      } catch (err) {
        console.warn('Voice listening endpoint fallback:', err);
      }

      // 3. Save voice entry into Firestore with audio recording data & insights
      const savedEntry = await addJournalEntry(
        currentUser.uid,
        `🎙️ [Voice Reflection - ${formatVoiceTime(duration)}]`,
        {
          entry_type: 'voice',
          audio_url: audioBase64,
          audio_duration: duration,
          audio_analysis: audioInsightResult,
        }
      );

      setJournals((prev) => [savedEntry, ...prev]);
      setLastAudioInsight(audioInsightResult);

      // Save corresponding sentiment entry for analytics & chatbot context
      try {
        const savedAnalysis = await saveSentimentAnalysis(
          currentUser.uid,
          savedEntry.journal_id,
          'Neutral',
          0.3,
          audioInsightResult.comfortNote || 'Voice note recorded with empathy and care.',
          audioInsightResult.detectedThemes || ['Voice Reflection']
        );
        setSentiments((prev) => [savedAnalysis, ...prev]);
      } catch (err) {
        console.warn('Could not save sentiment analysis for voice entry:', err);
      }

      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setVoiceSeconds(0);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving voice recording:', err);
      setSaveError(
        err?.message ||
          'Unable to save voice recording. Please check your storage settings.'
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

  const handlePlayAudio = (audioId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingAudioId === audioId && audioElementRef.current) {
      audioElementRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;
    setPlayingAudioId(audioId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setPlayingAudioId(null);
    };

    audio.play().catch((err) => {
      console.warn('Playback blocked or failed:', err);
      setPlayingAudioId(null);
    });
  };

  const filteredJournals = journals.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.content.toLowerCase().includes(q) ||
      entry.audio_analysis?.transcriptSummary?.toLowerCase().includes(q) ||
      entry.audio_analysis?.emotionalTone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Private Digital Journal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mindful Reflections & Voice Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Write or speak your unfiltered thoughts with complete privacy. Your companion listens and connects your reflections seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Entries</span>
            <span className="text-lg font-extrabold text-slate-900">{journals.length}</span>
          </div>
        </div>
      </div>

      {/* Editor & Voice Journal Bento Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              id="journal-mode-text-btn"
              type="button"
              onClick={() => setEntryMode('text')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                entryMode === 'text'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Written Reflection</span>
            </button>

            <button
              id="journal-mode-voice-btn"
              type="button"
              onClick={() => setEntryMode('voice')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                entryMode === 'voice'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note Journal</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {entryMode === 'text' ? `${content.length} characters` : 'Audio voice recording'}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {entryMode === 'voice'
                ? 'Your voice recording has been saved to your journal vault.'
                : 'Your journal reflection has been saved securely to your journal.'}
            </span>
          </div>
        )}

        {saveError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* MODE 1: TEXT REFLECTION */}
        {entryMode === 'text' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Prompt Selector Pills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
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
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveTextEntry} className="space-y-4">
              <textarea
                id="journal-content-textarea"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write whatever is on your heart and mind without filtering or judging yourself..."
                className="w-full text-xs sm:text-sm p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white leading-relaxed resize-y font-normal transition-all"
              />

              <div className="flex justify-end pt-1">
                <button
                  id="save-journal-entry-btn"
                  type="submit"
                  disabled={!content.trim() || isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Reflection...</span>
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
          </div>
        )}

        {/* MODE 2: VOICE NOTE JOURNALING */}
        {entryMode === 'voice' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
              {!isRecording && !recordedAudioBlob && (
                <>
                  <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-sm font-bold text-slate-900">
                      Record a Voice Note Journal
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      No need for typing or transcribing. Just tap record, speak what you feel, and your audio note will be safely kept in your journal.
                    </p>
                  </div>

                  <button
                    id="start-voice-recording-btn"
                    type="button"
                    onClick={startVoiceRecording}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Recording Audio</span>
                  </button>
                </>
              )}

              {/* Active Recording State */}
              {isRecording && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-base font-extrabold text-slate-900 tracking-wider">
                      {formatVoiceTime(voiceSeconds)}
                    </span>
                  </div>

                  {/* Audio Waveform visualization */}
                  <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                    {[12, 28, 44, 18, 36, 48, 24, 40, 16, 32, 48, 20, 36, 14].map((h, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-teal-600 rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(8, (h * ((i % 3) + 1)) % 40)}px`,
                          animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-teal-800">
                    Recording your voice note... Speak freely and authentically.
                  </p>

                  <button
                    id="stop-voice-recording-btn"
                    type="button"
                    onClick={stopVoiceRecording}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-md active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                </div>
              )}

              {/* Audio Recorded Preview & Save State */}
              {!isRecording && recordedAudioBlob && recordedAudioUrl && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 py-1.5 px-4 rounded-full border border-teal-200 inline-block mx-auto">
                    <Headphones className="w-3.5 h-3.5 inline" /> Audio Ready ({formatVoiceTime(voiceSeconds)})
                  </div>

                  {/* HTML5 Audio Player */}
                  <div className="w-full max-w-md mx-auto">
                    <audio src={recordedAudioUrl} controls className="w-full rounded-xl" />
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all shadow-xs"
                    >
                      Re-record
                    </button>

                    <button
                      id="save-voice-recording-btn"
                      type="button"
                      onClick={handleSaveVoiceEntry}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Reflection...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save Voice Note to Journal</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {voiceError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{voiceError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Emotional Insight Feedback Banner on recent text save */}
        {lastAnalysis && (
          <div className="p-4 rounded-3xl bg-teal-50/70 border border-teal-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Sentiment Tone Analyzed: <strong className="text-teal-700">{lastAnalysis.sentiment}</strong>
              </span>
              {lastAnalysis.detected_emotions && lastAnalysis.detected_emotions.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {lastAnalysis.detected_emotions.map((em, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-bold text-[10px]"
                    >
                      {em}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-teal-900 leading-relaxed font-medium">
              💡 {lastAnalysis.emotional_insight}
            </p>
          </div>
        )}

        {/* Live Audio Insight Feedback Banner on recent voice save */}
        {lastAudioInsight && (
          <div className="p-4 rounded-3xl bg-teal-50/70 border border-teal-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Audio Reflection Recorded: <strong className="text-teal-700">{lastAudioInsight.emotionalTone}</strong>
              </span>
              {lastAudioInsight.detectedThemes && (
                <div className="flex gap-1.5 flex-wrap">
                  {lastAudioInsight.detectedThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-bold text-[10px]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-teal-900 leading-relaxed font-medium">
              🎧 {lastAudioInsight.comfortNote}
            </p>
          </div>
        )}
      </div>

      {/* Journal History & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
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
              className="text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-full sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
            Loading your private journal...
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <BookOpen className="w-8 h-8 text-teal-600 mx-auto opacity-60" />
            <p className="text-sm font-bold text-slate-900">
              No journal reflections found
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No entries matched "${searchQuery}".`
                : 'Write a reflection or record a voice note above. Every entry helps bring emotional self-clarity.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJournals.map((entry) => {
              const analysis = sentiments.find((s) => s.journal_id === entry.journal_id);
              const date = new Date(entry.created_at);
              const isVoiceEntry = entry.entry_type === 'voice' || Boolean(entry.audio_url);
              const isPlaying = playingAudioId === (entry.id || entry.journal_id);

              return (
                <div
                  key={entry.id || entry.journal_id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
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
                      {isVoiceEntry && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <Mic className="w-3 h-3" /> Voice Note {entry.audio_duration ? `(${formatVoiceTime(entry.audio_duration)})` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {analysis && !isVoiceEntry && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            analysis.sentiment === 'Positive'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : analysis.sentiment === 'Negative'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {analysis.sentiment} Tone
                        </span>
                      )}
                      {isVoiceEntry && entry.audio_analysis?.emotionalTone && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          Tone: {entry.audio_analysis.emotionalTone}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteEntry(entry.journal_id, entry.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
                        title="Delete journal entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* VOICE ENTRY PLAYBACK & SUMMARY CARD */}
                  {isVoiceEntry ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {entry.audio_url ? (
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(entry.id || entry.journal_id, entry.audio_url)}
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                                isPlaying
                                  ? 'bg-teal-600 text-white shadow-md'
                                  : 'bg-white border border-slate-200 text-teal-700 hover:bg-teal-50'
                              }`}
                            >
                              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500">
                              <Mic className="w-4 h-4" />
                            </div>
                          )}

                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              Recorded Voice Reflection
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {entry.audio_duration ? `${formatVoiceTime(entry.audio_duration)} duration • ` : ''}
                              {isPlaying ? 'Playing audio...' : 'Tap to play audio recording'}
                            </span>
                          </div>
                        </div>

                        {entry.audio_url && (
                          <span className="text-xs text-teal-600 font-bold hidden sm:inline">
                            🔊 Audio Stored
                          </span>
                        )}
                      </div>

                      {/* Audio Insight */}
                      {entry.audio_analysis && (
                        <div className="pt-2 border-t border-slate-200 text-xs space-y-1.5">
                          {entry.audio_analysis.comfortNote && (
                            <p className="text-slate-700 leading-relaxed font-medium">
                              💡 <strong>Reflection Note:</strong> {entry.audio_analysis.comfortNote}
                            </p>
                          )}
                          {entry.audio_analysis.detectedThemes && entry.audio_analysis.detectedThemes.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <Tag className="w-3 h-3 text-teal-600" />
                              {entry.audio_analysis.detectedThemes.map((th, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[10px] font-semibold"
                                >
                                  {th}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* TEXT ENTRY CONTENT */
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </p>
                  )}

                  {/* Sentiment & Insight details for text */}
                  {analysis && !isVoiceEntry && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {analysis.emotional_insight && (
                        <p className="text-xs text-teal-900 leading-relaxed font-medium bg-teal-50/60 p-3 rounded-2xl border border-teal-200">
                          💡 <strong>Emotional Insight:</strong> {analysis.emotional_insight}
                        </p>
                      )}

                      {analysis.detected_emotions && analysis.detected_emotions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="w-3 h-3 text-teal-600" />
                          <span className="text-[10px] text-slate-400 mr-1">Felt tones:</span>
                          {analysis.detected_emotions.map((emotion, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-semibold"
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
