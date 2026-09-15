import React from 'react';
import { GitFork, Mic, Sparkles, BarChart3, Users } from 'lucide-react';

export type NavTab = 'tracks' | 'coach' | 'group' | 'vault' | 'analytics';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isInterviewActive?: boolean;
  isGroupDiscussionActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isInterviewActive = false,
  isGroupDiscussionActive = false,
}) => {
  const tabs = [
    {
      id: 'tracks' as NavTab,
      label: 'Prep Tracks',
      icon: GitFork,
      badge: null,
    },
    {
      id: 'coach' as NavTab,
      label: 'Live Coach',
      icon: Mic,
      badge: isInterviewActive ? 'LIVE' : null,
    },
    {
      id: 'group' as NavTab,
      label: 'Group Round',
      icon: Users,
      badge: isGroupDiscussionActive ? 'LIVE' : 'NEW',
    },
    {
      id: 'vault' as NavTab,
      label: 'STAR Vault',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#1e293b] py-2 px-2 sm:px-3 shadow-2xl transition-colors duration-200">
      <div className="max-w-lg mx-auto grid grid-cols-5 gap-0.5 sm:gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {/* Active ambient glow */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-indigo-500 rounded-full shadow-[0_0_12px_#6366f1]" />
              )}

              <div className="relative">
                <div
                  className={`p-1 rounded-lg transition-transform ${
                    isActive ? 'scale-110 bg-indigo-500/15' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-black text-white rounded-full ${
                      tab.badge === 'LIVE'
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
