import React from 'react';
import { ShieldAlert, PhoneCall, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  onOpenCrisisModal?: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ onOpenCrisisModal }) => {
  return (
    <div
      id="disclaimer-banner"
      className="bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-100/80 dark:border-emerald-900/40 py-2 px-4 sm:px-6 text-xs text-emerald-900 dark:text-emerald-200 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] sm:text-xs">
            <strong>MindBridge Wellness Notice:</strong> This AI companion provides emotional support and self-care tools. It does not diagnose conditions or replace licensed medical/psychiatric care.
          </span>
        </div>
        {onOpenCrisisModal && (
          <button
            id="crisis-support-header-btn"
            onClick={onOpenCrisisModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 rounded-full text-xs font-bold transition-colors shadow-xs shrink-0"
          >
            <PhoneCall className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Crisis Helplines (Tele-MANAS 14416)</span>
          </button>
        )}
      </div>
    </div>
  );
};
