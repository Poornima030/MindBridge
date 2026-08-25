import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Wind,
  Flower2,
  BookOpen,
  Heart,
  Moon,
  Footprints,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  X,
  Search,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.tsx';
import { getMoodEntries, getSentimentAnalyses } from '../firebase/firestoreService.ts';
import { fetchPersonalizedRecommendations } from '../services/apiService.ts';
import { WellnessRecommendation } from '../types.ts';

interface RecommendationsPageProps {
  onOpenBreathingModal: (type?: 'breathing-box' | 'breathing-478' | 'breathing-55' | 'breathing-belly') => void;
  onOpenGroundingModal: () => void;
  onNavigate: (tab: string) => void;
}

const MASTER_WELLNESS_CATALOG: WellnessRecommendation[] = [
  // 1. Breathing
  {
    id: 'box-breathing',
    title: '4x4 Box Breathing',
    category: 'Breathing',
    durationMinutes: 3,
    description: 'Regulate your autonomic nervous system and reduce acute anxiety with equal count cycles.',
    actionType: 'breathing-box',
    guidanceSteps: [
      'Inhale slowly through your nose for 4 counts',
      'Gently hold your breath with relaxed shoulders for 4 counts',
      'Exhale smoothly through your mouth for 4 counts',
      'Pause naturally before the next cycle for 4 counts',
    ],
    tag: 'Quick Stress Relief',
  },
  {
    id: 'relaxing-478',
    title: '4-7-8 Deep Relaxation Breath',
    category: 'Breathing',
    durationMinutes: 4,
    description: 'Slow your heart rate and prepare your mind and body for calm, de-escalation, or restful sleep.',
    actionType: 'breathing-478',
    guidanceSteps: [
      'Inhale quietly through your nose for 4 counts',
      'Hold your breath comfortably for 7 counts',
      'Exhale completely through open lips with a soft whoosh for 8 counts',
      'Repeat for 4 to 6 mindful cycles',
    ],
    tag: 'Deep Calming',
  },
  {
    id: 'coherent-55',
    title: '5-5 Coherent Breathing',
    category: 'Breathing',
    durationMinutes: 5,
    description: 'Optimize heart-rate variability (HRV) and cultivate deep physiological equilibrium.',
    actionType: 'breathing-55',
    guidanceSteps: [
      'Find an upright, comfortable posture and loosen your jaw',
      'Inhale smoothly for a steady 5 seconds into your lungs',
      'Exhale gently without pausing for a steady 5 seconds',
      'Maintain an unbroken, rolling wave of breath for 5 minutes',
    ],
    tag: 'Nervous System Balance',
  },
  {
    id: 'belly-diaphragm',
    title: 'Diaphragmatic Belly Breath',
    category: 'Breathing',
    durationMinutes: 3,
    description: 'Expand your lower abdomen to disengage the fight-or-flight response.',
    actionType: 'breathing-belly',
    guidanceSteps: [
      'Place one hand on your chest and one hand over your navel',
      'Breathe in through your nose, guiding your breath so only the belly hand rises',
      'Hold for a gentle 2-second pause',
      'Slowly release the breath, letting the belly fall inward completely',
    ],
    tag: 'Instant Grounding',
  },

  // 2. Mindfulness & Grounding
  {
    id: 'grounding-54321',
    title: '5-4-3-2-1 Sensory Grounding',
    category: 'Mindfulness',
    durationMinutes: 5,
    description: 'Anchor yourself back in the physical room by engaging each of your five senses.',
    actionType: 'grounding-54321',
    guidanceSteps: [
      'Acknowledge 5 things you can see around you right now',
      'Notice 4 physical textures you can feel or touch',
      'Listen for 3 distinct ambient sounds in your surroundings',
      'Identify 2 subtle scents you can smell',
      'Acknowledge 1 pleasant taste or take a mindful sip of water',
    ],
    tag: 'Anxiety Reset',
  },
  {
    id: 'body-scan-mindful',
    title: 'Progressive Body Scan',
    category: 'Mindfulness',
    durationMinutes: 7,
    description: 'Direct gentle, non-judgmental awareness from your toes to the crown of your head.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Rest comfortably with eyes closed or softly unfocused',
      'Notice sensations in your feet and toes—temperature, weight, or tingling',
      'Shift awareness up through your calves, knees, and thighs, releasing tension on each out-breath',
      'Observe your abdomen, chest, shoulders, and jaw, letting them melt downward',
      'Rest in whole-body awareness for the final minute',
    ],
    tag: 'Somatic Release',
  },
  {
    id: 'leaves-stream',
    title: 'Leaves on a Stream (Thought Defusion)',
    category: 'Mindfulness',
    durationMinutes: 5,
    description: 'Practice observing worrisome thoughts without getting caught up in their current.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Imagine sitting beside a gently flowing stream with leaves drifting by',
      'Whenever a thought or worry enters your mind, place it onto a leaf',
      'Watch the leaf float peacefully downstream around the bend',
      'If your mind wanders, gently bring your focus back to the flowing stream',
    ],
    tag: 'Overthinking Relief',
  },
  {
    id: 'stop-technique',
    title: 'The S.T.O.P. Micro-Pause',
    category: 'Mindfulness',
    durationMinutes: 2,
    description: 'A 2-minute cognitive circuit breaker when feeling rushed, irritated, or scattered.',
    actionType: 'guided-session',
    guidanceSteps: [
      'S - Stop: Pause what you are doing, saying, or typing for a brief moment',
      'T - Take a breath: Draw one slow, full breath into your lower belly',
      'O - Observe: Notice your physical posture, feelings, and current thoughts without judgment',
      'P - Proceed: Continue with your day with clearer intention and calm posture',
    ],
    tag: 'Daily Micro-Habit',
  },

  // 3. Movement & Somatics
  {
    id: 'neck-shoulder-reset',
    title: 'Gentle Neck & Shoulder Release',
    category: 'Movement',
    durationMinutes: 3,
    description: 'Release physical tension held in the neck, traps, and upper spine.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Roll your shoulders backward 5 times in slow, wide circles',
      'Gently tilt your right ear toward your right shoulder for 15 seconds',
      'Slowly tilt your left ear toward your left shoulder for 15 seconds',
      'Interlace fingers behind your back and gently open your collarbones for 20 seconds',
    ],
    tag: 'Physical Ease',
  },
  {
    id: 'pmr-exercise',
    title: 'Progressive Muscle Relaxation (PMR)',
    category: 'Movement',
    durationMinutes: 8,
    description: 'Tense and systematically release muscle groups to teach your body the feeling of deep ease.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Clench both fists tightly for 5 seconds, then let go completely and notice the warm release',
      'Tighten your shoulders up toward your ears for 5 seconds, then drop them softly',
      'Squeeze your abdominal muscles for 5 seconds, then release into a deep exhale',
      'Point your toes and flex your calf muscles for 5 seconds, then release completely',
    ],
    tag: 'Deep Body Relaxation',
  },
  {
    id: 'mindful-walk',
    title: 'Mindful Grounding Walk',
    category: 'Movement',
    durationMinutes: 10,
    description: 'Shift focus to the sensory rhythm of walking and feeling your feet connect with the earth.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Step outside or walk in a quiet room at a natural, unhurried pace',
      'Notice the sensation of your heel touching the ground, then the ball of your foot, then pushing off',
      'Coordinate your breathing with your stride (e.g. inhale for 3 steps, exhale for 3 steps)',
      'Look around and appreciate the ambient colors, trees, or shapes around you',
    ],
    tag: 'Outdoor Grounding',
  },

  // 4. Journaling
  {
    id: 'gratitude-spark',
    title: 'Three Micro-Moments of Gratitude',
    category: 'Journaling',
    durationMinutes: 5,
    description: 'Shift your cognitive attention toward positive or neutral moments from your day.',
    actionType: 'journal',
    guidanceSteps: [
      'Recall one small pleasant sensory experience today (warm tea, fresh breeze, clean sheets)',
      'Reflect on one kind word or interaction you experienced or witnessed',
      'Acknowledge one personal effort you made today, regardless of the outcome',
      'Record these reflections in your private MindBridge journal',
    ],
    tag: 'Mood Elevation',
  },
  {
    id: 'worry-dump',
    title: 'Worry Dump & Cognitive Reframing',
    category: 'Journaling',
    durationMinutes: 7,
    description: 'Empty cognitive clutter onto the page, then separate what is in your control from what is not.',
    actionType: 'journal',
    guidanceSteps: [
      'Write down everything currently creating mental pressure or anxiety without editing',
      'Circle the items that you can directly control today with one small action',
      'For items outside your control, practice writing: "I acknowledge this worry, but I release the need to control it now"',
      'Identify one simple next step for the item within your control',
    ],
    tag: 'Clarity & Focus',
  },
  {
    id: 'self-compassion-note',
    title: 'Self-Compassion Letter',
    category: 'Journaling',
    durationMinutes: 6,
    description: 'Speak to yourself with the kindness, patience, and warmth you would offer to a dear friend.',
    actionType: 'journal',
    guidanceSteps: [
      'Identify a mistake, insecurity, or difficulty you have been harsh on yourself about',
      'Imagine how a wise, deeply compassionate friend would respond to you',
      'Write 3 to 4 sentences offering yourself genuine forgiveness and understanding',
      'Notice the relief that comes with setting down self-criticism',
    ],
    tag: 'Emotional Healing',
  },

  // 5. Connection
  {
    id: 'supportive-checkin',
    title: 'Supportive Connection Outreach',
    category: 'Connection',
    durationMinutes: 5,
    description: 'Send a low-pressure, loving message to a trusted friend, family member, or colleague.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Pick one person whose presence brings you comfort or smiles',
      'Send a short check-in message: "Thinking of you today, hope your week is going gently!"',
      'Notice the warmth that comes with extending connection without expectations',
    ],
    tag: 'Social Wellness',
  },
  {
    id: 'metta-kindness',
    title: 'Loving-Kindness (Metta) Practice',
    category: 'Connection',
    durationMinutes: 6,
    description: 'Cultivate goodwill and emotional safety toward yourself and others.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Silently wish for yourself: "May I be safe. May I be healthy. May I live with ease."',
      'Picture someone you love and repeat: "May you be safe. May you be healthy. May you live with ease."',
      'Expand this wish to neutral acquaintances and the wider world',
    ],
    tag: 'Compassion',
  },
  {
    id: 'companion-heart-chat',
    title: 'Empathetic Heart-to-Heart Chat',
    category: 'Connection',
    durationMinutes: 5,
    description: 'Unpack your feelings in a safe, non-judgmental space with your personalized AI Companion.',
    actionType: 'chat',
    guidanceSteps: [
      'Open the AI Companion chat tab',
      'Share openly what is on your mind without fear of judgment',
      'Receive supportive, tailored perspective and thoughtful validation',
    ],
    tag: 'Safe Expression',
  },

  // 6. Rest & Sleep
  {
    id: 'screen-free-winddown',
    title: 'Screen-Free Evening Wind-Down',
    category: 'Rest',
    durationMinutes: 10,
    description: 'A soothing evening ritual to prepare your brain and melatonin production for deep sleep.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Dim bright overhead lights and switch off blue-light devices',
      'Do 2 minutes of gentle spinal twists or neck rolls',
      'Sip warm caffeine-free herbal tea or water',
      'Read a calming physical book or listen to peaceful ambient sounds',
    ],
    tag: 'Sleep Hygiene',
  },
  {
    id: 'nsdr-rest',
    title: 'Non-Sleep Deep Rest (NSDR)',
    category: 'Rest',
    durationMinutes: 12,
    description: 'Restore mental clarity and downshift brainwave states without falling fully asleep.',
    actionType: 'guided-session',
    guidanceSteps: [
      'Lie down flat with a pillow under your head or knees',
      'Allow your eyes to close completely and soften your facial muscles',
      'Take 3 long, slow exhales to signal full physical surrender to gravity',
      'Let your mind float freely in stillness for 10 minutes',
    ],
    tag: 'Neural Recharge',
  },
];

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onOpenBreathingModal,
  onOpenGroundingModal,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<WellnessRecommendation[]>(MASTER_WELLNESS_CATALOG);
  const [personalizedIds, setPersonalizedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePracticeModal, setActivePracticeModal] = useState<WellnessRecommendation | null>(null);

  // Active Practice Session State (Timer, Steps, Sound)
  const [timerSeconds, setTimerSeconds] = useState<number>(180);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      if (recs && recs.length > 0) {
        setPersonalizedIds(recs.map((r) => r.id));
        // Merge AI recs with the master catalog so every category is populated
        const existingIds = new Set(recs.map((r) => r.id));
        const combined = [...recs, ...MASTER_WELLNESS_CATALOG.filter((m) => !existingIds.has(m.id))];
        setRecommendations(combined);
      } else {
        setRecommendations(MASTER_WELLNESS_CATALOG);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setRecommendations(MASTER_WELLNESS_CATALOG);
    } finally {
      setLoading(false);
    }
  };

  // Play a soft calming chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime); // 528Hz calming tone
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Timer interval for active session modal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playChime();
            try {
              confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, soundEnabled]);

  const categories = ['all', 'Breathing', 'Mindfulness', 'Movement', 'Journaling', 'Connection', 'Rest'];

  const filteredRecs = recommendations.filter((rec) => {
    const matchesCat = selectedCategory === 'all' || rec.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
    } else if (rec.actionType === 'breathing-55') {
      onOpenBreathingModal('breathing-55');
    } else if (rec.actionType === 'breathing-belly') {
      onOpenBreathingModal('breathing-belly');
    } else if (rec.actionType === 'grounding-54321') {
      onOpenGroundingModal();
    } else if (rec.actionType === 'journal') {
      onNavigate('journal');
    } else if (rec.actionType === 'chat') {
      onNavigate('chat');
    } else {
      // Launch Guided Practice Session Player Modal
      setActivePracticeModal(rec);
      setTimerSeconds(rec.durationMinutes * 60);
      setIsTimerRunning(true);
      setCompletedSteps([]);
      playChime();
    }
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Interactive Care Sanctuary
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wellness Tools & Practices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore 20+ evidence-based practices for calming, breathwork, movement, and reflection.
          </p>
        </div>

        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-teal-600'}`} />
          <span>Refresh Tailored Practices</span>
        </button>
      </div>

      {/* Quick Launch Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onOpenBreathingModal('breathing-box')}
          className="p-4 rounded-3xl bg-gradient-to-tr from-teal-50 to-emerald-50 border border-teal-200/80 text-left hover:shadow-md transition-all flex items-start gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase block">Instant Calm</span>
            <span className="text-sm font-extrabold text-slate-900 block">4x4 Box Breath</span>
            <span className="text-xs text-slate-500">3 min interactive orb</span>
          </div>
        </button>

        <button
          onClick={() => onOpenBreathingModal('breathing-478')}
          className="p-4 rounded-3xl bg-gradient-to-tr from-sky-50 to-indigo-50 border border-sky-200/80 text-left hover:shadow-md transition-all flex items-start gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-700 uppercase block">Sleep & Rest</span>
            <span className="text-sm font-extrabold text-slate-900 block">4-7-8 Relaxation</span>
            <span className="text-xs text-slate-500">4 min deep exhale</span>
          </div>
        </button>

        <button
          onClick={onOpenGroundingModal}
          className="p-4 rounded-3xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200/80 text-left hover:shadow-md transition-all flex items-start gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Sensory Reset</span>
            <span className="text-sm font-extrabold text-slate-900 block">5-4-3-2-1 Grounding</span>
            <span className="text-xs text-slate-500">5 min step-by-step</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('journal')}
          className="p-4 rounded-3xl bg-gradient-to-tr from-purple-50 to-pink-50 border border-purple-200/80 text-left hover:shadow-md transition-all flex items-start gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase block">Safe Reflection</span>
            <span className="text-sm font-extrabold text-slate-900 block">Voice & Journal</span>
            <span className="text-xs text-slate-500">Speak or write thoughts</span>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Practices (20+)' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Recommendations Grid */}
      {filteredRecs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <Sparkles className="w-8 h-8 text-teal-600 mx-auto opacity-70" />
          <p className="text-sm font-bold text-slate-900">No practices found</p>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or switching to another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecs.map((rec) => {
            const isPersonalized = personalizedIds.includes(rec.id);
            return (
              <div
                key={rec.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
              >
                {isPersonalized && (
                  <span className="absolute top-4 right-4 text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                    ✨ Tailored For You
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-xs">
                      {getCategoryIcon(rec.category)}
                    </div>
                    {!isPersonalized && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                        <Clock className="w-3 h-3 text-teal-600" />
                        {rec.durationMinutes} min
                      </span>
                    )}
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
                  className="w-full py-2.5 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98"
                >
                  <Play className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
                  <span>Begin Practice ({rec.durationMinutes} min)</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Guided Practice Session Player Modal */}
      {activePracticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  {getCategoryIcon(activePracticeModal.category)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {activePracticeModal.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {activePracticeModal.category} • {activePracticeModal.tag}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePracticeModal(null);
                  setIsTimerRunning(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Practice Timer Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-50 to-teal-50/40 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Timer</span>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  {formatTime(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-teal-600 transition-colors"
                  title={soundEnabled ? 'Mute soothing chime' : 'Enable soothing chime'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  onClick={() => setTimerSeconds(activePracticeModal.durationMinutes * 60)}
                  className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Start
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activePracticeModal.description}
            </p>

            {/* Guided Interactive Steps Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Guided Action Steps ({completedSteps.length}/{activePracticeModal.guidanceSteps.length}):
                </h4>
                <span className="text-[11px] text-teal-600 font-semibold">
                  Tap to mark done
                </span>
              </div>

              <div className="space-y-2">
                {activePracticeModal.guidanceSteps.map((step, idx) => {
                  const isDone = completedSteps.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-xs leading-relaxed ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 transition-colors ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                      </div>
                      <span className={isDone ? 'line-through text-slate-500' : ''}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setActivePracticeModal(null);
                setIsTimerRunning(false);
                try {
                  confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                } catch {}
              }}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              Complete Exercise & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
