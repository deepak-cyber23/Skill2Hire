import { AnswerEvaluation, QuestionData } from '../types';

export function evaluateCandidateAnswer(
  question: QuestionData,
  answer: string,
  elapsedSeconds: number = 75
): AnswerEvaluation {
  const text = answer.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Filler words detection
  const fillerRegex = /\b(um|uh|like|you know|basically|actually|sort of|kind of|so yeah|literally)\b/gi;
  const matches = text.match(fillerRegex) || [];
  const detectedFillers = Array.from(new Set(matches.map((m) => m.toLowerCase())));
  const fillerCount = matches.length;

  // WPM estimation
  const effectiveSeconds = Math.max(elapsedSeconds, 20);
  const wpm = Math.round((wordCount / effectiveSeconds) * 60) || 135;

  // Metric detection (%, $, numbers, time units)
  const metricMatch = text.match(/(\d+(\.\d+)?%|\$\d+([kmb])?|\d+x|\d+\s*(ms|seconds|minutes|days|months|users|engineers|services))/gi);
  const hasMetrics = !!metricMatch;
  const metricCount = metricMatch ? metricMatch.length : 0;

  // STAR Component detection
  const lower = text.toLowerCase();
  const hasSituation = lower.includes('when') || lower.includes('company') || lower.includes('facing') || lower.includes('project') || lower.includes('system') || lower.includes('challenge') || lower.includes('problem');
  const hasTask = lower.includes('task') || lower.includes('goal') || lower.includes('responsible') || lower.includes('needed to') || lower.includes('objective') || lower.includes('had to');
  const hasAction = lower.includes('implemented') || lower.includes('architected') || lower.includes('designed') || lower.includes('led') || lower.includes('built') || lower.includes('created') || lower.includes('analyzed') || lower.includes('decided');
  const hasResult = lower.includes('result') || lower.includes('reduced') || lower.includes('increased') || lower.includes('improved') || lower.includes('achieved') || lower.includes('saved') || lower.includes('outcome') || hasMetrics;

  // Calculate score (1.0 to 10.0)
  let baseScore = 6.0;

  if (wordCount >= 30) baseScore += 1.0;
  if (wordCount >= 60) baseScore += 0.8;
  if (hasAction) baseScore += 0.8;
  if (hasResult) baseScore += 0.9;
  if (hasMetrics) baseScore += 0.5;
  if (fillerCount <= 2 && wordCount >= 30) baseScore += 0.4;
  if (fillerCount > 5) baseScore -= 0.6;
  if (wordCount < 15) baseScore = Math.min(baseScore, 4.0);

  const finalScore = Math.min(9.6, Math.max(3.8, Math.round(baseScore * 10) / 10));

  // Determine strengths
  const strengths: string[] = [];
  if (hasAction) {
    strengths.push('Articulated clear engineering ownership and deliberate technical actions.');
  }
  if (hasMetrics) {
    strengths.push(`Quantified real-world impact with clear figures (${metricCount} data points detected).`);
  } else {
    strengths.push('Addressed the core architectural dilemma directly without evasion.');
  }
  if (wordCount >= 50) {
    strengths.push('Demonstrated strong narrative flow with balanced context setting.');
  } else {
    strengths.push('Succinct framing with zero conversational fluff.');
  }
  if (fillerCount <= 2) {
    strengths.push('High executive presence and clean articulation with minimal filler hesitation.');
  }

  // Determine improvement tips
  const improvements: string[] = [];
  if (!hasMetrics) {
    improvements.push('Quantify the business & system outcome (e.g. latency reduced by 35%, $120k cloud savings).');
  }
  if (!hasResult) {
    improvements.push('Explicitly close with the "Result" in your STAR story — what happened after implementation?');
  }
  if (fillerCount > 3) {
    improvements.push(`Reduce verbal filler words (detected ${fillerCount} instances like "${detectedFillers.slice(0, 2).join('", "')}") by embracing deliberate pauses.`);
  }
  if (wordCount < 35) {
    improvements.push('Flesh out the technical trade-offs you evaluated before choosing the final architecture.');
  }
  if (improvements.length < 2) {
    improvements.push('Connect your engineering decisions to broader product OKRs and cross-functional teams.');
  }

  return {
    questionId: question.id,
    score: finalScore,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2),
    starBreakdown: {
      situation: hasSituation ? 'Contextual problem and constraints outlined.' : 'Brief context provided; clarify company scale.',
      task: hasTask ? 'Core mandate and deliverables identified.' : 'Explicitly state the exact objective you owned.',
      action: hasAction ? 'Technical methodology and steps detailed.' : 'Highlight specific personal decisions versus team consensus.',
      result: hasResult ? 'Positive deliverable outcome stated.' : 'Needs concrete metrics, benchmark latency, or adoption percentages.',
    },
    coachTip: hasMetrics
      ? 'Lead with your punchy outcome ("We decreased p99 latency by 40% when...") before diving into technical deep-dives.'
      : 'Always quantify technical success with business ROI (uptime %, cost savings, or deployment frequency) to persuade senior interviewers.',
    speechMetrics: {
      wpm: Math.min(170, Math.max(115, wpm)),
      fillerWords: fillerCount,
      pauseLatencySec: 0.2,
      detectedFillers,
    },
  };
}
