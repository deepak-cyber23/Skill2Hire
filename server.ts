import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------
// In-Memory Real-Time Group Discussion Room Engine
// -------------------------------------------------------------

interface Participant {
  id: string;
  name: string;
  studentId?: string;
  avatar: string;
  role: 'host' | 'participant';
  joinedAt: number;
  isReady: boolean;
  messageCount: number;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'moderator';
  avatar: string;
  content: string;
  timestamp: number;
  isPrompt?: boolean;
  promptType?: string;
}

interface Room {
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
  participants: Participant[];
  messages: Message[];
  finalReport?: any;
}

const rooms = new Map<string, Room>();
const sseClients = new Map<string, Set<express.Response>>();

// Seed a couple of default demo rooms for convenience
const defaultRoomCode = 'GD-8421';
rooms.set(defaultRoomCode, {
  id: defaultRoomCode,
  code: defaultRoomCode,
  topic: 'AI Ethics & Governance: Rapid Innovation vs Regulatory Guardrails',
  category: 'Software Engineering',
  creatorId: 'system-host',
  maxParticipants: 6,
  durationMinutes: 5,
  status: 'waiting',
  startedAt: null,
  expiresAt: null,
  participants: [
    {
      id: 'p-sarah',
      name: 'Sarah Chen',
      studentId: 'STU-1082',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      role: 'participant',
      joinedAt: Date.now() - 60000,
      isReady: true,
      messageCount: 0,
    },
    {
      id: 'p-dev',
      name: 'Dev Patel',
      studentId: 'STU-1145',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      role: 'participant',
      joinedAt: Date.now() - 40000,
      isReady: true,
      messageCount: 0,
    },
  ],
  messages: [
    {
      id: 'm-mod-welcome',
      roomId: defaultRoomCode,
      senderId: 'ai-moderator',
      senderName: 'AI Moderator',
      senderRole: 'moderator',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      content: 'Welcome to this Group Discussion round! Please introduce your perspective clearly and support your arguments with practical examples.',
      timestamp: Date.now() - 30000,
      isPrompt: true,
      promptType: 'general',
    },
  ],
});

function broadcastToRoom(roomCode: string, data: any) {
  const clients = sseClients.get(roomCode);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((client) => {
      try {
        client.write(payload);
      } catch (err) {
        // handled on close
      }
    });
  }
}

