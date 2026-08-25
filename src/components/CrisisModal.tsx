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
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 relative"
      >
        <button
          id="crisis-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors text-xs font-bold"
          aria-label="Close crisis dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Immediate Support & Helplines
            </h2>
            <p className="text-xs text-rose-600 font-bold">
              Free • Confidential • Available 24/7 (India)
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {customMessage ||
              'If you or someone you care about is experiencing overwhelming distress, painful thoughts, or an emergency, compassionate professionals are standing by right now to listen and support you.'}
          </p>
        </div>

        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Immediate Contact Options
        </h3>

        <div className="space-y-3 mb-6">
          {CRISIS_RESOURCES.map((resource, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 mt-0.5 rounded-xl bg-white text-teal-600 shadow-xs border border-slate-200">
                    {resource.type === 'phone' && <Phone className="w-4 h-4" />}
                    {resource.type === 'text' && <MessageSquare className="w-4 h-4" />}
                    {resource.type === 'web' && <Globe className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {resource.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <a
                  href={
                    resource.type === 'phone'
                      ? `tel:${resource.contact.replace(/[^0-9+]/g, '')}`
                      : resource.type === 'text'
                      ? `sms:${resource.contact.replace(/[^0-9]/g, '')}`
                      : resource.contact
                  }
                  target={resource.type === 'web' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>{resource.contact}</span>
                  {resource.type === 'web' && <ExternalLink className="w-3 h-3" />}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
          <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            MindBridge is an emotional reflection aid and is not a replacement for clinical diagnosis, psychiatric medical care, or emergency response services.
          </span>
        </div>
      </div>
    </div>
  );
};
