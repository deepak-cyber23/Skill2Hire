import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Lightbulb,
  Gauge,
  Radio,
  CheckCircle2,
  Hourglass,
  Mic,
  MicOff,
  Edit3,
  Video,
  VideoOff,
  ArrowRight,
  Sparkles,
  Bot,
  AlertCircle,
  FileCheck2,
  BrainCircuit,
  Target,
  MessageSquare,
  ShieldCheck,
  ListOrdered,
} from 'lucide-react';
import { QuestionData, InterviewerPersona, AnswerEvaluation } from '../types';
import { fetchGrokAnswerFeedback } from '../services/grokService';

interface LiveCoachViewProps {
  currentQuestion: QuestionData;
  questionIndex: number;
  totalQuestions: number;
  persona: InterviewerPersona;
  onEndSession: () => void;
  onAnswerEvaluated: (qId: string, answer: string, evalResult: AnswerEvaluation) => void;
  onNextQuestion: () => void;
  existingEvaluation?: AnswerEvaluation;
}

export const LiveCoachView: React.FC<LiveCoachViewProps> = ({
  currentQuestion,
  questionIndex,
  totalQuestions,
  persona,
  onEndSession,
  onAnswerEvaluated,
  onNextQuestion,
  existingEvaluation,
}) => {
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showJotNote, setShowJotNote] = useState(false);
  const [jotNoteText, setJotNoteText] = useState('');

  // Grok pipeline evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState<'analyzing' | 'scoring' | 'finalizing'>('analyzing');
  const [currentFeedback, setCurrentFeedback] = useState<AnswerEvaluation | null>(existingEvaluation || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(99);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Synchronize with external evaluation if already evaluated
  useEffect(() => {
    if (existingEvaluation) {
      setCurrentFeedback(existingEvaluation);
    } else {
      setCurrentFeedback(null);
      setAnswerText('');
      setErrorMessage(null);
    }
  }, [currentQuestion.id, existingEvaluation]);

  // Session elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup Web Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your answer in the box below.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  // Candidate camera toggle
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } catch (err) {
        setCameraError('Camera access denied or unavailable. Candidate preview fallback active.');
        setIsCameraActive(false);
      }
    }
  };

  // Live telemetry metrics calculation
  const words = answerText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const detectedFillers = (answerText.match(/\b(um|uh|like|you know|basically|actually|sort of)\b/gi) || []).length;
  const estimatedWpm = wordCount > 0 ? Math.min(160, Math.max(120, Math.round((wordCount / 40) * 130))) : 135;

  // Star status estimation
  const lowerAnswer = answerText.toLowerCase();
  const hasSituation = wordCount >= 10 || lowerAnswer.includes('when') || lowerAnswer.includes('facing');
  const hasTask = wordCount >= 25 || lowerAnswer.includes('task') || lowerAnswer.includes('needed to');
  const hasAction = wordCount >= 40 || lowerAnswer.includes('implemented') || lowerAnswer.includes('built');
  const hasResult = wordCount >= 55 || lowerAnswer.includes('result') || lowerAnswer.includes('%') || lowerAnswer.includes('reduced');

  const starCount = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length;
  const starPercentage = Math.max(25, starCount * 25);

  // Submit Answer & Call Grok API Service
  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || wordCount < 5) {
      alert('Please type or speak an answer before submitting.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    setErrorMessage(null);
    setEvalStep('analyzing');

    // Visual step progression
    const stepTimer1 = setTimeout(() => setEvalStep('scoring'), 600);
    const stepTimer2 = setTimeout(() => setEvalStep('finalizing'), 1200);

    try {
      const result = await fetchGrokAnswerFeedback(
        currentQuestion,
        answerText,
        currentQuestion.domain,
        'Behavioral (STAR)'
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setCurrentFeedback(result.evaluation);
      onAnswerEvaluated(currentQuestion.id, answerText, result.evaluation);
    } catch (err: any) {
      console.error('Feedback evaluation error:', err);
      setErrorMessage('Encountered an issue generating Grok evaluation. Showing fallback feedback.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Sample answer filler for quick testing
  const loadSampleAnswer = () => {
    if (currentQuestion.type === 'behavioral') {
      setAnswerText(
        'In my previous role, our lead architect favored a monolith, while our team proposed microservices for checkout to handle 10x traffic spikes. Instead of arguing opinion, I set up an A/B benchmark simulating 15k concurrent requests. The benchmark proved checkout latency dropped from 850ms to 92ms with isolated service scaling. We adopted the hybrid strangler pattern, resulting in zero downtime during Black Friday and saving $45,000 in monthly compute.'
      );
    } else {
      setAnswerText(
        'To handle 500k RPS rate limiting with low latency, I would design a distributed sliding-window counter using Redis clusters running Lua scripts. Redis provides atomic increments in sub-millisecond time. In front, we place Envoy proxies with local in-memory token buckets to absorb 80% of benign traffic. If a Redis node fails, the system falls back to degraded local limits to prevent cascade outages.'
      );
    }
  };

  return (
    <div className="pb-32 pt-3 px-3 sm:px-6 max-w-2xl mx-auto transition-colors duration-200">
      {/* TOP STATUS BAR */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/80 mb-4">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Q{questionIndex + 1} OF {totalQuestions}</span>
          </span>
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
            ⏱ {formatTimer(secondsElapsed)}
          </span>
        </div>

        <button
          onClick={onEndSession}
          id="live-coach-end-session"
          className="flex items-center space-x-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-500/30 transition-colors shadow-sm"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>End Session</span>
        </button>
      </div>

      {/* SIMULATED VIDEO CALL STAGE */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-2xl aspect-[4/3] sm:aspect-[16/11]">
        {/* Main Interviewer Video / Portrait */}
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-full h-full object-cover object-center filter brightness-[0.92]"
        />

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-black/30 pointer-events-none" />

        {/* Top Interviewer Status Tag */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className="flex items-center space-x-1">
            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 tracking-wide">
            AI Listening
          </span>
        </div>

        {/* Candidate Floating PIP ("You") in Top Right */}
        <div className="absolute top-4 right-4 w-28 sm:w-32 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-indigo-500/70 shadow-xl bg-slate-900 group">
          {isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full bg-slate-800 flex flex-col items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Candidate"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}

          {/* Label "You" and status */}
          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center space-x-1">
            <span>You</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>

          {/* Toggle Camera button on hover / tap */}
          <button
            onClick={toggleCamera}
            id="candidate-camera-toggle"
            className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black/90 rounded text-slate-300 hover:text-white transition-colors"
            title={isCameraActive ? 'Disable webcam' : 'Enable webcam preview'}
          >
            {isCameraActive ? (
              <Video className="w-3 h-3 text-emerald-400" />
            ) : (
              <VideoOff className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Mini audio bar in PIP */}
          <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-0.5">
            <span className={`w-0.5 h-2 rounded-full ${isRecording ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className={`w-0.5 h-3 rounded-full ${isRecording ? 'bg-emerald-400 animate-pulse [animation-delay:0.2s]' : 'bg-slate-500'}`} />
            <span className={`w-0.5 h-1.5 rounded-full ${isRecording ? 'bg-emerald-400 animate-pulse [animation-delay:0.4s]' : 'bg-slate-500'}`} />
          </div>
        </div>

        {/* Bottom Speaker Name */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white drop-shadow-md">
              {persona.name}
            </h3>
            <p className="text-xs text-slate-300/90 font-medium drop-shadow">
              {persona.role}
            </p>
          </div>
        </div>
      </div>

      {cameraError && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 px-2">{cameraError}</p>
      )}

      {/* ACTIVE QUESTION CARD */}
      <div className="mt-4 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-md dark:shadow-lg transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center space-x-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>ACTIVE {currentQuestion.type.toUpperCase()} QUESTION</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {currentQuestion.targetCompetency}
          </span>
        </div>

        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
          "{currentQuestion.question}"
        </p>

        {showHint && (
          <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
            <strong className="text-indigo-700 dark:text-indigo-300">💡 Interview Coach Hint:</strong> {currentQuestion.hint}
          </div>
        )}
      </div>

      {/* LIVE SPEECH & ACOUSTIC TELEMETRY BAR */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Speed / Pace */}
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3 flex items-center space-x-3 shadow-sm transition-colors">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Speech Pace
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {estimatedWpm} WPM (Optimal)
            </span>
          </div>
        </div>

        {/* Filler Words */}
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3 flex items-center space-x-3 shadow-sm transition-colors">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Filler Words
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              {detectedFillers} detected {detectedFillers > 0 ? '("um...")' : '(Clean)'}
            </span>
          </div>
        </div>
      </div>

      {/* STAR FRAMEWORK MATRIX */}
      <div className="mt-3 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            STAR Framework Matrix
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {starPercentage}% Structured
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Situation */}
          <div
            className={`p-2 rounded-xl text-center border transition-all ${
              hasSituation
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold block">Situation</span>
            <span className="text-[10px] opacity-80">{hasSituation ? 'Done' : 'Pending'}</span>
          </div>

          {/* Task */}
          <div
            className={`p-2 rounded-xl text-center border transition-all ${
              hasTask
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold block">Task</span>
            <span className="text-[10px] opacity-80">{hasTask ? 'Done' : 'Pending'}</span>
          </div>

          {/* Action */}
          <div
            className={`p-2 rounded-xl text-center border transition-all ${
              hasAction
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                : isRecording
                ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold block">Action</span>
            <span className="text-[10px] opacity-80">
              {hasAction ? 'Done' : isRecording ? 'Speaking' : 'Pending'}
            </span>
          </div>

          {/* Result */}
          <div
            className={`p-2 rounded-xl text-center border transition-all ${
              hasResult
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Hourglass className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold block">Result</span>
            <span className="text-[10px] opacity-80">{hasResult ? 'Done' : 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* JOT NOTE ACCORDION */}
      {showJotNote && (
        <div className="mt-3 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">📝 Private Scratchpad</span>
            <button
              onClick={() => setShowJotNote(false)}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Close
            </button>
          </div>
          <textarea
            value={jotNoteText}
            onChange={(e) => setJotNoteText(e.target.value)}
            placeholder="Bullet point your metrics, key numbers, or architecture points..."
            rows={2}
            className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* CANDIDATE ANSWER INPUT / LIVE TRANSCRIPTION */}
      {!currentFeedback && (
        <div className="mt-4 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Your Answer (Speak or Type)
              </span>
            </div>
            <button
              type="button"
              id="fill-sample-answer-btn"
              onClick={loadSampleAnswer}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20"
            >
              Fill Sample Answer
            </button>
          </div>

          <textarea
            id="candidate-answer-textarea"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Structure your answer using the STAR framework: Situation, Task, Action taken, and quantifiable Result..."
            rows={4}
            className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />

          {/* Quick Helper Bar */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            {/* Hint and Jot Note buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center space-x-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Hint</span>
              </button>

              <button
                type="button"
                onClick={() => setShowJotNote(!showJotNote)}
                className="flex items-center space-x-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Jot Note</span>
              </button>
            </div>

            {/* Central Floating Mic recording button */}
            <button
              type="button"
              id="live-coach-mic-button"
              onClick={toggleRecording}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }`}
              title={isRecording ? 'Click to stop recording' : 'Click to speak answer'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* GROK AI EVALUATION LOADING STATE */}
      {isEvaluating && !currentFeedback && (
        <div className="mt-4 bg-white dark:bg-[#111724] border border-indigo-300 dark:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-colors">
          <div className="flex items-center space-x-2.5 mb-3">
            <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Grok AI Interview Evaluator in Progress...
            </h4>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Analyzing answer architecture & technical depth</span>
            </div>

            <div
              className={`flex items-center space-x-2 text-xs font-medium ${
                evalStep === 'scoring' || evalStep === 'finalizing'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Calibrating communication quality, confidence & relevance</span>
            </div>

            <div
              className={`flex items-center space-x-2 text-xs font-medium ${
                evalStep === 'finalizing'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Compiling concise suggestions & actionable plan via Grok</span>
            </div>
          </div>
        </div>
      )}

      {/* ERROR NOTICE IF ANY */}
      {errorMessage && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* COMPREHENSIVE GROK AI FEEDBACK CARD */}
      {currentFeedback && (
        <div className="mt-4 bg-white dark:bg-[#111724] border border-emerald-500/30 dark:border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl transition-colors">
          {/* Header with Overall Score */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  AI Feedback Report
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                  {currentFeedback.source === 'grok' ? '⚡ xAI Grok Live' : 'Grok-Calibrated'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Overall Score: {currentFeedback.overallScore100 || Math.round(currentFeedback.score * 10)}/100
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl flex items-baseline space-x-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {currentFeedback.overallScore100 || Math.round(currentFeedback.score * 10)}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          {/* Performance Dimensions (Communication, Confidence, Relevance, Clarity) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                Communication Quality
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {currentFeedback.communicationQuality || 'Articulate and structured.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                Confidence
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {currentFeedback.confidence || 'Steady executive pacing.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                Relevance of Answers
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {currentFeedback.relevance || 'Directly aligned with core dilemma.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                Clarity
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {currentFeedback.clarity || 'Logical progression of thought.'}
              </p>
            </div>
          </div>

          {/* Strengths & Weak Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {/* Strengths */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Strengths:</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pl-3 list-disc">
                {currentFeedback.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Weak Areas */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-3.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Weak Areas:</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pl-3 list-disc">
                {(currentFeedback.weakAreas || currentFeedback.improvements).map((wa, idx) => (
                  <li key={idx}>{wa}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">
              <ListOrdered className="w-4 h-4" />
              <span>Improvement Suggestions:</span>
            </div>
            <ol className="text-xs text-slate-800 dark:text-slate-200 space-y-1.5 pl-4 list-decimal font-medium">
              {(currentFeedback.improvements || []).map((suggestion, idx) => (
                <li key={idx}>{suggestion.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          </div>

          {/* Actionable Improvement Plan */}
          {currentFeedback.actionablePlan && currentFeedback.actionablePlan.length > 0 && (
            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
              <span className="font-bold text-slate-900 dark:text-white block mb-1.5 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Actionable Improvement Plan:</span>
              </span>
              <ul className="space-y-1 pl-3 text-slate-600 dark:text-slate-300 list-disc">
                {currentFeedback.actionablePlan.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STAR Framework details */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5 text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">Situation: </span>
              <span className="text-slate-700 dark:text-slate-300">{currentFeedback.starBreakdown.situation}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">Task: </span>
              <span className="text-slate-700 dark:text-slate-300">{currentFeedback.starBreakdown.task}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">Action: </span>
              <span className="text-slate-700 dark:text-slate-300">{currentFeedback.starBreakdown.action}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">Result: </span>
              <span className="text-slate-700 dark:text-slate-300">{currentFeedback.starBreakdown.result}</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT / NEXT QUESTION BUTTON */}
      <div className="mt-5">
        {!currentFeedback ? (
          <button
            type="button"
            id="submit-answer-btn"
            onClick={handleSubmitAnswer}
            disabled={isEvaluating}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <FileCheck2 className="w-5 h-5" />
            <span className="text-base tracking-tight">Submit Answer for Grok AI Evaluation</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            id="proceed-next-question-btn"
            onClick={onNextQuestion}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <span className="text-base tracking-tight">
              {questionIndex + 1 < totalQuestions ? 'Proceed to Next Question' : 'View Final Performance Summary'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
