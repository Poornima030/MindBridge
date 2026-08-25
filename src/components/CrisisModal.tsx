import React from 'react';
import { Phone, MessageSquare, Globe, HeartHandshake, X, ExternalLink, ShieldAlert } from 'lucide-react';
import { CRISIS_RESOURCES } from '../../server/crisisService.ts';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string | null;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  customMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="crisis-support-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="crisis-support-modal-content"
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-rose-200/80 dark:border-rose-900 shadow-2xl p-6 sm:p-8 relative"
      >
        <button
          id="crisis-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors text-xs font-bold"
          aria-label="Close crisis dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl border border-rose-200 dark:border-rose-800">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Immediate Support & Helplines
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
              Free • Confidential • Available 24/7
            </p>
          </div>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 mb-6">
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {customMessage ||
              'If you or someone you care about is experiencing overwhelming distress, painful thoughts, or an emergency, compassionate professionals are standing by right now to listen and support you.'}
          </p>
        </div>

        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Immediate Contact Options
        </h3>

        <div className="space-y-3 mb-6">
          {CRISIS_RESOURCES.map((resource, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#F8FAF9] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 mt-0.5 rounded-xl bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/50 dark:border-slate-600">
                    {resource.type === 'phone' && <Phone className="w-4 h-4" />}
                    {resource.type === 'text' && <MessageSquare className="w-4 h-4" />}
                    {resource.type === 'web' && <Globe className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {resource.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {resource.description}
                    </p>
                    <div className="mt-2 inline-block px-3 py-1 bg-rose-100/80 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 text-xs font-mono font-bold rounded-xl">
                      {resource.contact}
                    </div>
                  </div>
                </div>
                {resource.type === 'web' && (
                  <a
                    href={resource.contact}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
                    aria-label="Visit website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            In an immediate physical emergency, please call your local emergency services (e.g. 112 in India).
          </p>
          <button
            id="close-crisis-modal-action"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-xs sm:text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};
