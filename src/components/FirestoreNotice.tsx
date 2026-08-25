import React, { useState, useEffect } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, X, Database } from 'lucide-react';

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Mood entries
    match /mood_entries/{entryId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    // Journal entries
    match /journal_entries/{journalId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    // Sentiment analysis entries
    match /sentiment_analysis/{analysisId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    // Chat history
    match /chat_history/{chatId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
  }
}`;

export function FirestoreNotice() {
  const [show, setShow] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const handlePermissionError = () => {
      setShow(true);
    };

    window.addEventListener('firestore-permission-denied', handlePermissionError);
    return () => {
      window.removeEventListener('firestore-permission-denied', handlePermissionError);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  if (!show) return null;

  return (
    <div
      id="firestore-permission-banner"
      className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 text-xs shadow-xs animate-in slide-in-from-top-2 duration-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Firestore Rules Setup Needed</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-medium">
                Action Required in Firebase Console
              </span>
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Your Firestore database is currently rejecting read/writes due to default locked security rules. Paste the security rules in your Firebase Console to activate full data persistence.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
          <button
            id="expand-rules-snippet-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide Rules' : 'View Rules'}</span>
          </button>

          <button
            id="copy-firestore-rules-btn"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Rules!' : 'Copy Rules'}</span>
          </button>

          <a
            id="open-firebase-console-rules-link"
            href="https://console.firebase.google.com/project/mindbridge-4ab02/firestore/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>Firebase Rules Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            id="dismiss-firestore-notice-btn"
            onClick={() => setShow(false)}
            className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-md"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto relative">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
            <span>firestore.rules (Paste into Firebase Console &gt; Firestore Database &gt; Rules)</span>
            <button
              onClick={handleCopy}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="whitespace-pre">{FIRESTORE_RULES_SNIPPET}</pre>
        </div>
      )}
    </div>
  );
}
