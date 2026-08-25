import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DisclaimerBanner } from './components/DisclaimerBanner.tsx';
import { FirestoreNotice } from './components/FirestoreNotice.tsx';
import { CrisisModal } from './components/CrisisModal.tsx';
import { BreathingExerciseModal } from './components/BreathingExerciseModal.tsx';
import { GroundingToolModal } from './components/GroundingToolModal.tsx';

import { AuthPage } from './pages/AuthPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ChatPage } from './pages/ChatPage.tsx';
import { MoodPage } from './pages/MoodPage.tsx';
import { JournalPage } from './pages/JournalPage.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { RecommendationsPage } from './pages/RecommendationsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { Heart, RefreshCw } from 'lucide-react';

function MainAppContent() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal states
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState<boolean>(false);
  const [breathingInitialType, setBreathingInitialType] = useState<
    'breathing-box' | 'breathing-478' | undefined
  >(undefined);
  const [isGroundingModalOpen, setIsGroundingModalOpen] = useState<boolean>(false);

  const handleOpenBreathingModal = (type?: 'breathing-box' | 'breathing-478') => {
    setBreathingInitialType(type);
    setIsBreathingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg mb-4 animate-bounce">
          <Heart className="w-7 h-7 fill-white/30" />
        </div>
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Opening MindBridge safe space...</span>
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
        <DisclaimerBanner onOpenCrisisModal={() => setIsCrisisModalOpen(true)} />
        <main className="flex-1">
          <AuthPage />
        </main>
        <CrisisModal
          isOpen={isCrisisModalOpen}
          onClose={() => setIsCrisisModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Professional Disclaimer */}
      <DisclaimerBanner onOpenCrisisModal={() => setIsCrisisModalOpen(true)} />
      {/* Firestore Permissions Notification (if rules locked) */}
      <FirestoreNotice />

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
        onOpenBreathingModal={() => handleOpenBreathingModal('breathing-box')}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenBreathingModal={handleOpenBreathingModal}
            onOpenGroundingModal={() => setIsGroundingModalOpen(true)}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPage onOpenCrisisModal={() => setIsCrisisModalOpen(true)} />
        )}
        {activeTab === 'mood' && <MoodPage />}
        {activeTab === 'journal' && (
          <JournalPage onOpenCrisisModal={() => setIsCrisisModalOpen(true)} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsPage onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsPage
            onOpenBreathingModal={handleOpenBreathingModal}
            onOpenGroundingModal={() => setIsGroundingModalOpen(true)}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'profile' && (
          <ProfilePage onOpenCrisisModal={() => setIsCrisisModalOpen(true)} />
        )}
      </main>

      {/* Modals */}
      <CrisisModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
      />
      <BreathingExerciseModal
        isOpen={isBreathingModalOpen}
        onClose={() => setIsBreathingModalOpen(false)}
        initialType={breathingInitialType}
      />
      <GroundingToolModal
        isOpen={isGroundingModalOpen}
        onClose={() => setIsGroundingModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
