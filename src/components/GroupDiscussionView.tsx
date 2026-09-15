import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  PlusCircle,
  LogIn,
  Clock,
  Send,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Shield,
  Award,
  BarChart3,
  TrendingUp,
  Brain,
  Hash,
  ChevronRight,
  Radio,
  UserPlus,
} from 'lucide-react';
import { GroupDiscussionRoom, GroupMessage, GroupParticipant, GroupFinalReport, ParticipantReport } from '../types';

interface GroupDiscussionViewProps {
  onBackToTracks?: () => void;
}

const PRESET_TOPICS = [
  'AI Ethics & Governance: Rapid Innovation vs Regulatory Guardrails',
  'Monolith vs Microservices: Engineering Trade-offs for Hypergrowth Startups',
  'Remote Work vs Office Return: Impact on Productivity, Culture & Architecture',
  'Cloud Cost Optimization vs System Reliability in 99.99% SLAs',
  'Data Privacy & End-to-End Encryption vs Public Safety Surveillance',
];

export const GroupDiscussionView: React.FC<GroupDiscussionViewProps> = () => {
  // Navigation inside Group Discussion
  const [viewState, setViewState] = useState<'lobby' | 'create' | 'join' | 'waiting' | 'active' | 'report'>('lobby');

  // Room creation state
  const [createTopic, setCreateTopic] = useState(PRESET_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [createCategory, setCreateCategory] = useState('Software Engineering');
  const [createMaxParticipants, setCreateMaxParticipants] = useState(6);
  const [createDuration, setCreateDuration] = useState(5);
  const [hostName, setHostName] = useState('Alex Morgan');
  const [hostStudentId, setHostStudentId] = useState('STU-2026-A');

  // Join state
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('Candidate User');
  const [joinStudentId, setJoinStudentId] = useState('STU-3091');

  // Active room data & current participant
  const [room, setRoom] = useState<GroupDiscussionRoom | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<GroupParticipant | null>(null);
  const [openRooms, setOpenRooms] = useState<any[]>([]);

  // Real-time Chat
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedReportParticipantId, setSelectedReportParticipantId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Fetch open rooms on lobby
  useEffect(() => {
    if (viewState === 'lobby') {
      fetch('/api/gd/rooms')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.rooms) {
            setOpenRooms(data.rooms);
          }
        })
        .catch(() => {});
    }
  }, [viewState]);

  // Connect SSE when inside a room (waiting or active)
  useEffect(() => {
    if (!room || (viewState !== 'waiting' && viewState !== 'active')) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const sse = new EventSource(`/api/gd/rooms/${room.code}/events`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init') {
          setRoom(data.room);
          if (data.room.status === 'active' && viewState === 'waiting') {
            setViewState('active');
          }
        } else if (data.type === 'participant_joined') {
          setRoom(data.room);
        } else if (data.type === 'participant_left') {
          setRoom(data.room);
        } else if (data.type === 'discussion_started') {
          setRoom(data.room);
          setViewState('active');
          if (data.expiresAt) {
            const rem = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
            setTimeRemainingSeconds(rem);
          }
        } else if (data.type === 'new_message') {
          setRoom(data.room);
        } else if (data.type === 'typing_update') {
          if (data.participantId !== currentParticipant?.id) {
            setTypingUsers((prev) => {
              if (data.isTyping && !prev.includes(data.participantId)) {
                return [...prev, data.participantId];
              } else if (!data.isTyping) {
                return prev.filter((id) => id !== data.participantId);
              }
              return prev;
            });
          }
        } else if (data.type === 'status_changed') {
          setRoom(data.room);
          if (data.status === 'ended') {
            setViewState('report');
          }
        } else if (data.type === 'discussion_ended') {
          setRoom(data.room);
          setViewState('report');
          setIsGeneratingReport(false);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    sse.onerror = () => {
      // EventSource auto reconnects natively
    };

    return () => {
      sse.close();
    };
  }, [room?.code, viewState]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages, typingUsers]);

  // Timer countdown when active
  useEffect(() => {
    if (viewState !== 'active' || !room?.expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((room.expiresAt! - now) / 1000));
      setTimeRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleEndDiscussion();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState, room?.expiresAt]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // CREATE ROOM
  const handleCreateRoom = async () => {
    const finalTopic = customTopic.trim() ? customTopic.trim() : createTopic;
    if (!hostName.trim()) {
      alert('Please enter your participant name.');
      return;
    }

    try {
      setErrorMessage(null);
      const res = await fetch('/api/gd/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          category: createCategory,
          maxParticipants: createMaxParticipants,
          durationMinutes: createDuration,
          hostName: hostName.trim(),
          hostStudentId: hostStudentId.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create room.');
      }

      const data = await res.json();
      setRoom(data.room);
      setCurrentParticipant(data.host);
      setViewState('waiting');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating discussion room.');
    }
  };

  // JOIN ROOM
  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || joinCode).trim().toUpperCase();
    if (!code) {
      alert('Please enter a room code (e.g. GD-8421).');
      return;
    }
    if (!joinName.trim()) {
      alert('Please enter your participant name.');
      return;
    }

    try {
      setErrorMessage(null);
      const res = await fetch(`/api/gd/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: joinName.trim(),
          studentId: joinStudentId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to join room.');
        return;
      }

      setRoom(data.room);
      setCurrentParticipant(data.participant);

      if (data.room.status === 'active') {
        setViewState('active');
        if (data.room.expiresAt) {
          const rem = Math.max(0, Math.floor((data.room.expiresAt - Date.now()) / 1000));
          setTimeRemainingSeconds(rem);
        }
      } else if (data.room.status === 'ended') {
        setViewState('report');
      } else {
        setViewState('waiting');
      }
    } catch (err: any) {
      setErrorMessage('Network error joining room. Please retry.');
    }
  };

  // START DISCUSSION
  const handleStartDiscussion = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/gd/rooms/${room.code}/start`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setViewState('active');
        setTimeRemainingSeconds(data.room.durationMinutes * 60);
      }
    } catch (err) {
      console.error('Error starting discussion:', err);
    }
  };

  // SEND MESSAGE
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !room || !currentParticipant) return;

    const content = inputMessage.trim();
    setInputMessage('');

    // Clear typing state
    handleTyping(false);

    try {
      await fetch(`/api/gd/rooms/${room.code}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentParticipant.id,
          senderName: currentParticipant.name,
          avatar: currentParticipant.avatar,
          content,
        }),
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // TYPING INDICATOR
  const handleTyping = (typing: boolean) => {
    if (!room || !currentParticipant) return;
    setIsTyping(typing);

    fetch(`/api/gd/rooms/${room.code}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: currentParticipant.id,
        isTyping: typing,
      }),
    }).catch(() => {});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!isTyping) {
      handleTyping(true);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  // END DISCUSSION & GENERATE FINAL REPORT
  const handleEndDiscussion = async () => {
    if (!room) return;
    setIsGeneratingReport(true);
    try {
      const res = await fetch(`/api/gd/rooms/${room.code}/end`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setViewState('report');
      }
    } catch (err) {
      console.error('Error ending discussion:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // COPY ROOM CODE
  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // -------------------------------------------------------------
  // RENDER: LOBBY (Create or Join)
  // -------------------------------------------------------------
  if (viewState === 'lobby') {
    return (
      <div className="pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto transition-colors duration-200">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-violet-900/30 to-indigo-900/40 dark:from-indigo-950/60 dark:via-violet-950/40 dark:to-indigo-950/60 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xl mb-8">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-white/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full mb-3 shadow-sm">
            <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>AI-Moderated Multi-Student Simulation</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Real-Time Group Discussion Round
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Collaborate and debate with other students in real-time. An intelligent AI Moderator monitors
            participation, communication, and logic, generating comprehensive individual performance reports.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setViewState('create')}
              id="lobby-create-room-button"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Discussion Room</span>
            </button>

            <button
              onClick={() => setViewState('join')}
              id="lobby-join-room-button"
              className="bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-[#1e2c44] text-slate-800 dark:text-slate-200 font-bold text-sm px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md flex items-center space-x-2 transition-colors"
            >
              <LogIn className="w-4 h-4 text-indigo-500" />
              <span>Join with Room Code</span>
            </button>
          </div>
        </div>

        {/* Live Available Rooms */}
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-5 sm:p-6 shadow-md transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Available Discussion Sessions
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {openRooms.length} room{openRooms.length === 1 ? '' : 's'} available
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {openRooms.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                No active rooms found. Click "Create Discussion Room" above to start one!
              </div>
            ) : (
              openRooms.map((r) => (
                <div
                  key={r.code}
                  className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                        {r.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {r.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'active'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {r.status === 'active' ? 'IN PROGRESS' : 'WAITING LOBBY'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {r.topic}
                    </h3>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{r.participantCount} / {r.maxParticipants} students</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{r.durationMinutes} min round</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setJoinCode(r.code);
                      setViewState('join');
                    }}
                    className="self-start sm:self-center bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 transition-colors flex items-center space-x-1.5"
                  >
                    <span>Join Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: CREATE DISCUSSION
  // -------------------------------------------------------------
  if (viewState === 'create') {
    return (
      <div className="pb-32 pt-4 px-3 sm:px-6 max-w-2xl mx-auto transition-colors duration-200">
        <button
          onClick={() => setViewState('lobby')}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3 flex items-center space-x-1"
        >
          <span>← Back to Group Lobby</span>
        </button>

        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-xl transition-colors">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Discussion Room
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup topic, duration, and maximum capacity for your round
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {/* Host Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Student / Candidate ID (Optional)
                </label>
                <input
                  type="text"
                  value={hostStudentId}
                  onChange={(e) => setHostStudentId(e.target.value)}
                  placeholder="e.g. STU-2026-A"
                  className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Select Discussion Topic */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Select Discussion Topic
              </label>
              <div className="space-y-2">
                {PRESET_TOPICS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCreateTopic(t);
                      setCustomTopic('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                      createTopic === t && !customTopic
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Or enter your custom discussion topic..."
                  className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Settings: Duration & Max Students */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Round Duration
                </label>
                <select
                  value={createDuration}
                  onChange={(e) => setCreateDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>2 Minutes (Lightning)</option>
                  <option value={5}>5 Minutes (Standard)</option>
                  <option value={10}>10 Minutes (Comprehensive)</option>
                  <option value={15}>15 Minutes (Executive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Max Participants
                </label>
                <select
                  value={createMaxParticipants}
                  onChange={(e) => setCreateMaxParticipants(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>2 Students</option>
                  <option value={4}>4 Students</option>
                  <option value={6}>6 Students (Recommended)</option>
                  <option value={8}>8 Students</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="button"
                id="create-room-submit-btn"
                onClick={handleCreateRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create & Enter Waiting Room</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: JOIN DISCUSSION
  // -------------------------------------------------------------
  if (viewState === 'join') {
    return (
      <div className="pb-32 pt-4 px-3 sm:px-6 max-w-md mx-auto transition-colors duration-200">
        <button
          onClick={() => setViewState('lobby')}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3 flex items-center space-x-1"
        >
          <span>← Back to Group Lobby</span>
        </button>

        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-xl transition-colors">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Join Discussion Room
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the unique room code provided by the organizer
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Room Code / ID
              </label>
              <input
                type="text"
                id="join-room-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. GD-8421"
                className="w-full font-mono text-base font-bold tracking-widest bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                id="join-name-input"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Student ID / Roll No. (Optional)
              </label>
              <input
                type="text"
                id="join-student-id-input"
                value={joinStudentId}
                onChange={(e) => setJoinStudentId(e.target.value)}
                placeholder="e.g. STU-8921"
                className="w-full bg-slate-50 dark:bg-[#0b0f17] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              id="join-room-submit-btn"
              onClick={() => handleJoinRoom()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <span>Join Discussion Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: WAITING ROOM
  // -------------------------------------------------------------
  if (viewState === 'waiting' && room) {
    const isHost = currentParticipant?.role === 'host';

    return (
      <div className="pb-32 pt-4 px-3 sm:px-6 max-w-2xl mx-auto transition-colors duration-200">
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-xl transition-colors">
          {/* Room Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Waiting Lobby
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Room {room.code}
              </h2>
            </div>

            {/* Room Code Copy Button */}
            <button
              onClick={handleCopyCode}
              id="copy-room-code-btn"
              className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-sm"
              title="Copy room code to share"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Discussion Topic Card */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block">
              Discussion Topic
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              "{room.topic}"
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <span>⏱ Duration: {room.durationMinutes} minutes</span>
              <span>👥 Max Capacity: {room.maxParticipants} students</span>
            </div>
          </div>

          {/* Joined Participants list */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Joined Students ({room.participants.length}/{room.maxParticipants})
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ready to start</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {room.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-9 h-9 rounded-full object-cover border border-indigo-500/40"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </span>
                      {p.role === 'host' && (
                        <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded">
                          HOST
                        </span>
                      )}
                      {p.id === currentParticipant?.id && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {p.studentId || 'Participant'}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setViewState('lobby')}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2"
            >
              Leave Room
            </button>

            {isHost ? (
              <button
                onClick={handleStartDiscussion}
                id="host-start-discussion-btn"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95"
              >
                <span>Launch Group Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Waiting for host to start round...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: ACTIVE REAL-TIME DISCUSSION
  // -------------------------------------------------------------
  if (viewState === 'active' && room) {
    const isHost = currentParticipant?.role === 'host';

    return (
      <div className="pb-28 pt-2 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-5.5rem)] transition-colors duration-200">
        {/* Top Discussion Header Bar */}
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between flex-shrink-0 mb-3 transition-colors">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                {room.code}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE DISCUSSION</span>
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
              {room.topic}
            </h2>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Live Countdown Timer */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span className={timeRemainingSeconds < 60 ? 'text-rose-500 animate-pulse' : ''}>
                {formatCountdown(timeRemainingSeconds)}
              </span>
            </div>

            {/* End Discussion Button */}
            <button
              onClick={handleEndDiscussion}
              id="end-group-discussion-btn"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 transition-colors"
            >
              {isHost ? 'End Round' : 'Leave'}
            </button>
          </div>
        </div>

        {/* Participants Horizontal Strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 flex-shrink-0 mb-2 no-scrollbar">
          {room.participants.map((p) => {
            const isMe = p.id === currentParticipant?.id;
            return (
              <div
                key={p.id}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs flex-shrink-0 border transition-all ${
                  isMe
                    ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'bg-white dark:bg-[#111724] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="truncate max-w-[90px]">{p.name}</span>
                <span className="text-[9px] opacity-70">({p.messageCount || 0})</span>
              </div>
            );
          })}
        </div>

        {/* Real-time Messages Container */}
        <div className="flex-1 bg-white dark:bg-[#0f141f] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-4 overflow-y-auto space-y-3.5 shadow-inner transition-colors">
          {room.messages.map((m) => {
            const isMe = m.senderId === currentParticipant?.id;
            const isModerator = m.senderRole === 'moderator';

            // AI Moderator Prompt styling
            if (isModerator) {
              return (
                <div
                  key={m.id}
                  className="mx-auto max-w-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-3 text-center my-2 shadow-sm"
                >
                  <div className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Moderator Observation</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    "{m.content}"
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            }

            // Student chat bubbles
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
              >
                <img
                  src={m.avatar}
                  alt={m.senderName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0 mt-0.5"
                />

                <div className={`max-w-[78%] ${isMe ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {isMe ? 'You' : m.senderName}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-[#182234] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 italic pl-2">
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>Someone is typing a response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Message Bar */}
        <form
          onSubmit={handleSendMessage}
          className="mt-2.5 flex-shrink-0 bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-2 flex items-center space-x-2 shadow-md transition-colors"
        >
          <input
            type="text"
            id="group-discussion-input"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Contribute your point, rebuttal, or synthesis to the group..."
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            id="group-discussion-send-btn"
            disabled={!inputMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-md transition-colors"
            title="Send response"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Conversation Starter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1.5 flex-shrink-0 no-scrollbar">
          {[
            "I'd like to build upon that point...",
            "Considering the architectural trade-offs...",
            "A potential counterargument to that is...",
            "From a scalability and SLA standpoint...",
          ].map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputMessage(starter + ' ')}
              className="text-[11px] whitespace-nowrap bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800/80 transition-colors"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: FINAL REPORT & AI ASSESSMENT
  // -------------------------------------------------------------
  if (viewState === 'report' && room) {
    const report: GroupFinalReport | undefined = room.finalReport;

    if (isGeneratingReport || !report) {
      return (
        <div className="py-20 px-4 text-center max-w-md mx-auto">
          <Bot className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            AI Moderator is Analyzing Round...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Evaluating participation balance, logical reasoning, team dynamics, and scoring each student.
          </p>
        </div>
      );
    }

    const selectedParticipantReport: ParticipantReport =
      report.participantReports.find((p) => p.participantId === selectedReportParticipantId) ||
      report.participantReports.find((p) => p.participantId === currentParticipant?.id) ||
      report.participantReports[0];

    return (
      <div className="pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto transition-colors duration-200">
        {/* Top Return / Lobby Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewState('lobby')}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
          >
            <span>← Back to Group Discussion Lobby</span>
          </button>

          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
            Discussion Round Complete
          </span>
        </div>

        {/* GROUP SUMMARY CARD */}
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-xl transition-colors mb-6">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Executive Group Summary</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            "{report.topic}"
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                Total Participants
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {report.participantCount} Students
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                Discussion Duration
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {report.duration}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                Overall Quality
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {report.overallQuality}
              </span>
            </div>
          </div>

          {/* AI Moderator Summary */}
          <div className="mt-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs">
            <strong className="text-indigo-700 dark:text-indigo-300 block mb-1">
              🤖 AI Moderator Synthesis:
            </strong>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {report.moderatorSummary}
            </p>
          </div>

          {/* Major Arguments & Key Takeaways */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
              <span className="font-bold text-slate-900 dark:text-white block mb-1.5">
                📌 Major Arguments Examined:
              </span>
              <ul className="space-y-1 pl-3 text-slate-600 dark:text-slate-300 list-disc">
                {report.majorArguments.map((arg, i) => (
                  <li key={i}>{arg}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
              <span className="font-bold text-slate-900 dark:text-white block mb-1.5">
                💡 Key Discussion Takeaways:
              </span>
              <ul className="space-y-1 pl-3 text-slate-600 dark:text-slate-300 list-disc">
                {report.keyTakeaways.map((takeaway, i) => (
                  <li key={i}>{takeaway}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* INDIVIDUAL PARTICIPANT REPORTS SECTION */}
        <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Individual Scorecards
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Student Performance Reports
              </h2>
            </div>

            {/* Participant selector pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              {report.participantReports.map((p) => {
                const isSelected = p.participantId === selectedParticipantReport.participantId;
                const isMe = p.participantId === currentParticipant?.id;
                return (
                  <button
                    key={p.participantId}
                    onClick={() => setSelectedReportParticipantId(p.participantId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>{p.name}</span>
                    {isMe && <span className="text-[9px] opacity-80">(You)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Participant Card */}
          {selectedParticipantReport && (
            <div className="mt-5 space-y-5">
              {/* Score header */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Participant: {selectedParticipantReport.name}
                    </h3>
                    {selectedParticipantReport.studentId && (
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        ({selectedParticipantReport.studentId})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Individual GD Assessment & Competency Telemetry
                  </p>
                </div>

                <div className="flex items-baseline space-x-1 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {selectedParticipantReport.overallScore}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 100</span>
                </div>
              </div>

              {/* Sub-Score Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(selectedParticipantReport.scores).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-600 dark:text-slate-400 capitalize">
                        {key === 'teamInteraction' ? 'Team Interaction' : key}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {val}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-2 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Strengths:</span>
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-3 list-disc">
                    {selectedParticipantReport.strengths.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-2 flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Weaknesses:</span>
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-3 list-disc">
                    {selectedParticipantReport.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-2 flex items-center space-x-1.5">
                  <Bot className="w-4 h-4" />
                  <span>AI Suggestions for Improvement:</span>
                </span>
                <ul className="text-slate-800 dark:text-slate-200 space-y-1.5 pl-4 list-disc font-medium">
                  {selectedParticipantReport.suggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setViewState('lobby')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-colors"
            >
              Start New Group Round
            </button>

            <button
              onClick={() => window.print()}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              Export Report PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
