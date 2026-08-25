import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wind,
  Flower2,
  BookOpen,
  Heart,
  Moon,
  Footprints,
  Play,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { getMoodEntries, getSentimentAnalyses } from '../firebase/firestoreService.ts';
import { fetchPersonalizedRecommendations } from '../services/apiService.ts';
import { WellnessRecommendation } from '../types.ts';

interface RecommendationsPageProps {
  onOpenBreathingModal: (type?: 'breathing-box' | 'breathing-478') => void;
  onOpenGroundingModal: () => void;
  onNavigate: (tab: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onOpenBreathingModal,
  onOpenGroundingModal,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<WellnessRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeStepModal, setActiveStepModal] = useState<WellnessRecommendation | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [currentUser]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      let recentMoods: string[] = [];
      let recentSentiments: string[] = [];

      if (currentUser) {
        const [moods, sentiments] = await Promise.all([
          getMoodEntries(currentUser.uid),
          getSentimentAnalyses(currentUser.uid),
        ]);
        recentMoods = moods.slice(0, 5).map((m) => m.mood);
        recentSentiments = sentiments.slice(0, 5).map((s) => s.sentiment);
      }

      const recs = await fetchPersonalizedRecommendations(recentMoods, recentSentiments);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Breathing', 'Mindfulness', 'Movement', 'Journaling', 'Connection', 'Rest'];

  const filteredRecs =
    selectedCategory === 'all'
      ? recommendations
      : recommendations.filter((r) => r.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Breathing':
        return <Wind className="w-5 h-5 text-emerald-500" />;
      case 'Mindfulness':
        return <Flower2 className="w-5 h-5 text-teal-500" />;
      case 'Movement':
        return <Footprints className="w-5 h-5 text-amber-500" />;
      case 'Journaling':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'Connection':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Rest':
        return <Moon className="w-5 h-5 text-indigo-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
    }
  };

  const handleAction = (rec: WellnessRecommendation) => {
    if (rec.actionType === 'breathing-box') {
      onOpenBreathingModal('breathing-box');
    } else if (rec.actionType === 'breathing-478') {
      onOpenBreathingModal('breathing-478');
    } else if (rec.actionType === 'grounding-54321') {
      onOpenGroundingModal();
    } else if (rec.actionType === 'journal') {
      onNavigate('journal');
    } else if (rec.actionType === 'chat') {
      onNavigate('chat');
    } else {
      setActiveStepModal(rec);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Personalized Coping & Micro-Practices
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Wellness Toolkit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Evidence-informed micro-habits, breathwork pacers, and mindfulness tools adapted to your recent emotional logs.
          </p>
        </div>

        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-[#F8FAF9] shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Practices</span>
        </button>
      </div>

      {/* Category Bento Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Practices' : cat}
          </button>
        ))}
      </div>

      {/* Featured Interactive Bento Hero Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Box Breathing Launcher */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-7 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
              <Wind className="w-4 h-4" />
              <span>Interactive Breathwork</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">4x4 Box & 4-7-8 Breathing Pacer</h3>
            <p className="text-xs text-emerald-50/90 mt-2 leading-relaxed max-w-md">
              Launch our calming visual breathing guide to smooth your autonomic nervous system in under 3 minutes.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-emerald-100 bg-white/10 px-3 py-1 rounded-full">⏱️ 3-4 Minutes</span>
            <button
              id="launch-breathwork-pacer-btn"
              onClick={() => onOpenBreathingModal('breathing-box')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open Breathing Pacer</span>
            </button>
          </div>
        </div>

        {/* Tool 2: 5-4-3-2-1 Grounding Launcher */}
        <div className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-3xl p-7 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-teal-100 text-xs font-bold uppercase tracking-wider mb-2">
              <Flower2 className="w-4 h-4" />
              <span>Interactive Sensory Tool</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">5-4-3-2-1 Sensory Grounding</h3>
            <p className="text-xs text-teal-50/90 mt-2 leading-relaxed max-w-md">
              Engage sight, touch, hearing, smell, and taste to pull your attention away from racing thoughts.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-teal-100 bg-white/10 px-3 py-1 rounded-full">⏱️ 5 Minutes</span>
            <button
              id="launch-sensory-grounding-btn"
              onClick={onOpenGroundingModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal-800 hover:bg-teal-50 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Grounding Tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Personalized Micro-Practices
        </h2>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Crafting personalized wellness recommendations...
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No practices found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecs.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      {getCategoryIcon(rec.category)}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {rec.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {rec.description}
                  </p>

                  {/* Steps preview */}
                  <div className="space-y-1.5 mb-4 bg-[#F8FAF9] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Quick Steps:
                    </span>
                    {rec.guidanceSteps.slice(0, 3).map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span className="line-clamp-1">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {rec.durationMinutes} min
                  </span>
                  <button
                    onClick={() => handleAction(rec)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                  >
                    <span>Practice Now</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guidance Modal for generic step-through */}
      {activeStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                {activeStepModal.title}
              </h3>
              <button
                onClick={() => setActiveStepModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {activeStepModal.description}
            </p>
            <div className="space-y-2">
              {activeStepModal.guidanceSteps.map((step, idx) => (
                <div key={idx} className="p-3.5 bg-[#F8FAF9] dark:bg-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-800 dark:text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{step}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveStepModal(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              Complete Practice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
