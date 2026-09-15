# AI Interview Prep Coach 🎙️
### *Skill2Hire Digital Interview Twin — Practice. Analyze. Improve. Get Hired.*

A complete AI-powered interview preparation assistant designed for students and job seekers preparing for placements and internships. It simulates realistic interview scenarios across **Software Engineering**, **Core Engineering**, and **Management**, tracking the **STAR framework** (Situation, Task, Action, Result) and evaluating speech pacing, filler words, and quantifiable metrics.

---

## 🌟 Key Features

1. **Track Configuration**:
   - Select interview domain: **Software Engineering**, **Core Engineering**, or **Management**
   - Optional candidate resume / background text ingestion
   - Custom persona selection (Sophia Vance, Alex Rivera, Marcus Chen) and format (Behavioral STAR, Technical Deep Dive, Executive Lead)

2. **Adaptive Interview Flow**:
   - Displays 1 question at a time (mix of technical, situational, and HR-style STAR questions)
   - Real-time speech pacing (WPM), filler-word detection (`"like"`, `"um"`), and live audio transcription
   - Simulated candidate webcam PIP with live camera feed toggle
   - **Agent Status Pipeline**:
     - `✓ Answer analyzed`
     - `✓ Communication clarity checked`
     - `✓ Feedback generated`
   - Detailed feedback: Score (1-10), key strengths, actionable improvements, and executive coach tips

3. **STAR Vault (Story Builder)**:
   - Executive Framework Lab transforming work memories into structured Situation, Task, Action, Result blocks
   - AI Impact Enhancer recommendation cards with ROI metrics

4. **Analytics & Performance Summary**:
   - Overall Score circular gauge (1-100) with benchmark recommendation (`Strong Hire`)
   - 4-Dimensional Breakdown: STAR Structure & Clarity, Technical Accuracy, Communication & Confidence, Conciseness & Timing
   - Acoustic AI speech analysis (Pacing & Rhythm, Filler words count, Tone)
   - AI Coach Directives: Tactical resilience & impact quantification

5. **Privacy & Security First**:
   - Zero database persistence: all candidate responses, scores, and resume data remain in memory for the active session (`st.session_state`)
   - `GROQ_API_KEY` read strictly via `.env` with python-dotenv — no UI input for API keys

---

## 🚀 Running the Python Streamlit Version (with `uv`)

### 1. Prerequisites
Install [uv](https://docs.astral.sh/uv/):
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your Groq API key (optional; has offline heuristic fallback if key is omitted):
```bash
cp .env.example .env
# Edit .env and set GROQ_API_KEY="your_groq_api_key"
```

### 3. Run Application
```bash
uv run streamlit run app.py
```

---

## 📁 Architecture & Code Separation

- `app.py`: Streamlit frontend UI logic, session state handling (`st.session_state`), and step navigation.
- `agent.py`: Modular LLM engine containing:
  - `generate_question(domain: str, previous_questions: list, resume_text: str = "") -> str`
  - `evaluate_answer(question: str, answer: str, domain: str) -> dict`
  - LangChain `init_chat_model` integration with Groq `llama-3.3-70b-versatile` and resilient offline fallback.
- `src/`: High-fidelity React + Tailwind CSS web application matching the 4 Skill2Hire interface screens with live webcam preview, speech recognition, audio visualizers, and interactive STAR builder.
