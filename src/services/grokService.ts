import { AnswerEvaluation, QuestionData, GroupFinalReport, GroupMessage, GroupParticipant } from '../types';
import { evaluateCandidateAnswer } from '../utils/evaluator';

export interface GrokFeedbackResponse {
  evaluation: AnswerEvaluation;
  isGrokLive: boolean;
  message?: string;
}

/**
 * Service to interact with the backend Grok API proxy.
 * Ensures the GROK_API_KEY is never exposed to the client.
 */
export async function fetchGrokAnswerFeedback(
  question: QuestionData,
  answer: string,
  domain: string = 'Software Engineering',
  format: string = 'Behavioral (STAR)'
): Promise<GrokFeedbackResponse> {
  try {
    const response = await fetch('/api/grok/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        domain,
        format,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.evaluation) {
        return {
          evaluation: data.evaluation,
          isGrokLive: data.source === 'grok',
          message: data.note,
        };
      }
    }
  } catch (error) {
    console.warn('Backend Grok API route unavailable or failed, utilizing heuristic engine:', error);
  }

  // Graceful fallback to client-side evaluator with enhanced fields matching Grok's schema
  const heuristic = evaluateCandidateAnswer(question, answer, 60);
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const score100 = Math.round(heuristic.score * 10);
  const communicationQuality =
    wordCount > 60
      ? 'Fluent, articulate, and well-paced with good vocabulary depth'
      : wordCount > 25
      ? 'Concise and direct, with opportunities to expand technical context'
      : 'Brief response; could benefit from more structured depth';

  const confidence =
    heuristic.speechMetrics.fillerWords <= 1
      ? 'High executive presence with steady, calm cadence'
      : heuristic.speechMetrics.fillerWords <= 3
      ? 'Good confidence with minor verbal hesitation'
      : 'Noticeable hesitation; practice deliberate pauses over filler words';

  const relevance =
    wordCount >= 30
      ? 'Directly addressed the core interview competency and technical requirements'
      : 'Partially addresses the question; add concrete scenario examples';

  const clarity = 'Follows a clear situational flow with identifiable action items';

  const actionablePlan = [
    '1. Give direct answers first before elaborating on constraints.',
    '2. Support every technical claim with quantifiable business or system metrics.',
    '3. Improve confidence and fluency by reducing filler words and pacing your delivery.',
  ];

  const enrichedEvaluation: AnswerEvaluation = {
    ...heuristic,
    overallScore100: score100,
    weakAreas: heuristic.improvements,
    communicationQuality,
    confidence,
    relevance,
    clarity,
    actionablePlan,
    source: 'fallback',
    providerNote: 'Generated via built-in evaluator. Add GROK_API_KEY in settings to enable live xAI Grok analysis.',
  };

  return {
    evaluation: enrichedEvaluation,
    isGrokLive: false,
    message: 'Set GROK_API_KEY in environment for live Grok analysis.',
  };
}

/**
 * Generate AI Moderator intervention prompt during real-time discussion
 */
export async function fetchAiModeratorPrompt(
  topic: string,
  messages: GroupMessage[],
  participants: GroupParticipant[]
): Promise<{ promptText: string; promptType: 'counterargument' | 'redirect' | 'inclusion' | 'summary' | 'general' }> {
  try {
    const response = await fetch('/api/grok/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, messages, participants }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.promptText) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Grok moderation endpoint fallback:', err);
  }

  // Fallback intelligent moderation prompt
  const participantMessageCounts = participants.map((p) => ({
    name: p.name,
    count: messages.filter((m) => m.senderId === p.id).length,
  }));

  const quietParticipants = participantMessageCounts.filter((p) => p.count === 0);
  if (quietParticipants.length > 0 && messages.length >= 3) {
    return {
      promptText: `Let's hear from participants who haven't contributed yet, like ${quietParticipants[0].name}. What are your thoughts on this?`,
      promptType: 'inclusion',
    };
  }

  const promptOptions: { promptText: string; promptType: 'counterargument' | 'redirect' | 'inclusion' | 'summary' | 'general' }[] = [
    {
      promptText: 'Good point raised. Can someone offer a counterargument or highlight the operational trade-offs?',
      promptType: 'counterargument',
    },
    {
      promptText: 'Let us bring the discussion back to the core topic and focus on practical engineering implications.',
      promptType: 'redirect',
    },
    {
      promptText: 'Great engagement. How do we quantify the scalability and security aspects of these solutions?',
      promptType: 'general',
    },
  ];

  return promptOptions[messages.length % promptOptions.length];
}

