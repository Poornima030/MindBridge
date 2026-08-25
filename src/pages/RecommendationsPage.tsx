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
  X,
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
        return <Wind className="w-5 h-5 text-teal-600" />;
      case 'Mindfulness':
        return <Flower2 className="w-5 h-5 text-teal-600" />;
      case 'Movement':
        return <Footprints className="w-5 h-5 text-sky-600" />;
      case 'Journaling':
        return <BookOpen className="w-5 h-5 text-teal-600" />;
      case 'Connection':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Rest':
        return <Moon className="w-5 h-5 text-indigo-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-teal-600" />;
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Evidence-Informed Care Tools
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personalized Wellness Exercises
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tailored micro-practices based on your latest emotional check-ins.
          </p>
        </div>

        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-teal-600'}`} />
          <span>Refresh Suggestions</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {cat === 'all' ? 'All Practices' : cat}
          </button>
        ))}
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
          Finding the most comforting exercises for your current state...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-xs">
                    {getCategoryIcon(rec.category)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    <Clock className="w-3 h-3 text-teal-600" />
                    {rec.durationMinutes} min
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-0.5">
                    {rec.category} • {rec.tag}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {rec.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <button
                onClick={() => handleAction(rec)}
                className="w-full py-2.5 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
                <span>Begin Practice</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Guidance Steps Modal */}
      {activeStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  {getCategoryIcon(activeStepModal.category)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {activeStepModal.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {activeStepModal.durationMinutes} min exercise
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeStepModal.description}
            </p>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Guided Steps:
              </h4>
              <div className="space-y-2">
                {activeStepModal.guidanceSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs text-slate-800 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveStepModal(null)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              Complete Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
