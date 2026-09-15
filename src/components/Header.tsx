import React from 'react';
import { Bell, Code2, Sparkles, Sun, Moon, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type HeaderTab = 'tracks' | 'coach' | 'vault' | 'analytics' | 'group';

interface HeaderProps {
  activeTab: HeaderTab;
  onOpenCodeModal: () => void;
  onOpenProfileModal: () => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenCodeModal,
  onOpenProfileModal,
  notificationCount = 2,
}) => {
  const { theme, toggleTheme } = useTheme();

  const getSubLabel = () => {
    switch (activeTab) {
      case 'tracks':
        return 'Prep Tracks & Setup';
      case 'coach':
        return 'Live Coach Simulator';
      case 'vault':
        return 'STAR Story Vault';
      case 'analytics':
        return 'Analytics & Telemetry';
      case 'group':
        return 'Real-Time Group Discussion';
      default:
        return 'AI Interview Assistant';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1e293b] px-4 py-3 sm:px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand logo & Context */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Skill2Hire<span className="text-indigo-600 dark:text-indigo-400">.ai</span>
              </span>
              <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
              {getSubLabel()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Theme Toggle Button (Dark / Light Mode) */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-button"
            className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-100 dark:bg-[#161f30] hover:bg-slate-200 dark:hover:bg-[#1e2c44] text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
            <span className="text-xs font-semibold hidden sm:inline text-slate-700 dark:text-slate-200">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Python/uv Code Viewer trigger */}
          <button
            onClick={onOpenCodeModal}
            id="python-code-modal-trigger"
            className="flex items-center space-x-1.5 bg-indigo-50 dark:bg-[#161f30] hover:bg-indigo-100 dark:hover:bg-[#1e2c44] text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-sm"
            title="View Python Streamlit & LangChain source code"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Python / LangChain</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenProfileModal}
            id="profile-notifications-trigger"
            className="relative p-2 rounded-lg bg-slate-100 dark:bg-[#161f30] hover:bg-slate-200 dark:hover:bg-[#1e2c44] text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Candidate Profile Avatar */}
          <button
            onClick={onOpenProfileModal}
            id="candidate-profile-button"
            className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-full bg-slate-100 dark:bg-[#161f30] hover:bg-slate-200 dark:hover:bg-[#1e2c44] border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Candidate Profile"
              className="w-6 h-6 rounded-full object-cover border border-indigo-500/50"
            />
            <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-200">
              Alex (Candidate)
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
