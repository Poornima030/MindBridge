import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  Heart,
  Calendar,
  LogOut,
  PhoneCall,
  KeyRound,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { getMoodEntries, getJournalEntries } from '../firebase/firestoreService.ts';

interface ProfilePageProps {
  onOpenCrisisModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenCrisisModal }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [stats, setStats] = useState<{ moods: number; journals: number }>({
    moods: 0,
    journals: 0,
  });

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      getMoodEntries(currentUser.uid),
      getJournalEntries(currentUser.uid),
    ]).then(([m, j]) => {
      setStats({ moods: m.length, journals: j.length });
    });
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const memberSince = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <User className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Account & Safety</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Your Profile
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review your account details, privacy protection, and emergency safety guidelines.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {userProfile?.name?.charAt(0).toUpperCase() ||
              currentUser?.email?.charAt(0).toUpperCase() ||
              'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {userProfile?.name || 'Friend'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {currentUser?.email}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              Member since {memberSince}
            </p>
          </div>
        </div>

        {/* Account Info Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Firebase UID</span>
            <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate block mt-0.5">
              {currentUser?.uid}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Mood Logs</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {stats.moods}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Journal Reflections</span>
            <span className="text-base font-bold text-teal-600 dark:text-teal-400 block mt-0.5">
              {stats.journals}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy & Security Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Privacy & Data Security Policy
          </h2>
        </div>
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Private Data Isolation:</strong> Your mood entries, journal logs, and chat records are scoped strictly to your unique Firebase UID via Firestore security rules.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Secure Server Processing:</strong> Gemini AI queries and sentiment evaluations execute server-side; API keys are never exposed in browser code.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Non-Diagnostic Commitment:</strong> MindBridge is an emotional reflection companion and educational wellness platform, not a healthcare provider.
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Resources Quick Access */}
      <div className="bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <PhoneCall className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Crisis Helplines & Immediate Resources
            </h2>
          </div>
          <button
            onClick={onOpenCrisisModal}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Open 24/7 Directory
          </button>
        </div>
        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
          If you are experiencing severe emotional pain or suicidal thoughts, help is free, confidential, and available 24/7:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/50">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
              988 Suicide & Crisis Lifeline
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-mono text-xs font-bold block mt-1">
              Call or Text 988 (US & Canada)
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/50">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
              Crisis Text Line
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-mono text-xs font-bold block mt-1">
              Text HOME to 741741
            </span>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-4 flex justify-end">
        <button
          id="profile-logout-btn"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of MindBridge</span>
        </button>
      </div>
    </div>
  );
};
