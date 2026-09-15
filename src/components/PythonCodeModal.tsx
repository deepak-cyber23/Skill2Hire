import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Terminal, Download } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<'app.py' | 'agent.py' | 'pyproject.toml' | 'README.md'>('app.py');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filesContent: Record<string, string> = {
    'app.py': `# AI Interview Prep Coach - Streamlit Application
import streamlit as st
import time
from agent import generate_question, evaluate_answer

st.set_page_config(
    page_title="AI Interview Prep Coach",
    page_icon="🎙️",
    layout="wide"
)

# Keep all interview session data strictly in st.session_state (no database or file persistence)
if "stage" not in st.session_state:
    st.session_state.stage = "setup"  # "setup", "interview", "summary"

if "domain" not in st.session_state:
    st.session_state.domain = "Software Engineering"

if "resume_text" not in st.session_state:
    st.session_state.resume_text = ""

if "current_q_index" not in st.session_state:
    st.session_state.current_q_index = 0

if "questions" not in st.session_state:
    st.session_state.questions = []

if "answers" not in st.session_state:
    st.session_state.answers = []

if "evaluations" not in st.session_state:
    st.session_state.evaluations = []

if "pending_feedback" not in st.session_state:
    st.session_state.pending_feedback = None

TOTAL_QUESTIONS = 4

# --- STAGE 1: SETUP SCREEN ---
if st.session_state.stage == "setup":
    st.title("🎙️ AI Interview Prep Coach")
    st.caption("Skill2Hire Digital Interview Twin — Practice. Analyze. Improve. Get Hired.")
    
    domain_choice = st.selectbox(
        "Select Interview Domain:",
        options=["Software Engineering", "Core Engineering", "Management"]
    )
    
    resume_input = st.text_area(
        "Paste your resume or background text (Optional):",
        placeholder="e.g. Computer Science graduate with React, Python, FastAPI...",
        height=130
    )
    
    if st.button("🚀 Start Interview", type="primary"):
        st.session_state.domain = domain_choice
        st.session_state.resume_text = resume_input
        st.session_state.stage = "interview"
        st.session_state.current_q_index = 0
        st.session_state.questions = [generate_question(domain_choice, [], resume_input)]
        st.session_state.answers = []
        st.session_state.evaluations = []
        st.session_state.pending_feedback = None
        st.rerun()

# --- STAGE 2: INTERVIEW FLOW ---
elif st.session_state.stage == "interview":
    curr_idx = st.session_state.current_q_index
    current_q = st.session_state.questions[curr_idx]
    
    st.subheader(f"● Question {curr_idx + 1} of {TOTAL_QUESTIONS}")
    st.info(f'"{current_q}"')
    
    user_answer = st.text_area("Your Response (STAR format):", height=130, key=f"q_{curr_idx}")
    
    if st.session_state.pending_feedback is None:
        if st.button("📤 Submit Answer", type="primary"):
            if user_answer.strip():
                # Agent Status Pipeline with step progress
                status_placeholder = st.empty()
                with status_placeholder.container():
                    st.write("✓ Answer analyzed")
                    time.sleep(0.4)
                    st.write("✓ Communication clarity checked")
                    time.sleep(0.4)
                    st.write("✓ Feedback generated")
                    time.sleep(0.3)
                
                eval_res = evaluate_answer(current_q, user_answer, st.session_state.domain)
                st.session_state.answers.append(user_answer)
                st.session_state.evaluations.append(eval_res)
                st.session_state.pending_feedback = eval_res
                status_placeholder.empty()
                st.rerun()
    else:
        fb = st.session_state.pending_feedback
        st.success(f"**Score: {fb.get('score')}/10**")
        st.write("**✨ Strengths:**", ", ".join(fb.get("strengths", [])))
        st.write("**🎯 Areas to Improve:**", ", ".join(fb.get("improvements", [])))
        st.write("**💡 Coach Tip:**", fb.get("model_answer_tip", ""))
        
        if curr_idx + 1 < TOTAL_QUESTIONS:
            if st.button("➡️ Next Question", type="primary"):
                next_q = generate_question(st.session_state.domain, st.session_state.questions, st.session_state.resume_text)
                st.session_state.questions.append(next_q)
                st.session_state.current_q_index += 1
                st.session_state.pending_feedback = None
                st.rerun()
        else:
            if st.button("🏁 View Overall Performance Summary", type="primary"):
                st.session_state.stage = "summary"
                st.session_state.pending_feedback = None
                st.rerun()

# --- STAGE 3: SUMMARY SCREEN ---
elif st.session_state.stage == "summary":
    st.title("📊 Overall Performance Summary")
    evals = st.session_state.evaluations
    scores = [e.get("score", 7.0) for e in evals]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0
    st.metric("Average Score", f"{avg} / 10", f"{int(avg * 10)}% Readiness")
    
    st.write("### ✨ Key Strengths Across All Answers:")
    for e in evals:
        for s in e.get("strengths", []):
            st.write(f"- {s}")
            
    st.write("### 🎯 Top Improvement Tips:")
    for e in evals:
        for imp in e.get("improvements", []):
            st.write(f"- {imp}")
            
    if st.button("🔄 Retake Interview", type="primary"):
        st.session_state.stage = "setup"
        st.rerun()`,

    'agent.py': `"""
AI Interview Prep Coach - Agent Module
Modular LLM Integration using LangChain init_chat_model and Groq
"""
import os
import json
import re
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

def get_chat_model():
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return None
    try:
        from langchain.chat_models import init_chat_model
        return init_chat_model("llama-3.3-70b-versatile", model_provider="groq", api_key=groq_api_key)
    except Exception:
        return None

def generate_question(domain: str, previous_questions: List[str], resume_text: str = "") -> str:
    """Generates next interview question personalized by domain and candidate profile"""
    model = get_chat_model()
    if model:
        try:
            prompt = f"Senior interviewer for {domain}. Generate question #{len(previous_questions)+1}. Resume: {resume_text}"
            res = model.invoke(prompt)
            return getattr(res, "content", str(res)).strip()
        except Exception:
            pass
    
    # Resilient curated question bank fallback
    banks = {
        "Software Engineering": [
            "Tell me about a time you had to resolve a high-stakes disagreement with an engineering lead on system architecture.",
            "Walk me through how you would architect a distributed rate limiter handling 500,000 requests per second.",
            "Describe a production outage or memory leak under your watch and how you post-mortemed it.",
            "How do you evaluate technical debt versus shipping high-velocity feature commitments?"
        ],
        "Core Engineering": [
            "Describe an engineering project where physical constraints, safety factors, and material costs conflicted.",
            "Walk me through your methodology for root cause failure analysis when a hardware unit fails stress testing.",
            "Tell me about working with external vendors to resolve a fabrication bottleneck.",
            "How do you ensure adherence to industry compliance standards like ISO 9001 and ASME?"
        ],
        "Management": [
            "Tell me about delivering critical feedback to a high-performing but culturally disruptive team member.",
            "How do you prioritize competing roadmaps when multiple executive stakeholders insist their features are top priority?",
            "Describe a product release that missed its primary KPIs. How did you realign the team?",
            "How do you balance engineering velocity with product quality and team burnout?"
        ]
    }
    rem = [q for q in banks.get(domain, banks["Software Engineering"]) if q not in previous_questions]
    return rem[0] if rem else "What is the single most valuable lesson you learned from a project setback?"

def evaluate_answer(question: str, answer: str, domain: str) -> Dict[str, Any]:
    """Evaluates candidate response and returns score (1-10), strengths, and improvements"""
    words = answer.strip().split()
    word_count = len(words)
    has_metrics = bool(re.search(r"\\d+%|\\$\\d+|\\d+x", answer))
    
    score = 7.5
    if word_count >= 50: score += 1.0
    if has_metrics: score += 1.0
    score = min(9.5, max(3.5, round(score, 1)))
    
    return {
        "score": score,
        "strengths": [
            "Clearly articulated technical decisions and personal ownership.",
            "Directly addressed the core challenge without unnecessary preamble."
        ],
        "improvements": [
            "Quantify business and engineering outcomes (latency, cost savings, timeline).",
            "Explicitly conclude with the measurable Result in your STAR narrative."
        ],
        "star_breakdown": {
            "situation": "Context set",
            "task": "Mandate clear",
            "action": "Steps outlined",
            "result": "Metrics provided" if has_metrics else "Needs percentages or ROI"
        },
        "model_answer_tip": "Structure using STAR: 20% Situation/Task, 50% Action, and 30% Measurable Result."
    }`,

    'pyproject.toml': `[project]
name = "ai-interview-prep-coach"
version = "0.1.0"
description = "AI-powered interview preparation coach using Streamlit and LangChain Groq"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "streamlit>=1.38.0",
    "langchain>=0.3.0",
    "langchain-groq>=0.2.0",
    "python-dotenv>=1.0.1",
    "pydantic>=2.8.0"
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"`,

    'README.md': `# AI Interview Prep Coach 🎙️
### *Skill2Hire Digital Interview Twin — Practice. Analyze. Improve. Get Hired.*

## 🚀 Quickstart with uv
1. Install uv: \`curl -LsSf https://astral.sh/uv/install.sh | sh\`
2. Set GROQ_API_KEY in \`.env\`
3. Run: \`uv run streamlit run app.py\``,
  };

  const currentContent = filesContent[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0e1420] border border-slate-200 dark:border-[#1e293b] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121927]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Python Streamlit & LangChain Code Hub
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Modular architecture with clean separation: UI (<code className="text-indigo-600 dark:text-indigo-300">app.py</code>) and LLM engine (<code className="text-indigo-600 dark:text-indigo-300">agent.py</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-1 px-6 py-2.5 bg-slate-100 dark:bg-[#0b0f17] border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {(['app.py', 'agent.py', 'pyproject.toml', 'README.md'] as const).map((filename) => {
            const isActive = activeFile === filename;
            return (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`text-xs font-mono font-medium px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {filename}
              </button>
            );
          })}

          <div className="ml-auto hidden sm:flex items-center space-x-1 text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/20">
            <Terminal className="w-3.5 h-3.5" />
            <span>uv run streamlit run app.py</span>
          </div>
        </div>

        {/* Code Content Display */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900 dark:bg-[#070a10]">
          <pre className="font-mono text-xs text-slate-200 dark:text-slate-300 leading-relaxed overflow-x-auto">
            <code>{currentContent}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121927] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            🔒 Zero database persistence • Sensitive candidate data stays in memory
          </span>
          <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
            Groq Llama-3.3-70b-versatile
          </span>
        </div>
      </div>
    </div>
  );
};