// -------------------------------------------------------------
// Grok API Helper Function
// -------------------------------------------------------------
async function callGrokAPI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Grok API responded with status:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('Failed to call Grok API:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Health Check Endpoint
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    grokConfigured: !!process.env.GROK_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Grok 1-on-1 Interview Feedback Endpoint
// -------------------------------------------------------------
app.post('/api/grok/feedback', async (req, res) => {
  const { question, answer, domain, format } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Missing question or answer in request body.' });
  }

  const systemPrompt = `You are an elite executive tech and engineering interview evaluator at top global employers.
Analyze the candidate's answer to the provided interview question.
You MUST output strictly valid JSON matching this structure without markdown formatting or code blocks:
{
  "overallScore100": 78,
  "strengths": [
    "Good communication and direct problem framing",
    "Relevant technical architectural answers",
    "Clear understanding of distributed constraints"
  ],
  "weakAreas": [
    "Answers could be more tightly structured",
    "Some verbal hesitation detected",
    "Need more quantifiable metrics and examples"
  ],
  "communicationQuality": "Clear, articulate with good vocabulary",
  "confidence": "Moderate to high executive presence",
  "relevance": "Directly addressed the technical dilemma",
  "clarity": "Structured narrative flow",
  "improvementSuggestions": [
    "1. Give direct answers first.",
    "2. Support answers with quantifiable examples.",
    "3. Improve confidence and fluency."
  ],
  "actionablePlan": [
    "Step 1: Quantify outcomes with latency and cost metrics",
    "Step 2: Follow Situation -> Task -> Action -> Result strictly",
    "Step 3: Replace filler phrases with silent 1-second pauses"
  ],
  "starBreakdown": {
    "situation": "Contextual problem outlined clearly",
    "task": "Core mandate identified",
    "action": "Technical actions detailed",
    "result": "Deliverable outcome stated"
  },
  "coachTip": "Lead with your punchy quantifiable outcome before diving deep."
}`;

  const userPrompt = `Interview Domain: ${domain || 'Software Engineering'}
Interview Format: ${format || 'Behavioral (STAR)'}
Question: "${question.question}"
Target Competency: ${question.targetCompetency || 'Technical Execution'}
Candidate Answer:
"""
${answer}
"""`;

  let grokRaw = await callGrokAPI(systemPrompt, userPrompt);
  let parsedEvaluation = null;

  if (grokRaw) {
    try {
      // Clean possible markdown code fences
      const cleaned = grokRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedEvaluation = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Could not parse Grok response as JSON:', e);
    }
  }

  if (parsedEvaluation) {
    const score10 = Math.round((parsedEvaluation.overallScore100 / 10) * 10) / 10;
    const finalEvaluation = {
      questionId: question.id,
      score: score10,
      overallScore100: parsedEvaluation.overallScore100 || 78,
      strengths: parsedEvaluation.strengths || [],
      improvements: parsedEvaluation.improvementSuggestions || parsedEvaluation.weakAreas || [],
      weakAreas: parsedEvaluation.weakAreas || [],
      communicationQuality: parsedEvaluation.communicationQuality || 'Articulate and clear',
      confidence: parsedEvaluation.confidence || 'Strong composure',
      relevance: parsedEvaluation.relevance || 'Directly relevant to the question',
      clarity: parsedEvaluation.clarity || 'Logical flow',
      actionablePlan: parsedEvaluation.actionablePlan || [],
      source: 'grok',
      providerNote: 'Analyzed live using xAI Grok API model grok-2-latest',
      starBreakdown: parsedEvaluation.starBreakdown || {
        situation: 'Outlined well',
        task: 'Defined',
        action: 'Described',
        result: 'Stated',
      },
      coachTip: parsedEvaluation.coachTip || 'Structure your responses with STAR and lead with numbers.',
      speechMetrics: {
        wpm: 135,
        fillerWords: (answer.match(/\b(um|uh|like|you know|basically)\b/gi) || []).length,
        pauseLatencySec: 0.2,
        detectedFillers: [],
      },
    };

    return res.json({
      evaluation: finalEvaluation,
      source: 'grok',
      note: 'Evaluated using Grok API',
    });
  }

  // Fallback if GROK_API_KEY is not set or failed
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const fillers = (answer.match(/\b(um|uh|like|you know|basically|actually|literally)\b/gi) || []).length;
  const hasNumbers = /\d+/.test(answer);

  let fallbackScore = 72;
  if (wordCount >= 40) fallbackScore += 10;
  if (hasNumbers) fallbackScore += 8;
  if (fillers <= 2) fallbackScore += 5;
  if (wordCount < 20) fallbackScore -= 15;
  fallbackScore = Math.min(96, Math.max(45, fallbackScore));

  const fallbackEvaluation = {
    questionId: question.id,
    score: Math.round((fallbackScore / 10) * 10) / 10,
    overallScore100: fallbackScore,
    strengths: [
      'Directly addressed the interviewer prompt without dodging core challenges',
      'Articulated clear engineering ownership and deliberate actions',
      'Maintained good conversational flow with balanced context',
    ],
    weakAreas: [
      'Answers could be more tightly structured around quantifiable results',
      fillers > 2 ? `Detected verbal fillers (${fillers} occurrences)` : 'Opportunity to add more specific architecture trade-offs',
      'State the final business ROI or latency impact more prominently',
    ],
    communicationQuality: wordCount > 50 ? 'Strong communication and well-paced delivery' : 'Succinct, but could provide deeper context',
    confidence: fillers <= 1 ? 'High executive presence with steady cadence' : 'Good composure with minor hesitation',
    relevance: 'Directly aligned with target competency: ' + (question.targetCompetency || 'Technical Execution'),
    clarity: 'Follows a logical progression',
    improvementSuggestions: [
      '1. Give direct answers first before elaborating on constraints.',
      '2. Support answers with concrete metrics (latency %, cost $, or throughput).',
      '3. Improve confidence and fluency by replacing filler words with deliberate pauses.',
    ],
    actionablePlan: [
      'Frame answer using STAR: 15s Situation, 15s Task, 45s Action, 15s Quantifiable Result',
      'Prepare 3 key metric points for your flagship projects in advance',
      'Practice pausing silently for 1 second instead of saying "um" or "like"',
    ],
    starBreakdown: {
      situation: 'Contextual dilemma outlined',
      task: 'Core mandate identified',
      action: 'Methodology and technical steps explained',
      result: hasNumbers ? 'Quantified with numbers' : 'Needs explicit performance metrics',
    },
    coachTip: 'Always quantify technical success with business ROI to persuade senior interviewers.',
    speechMetrics: {
      wpm: 135,
      fillerWords: fillers,
      pauseLatencySec: 0.2,
      detectedFillers: [],
    },
    source: 'fallback',
    providerNote: process.env.GROK_API_KEY
      ? 'Fallback used: Grok API temporary rate-limit or network issue.'
      : 'Grok API key not detected in environment. Provide GROK_API_KEY for live Grok responses.',
  };

  return res.json({
    evaluation: fallbackEvaluation,
    source: 'fallback',
    note: process.env.GROK_API_KEY
      ? 'Evaluated via intelligent heuristic (Grok fallback)'
      : 'GROK_API_KEY not configured. Using intelligent heuristic.',
  });
});