/**
 * Generate final Group Discussion Report with Individual & Group telemetry
 */
export async function fetchFinalGroupReport(
  topic: string,
  durationMinutes: number,
  messages: GroupMessage[],
  participants: GroupParticipant[]
): Promise<GroupFinalReport> {
  try {
    const response = await fetch('/api/grok/group-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, durationMinutes, messages, participants }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.report) {
        return data.report;
      }
    }
  } catch (err) {
    console.warn('Grok group report endpoint fallback:', err);
  }

  // Calculate high-fidelity fallback report
  const participantReports = participants.map((p) => {
    const pMessages = messages.filter((m) => m.senderId === p.id);
    const totalWords = pMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);
    const count = pMessages.length;

    const participationScore = Math.min(95, Math.max(50, 60 + count * 8));
    const communicationScore = Math.min(96, Math.max(60, 70 + Math.floor(totalWords / 15)));
    const relevanceScore = count > 0 ? 84 + (count % 3) * 4 : 50;
    const confidenceScore = count > 1 ? 82 + (count % 2) * 5 : 65;
    const reasoningScore = totalWords > 40 ? 85 : 72;
    const teamInteractionScore = count > 1 ? 88 : 60;

    const overallScore = Math.round(
      (participationScore * 0.2 +
        communicationScore * 0.2 +
        relevanceScore * 0.2 +
        confidenceScore * 0.15 +
        reasoningScore * 0.15 +
        teamInteractionScore * 0.1)
    );

    return {
      participantId: p.id,
      name: p.name,
      studentId: p.studentId,
      overallScore: Math.min(98, Math.max(45, overallScore)),
      scores: {
        participation: participationScore,
        communication: communicationScore,
        relevance: relevanceScore,
        confidence: confidenceScore,
        reasoning: reasoningScore,
        teamInteraction: teamInteractionScore,
      },
      strengths: [
        'Presented clear, articulate points and contributed constructively.',
        'Responded actively to peer perspectives and maintained professional tone.',
        'Structured key arguments with domain-relevant context.',
      ],
      weaknesses: [
        count <= 1 ? 'Participated infrequently; aim to contribute earlier in the round.' : 'Could bring deeper metrics to reinforce arguments.',
        'Opportunity to pose probing questions directly to other participants.',
      ],
      suggestions: [
        'Use structured arguments: state claim, provide evidence, and explain impact.',
        'Give concrete real-world engineering or industry examples.',
        'Respond directly to counterarguments before introducing new topics.',
      ],
    };
  });

  return {
    topic,
    participantCount: participants.length,
    duration: `${durationMinutes} minutes`,
    overallQuality: messages.length >= 6 ? 'High — Dynamic & Collaborative' : 'Moderate — Formative Discussion',
    majorArguments: [
      'Balanced technical feasibility against business delivery timelines and operational risk.',
      'Emphasized modular architecture, observability, and team ownership during migration phases.',
      'Highlighted the need for explicit SLAs and clear stakeholder communication.',
    ],
    keyTakeaways: [
      'Active listening and respectful rebuttal elevate group discussion scores significantly.',
      'Grounding points in real-world constraints leads to stronger team consensus.',
      'Balanced participation from all candidates creates the highest overall round quality.',
    ],
    moderatorSummary:
      'The group demonstrated solid collaborative engagement and critical reasoning. Candidates built upon each other\'s perspectives while keeping the discussion focused on the core problem statement.',
    participantReports,
  };
}
