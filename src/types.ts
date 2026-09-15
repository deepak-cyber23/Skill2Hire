export type InterviewDomain = 'Software Engineering' | 'Core Engineering' | 'Management';

export type InterviewFormat = 'Behavioral (STAR)' | 'Technical Deep Dive' | 'Executive Lead' | 'Recruiter Screen';

export type SeniorityLevel = 'Entry' | 'Mid-Level' | 'Senior/Lead' | 'Executive';

export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  voiceDesc: string;
  tag: string;
}

export interface QuestionData {
  id: string;
  question: string;
  type: 'behavioral' | 'technical';
  domain: InterviewDomain;
  targetCompetency: string;
  hint: string;
}

export interface AnswerEvaluation {
  questionId: string;
  score: number; // 1-10 or 1-100 mapped
  overallScore100?: number;
  strengths: string[];
  improvements: string[];
  weakAreas?: string[];
  communicationQuality?: string;
  confidence?: string;
  relevance?: string;
  clarity?: string;
  actionablePlan?: string[];
  source?: 'grok' | 'heuristic' | 'fallback';
  providerNote?: string;
  starBreakdown: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  coachTip: string;
  speechMetrics: {
    wpm: number;
    fillerWords: number;
    pauseLatencySec: number;
    detectedFillers: string[];
  };
}

export interface StarStory {
  id: string;
  title: string;
  category: string;
  tags: string[];
  duration: string;
  readinessScore: number;
  situation: string;
  task: string;
  action: string;
  result: string;
  aiRecommendation?: string;
}

export interface InterviewSession {
  domain: InterviewDomain;
  format: InterviewFormat;
  seniority: SeniorityLevel;
  persona: InterviewerPersona;
  resumeText: string;
  questions: QuestionData[];
  currentIndex: number;
  answers: Record<string, string>;
  evaluations: Record<string, AnswerEvaluation>;
  startTime: number;
  isCompleted: boolean;
}

// -------------------------------------------------------------
// Real-Time Group Discussion Types
// -------------------------------------------------------------

export interface GroupParticipant {
  id: string;
  name: string;
  studentId?: string;
  avatar: string;
  role: 'host' | 'participant';
  joinedAt: number;
  isReady: boolean;
  isTyping?: boolean;
  messageCount: number;
}

export interface GroupMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'moderator';
  avatar: string;
  content: string;
  timestamp: number;
  isPrompt?: boolean;
  promptType?: 'counterargument' | 'redirect' | 'inclusion' | 'summary' | 'general';
}

export interface ParticipantReport {
  participantId: string;
  name: string;
  studentId?: string;
  overallScore: number; // 0-100
  scores: {
    participation: number;
    communication: number;
    relevance: number;
    confidence: number;
    reasoning: number;
    teamInteraction: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface GroupFinalReport {
  topic: string;
  participantCount: number;
  duration: string;
  overallQuality: string;
  majorArguments: string[];
  keyTakeaways: string[];
  moderatorSummary: string;
  participantReports: ParticipantReport[];
}

export interface GroupDiscussionRoom {
  id: string;
  code: string;
  topic: string;
  category: string;
  creatorId: string;
  maxParticipants: number;
  durationMinutes: number;
  status: 'waiting' | 'active' | 'ended';
  startedAt: number | null;
  expiresAt: number | null;
  participants: GroupParticipant[];
  messages: GroupMessage[];
  finalReport?: GroupFinalReport;
}