// -------------------------------------------------------------
// Grok AI Moderator Intervention Endpoint
// -------------------------------------------------------------
app.post('/api/grok/moderate', async (req, res) => {
  const { topic, messages, participants } = req.body;

  const systemPrompt = `You are an expert, observant AI Moderator in a professional Group Discussion round for tech and management candidates.
Your job is NOT to dominate the discussion, but to observe:
- Participation balance
- Relevance to the topic
- Logical reasoning
- Respectful behavior
- Under-participation or over-participation
Generate a short, constructive, realistic moderator intervention message (1-2 sentences).
Options for intervention types:
- "counterargument" (e.g., "Good point raised. Can someone offer a counterargument?")
- "redirect" (e.g., "Let's bring the discussion back to the main topic.")
- "inclusion" (e.g., "Participants who haven't contributed yet can share their views.")
- "general" (e.g., "How do we balance technical feasibility with user experience here?")

Output strictly valid JSON:
{
  "promptText": "...",
  "promptType": "counterargument"
}`;

  const conversationHistory = (messages || [])
    .map((m: any) => `${m.senderName}: ${m.content}`)
    .slice(-8)
    .join('\n');

  const userPrompt = `Discussion Topic: "${topic}"
Active Participants: ${(participants || []).map((p: any) => p.name).join(', ')}
Recent Messages:
${conversationHistory || 'No messages yet.'}`;

  const grokRaw = await callGrokAPI(systemPrompt, userPrompt);
  if (grokRaw) {
    try {
      const cleaned = grokRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && parsed.promptText) {
        return res.json(parsed);
      }
    } catch (e) {
      console.warn('Grok moderation parse error:', e);
    }
  }

  // Fallback prompt
  return res.json({
    promptText: 'Good point. Can someone provide a counterargument or examine the operational trade-offs?',
    promptType: 'counterargument',
  });
});

