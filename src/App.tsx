/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { PrepTracksView } from './components/PrepTracksView';
import { LiveCoachView } from './components/LiveCoachView';
import { AnalyticsView } from './components/AnalyticsView';
import { StarVaultView } from './components/StarVaultView';
import { GroupDiscussionView } from './components/GroupDiscussionView';
import { PythonCodeModal } from './components/PythonCodeModal';
import { ProfileModal } from './components/ProfileModal';
import { InterviewDomain, InterviewFormat, SeniorityLevel, InterviewerPersona, AnswerEvaluation, StarStory } from './types';
import { PERSONAS, DOMAIN_QUESTIONS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('tracks');
  const [selectedDomain, setSelectedDomain] = useState<InterviewDomain>('Software Engineering');
  const [selectedFormat, setSelectedFormat] = useState<InterviewFormat>('Behavioral (STAR)');
  const [selectedSeniority, setSelectedSeniority] = useState<SeniorityLevel>('Senior/Lead');
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>(PERSONAS[0]);
  const [resumeText, setResumeText] = useState<string>('');

  // Interview session state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(false);

  // Modals
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const currentQuestions = DOMAIN_QUESTIONS[selectedDomain] || DOMAIN_QUESTIONS['Software Engineering'];
  const currentQuestion = currentQuestions[currentQuestionIndex] || currentQuestions[0];

  const handleStartInterview = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setEvaluations({});
    setIsInterviewActive(true);
    setActiveTab('coach');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswerEvaluated = (qId: string, answer: string, evalResult: AnswerEvaluation) => {
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
    setEvaluations((prev) => ({ ...prev, [qId]: evalResult }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Completed all questions
      setIsInterviewActive(false);
      setActiveTab('analytics');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEndSession = () => {
    setIsInterviewActive(false);
    setActiveTab('analytics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePracticeStory = (story: StarStory) => {
    setActiveTab('coach');
    setIsInterviewActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestartMock = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setEvaluations({});
    setIsInterviewActive(false);
    setActiveTab('tracks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top App Header */}
      <Header
        activeTab={activeTab}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'tracks' && (
          <PrepTracksView
            selectedDomain={selectedDomain}
            onSelectDomain={setSelectedDomain}
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
            selectedSeniority={selectedSeniority}
            onSelectSeniority={setSelectedSeniority}
            selectedPersona={selectedPersona}
            onSelectPersona={setSelectedPersona}
            resumeText={resumeText}
            onUpdateResumeText={setResumeText}
            onStartInterview={handleStartInterview}
          />
        )}

        {activeTab === 'coach' && (
          <LiveCoachView
            currentQuestion={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={currentQuestions.length}
            persona={selectedPersona}
            onEndSession={handleEndSession}
            onAnswerEvaluated={handleAnswerEvaluated}
            onNextQuestion={handleNextQuestion}
            existingEvaluation={evaluations[currentQuestion.id]}
          />
        )}

        {activeTab === 'group' && (
          <GroupDiscussionView onBackToTracks={() => setActiveTab('tracks')} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            domain={selectedDomain}
            evaluations={evaluations}
            questions={currentQuestions}
            onGoToVault={() => {
              setActiveTab('vault');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRestart={handleRestartMock}
          />
        )}

        {activeTab === 'vault' && (
          <StarVaultView onPracticeStory={handlePracticeStory} />
        )}
      </main>

      {/* Sticky Bottom Navigation matching all 4 screenshots */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isInterviewActive={isInterviewActive}
      />

      {/* Python / LangChain Streamlit Code Inspection Modal */}
      <PythonCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Candidate Profile / Notification Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
