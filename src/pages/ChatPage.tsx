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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getChatHistory,
  saveChatMessage,
  clearUserChatHistory,
} from '../firebase/firestoreService.ts';
import { sendChatMessage } from '../services/apiService.ts';
import { ChatMessage } from '../types.ts';

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadHistory();
  }, [currentUser]);

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

    try {
      const result = await sendChatMessage({
        message: userMsg,
        history: historyPayload,
        userName: userProfile?.name || 'Friend',
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
        // Retain message in state so user chat experience is smooth
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
      // Still clear local view to respect user privacy
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
              MindBridge AI Companion
            </h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              Active Listening • Non-Diagnostic • Private
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              id="clear-chat-history-btn"
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Clear History</span>
            </button>
          )}
          <button
            onClick={onOpenCrisisModal}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-xs font-bold flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Crisis Help</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        id="chat-messages-container"
        className="flex-1 overflow-y-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-inner"
      >
        {initialLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
            Loading conversations...
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base mb-1">
              Hey there! Your Buddy is Here 🤗
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              I'm your safe, friendly space to chat, vent, or share whatever is on your mind today. Say hey or tap one of the starters below! ✨
            </p>

            <div className="w-full space-y-2 text-left">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left shadow-xs"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          messages.map((msg, index) => (
            <div key={msg.id || index} className="space-y-4">
              {/* User Bubble */}
              <div className="flex items-start justify-end gap-2.5">
                <div className="max-w-[85%] sm:max-w-[75%] bg-emerald-600 text-white rounded-3xl rounded-tr-xs p-4 shadow-sm">
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-normal">
                    {msg.user_message}
                  </p>
                  <span className="block text-[10px] text-emerald-200 text-right mt-1.5 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>

              {/* AI Bubble */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                  <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl rounded-tl-xs p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.ai_response}
                    </p>
                    <span className="block text-[10px] text-slate-400 text-left mt-2 font-medium">
                      MindBridge • {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Crisis Alert Banner inside chat if triggered */}
                  {msg.crisis_info?.isCrisisDetected && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Supportive Emergency Notice</span>
                      </div>
                      <p className="leading-relaxed">
                        {msg.crisis_info.message ||
                          'Please remember you are not alone. There is compassionate, free, 24/7 human support waiting to listen.'}
                      </p>
                      <button
                        onClick={onOpenCrisisModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-xs"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>View 24/7 Lifelines & Text Support</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2.5 text-slate-400 text-xs pl-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-500" />
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">
                Reflecting empathetically...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mt-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className="mt-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 shadow-xs">
        <div className="flex items-end gap-2">
          <textarea
            id="chat-input-textarea"
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what you are feeling or experiencing right now..."
            disabled={loading}
            className="flex-1 text-xs sm:text-sm bg-transparent border-0 resize-none focus:outline-hidden focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-2 py-1 leading-relaxed"
          />
          <button
            id="chat-send-message-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Encrypted & Confidential</span>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Clear Chat History?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will delete your past conversation messages from this device and Cloud Firestore.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                id="cancel-clear-history-btn"
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
    </div>
  );
};