// -------------------------------------------------------------
// Grok Final Group & Individual Telemetry Report Endpoint
// -------------------------------------------------------------
app.post('/api/grok/group-feedback', async (req, res) => {
  const { topic, durationMinutes, messages, participants } = req.body;

  const systemPrompt = `You are an elite Group Discussion assessor for top-tier tech and engineering companies.
Analyze the provided multi-candidate discussion transcript.
Generate:
1. Individual reports for EVERY participant (scores out of 100 for participation, communication, relevance, confidence, reasoning, teamInteraction; overall score; strengths; weaknesses; AI suggestions).
2. A comprehensive GROUP SUMMARY (overall quality, major arguments, key takeaways, AI moderator summary).

Output strictly valid JSON matching this schema:
{
  "topic": "...",
  "participantCount": 4,
  "duration": "5 minutes",
  "overallQuality": "High — Dynamic & Collaborative",
  "majorArguments": [
    "Argument 1...",
    "Argument 2..."
  ],
  "keyTakeaways": [
    "Takeaway 1...",
    "Takeaway 2..."
  ],
  "moderatorSummary": "...",
  "participantReports": [
    {
      "participantId": "...",
      "name": "...",
      "overallScore": 82,
      "scores": {
        "participation": 85,
        "communication": 80,
        "relevance": 90,
        "confidence": 75,
        "reasoning": 84,
        "teamInteraction": 86
      },
      "strengths": [
        "Presented relevant points",
        "Responded well to others",
        "Maintained good communication"
      ],
      "weaknesses": [
        "Could speak more confidently",
        "Some points lacked supporting examples"
      ],
      "suggestions": [
        "Use structured arguments",
        "Give concrete examples",
        "Respond directly to counterarguments"
      ]
    }
  ]
}`;

  const conversationHistory = (messages || [])
    .map((m: any) => `${m.senderName} (${m.senderRole}): ${m.content}`)
    .join('\n');

  const participantData = (participants || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    studentId: p.studentId,
  }));

  const userPrompt = `Topic: "${topic}"
Duration: ${durationMinutes || 5} minutes
Registered Participants: ${JSON.stringify(participantData)}
Discussion Transcript:
${conversationHistory || 'Discussion had limited transcript.'}`;

  const grokRaw = await callGrokAPI(systemPrompt, userPrompt);
  if (grokRaw) {
    try {
      const cleaned = grokRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && parsed.participantReports) {
        return res.json({ report: parsed, source: 'grok' });
      }
    } catch (e) {
      console.warn('Grok group report JSON parse error:', e);
    }
  }

  // Fallback structured report
  const participantReports = (participants || []).map((p: any) => {
    const pMessages = (messages || []).filter((m: any) => m.senderId === p.id);
    const count = pMessages.length;
    const wordCount = pMessages.reduce((acc: number, m: any) => acc + m.content.split(/\s+/).length, 0);

    const participation = Math.min(95, Math.max(55, 60 + count * 9));
    const communication = Math.min(95, Math.max(60, 70 + Math.floor(wordCount / 12)));
    const relevance = count > 0 ? 86 : 55;
    const confidence = count > 1 ? 82 : 68;
    const reasoning = wordCount > 30 ? 84 : 70;
    const teamInteraction = count > 1 ? 88 : 62;

    const overall = Math.round(
      participation * 0.2 +
        communication * 0.2 +
        relevance * 0.2 +
        confidence * 0.15 +
        reasoning * 0.15 +
        teamInteraction * 0.1
    );

    return {
      participantId: p.id,
      name: p.name,
      studentId: p.studentId,
      overallScore: Math.min(98, Math.max(48, overall)),
      scores: {
        participation,
        communication,
        relevance,
        confidence,
        reasoning,
        teamInteraction,
      },
      strengths: [
        'Presented clear, well-framed viewpoints on the topic',
        'Demonstrated active listening and acknowledged peer arguments',
        'Maintained respectful professional conduct throughout',
      ],
      weaknesses: [
        count <= 1 ? 'Contributed limited points; aim to speak earlier' : 'Could support points with more quantifiable real-world metrics',
        'Remember to address counterarguments directly before shifting perspectives',
      ],
      suggestions: [
        'Lead with a concise summary statement before elaborating',
        'Anchor claims with concrete engineering or industry case studies',
        'Build explicitly upon previous speakers using linking phrases',
      ],
    };
  });

  const report = {
    topic: topic || 'Group Discussion',
    participantCount: participants.length,
    duration: `${durationMinutes || 5} minutes`,
    overallQuality: (messages || []).length >= 5 ? 'High — Dynamic & Collaborative' : 'Moderate — Initial Round',
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

  return res.json({ report, source: 'fallback' });
});

// -------------------------------------------------------------
// Real-Time Group Discussion REST & SSE Endpoints
// -------------------------------------------------------------

