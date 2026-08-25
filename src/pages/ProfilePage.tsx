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
  Sparkles,
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
        <div className="flex items-center gap-2 text-teal-600 mb-1">
          <User className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Account & Safety</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Your Profile & Sanctuary
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your account details, privacy protection, and emergency safety guidelines.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {userProfile?.name?.charAt(0).toUpperCase() ||
              currentUser?.email?.charAt(0).toUpperCase() ||
              'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {userProfile?.name || 'Friend'}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              {currentUser?.email}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Member since {memberSince}
            </p>
          </div>
        </div>

        {/* Account Info Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Mood Logs</span>
            <span className="text-lg font-extrabold text-slate-900">{stats.moods}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Journal Reflections</span>
            <span className="text-lg font-extrabold text-slate-900">{stats.journals}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">AI System</span>
            <span className="text-xs font-bold text-teal-600 flex items-center gap-1 mt-1">
              <Sparkles className="w-3.5 h-3.5" /> Empathetic AI
            </span>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Data Privacy & Security</span>
          </h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All mood entries, voice entries, and reflections are isolated to your authenticated user account.</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Conversations are secured with Cloud Firestore rules and private inference keys.</span>
            </p>
          </div>
        </div>

        {/* Emergency Helplines Quick Action */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <span>Emergency Human Support</span>
          </h3>
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-700">
            <div>
              <p className="font-bold text-rose-900">24/7 Free Helplines in India</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Tele-MANAS: 14416 • Vandrevala Foundation: +91 9999 666 555
              </p>
            </div>
            <button
              onClick={onOpenCrisisModal}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold shadow-xs hover:bg-rose-700 transition-colors whitespace-nowrap"
            >
              Open Helpline Directory
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of MindBridge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
