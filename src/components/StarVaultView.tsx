import React, { useState } from 'react';
import {
  Sparkles,
  Edit2,
  Plus,
  Mic,
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { StarStory } from '../types';
import { INITIAL_STAR_STORIES } from '../data/mockData';

interface StarVaultViewProps {
  onPracticeStory: (story: StarStory) => void;
}

export const StarVaultView: React.FC<StarVaultViewProps> = ({ onPracticeStory }) => {
  const [stories, setStories] = useState<StarStory[]>(INITIAL_STAR_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Stories');
  const [isEditingSection, setIsEditingSection] = useState<string | null>(null);

  const activeStory = stories[activeStoryIndex] || stories[0];

  const categories = ['All Stories', 'Leadership', 'Conflict Resolution', 'Innovation'];

  const filteredStories =
    selectedCategory === 'All Stories'
      ? stories
      : stories.filter((s) => s.category === selectedCategory);

  const handleUpdateActiveField = (
    field: 'situation' | 'task' | 'action' | 'result',
    val: string
  ) => {
    setStories((prev) =>
      prev.map((s, idx) => (idx === activeStoryIndex ? { ...s, [field]: val } : s))
    );
  };

  const handleAddRoiMetric = () => {
    const enrichedResult = `${activeStory.result} Deliberate architecture decisions saved the enterprise an estimated $4.2M in annualized cloud infrastructure spend.`;
    handleUpdateActiveField('result', enrichedResult);
  };

  const handleCreateNewStory = () => {
    const newStory: StarStory = {
      id: `story-${Date.now()}`,
      title: 'New High-Impact Engineering Milestone',
      category: 'Leadership',
      tags: ['Engineering Rigor', 'Velocity'],
      duration: '2m 00s avg',
      readinessScore: 85,
      situation:
        'Describe the context, company scale, and the architectural bottleneck your team encountered.',
      task: 'Define the explicit goal and deliverables you were tasked to solve within strict constraints.',
      action:
        'Detail the concrete engineering decisions, system designs, or organizational changes you instituted.',
      result:
        'Quantify the outcome with percentages, latency reduction, cost savings, or user adoption metrics.',
      aiRecommendation:
        'Ensure you state the baseline metric before the project and the resulting metric after rollout.',
    };
    setStories([newStory, ...stories]);
    setActiveStoryIndex(0);
  };

  return (
    <div className="pb-32 pt-4 px-3 sm:px-6 max-w-2xl mx-auto transition-colors duration-200">
      {/* Top Badge */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1 rounded-full w-fit mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Executive Framework Lab</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        STAR Story Builder
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
        Transform messy work memories into irresistible, structured interview answers.
      </p>

      {/* CATEGORY FILTER CHIPS */}
      <div className="flex items-center space-x-2 overflow-x-auto py-4 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-[#161f30] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat} {cat === 'All Stories' ? `(${stories.length})` : ''}
            </button>
          );
        })}
      </div>

      {/* ACTIVE DRAFT STORY CARD */}
      <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-5 shadow-xl relative transition-colors">
        {/* Status bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              ACTIVE DRAFT • HIGH IMPACT
            </span>
          </div>
          <span className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>{activeStory.duration}</span>
          </span>
        </div>

        {/* Story Title */}
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-3 leading-snug">
          {activeStory.title}
        </h2>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {activeStory.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* STAR BLOCKS (S, T, A, R) */}
        <div className="space-y-3 mt-4">
          {/* S - Situation */}
          <div className="bg-slate-50 dark:bg-[#151c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  S
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    SITUATION
                  </span>
                  {isEditingSection === 'situation' ? (
                    <textarea
                      value={activeStory.situation}
                      onChange={(e) => handleUpdateActiveField('situation', e.target.value)}
                      onBlur={() => setIsEditingSection(null)}
                      autoFocus
                      rows={2}
                      className="w-full bg-white dark:bg-[#0b0f17] border border-indigo-500 rounded p-1.5 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                      {activeStory.situation}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setIsEditingSection(isEditingSection === 'situation' ? null : 'situation')
                }
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* T - Task */}
          <div className="bg-slate-50 dark:bg-[#151c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  T
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    TASK
                  </span>
                  {isEditingSection === 'task' ? (
                    <textarea
                      value={activeStory.task}
                      onChange={(e) => handleUpdateActiveField('task', e.target.value)}
                      onBlur={() => setIsEditingSection(null)}
                      autoFocus
                      rows={2}
                      className="w-full bg-white dark:bg-[#0b0f17] border border-indigo-500 rounded p-1.5 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                      {activeStory.task}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setIsEditingSection(isEditingSection === 'task' ? null : 'task')
                }
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* A - Action */}
          <div className="bg-slate-50 dark:bg-[#151c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  A
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    ACTION
                  </span>
                  {isEditingSection === 'action' ? (
                    <textarea
                      value={activeStory.action}
                      onChange={(e) => handleUpdateActiveField('action', e.target.value)}
                      onBlur={() => setIsEditingSection(null)}
                      autoFocus
                      rows={2}
                      className="w-full bg-white dark:bg-[#0b0f17] border border-indigo-500 rounded p-1.5 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                      {activeStory.action}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setIsEditingSection(isEditingSection === 'action' ? null : 'action')
                }
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* R - Result */}
          <div className="bg-emerald-50/70 dark:bg-[#151c2e] border border-emerald-200 dark:border-slate-800 rounded-2xl p-3.5 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  R
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    RESULT
                  </span>
                  {isEditingSection === 'result' ? (
                    <textarea
                      value={activeStory.result}
                      onChange={(e) => handleUpdateActiveField('result', e.target.value)}
                      onBlur={() => setIsEditingSection(null)}
                      autoFocus
                      rows={2}
                      className="w-full bg-white dark:bg-[#0b0f17] border border-emerald-500 rounded p-1.5 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  ) : (
                    <p className="text-xs text-emerald-900 dark:text-emerald-200/95 font-semibold mt-0.5 leading-relaxed">
                      {activeStory.result}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setIsEditingSection(isEditingSection === 'result' ? null : 'result')
                }
                className="p-1 text-emerald-600 dark:text-emerald-400"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI IMPACT ENHANCER RECOMMENDATION */}
        {activeStory.aiRecommendation && (
          <div className="mt-4 bg-indigo-50 dark:bg-[#141d2f] border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 transition-colors">
            <div className="flex items-center space-x-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Impact Enhancer</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                AI Recommendation
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeStory.aiRecommendation}
            </p>

            <button
              onClick={handleAddRoiMetric}
              className="mt-3 w-full bg-indigo-600/10 hover:bg-indigo-600/20 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add quantifiable business ROI metric</span>
            </button>
          </div>
        )}
      </div>

      {/* THE STORY VAULT SAVED LIST */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Story Vault</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filteredStories.length} Saved
            </span>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer">
            Sort by Ready ▾
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredStories.map((story, idx) => (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(idx)}
              className={`cursor-pointer rounded-2xl p-3.5 flex items-center justify-between transition-all border ${
                activeStory.id === story.id
                  ? 'bg-indigo-50/70 dark:bg-[#151c2e] border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm'
                  : 'bg-white dark:bg-[#111724] border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {story.title}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{story.readinessScore}% Ready</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>{story.tags.slice(0, 2).join(' • ')}</span>
                  <span>•</span>
                  <span>⏱ {story.duration}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span className="hidden sm:inline">Review STAR</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          onClick={handleCreateNewStory}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-[#161f30] dark:hover:bg-[#1e2c44] text-slate-800 dark:text-slate-200 font-bold py-3.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-2 text-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Create Story</span>
        </button>

        <button
          onClick={() => onPracticeStory(activeStory)}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 text-xs transition-all"
        >
          <Mic className="w-4 h-4" />
          <span>Practice with AI</span>
        </button>
      </div>
    </div>
  );
};