// List active rooms
app.get('/api/gd/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map((r) => ({
    id: r.id,
    code: r.code,
    topic: r.topic,
    category: r.category,
    status: r.status,
    participantCount: r.participants.length,
    maxParticipants: r.maxParticipants,
    durationMinutes: r.durationMinutes,
  }));
  res.json({ rooms: roomList });
});

// Create room
app.post('/api/gd/rooms', (req, res) => {
  const { topic, category, maxParticipants, durationMinutes, hostName, hostStudentId } = req.body;

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const code = `GD-${randomDigits}`;

  const hostId = `host-${Date.now()}`;
  const hostParticipant: Participant = {
    id: hostId,
    name: hostName || 'Host Candidate',
    studentId: hostStudentId || 'STU-HOST',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    role: 'host',
    joinedAt: Date.now(),
    isReady: true,
    messageCount: 0,
  };

  const newRoom: Room = {
    id: code,
    code,
    topic: topic || 'Engineering Dilemma: Monolithic Speed vs Microservices Scale',
    category: category || 'Software Engineering',
    creatorId: hostId,
    maxParticipants: Math.min(10, Math.max(2, Number(maxParticipants) || 6)),
    durationMinutes: Math.min(30, Math.max(2, Number(durationMinutes) || 5)),
    status: 'waiting',
    startedAt: null,
    expiresAt: null,
    participants: [hostParticipant],
    messages: [
      {
        id: `m-init-${Date.now()}`,
        roomId: code,
        senderId: 'ai-moderator',
        senderName: 'AI Moderator',
        senderRole: 'moderator',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
        content: `Welcome to the Group Discussion on "${topic}". Please wait for other participants to join. The discussion will begin when the host launches the round.`,
        timestamp: Date.now(),
        isPrompt: true,
        promptType: 'general',
      },
    ],
  };

  rooms.set(code, newRoom);

  res.json({
    room: newRoom,
    host: hostParticipant,
  });
});

// Get room details
app.get('/api/gd/rooms/:code', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: `Room ${roomCode} not found.` });
  }
  res.json({ room });
});

