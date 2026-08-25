import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, Eye, Hand, Volume2, Flower2, Coffee, ChevronRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroundingStep {
  count: number;
  sense: string;
  icon: React.ReactNode;
  prompt: string;
  placeholder: string;
}

const STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: 'Sight',
    icon: <Eye className="w-5 h-5 text-sky-600" />,
    prompt: 'Acknowledge FIVE things you see around you.',
    placeholder: 'e.g. A plant on the windowsill, sunlight on the floor...',
  },
  {
    count: 4,
    sense: 'Touch',
    icon: <Hand className="w-5 h-5 text-teal-600" />,
    prompt: 'Acknowledge FOUR things you can physically feel.',
    placeholder: 'e.g. The texture of your chair, your feet on the rug...',
  },
  {
    count: 3,
    sense: 'Hearing',
    icon: <Volume2 className="w-5 h-5 text-sky-600" />,
    prompt: 'Acknowledge THREE sounds you hear right now.',
    placeholder: 'e.g. Clock ticking, birds outside, a gentle fan hum...',
  },
  {
    count: 2,
    sense: 'Smell',
    icon: <Flower2 className="w-5 h-5 text-teal-600" />,
    prompt: 'Acknowledge TWO scents you can smell.',
    placeholder: 'e.g. Morning coffee, fresh rain, scented candle...',
  },
  {
    count: 1,
    sense: 'Taste',
    icon: <Coffee className="w-5 h-5 text-emerald-600" />,
    prompt: 'Acknowledge ONE taste or take a mindful sip of water.',
    placeholder: 'e.g. Mint from toothpaste, or cool fresh water...',
  },
];

export const GroundingToolModal: React.FC<GroundingModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [inputs, setInputs] = useState<string[]>(['', '', '', '', '']);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setInputs(['', '', '', '', '']);
    setIsCompleted(false);
  };

  return (
    <div
      id="grounding-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="grounding-modal-container"
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 relative"
      >
        <button
          id="grounding-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors text-xs font-bold"
          aria-label="Close grounding modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-teal-600 mb-1">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider">5-4-3-2-1 Grounding</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">
          Sensory Awareness Reset
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Bring your mind back to the physical safety of this present moment by engaging each sense.
        </p>

        {!isCompleted ? (
          <div>
            {/* Progress indicators */}
            <div className="flex gap-2 mb-6">
              {STEPS.map((s, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                    idx < currentStepIndex
                      ? 'bg-teal-500'
                      : idx === currentStepIndex
                      ? 'bg-sky-600 ring-2 ring-sky-600/30'
                      : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>

            {/* Current Step Card */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-2xl bg-white shadow-xs border border-slate-200">
                  {currentStep.icon}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-teal-600">
                    Step {currentStepIndex + 1} of 5 • {currentStep.sense}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {currentStep.prompt}
                  </h3>
                </div>
              </div>

              <textarea
                value={inputs[currentStepIndex]}
                onChange={(e) => {
                  const newInputs = [...inputs];
                  newInputs[currentStepIndex] = e.target.value;
                  setInputs(newInputs);
                }}
                placeholder={currentStep.placeholder}
                rows={3}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 resize-none shadow-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start Over
              </button>
              <button
                id="grounding-next-step-btn"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95"
              >
                {currentStepIndex === STEPS.length - 1 ? 'Finish Exercise' : 'Next Step'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Well Done! You are Grounded
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">
              Take one slow, deep belly breath. You have returned your awareness to the safe, tangible reality of the here and now.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50"
              >
                Repeat Exercise
              </button>
              <button
                id="grounding-done-btn"
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-teal-600/20"
              >
                Complete & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
