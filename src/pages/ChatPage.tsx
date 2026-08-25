import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  PhoneCall,
  AlertTriangle,
  HeartHandshake,
  CornerDownLeft,
  RefreshCw,
  Sliders,
  Smile,
  Zap,
  Volume2,
  Heart,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getChatHistory,
  saveChatMessage,
  clearUserChatHistory,
  getMoodEntries,
  getJournalEntries,
  getSentimentAnalyses,
  updateUserPersona,
} from '../firebase/firestoreService.ts';
import { sendChatMessage } from '../services/apiService.ts';
import {
  ChatMessage,
  BotPersonaConfig,
  DEFAULT_BOT_PERSONA,
  UserEmotionalContext,
} from '../types.ts';

interface ChatPageProps {
  onOpenCrisisModal: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onOpenCrisisModal }) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  // Persona Customization State
  const [showPersonaModal, setShowPersonaModal] = useState<boolean>(false);
  const [persona, setPersona] = useState<BotPersonaConfig>(() => {
    try {
      const cached = localStorage.getItem('mindbridge_bot_persona');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // ignore
    }
    return userProfile?.persona_settings || DEFAULT_BOT_PERSONA;
  });

  const [savingPersona, setSavingPersona] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadHistory();
    if (userProfile?.persona_settings) {
      setPersona(userProfile.persona_settings);
      localStorage.setItem('mindbridge_bot_persona', JSON.stringify(userProfile.persona_settings));
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    if (!currentUser) return;
    setInitialLoading(true);
    try {
      const history = await getChatHistory(currentUser.uid);
      setMessages(history);
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const savePersonaSettings = async (newPersona: BotPersonaConfig) => {
    setPersona(newPersona);
    localStorage.setItem('mindbridge_bot_persona', JSON.stringify(newPersona));
    if (currentUser) {
      try {
        setSavingPersona(true);
        await updateUserPersona(currentUser.uid, newPersona);
      } catch (err) {
        console.warn('Failed to sync persona to Firestore:', err);
      } finally {
        setSavingPersona(false);
      }
    }
    setShowPersonaModal(false);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !currentUser || loading) return;

    const userMsg = text.trim();
    setInputText('');
    setError(null);
    setLoading(true);

    // Prepare history for API context
    const historyPayload = messages.flatMap((m) => [
      { role: 'user' as const, text: m.user_message },
      { role: 'model' as const, text: m.ai_response },
    ]);

    // Build comprehensive user context (Mood logs + Journal reflections)
    let userContext: UserEmotionalContext | undefined;
    try {
      const [moods, journals, sentiments] = await Promise.all([
        getMoodEntries(currentUser.uid),
        getJournalEntries(currentUser.uid),
        getSentimentAnalyses(currentUser.uid),
      ]);

      const recentMoods = moods.slice(0, 5).map((m) => ({
        mood: m.mood,
        note: m.note,
        created_at: m.created_at,
      }));

      const recentJournals = journals.slice(0, 4).map((j) => {
        const sentiment = sentiments.find((s) => s.journal_id === j.journal_id);
        const isVoice = j.entry_type === 'voice' || Boolean(j.audio_url);
        const snippet = isVoice
          ? `[Voice Note (${j.audio_duration ? `${j.audio_duration}s` : 'audio'})]: ${
              j.audio_analysis?.transcriptSummary || j.audio_analysis?.comfortNote || j.content
            } (Tone: ${j.audio_analysis?.emotionalTone || 'Spoken Reflection'})`
          : j.content.slice(0, 150);

        const emotions = isVoice
          ? j.audio_analysis?.detectedThemes || ['Voice Reflection']
          : sentiment?.detected_emotions;

        return {
          snippet,
          created_at: j.created_at,
          sentiment: isVoice ? j.audio_analysis?.emotionalTone || 'Expressive' : sentiment?.sentiment,
          emotions,
        };
      });

      // Calculate dominant mood & average score if available
      let dominantMood: string | undefined;
      let averageScore: number | undefined;

      if (moods.length > 0) {
        const moodCounts: Record<string, number> = {};
        moods.slice(0, 10).forEach((m) => {
          moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
        });
        dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      }

      userContext = {
        recentMoods,
        recentJournals,
        moodSummary: {
          dominantMood,
          averageScore,
          totalLogs: moods.length,
        },
      };
    } catch (ctxErr) {
      console.warn('Could not bundle holistic emotional context:', ctxErr);
    }

    try {
      const result = await sendChatMessage({
        message: userMsg,
        history: historyPayload,
        userName: userProfile?.name || 'Friend',
        persona,
        userContext,
      });

      // Save to Firestore with graceful fallback
      let savedMsg: ChatMessage;
      try {
        savedMsg = await saveChatMessage(
          currentUser.uid,
          userMsg,
          result.reply,
          result.crisisInfo?.isCrisisDetected
            ? {
                isCrisisDetected: result.crisisInfo.isCrisisDetected,
                severity: result.crisisInfo.severity,
                message: result.crisisInfo.message,
              }
            : undefined
        );
      } catch (saveErr: any) {
        console.warn('Could not persist chat message to Firestore:', saveErr);
        savedMsg = {
          id: `local_${Date.now()}`,
          chat_id: `chat_${Date.now()}`,
          user_id: currentUser.uid,
          user_message: userMsg,
          ai_response: result.reply,
          created_at: new Date().toISOString(),
          crisis_info: result.crisisInfo,
        };
      }

      setMessages((prev) => [...prev, savedMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(
        err.message ||
          'Failed to receive companion response. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const executeClearHistory = async () => {
    if (!currentUser) {
      setMessages([]);
      setShowClearConfirm(false);
      return;
    }
    try {
      setClearing(true);
      await clearUserChatHistory(currentUser.uid);
      setMessages([]);
      setShowClearConfirm(false);
    } catch (err: any) {
      console.error('Failed to clear history from Firestore:', err);
      setMessages([]);
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  };

  const samplePrompts = [
    'Hey, I had a super exhausting day and just want to vent a bit ☕',
    'I am feeling a little anxious about something that happened today 🥺',
    'Can we talk through a negative thought I cannot get out of my head? 💭',
    'Just checking in! What are some quick ways to cheer myself up right now? ✨',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col justify-between animate-in fade-in duration-200">
      {/* Top Chat Header Bar */}
      <div className="bg-white rounded-3xl px-5 py-3.5 border border-slate-200 shadow-xs flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {persona.botName || 'MindBridge Buddy'}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                Empathetic AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {persona.communicationStyle === 'bestie'
                ? 'Bestie vibe 🤗'
                : persona.communicationStyle === 'listener'
                ? 'Gentle listener 🧘'
                : persona.communicationStyle === 'mentor'
                ? 'Mindful mentor 🌿'
                : 'Direct & motivating ⚡'}{' '}
              • Context-aware with your journals & moods
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Customize Persona Button */}
          <button
            id="customize-persona-btn"
            onClick={() => setShowPersonaModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-xl border border-slate-200 hover:border-teal-300 transition-all shadow-xs"
            title="Customize Buddy Personality"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Customize Buddy</span>
          </button>

          <button
            id="clear-chat-history-btn"
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {initialLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-teal-600" />
            Opening your safe conversation space...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              Hey there! {persona.botName || 'Your Buddy'} is Here 🤗
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              I know your recent mood logs and reflections, and I'm here to listen, validate, or chat whenever you need. Say hey or tap a starter below! ✨
            </p>

            <div className="w-full space-y-2 text-left">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-xs p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-left block shadow-xs"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} className="space-y-3">
              {/* User message */}
              <div className="flex items-start justify-end gap-2.5 pl-10">
                <div className="bg-teal-600 text-white rounded-3xl rounded-tr-xs px-4 py-3 text-xs sm:text-sm max-w-lg shadow-xs leading-relaxed">
                  <p className="whitespace-pre-wrap">{msg.user_message}</p>
                </div>
                <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Companion response */}
              <div className="flex items-start justify-start gap-2.5 pr-10">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm max-w-xl shadow-xs leading-relaxed space-y-2">
                  <p className="whitespace-pre-wrap">{msg.ai_response}</p>

                  {/* Crisis Resources Callout if flagged */}
                  {msg.crisis_info?.isCrisisDetected && (
                    <div className="pt-2 border-t border-rose-100 mt-2 text-xs text-rose-700 flex items-start gap-2 font-medium bg-rose-50/70 p-2.5 rounded-2xl border border-rose-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <div className="space-y-1">
                        <p className="font-bold text-rose-900">Need immediate human support?</p>
                        <p className="text-[11px] text-slate-600">
                          Free, confidential 24/7 help in India: Tele-MANAS (<strong>14416</strong>) or Vandrevala Foundation (<strong>+91 9999 666 555</strong>).
                        </p>
                        <button
                          onClick={onOpenCrisisModal}
                          className="text-[11px] font-bold text-rose-600 underline hover:text-rose-800"
                        >
                          View Full Crisis Directory →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading typing bubble */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.3s]" />
              <span className="ml-1 text-[11px] font-semibold text-slate-500">
                {persona.botName || 'Buddy'} is typing...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="bg-white rounded-3xl p-2.5 sm:p-3 border border-slate-200 shadow-sm space-y-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            id="chat-user-input"
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Talk to ${persona.botName || 'your buddy'} (Enter to send, Shift+Enter for new line)...`}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none leading-relaxed transition-all"
          />

          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>Emotional reflection companion • Thoughtful & responsive</span>
          <span className="font-semibold text-teal-600">🔒 Private & Confidential</span>
        </div>
      </div>

      {/* Custom Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                Clear Chat History?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will delete your past conversation messages from this device and Cloud Firestore.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                id="cancel-clear-history-btn"
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-clear-history-btn"
                type="button"
                onClick={executeClearHistory}
                disabled={clearing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Clear</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Persona Customization Modal */}
      {showPersonaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Customize Chatbot Characteristics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tune humor, style, advice mode, and vibe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPersonaModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Bot Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Companion Nickname
              </label>
              <input
                type="text"
                value={persona.botName}
                onChange={(e) => setPersona({ ...persona, botName: e.target.value })}
                placeholder="e.g. MindBridge Buddy, Misty, Sage, Sunny..."
                className="w-full text-xs sm:text-sm p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Humor Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Humor & Wit Level</span>
                <span className="text-teal-600 font-semibold text-[11px]">
                  {persona.humorLevel === 'none'
                    ? 'Gentle & Serene (No jokes)'
                    : persona.humorLevel === 'subtle'
                    ? 'Warm & Subtle Smiles'
                    : 'High / Witty & Fun ✨'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Gentle / None', desc: 'Serene & calm' },
                  { id: 'subtle', label: 'Subtle Warmth', desc: 'Lighthearted' },
                  { id: 'high', label: 'Witty & Fun', desc: 'Playful & funny' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setPersona({ ...persona, humorLevel: item.id as any })
                    }
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      persona.humorLevel === item.id
                        ? 'border-teal-600 bg-teal-50/70 text-teal-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="block text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Communication Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Personality & Communication Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'bestie',
                    title: 'Warm Bestie 🤗',
                    desc: 'Caring, relatable, like your closest friend texting back',
                  },
                  {
                    id: 'listener',
                    title: 'Gentle Listener 🧘',
                    desc: 'Deeply calm, peaceful, mirrors feelings with quiet care',
                  },
                  {
                    id: 'mentor',
                    title: 'Mindful Mentor 🌿',
                    desc: 'Wise, thoughtful reflections with philosophical grounding',
                  },
                  {
                    id: 'direct',
                    title: 'Direct & Motivating ⚡',
                    desc: 'Clear, encouraging, actionable clarity and high energy',
                  },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      setPersona({ ...persona, communicationStyle: st.id as any })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      persona.communicationStyle === st.id
                        ? 'border-teal-600 bg-teal-50/70 text-teal-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">{st.title}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{st.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advice Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Advice & Support Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'listen', title: 'Just Listen 🫂', desc: 'No unsolicited advice' },
                  { id: 'balanced', title: 'Balanced ⚖️', desc: 'Validation + reflection' },
                  { id: 'action', title: 'Action Steps 🎯', desc: 'Practical micro-tasks' },
                ].map((adv) => (
                  <button
                    key={adv.id}
                    type="button"
                    onClick={() =>
                      setPersona({ ...persona, adviceMode: adv.id as any })
                    }
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      persona.adviceMode === adv.id
                        ? 'border-teal-600 bg-teal-50/70 text-teal-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">{adv.title}</span>
                    <span className="block text-[10px] text-slate-400">{adv.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Emoji Expressiveness
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'minimal', title: 'Minimal ✨', desc: 'Rare emojis' },
                  { id: 'moderate', title: 'Sweet 🌸', desc: '1-2 comforting emojis' },
                  { id: 'expressive', title: 'Expressive 🤗💖', desc: 'Fun & lively vibe' },
                ].map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() =>
                      setPersona({ ...persona, emojiLevel: em.id as any })
                    }
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      persona.emojiLevel === em.id
                        ? 'border-teal-600 bg-teal-50/70 text-teal-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">{em.title}</span>
                    <span className="block text-[10px] text-slate-400">{em.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPersona(DEFAULT_BOT_PERSONA)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => savePersonaSettings(persona)}
                disabled={savingPersona}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {savingPersona ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Personality</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