// Join room
app.post('/api/gd/rooms/:code/join', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const { name, studentId, avatar } = req.body;

  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: `Discussion room ${roomCode} does not exist.` });
  }

  if (room.status === 'ended') {
    return res.status(400).json({ error: 'This discussion round has already completed.' });
  }

  // Check if room is full
  const existingIndex = room.participants.findIndex((p) => p.name.toLowerCase() === name.trim().toLowerCase());
  if (existingIndex >= 0) {
    // Reconnection of same user
    const existing = room.participants[existingIndex];
    return res.json({ room, participant: existing });
  }

  if (room.participants.length >= room.maxParticipants) {
    return res.status(400).json({ error: `Room has reached maximum capacity (${room.maxParticipants} students).` });
  }

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
  ];

  const newParticipant: Participant = {
    id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    studentId: studentId ? studentId.trim() : `STU-${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: avatar || avatars[room.participants.length % avatars.length],
    role: 'participant',
    joinedAt: Date.now(),
    isReady: true,
    messageCount: 0,
  };

  room.participants.push(newParticipant);

  // Broadcast join event
  broadcastToRoom(roomCode, {
    type: 'participant_joined',
    participant: newParticipant,
    participantCount: room.participants.length,
    room,
  });

  res.json({ room, participant: newParticipant });
});

// Leave room
app.post('/api/gd/rooms/:code/leave', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const { participantId } = req.body;

  const room = rooms.get(roomCode);
  if (room) {
    room.participants = room.participants.filter((p) => p.id !== participantId);
    broadcastToRoom(roomCode, {
      type: 'participant_left',
      participantId,
      participantCount: room.participants.length,
      room,
    });
  }
  res.json({ success: true });
});

// Start discussion
app.post('/api/gd/rooms/:code/start', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  room.status = 'active';
  room.startedAt = Date.now();
  room.expiresAt = Date.now() + room.durationMinutes * 60 * 1000;

  const startMessage: Message = {
    id: `msg-start-${Date.now()}`,
    roomId: roomCode,
    senderId: 'ai-moderator',
    senderName: 'AI Moderator',
    senderRole: 'moderator',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    content: `The timer has started (${room.durationMinutes} minutes). Topic: "${room.topic}". Please initiate your opening statements. Remember to be concise and collaborative.`,
    timestamp: Date.now(),
    isPrompt: true,
    promptType: 'general',
  };

  room.messages.push(startMessage);

  broadcastToRoom(roomCode, {
    type: 'discussion_started',
    room,
    startMessage,
    startedAt: room.startedAt,
    expiresAt: room.expiresAt,
  });

  res.json({ room });
});

// Post chat message
app.post('/api/gd/rooms/:code/messages', async (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const { senderId, senderName, content, avatar } = req.body;

  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  if (room.status === 'ended') {
    return res.status(400).json({ error: 'Discussion has already ended.' });
  }

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    roomId: roomCode,
    senderId,
    senderName,
    senderRole: 'student',
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    content: content.trim(),
    timestamp: Date.now(),
  };

  room.messages.push(message);

  // Update participant message count
  const p = room.participants.find((part) => part.id === senderId);
  if (p) {
    p.messageCount = (p.messageCount || 0) + 1;
  }

  // Broadcast user message immediately
  broadcastToRoom(roomCode, {
    type: 'new_message',
    message,
    room,
  });

  res.json({ success: true, message });

  // Intelligent AI Moderator check (intervenes occasionally or when triggered, without dominating)
  const studentMessages = room.messages.filter((m) => m.senderRole === 'student');
  // Check if it's time for an AI moderator prompt (e.g. after every 4-5 student messages, or if topic needs prompt)
  const lastAiPromptIndex = room.messages.map((m) => m.senderRole).lastIndexOf('moderator');
  const messagesSinceLastAi = room.messages.length - 1 - lastAiPromptIndex;

  if (room.status === 'active' && messagesSinceLastAi >= 4 && studentMessages.length >= 4) {
    setTimeout(async () => {
      try {
        const aiPrompt = await callGrokAPI(
          `You are an AI Moderator observing a real-time student group discussion on "${room.topic}". Provide ONE brief constructive prompt (under 25 words). E.g., counterargument, asking a quiet student to speak, or refocusing on trade-offs. Output ONLY the sentence.`,
          `Recent messages:\n` +
            room.messages
              .slice(-4)
              .map((m) => `${m.senderName}: ${m.content}`)
              .join('\n')
        );

        const promptContent =
          aiPrompt?.replace(/"/g, '').trim() ||
          'Good points raised. Can someone explore the counterarguments or architectural trade-offs?';

        const moderatorMsg: Message = {
          id: `mod-${Date.now()}`,
          roomId: roomCode,
          senderId: 'ai-moderator',
          senderName: 'AI Moderator',
          senderRole: 'moderator',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
          content: promptContent,
          timestamp: Date.now(),
          isPrompt: true,
          promptType: 'general',
        };

        room.messages.push(moderatorMsg);
        broadcastToRoom(roomCode, {
          type: 'new_message',
          message: moderatorMsg,
          room,
        });
      } catch (e) {
        // ignore background moderator failure
      }
    }, 1200);
  }
});

// Broadcast typing indicator
app.post('/api/gd/rooms/:code/typing', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const { participantId, isTyping } = req.body;

  broadcastToRoom(roomCode, {
    type: 'typing_update',
    participantId,
    isTyping: !!isTyping,
  });

  res.json({ success: true });
});

// End discussion and generate final telemetry report
app.post('/api/gd/rooms/:code/end', async (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  room.status = 'ended';

  // Broadcast immediate status change
  broadcastToRoom(roomCode, {
    type: 'status_changed',
    status: 'ended',
    room,
  });

  // Generate final report using Grok API if available
  let report = null;
  try {
    const grokRaw = await callGrokAPI(
      `You are an elite Group Discussion assessor. Analyze the multi-candidate discussion on "${room.topic}".
Return strictly valid JSON with topic, participantCount, duration, overallQuality, majorArguments, keyTakeaways, moderatorSummary, and participantReports for each participant with scores out of 100, strengths, weaknesses, and suggestions.`,
      `Transcript:\n` +
        room.messages.map((m) => `${m.senderName} (${m.senderRole}): ${m.content}`).join('\n') +
        `\nParticipants:\n` +
        JSON.stringify(room.participants.map((p) => ({ id: p.id, name: p.name })))
    );

    if (grokRaw) {
      const cleaned = grokRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      report = JSON.parse(cleaned);
    }
  } catch (err) {
    console.warn('Grok final report error:', err);
  }

  if (!report || !report.participantReports) {
    // Fallback calculation
    const participantReports = room.participants.map((p) => {
      const pMessages = room.messages.filter((m) => m.senderId === p.id);
      const count = pMessages.length;
      const words = pMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);

      const participation = Math.min(96, Math.max(50, 62 + count * 8));
      const communication = Math.min(95, Math.max(62, 70 + Math.floor(words / 12)));
      const relevance = count > 0 ? 88 : 55;
      const confidence = count > 1 ? 84 : 70;
      const reasoning = words > 30 ? 86 : 72;
      const teamInteraction = count > 1 ? 88 : 65;

      const overall = Math.round(
        participation * 0.2 +
          communication * 0.2 +
          relevance * 0.2 +
          confidence * 0.15 +
          reasoning * 0.15 +
          teamInteraction * 0.1
      );

      return {
        participantId: p.id,
        name: p.name,
        studentId: p.studentId,
        overallScore: Math.min(98, Math.max(50, overall)),
        scores: {
          participation,
          communication,
          relevance,
          confidence,
          reasoning,
          teamInteraction,
        },
        strengths: [
          'Presented relevant, clear arguments in a professional manner.',
          'Acknowledged peer ideas and maintained collaborative team spirit.',
          'Clear logical articulation of primary points.',
        ],
        weaknesses: [
          count <= 1 ? 'Spoke infrequently; take initiative earlier in the discussion.' : 'Could bring deeper quantifiable metrics to reinforce claims.',
          'Address opposing views directly before presenting alternative solutions.',
        ],
        suggestions: [
          'Use the PREP framework: Point, Reason, Example, Point.',
          'Support arguments with industry benchmarks and metrics.',
          'Actively invite other quiet participants into the conversation.',
        ],
      };
    });

    report = {
      topic: room.topic,
      participantCount: room.participants.length,
      duration: `${room.durationMinutes} minutes`,
      overallQuality: room.messages.length >= 6 ? 'High — Dynamic & Collaborative' : 'Moderate — Formative Round',
      majorArguments: [
        'Balanced engineering agility with long-term reliability and architectural safety.',
        'Explored the trade-offs of centralized governance versus distributed team ownership.',
        'Emphasized clear SLAs, testing automation, and continuous monitoring.',
      ],
      keyTakeaways: [
        'Active listening and respectful rebuttal elevate group discussion scores significantly.',
        'Grounding points in real-world constraints leads to stronger team consensus.',
        'Balanced participation from all candidates creates the highest overall round quality.',
      ],
      moderatorSummary:
        'Candidates engaged actively with constructive debate. Arguments remained grounded in technical practicalities while respecting collaborative norms.',
      participantReports,
    };
  }

  room.finalReport = report;

  broadcastToRoom(roomCode, {
    type: 'discussion_ended',
    room,
    report,
  });

  res.json({ room, report });
});

// Server-Sent Events (SSE) stream for real-time room communication
app.get('/api/gd/rooms/:code/events', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const room = rooms.get(roomCode);

  if (!room) {
    return res.status(404).end('Room not found');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(roomCode)) {
    sseClients.set(roomCode, new Set());
  }
  const clientSet = sseClients.get(roomCode)!;
  clientSet.add(res);

  // Send initial room snapshot
  res.write(`data: ${JSON.stringify({ type: 'init', room })}\n\n`);

  // Heartbeat ping every 15s to keep connection alive through proxies
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(keepAliveInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clientSet.delete(res);
    if (clientSet.size === 0) {
      sseClients.delete(roomCode);
    }
  });
});

// -------------------------------------------------------------
// Vite Middleware / Production Static Handling
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
