import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Wind } from 'lucide-react';

export interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'breathing-box' | 'breathing-478' | 'breathing-55' | 'breathing-belly';
}

type Technique = 'box' | '478' | '55' | 'belly';

interface PhaseConfig {
  name: 'Inhale' | 'Hold' | 'Exhale' | 'Rest';
  duration: number; // in seconds
  instruction: string;
}

const TECHNIQUES: Record<Technique, { name: string; description: string; phases: PhaseConfig[] }> = {
  box: {
    name: '4x4 Box Breathing',
    description: 'Regulate stress and enhance mental focus with equal counts.',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose...' },
      { name: 'Hold', duration: 4, instruction: 'Gently hold your breath, softening your shoulders...' },
      { name: 'Exhale', duration: 4, instruction: 'Release breath smoothly through open lips...' },
      { name: 'Rest', duration: 4, instruction: 'Pause naturally before the next breath...' },
    ],
  },
  '478': {
    name: '4-7-8 Relaxing Breath',
    description: 'Deep autonomic relaxation to soothe anxiety and invite calm.',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Inhale quietly through your nose...' },
      { name: 'Hold', duration: 7, instruction: 'Hold your breath gently and relax your face...' },
      { name: 'Exhale', duration: 8, instruction: 'Exhale completely with a soft, gentle whoosh...' },
    ],
  },
  '55': {
    name: '5-5 Coherent Breathing',
    description: 'Harmonize your heart rate variability (HRV) and cultivate deep inner balance.',
    phases: [
      { name: 'Inhale', duration: 5, instruction: 'Inhale smoothly and deeply for 5 seconds...' },
      { name: 'Exhale', duration: 5, instruction: 'Exhale gently and steadily for 5 seconds...' },
    ],
  },
  belly: {
    name: 'Diaphragmatic Belly Breath',
    description: 'Expand your diaphragm to signal instant safety to your nervous system.',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe deep into your belly, feeling it rise...' },
      { name: 'Hold', duration: 2, instruction: 'Gentle pause, feeling full of gentle warmth...' },
      { name: 'Exhale', duration: 6, instruction: 'Slowly let your belly fall, releasing all tension...' },
    ],
  },
};

export const BreathingExerciseModal: React.FC<BreathingModalProps> = ({
  isOpen,
  onClose,
  initialType,
}) => {
  const getInitialTech = (): Technique => {
    if (initialType === 'breathing-478') return '478';
    if (initialType === 'breathing-55') return '55';
    if (initialType === 'breathing-belly') return 'belly';
    return 'box';
  };

  const [technique, setTechnique] = useState<Technique>(getInitialTech());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const activeTechnique = TECHNIQUES[technique] || TECHNIQUES.box;
  const activePhase = activeTechnique.phases[currentPhaseIndex] || activeTechnique.phases[0];

  // Reset when opening or changing technique
  useEffect(() => {
    if (isOpen) {
      const selected = getInitialTech();
      setTechnique(selected);
      setIsRunning(true);
      setCurrentPhaseIndex(0);
      setSecondsLeft(TECHNIQUES[selected].phases[0].duration);
      setCompletedCycles(0);
    } else {
      setIsRunning(false);
    }
  }, [isOpen, initialType]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && isOpen) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            const nextIndex = (currentPhaseIndex + 1) % activeTechnique.phases.length;
            if (nextIndex === 0) {
              setCompletedCycles((c) => c + 1);
            }
            setCurrentPhaseIndex(nextIndex);
            return activeTechnique.phases[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isOpen, currentPhaseIndex, activeTechnique]);

  const handleTechniqueChange = (newTech: Technique) => {
    setTechnique(newTech);
    setCurrentPhaseIndex(0);
    setSecondsLeft(TECHNIQUES[newTech].phases[0].duration);
    setCompletedCycles(0);
  };

  const handleReset = () => {
    setCurrentPhaseIndex(0);
    setSecondsLeft(activeTechnique.phases[0].duration);
    setCompletedCycles(0);
    setIsRunning(true);
  };

  if (!isOpen) return null;

  // Visual scale calculation
  const totalPhaseDuration = activePhase.duration;
  const progressRatio = 1 - secondsLeft / totalPhaseDuration;
  let scale = 1;
  if (activePhase.name === 'Inhale') {
    scale = 1 + progressRatio * 0.45;
  } else if (activePhase.name === 'Hold') {
    scale = 1.45;
  } else if (activePhase.name === 'Exhale') {
    scale = 1.45 - progressRatio * 0.45;
  } else {
    scale = 1.0;
  }

  return (
    <div
      id="breathing-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="breathing-modal-container"
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col items-center text-center"
      >
        <button
          id="breathing-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors text-xs font-bold"
          aria-label="Close breathing modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-teal-600 mb-2">
          <Wind className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Mindful Breathwork</span>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-4 text-xs font-bold border border-slate-200">
          <button
            id="tab-box-breathing"
            onClick={() => handleTechniqueChange('box')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              technique === 'box'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4x4 Box
          </button>
          <button
            id="tab-478-breathing"
            onClick={() => handleTechniqueChange('478')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              technique === '478'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4-7-8 Relax
          </button>
          <button
            id="tab-55-breathing"
            onClick={() => handleTechniqueChange('55')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              technique === '55'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            5-5 Coherent
          </button>
          <button
            id="tab-belly-breathing"
            onClick={() => handleTechniqueChange('belly')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              technique === 'belly'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belly Breath
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
          {activeTechnique.name}
        </h3>
        <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
          {activeTechnique.description}
        </p>

        {/* Breathing Animation Orb */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          <div
            className="absolute inset-0 rounded-full bg-teal-100/60 border border-teal-200"
            style={{
              transform: `scale(${scale * 1.15})`,
              transition: isRunning ? 'transform 1s linear' : 'none',
            }}
          />
          <div
            className="w-36 h-36 rounded-full bg-gradient-to-tr from-teal-600 to-sky-500 text-white shadow-lg flex flex-col items-center justify-center relative z-10"
            style={{
              transform: `scale(${scale})`,
              transition: isRunning ? 'transform 1s linear' : 'none',
            }}
          >
            <span className="text-lg font-bold tracking-wide uppercase">
              {activePhase.name}
            </span>
            <span className="text-3xl font-extrabold font-mono mt-0.5">
              {secondsLeft}s
            </span>
          </div>
        </div>

        {/* Phase Instruction */}
        <div className="min-h-[44px] flex items-center justify-center mb-6">
          <p className="text-sm font-semibold text-slate-800 px-4">
            {activePhase.instruction}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 w-full pt-4 border-t border-slate-200">
          <button
            id="breathing-reset-btn"
            onClick={handleReset}
            className="p-3 text-slate-500 hover:text-slate-800 rounded-2xl hover:bg-slate-100 transition-colors"
            title="Restart cycle"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            id="breathing-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95 text-xs sm:text-sm"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Resume
              </>
            )}
          </button>
          <div className="text-xs text-slate-700 font-bold px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
            Cycles: {completedCycles}
          </div>
        </div>
      </div>
    </div>
  );
};
