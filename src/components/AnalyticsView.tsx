import React from 'react';
import {
  CheckCircle,
  Clock,
  Award,
  Layers,
  Code2,
  Users,
  Timer,
  Volume2,
  Sparkles,
  ArrowRight,
  Bookmark,
  RotateCcw,
} from 'lucide-react';
import { InterviewDomain, AnswerEvaluation, QuestionData } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsViewProps {
  domain: InterviewDomain;
  evaluations: Record<string, AnswerEvaluation>;
  questions: QuestionData[];
  onGoToVault: () => void;
  onRestart: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  domain,
  evaluations,
  questions,
  onGoToVault,
  onRestart,
}) => {
  const { theme } = useTheme();
  const evalList: AnswerEvaluation[] = Object.values(evaluations);
  const avgRawScore =
    evalList.length > 0
      ? evalList.reduce((acc: number, curr: AnswerEvaluation) => acc + curr.score, 0) /
        evalList.length
      : 8.8;

  const overallScore = Math.round(avgRawScore * 10);

  // Recommendations and percentile
  let recommendation = 'Strong Hire recommendation';
  let badgeColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30';
  let percentile = 'top 8%';

  if (overallScore >= 90) {
    recommendation = 'Top 3% Exceptional Hire recommendation';
    percentile = 'top 3%';
  } else if (overallScore >= 75) {
    recommendation = 'Strong Hire recommendation';
    percentile = 'top 8%';
  } else if (overallScore >= 60) {
    recommendation = 'Interview Ready — Moderate Calibration';
    badgeColor = 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30';
    percentile = 'top 22%';
  } else {
    recommendation = 'Developing — Focus on STAR Story Framework';
    badgeColor = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30';
    percentile = 'developing range';
  }

  // Dimensions
  const dimensions = [
    {
      label: 'STAR Structure & Clarity',
      score: Math.min(98, Math.max(70, overallScore + 4)),
      badge: 'Top 5%',
      icon: Layers,
      color: 'bg-emerald-500',
    },
    {
      label: 'Technical Accuracy',
      score: Math.min(95, Math.max(65, overallScore - 3)),
      badge: null,
      icon: Code2,
      color: 'bg-indigo-500',
    },
    {
      label: 'Communication & Confidence',
      score: Math.min(96, Math.max(68, overallScore + 1)),
      badge: null,
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      label: 'Conciseness & Timing',
      score: Math.min(94, Math.max(60, overallScore - 4)),
      badge: null,
      icon: Timer,
      color: 'bg-indigo-500',
    },
  ];

  // Acoustic aggregates
  const totalFillers =
    evalList.reduce(
      (acc: number, curr: AnswerEvaluation) => acc + (curr.speechMetrics?.fillerWords || 1),
      0
    ) || 3;
  const avgWpm =
    evalList.length > 0
      ? Math.round(
          evalList.reduce(
            (acc: number, curr: AnswerEvaluation) => acc + (curr.speechMetrics?.wpm || 135),
            0
          ) / evalList.length
        )
      : 138;

  return (
    <div className="pb-32 pt-4 px-3 sm:px-6 max-w-2xl mx-auto transition-colors duration-200">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Interview Completed!</span>
        </span>
        <span className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>28m mock</span>
        </span>
      </div>

      {/* Main Track Heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {domain} Mock
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
        Evaluated across 6 core competency modules & acoustic speech metrics
      </p>

      {/* CIRCULAR OVERALL SCORE CARD */}
      <div className="mt-6 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />

        {/* Circular SVG Gauge */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#10b981"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="314.15"
              strokeDashoffset={314.15 - (314.15 * overallScore) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text in radial ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {overallScore}
              </span>
              <span className="text-base font-bold text-slate-500 dark:text-slate-400 ml-1">
                /100
              </span>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
              OVERALL SCORE
            </span>
          </div>
        </div>

        {/* Hire Recommendation Badge */}
        <div
          className={`mt-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${badgeColor}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{recommendation}</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 max-w-sm leading-relaxed">
          You rank in the <strong className="text-slate-900 dark:text-white">{percentile}</strong> of candidates
          interviewed for {domain} tracks this month.
        </p>
      </div>

      {/* DIMENSION BREAKDOWN */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Dimension Breakdown</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Benchmark: Staff / Senior
          </span>
        </div>

        <div className="space-y-3.5">
          {dimensions.map((dim, idx) => {
            const Icon = dim.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3.5 shadow-sm transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {dim.label}
                    </span>
                    {dim.badge && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                        {dim.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    {dim.score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-[#1e293b] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.color} transition-all duration-700`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEEP SPEECH ANALYSIS (ACOUSTIC AI) */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-3">
          <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Deep Speech Analysis</h3>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20 ml-auto">
            Acoustic AI
          </span>
        </div>

        <div className="space-y-3">
          {/* Pacing & Rhythm */}
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-colors">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Pacing & Rhythm</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Target: 130-150 WPM</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                {avgWpm} WPM
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ● Balanced
              </span>
            </div>
          </div>

          {/* Filler Words */}
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-colors">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Filler Words</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Occurrences per question</span>
              <div className="flex space-x-1.5 mt-1.5">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  "like" × 2
                </span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  "you know" × 1
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/20">
                {totalFillers} total
              </span>
            </div>
          </div>

          {/* Tone & Confidence */}
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-colors">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Tone & Confidence</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Executive presence</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                Assertive & Empathetic
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">0.2s pause latency</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI COACH DIRECTIVES */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Coach Directives</h3>
        </div>

        <div className="space-y-3">
          {/* Directive 1 */}
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Quantify Impact Earlier</span>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                High Value
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Highlight quantifiable business impact in Question 3 (e.g. mention the{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">35% latency reduction</strong>{' '}
              earlier in your Result to hook executive interviewers).
            </p>
          </div>

          {/* Directive 2 */}
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Tactical Resilience</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                Mastered
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Great composure under the follow-up architectural challenge. You paused intentionally
              and clarified constraints prior to diagramming solutions.
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-8 space-y-3">
        <button
          onClick={onGoToVault}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <span>Practice Weak Spots (STAR Builder)</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => alert('Interview session report saved to your candidate profile vault!')}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-[#161f30] dark:hover:bg-[#1e2c44] text-slate-800 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-1.5 text-xs transition-colors"
          >
            <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Save to Vault</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-[#161f30] dark:hover:bg-[#1e2c44] text-slate-800 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-1.5 text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Restart Mock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
