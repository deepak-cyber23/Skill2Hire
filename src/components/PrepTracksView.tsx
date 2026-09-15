import React, { useState } from 'react';
import {
  Code,
  Briefcase,
  TrendingUp,
  Cpu,
  Sparkles,
  Check,
  Mic,
  ShieldCheck,
  FileText,
  Volume2,
} from 'lucide-react';
import { InterviewDomain, InterviewFormat, SeniorityLevel, InterviewerPersona } from '../types';
import { PERSONAS } from '../data/mockData';

interface PrepTracksViewProps {
  selectedDomain: InterviewDomain;
  onSelectDomain: (domain: InterviewDomain) => void;
  selectedFormat: InterviewFormat;
  onSelectFormat: (format: InterviewFormat) => void;
  selectedSeniority: SeniorityLevel;
  onSelectSeniority: (seniority: SeniorityLevel) => void;
  selectedPersona: InterviewerPersona;
  onSelectPersona: (persona: InterviewerPersona) => void;
  resumeText: string;
  onUpdateResumeText: (text: string) => void;
  onStartInterview: () => void;
}

export const PrepTracksView: React.FC<PrepTracksViewProps> = ({
  selectedDomain,
  onSelectDomain,
  selectedFormat,
  onSelectFormat,
  selectedSeniority,
  onSelectSeniority,
  selectedPersona,
  onSelectPersona,
  resumeText,
  onUpdateResumeText,
  onStartInterview,
}) => {
  const [voiceAnalysisEnabled, setVoiceAnalysisEnabled] = useState(true);
  const [showResumeInput, setShowResumeInput] = useState(false);

  const sampleResumes: Record<InterviewDomain, string> = {
    'Software Engineering':
      'Computer Science Senior. Built distributed caching in Go, React dashboard, and Redis queues for 10k DAU. Experienced with microservices, Postgres, Docker, and AWS.',
    'Core Engineering':
      'Mechanical & Mechatronics Graduate. Lead designer for formula student chassis. SolidWorks CAD, FEA stress analysis, PLC automation, and ISO 9001 compliance standards.',
    'Management':
      'Associate Product Manager with 2 years experience in fintech checkout conversion. Led cross-functional squad of 8 engineers and UX designers. RICE prioritization and SQL analytics.',
  };

  const domainCards = [
    {
      domain: 'Software Engineering' as InterviewDomain,
      title: 'Technology & Digital',
      badge: 'Popular',
      description: 'Software architecture, system design & data engineering',
      tags: ['Cloud Architect', 'Full-Stack Dev', 'Data Scientist'],
      icon: Code,
    },
    {
      domain: 'Management' as InterviewDomain,
      title: 'Business & Operations',
      badge: null,
      description: 'Product management, analytics, roadmaps & team strategy',
      tags: ['Product Manager', 'FP&A Lead', 'Ops Director'],
      icon: Briefcase,
    },
    {
      domain: 'Management' as InterviewDomain,
      title: 'Marketing & Client Success',
      badge: null,
      description: 'Revenue growth, enterprise accounts & strategic partnerships',
      tags: ['Growth Lead', 'Enterprise AE'],
      icon: TrendingUp,
    },
    {
      domain: 'Core Engineering' as InterviewDomain,
      title: 'Engineering & Hardware',
      badge: null,
      description: 'Civil, mechanical, electrical & industrial scale prototypes',
      tags: ['Hardware Lead', 'Systems Eng', 'Quality Spec'],
      icon: Cpu,
    },
  ];

  const formatOptions: { id: InterviewFormat; label: string; sub: string; badge?: string }[] = [
    {
      id: 'Behavioral (STAR)',
      label: 'Behavioral (STAR)',
      sub: 'Impact, conflicts & values',
      badge: 'Recommended: STAR',
    },
    {
      id: 'Technical Deep Dive',
      label: 'Technical Deep Dive',
      sub: 'System rigor & edge cases',
    },
    {
      id: 'Executive Lead',
      label: 'Executive Lead',
      sub: 'Vision & stakeholder org',
    },
    {
      id: 'Recruiter Screen',
      label: 'Recruiter Screen',
      sub: 'Resume & salary alignment',
    },
  ];

  const seniorityLevels: SeniorityLevel[] = ['Entry', 'Mid-Level', 'Senior/Lead', 'Executive'];

  return (
    <div className="pb-32 pt-4 px-4 sm:px-6 max-w-2xl mx-auto transition-colors duration-200">
      {/* Session counter pill */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1.5 rounded-full w-fit mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>8 Free Sessions Remaining • No Card Needed</span>
      </div>

      {/* Hero header */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Ready to ace your interview?
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
        Select target role and mock interview format to configure your AI coach session.
      </p>

      {/* STEP 1: Target Industry & Focus */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              🎯 Target Industry & Focus
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Step 1 of 3</span>
        </div>

        <div className="space-y-3">
          {domainCards.map((item, idx) => {
            const Icon = item.icon;
            const isSelected =
              selectedDomain === item.domain &&
              ((item.title === 'Technology & Digital' && selectedDomain === 'Software Engineering') ||
                (item.title === 'Engineering & Hardware' && selectedDomain === 'Core Engineering') ||
                (item.title === 'Business & Operations' && selectedDomain === 'Management'));

            return (
              <div
                key={idx}
                onClick={() => onSelectDomain(item.domain)}
                className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-[#151c2e] border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                    : 'bg-white dark:bg-[#111724] border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#141b2b]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-[#1a2335] text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h2>
                        {item.badge && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Sub-tags */}
                <div className="flex flex-wrap gap-1.5 mt-3 pl-12">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[11px] font-medium bg-slate-100 dark:bg-[#1e293b]/70 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OPTIONAL RESUME / BACKGROUND INGESTION */}
      <div className="mt-6 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Candidate Resume / Background (Optional)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowResumeInput(!showResumeInput)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
          >
            {showResumeInput ? 'Collapse' : resumeText ? 'Edit (Added)' : '+ Add Background'}
          </button>
        </div>

        {showResumeInput && (
          <div className="mt-3 space-y-2">
            <textarea
              value={resumeText}
              onChange={(e) => onUpdateResumeText(e.target.value)}
              placeholder="Paste your resume summary, project milestones, or target tech stack..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                AI questions will personalize around your experience.
              </span>
              <button
                type="button"
                onClick={() => onUpdateResumeText(sampleResumes[selectedDomain])}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-500/30"
              >
                Use Sample {selectedDomain} Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Mock Interview Format */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            💡 Mock Interview Format
          </span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400/80">
            Recommended: STAR
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {formatOptions.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => onSelectFormat(fmt.id)}
                className={`cursor-pointer rounded-2xl p-3.5 transition-all border ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/40'
                    : 'bg-white dark:bg-[#111724] border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {fmt.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#34d399]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5">{fmt.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 3: Seniority Level */}
      <div className="mt-8">
        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm block mb-3">
          📊 Seniority Level
        </span>
        <div className="grid grid-cols-4 gap-2 bg-slate-100 dark:bg-[#111724] p-1.5 rounded-xl border border-slate-200 dark:border-[#1e293b]">
          {seniorityLevels.map((lvl) => {
            const isSelected = selectedSeniority === lvl;
            return (
              <button
                key={lvl}
                onClick={() => onSelectSeniority(lvl)}
                className={`py-2 px-1 text-center text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 4: Select AI Interviewer Persona */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            🤖 Select AI Interviewer Persona
          </span>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
            Voice Synthesis: 48kHz
          </span>
        </div>

        <div className="space-y-2.5">
          {PERSONAS.map((persona) => {
            const isSelected = selectedPersona.id === persona.id;
            return (
              <div
                key={persona.id}
                onClick={() => onSelectPersona(persona)}
                className={`cursor-pointer rounded-2xl p-3 flex items-center justify-between transition-all border ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-[#151c2e] border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm'
                    : 'bg-white dark:bg-[#111724] border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {persona.name}
                      </h4>
                      <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                        {persona.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {persona.role}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-4 border-indigo-500 bg-white'
                      : 'border border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 5: Audio & Voice Analysis Toggle */}
      <div className="mt-8 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Audio & Voice Analysis
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Real-time pacing telemetry, filler-word counters, and tone confidence indicators.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVoiceAnalysisEnabled(!voiceAnalysisEnabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              voiceAnalysisEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                voiceAnalysisEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio visualizer bar demo */}
        <div className="flex items-center justify-between space-x-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 px-2">
          {[4, 8, 14, 20, 12, 18, 24, 16, 8, 14, 10, 6].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                i % 3 === 0 ? 'bg-emerald-500' : 'bg-indigo-500/60'
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* LAUNCH BUTTON */}
      <div className="mt-8">
        <button
          type="button"
          onClick={onStartInterview}
          className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Mic className="w-5 h-5" />
          <span className="text-base tracking-tight">
            Launch AI Mock Session • {selectedDomain}
          </span>
        </button>

        <div className="flex items-center justify-center space-x-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Simulates real questions from top 500+ tech employers</span>
        </div>
      </div>
    </div>
  );
};
