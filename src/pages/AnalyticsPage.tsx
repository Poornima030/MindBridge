import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  Smile,
  BookOpen,
  Sparkles,
  Calendar,
  Zap,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getMoodEntries,
  getJournalEntries,
  getSentimentAnalyses,
} from '../firebase/firestoreService.ts';
import {
  MoodEntry,
  JournalEntry,
  SentimentAnalysis,
  MOOD_DEFINITIONS,
  MoodType,
} from '../types.ts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsPageProps {
  onNavigate: (tab: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [sentiments, setSentiments] = useState<SentimentAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) return;
    loadAnalyticsData();
  }, [currentUser]);

  const loadAnalyticsData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [moodData, journalData, sentimentData] = await Promise.all([
        getMoodEntries(currentUser.uid),
        getJournalEntries(currentUser.uid),
        getSentimentAnalyses(currentUser.uid),
      ]);
      setMoods(moodData);
      setJournals(journalData);
      setSentiments(sentimentData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalMoodLogs = moods.length;
  const totalJournals = journals.length;

  // Numerical Mood Score mapping
  const averageScore =
    totalMoodLogs > 0
      ? (
          moods.reduce((acc, m) => acc + (MOOD_DEFINITIONS[m.mood]?.score || 3), 0) /
          totalMoodLogs
        ).toFixed(1)
      : '0.0';

  // Find most frequent mood
  const moodFrequency: Record<string, number> = {};
  moods.forEach((m) => {
    moodFrequency[m.mood] = (moodFrequency[m.mood] || 0) + 1;
  });

  let mostCommonMood = 'N/A';
  let highestCount = 0;
  Object.entries(moodFrequency).forEach(([m, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostCommonMood = m;
    }
  });

  // Sentiment counts
  const positiveSentiments = sentiments.filter((s) => s.sentiment === 'Positive').length;
  const neutralSentiments = sentiments.filter((s) => s.sentiment === 'Neutral').length;
  const negativeSentiments = sentiments.filter((s) => s.sentiment === 'Negative').length;

  // Line Chart Data: Mood trajectory chronologically (oldest to newest, max last 15 logs)
  const chronologicalMoods = [...moods]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-15);

  const lineChartData = {
    labels: chronologicalMoods.map((m) =>
      new Date(m.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    ),
    datasets: [
      {
        label: 'Emotional Balance Score (1-5)',
        data: chronologicalMoods.map((m) => MOOD_DEFINITIONS[m.mood]?.score || 3),
        borderColor: '#059669',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#047857',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointRadius: 4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const entry = chronologicalMoods[index];
            return ` Mood: ${entry.mood} (${context.raw}/5)`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value: any) => {
            if (value === 5) return '5 - Very Happy';
            if (value === 4) return '4 - Happy';
            if (value === 3) return '3 - Neutral';
            if (value === 2) return '2 - Sad / Heavy';
            if (value === 1) return '1 - Very Sad';
            return value;
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Bar Chart Data: Mood Distribution
  const moodTypes: MoodType[] = [
    'Very Happy',
    'Happy',
    'Neutral',
    'Sad',
    'Very Sad',
    'Anxious',
    'Angry',
    'Stressed',
  ];

  const barChartData = {
    labels: moodTypes.map((m) => MOOD_DEFINITIONS[m].label),
    datasets: [
      {
        label: 'Check-in Count',
        data: moodTypes.map((m) => moodFrequency[m] || 0),
        backgroundColor: [
          '#10B981',
          '#059669',
          '#64748B',
          '#3B82F6',
          '#1D4ED8',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderRadius: 8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Doughnut Chart Data: Sentiment Breakdown
  const sentimentChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [positiveSentiments, neutralSentiments, negativeSentiments],
        backgroundColor: ['#10B981', '#94A3B8', '#F43F5E'],
        hoverOffset: 4,
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Emotional Analytics & Insights
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Wellness Trends & Metrics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Visualized patterns from your private mood check-ins and journal sentiment analyses.
          </p>
        </div>
      </div>

      {/* Bento Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Avg. Mood Score
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {averageScore}
            </span>
            <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Based on {totalMoodLogs} check-ins
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Primary Emotional State
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl">
              {MOOD_DEFINITIONS[mostCommonMood as MoodType]?.emoji || '🌱'}
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {mostCommonMood}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            {highestCount} recorded entries
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Journal Reflections
          </span>
          <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
            {totalJournals}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            {sentiments.length} analyzed tones
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Positive Tone Ratio
          </span>
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {sentiments.length > 0
              ? `${Math.round((positiveSentiments / sentiments.length) * 100)}%`
              : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            {positiveSentiments} uplifting reflections
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Aggregating your wellness analytics...
        </div>
      ) : totalMoodLogs === 0 && totalJournals === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            No Analytics Data Available Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Analytics are generated strictly from your real check-in entries. Once you log your mood or write your first journal entry, your personalized trajectory and distribution charts will appear here.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigate('mood')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
            >
              Log First Mood
            </button>
            <button
              onClick={() => onNavigate('journal')}
              className="px-4 py-2 bg-teal-600 text-white rounded-2xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
            >
              Write First Journal
            </button>
          </div>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Mood Trajectory Line Chart */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Mood Trajectory Over Time
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Recent {chronologicalMoods.length} entries</span>
            </div>

            <div className="h-64 w-full">
              {chronologicalMoods.length > 0 ? (
                <Line data={lineChartData} options={lineChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Need at least 1 mood log to render trajectory.
                </div>
              )}
            </div>
          </div>

          {/* Sentiment Doughnut Chart */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Journal Tone Breakdown
              </h2>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {sentiments.length > 0 ? (
                <Doughnut data={sentimentChartData} options={doughnutOptions} />
              ) : (
                <div className="text-center p-6 text-xs text-slate-400 italic">
                  No journal entries analyzed yet. Write an entry in the Journal tab to see your emotional tone breakdown.
                </div>
              )}
            </div>
          </div>

          {/* Mood Frequency Distribution Bar Chart */}
          <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Smile className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Mood Frequency Distribution
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Total Check-ins: {totalMoodLogs}</span>
            </div>

            <div className="h-64 w-full">
              {totalMoodLogs > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  No mood logs available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-diagnostic notice */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Analytics Guidance:</strong> Numerical mood mappings and sentiment scores are designed for personal self-reflection and habit awareness. They do not constitute clinical psychological assessments or medical measurements.
        </span>
      </div>
    </div>
  );
};
