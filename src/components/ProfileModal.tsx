import React from 'react';
import { X, User, Bell, CheckCircle2, Shield, Sparkles } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0e1420] border border-slate-200 dark:border-[#1e293b] rounded-3xl w-full max-w-md p-6 shadow-2xl relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Candidate Profile Info */}
        <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
            alt="Alex Rivera"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Alex Morgan</h3>
              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                PRO ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">alex.morgan@alumni.tech • Candidate</p>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Targeting: Staff / Lead Systems Architect
            </span>
          </div>
        </div>

        {/* Notifications list */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">
            <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Recent Coach Notifications</span>
          </div>

          <div className="space-y-2">
            <div className="bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">New STAR Story Ready</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">2h ago</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Your monolith migration story scored 92% readiness in behavioral simulation.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Speech Telemetry Calibrated</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">1d ago</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Your average speaking pace stabilized at 138 WPM (Optimal clarity).
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl flex items-center space-x-2 text-xs text-indigo-800 dark:text-indigo-300">
          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Local session security active. No audio or resume data stored externally.</span>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
