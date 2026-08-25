import React from 'react';
import { ShieldAlert, PhoneCall, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  onOpenCrisisModal?: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ onOpenCrisisModal }) => {
  return (
    <div
      id="disclaimer-banner"
      className="bg-slate-100/90 border-b border-slate-200/80 py-2 px-4 sm:px-6 text-xs text-slate-700 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] sm:text-xs">
            <strong className="text-slate-900">MindBridge Wellness Notice:</strong> This AI companion provides emotional support and self-care tools. It does not diagnose conditions or replace licensed medical/psychiatric care.
          </span>
        </div>
        {onOpenCrisisModal && (
          <button
            id="crisis-support-header-btn"
            onClick={onOpenCrisisModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-full text-xs font-bold transition-colors shadow-xs shrink-0"
          >
            <PhoneCall className="w-3 h-3 text-rose-600" />
            <span>Crisis Helplines (Tele-MANAS 14416)</span>
          </button>
        )}
      </div>
    </div>
  );
};
