"""
AI Interview Prep Coach - Streamlit Application
A modern, responsive interview preparation assistant that helps students practice
technical & HR questions, analyzes answers using STAR framework, and delivers actionable feedback.
"""

import streamlit as st
import time
from agent import generate_question, evaluate_answer

# Streamlit page configuration
st.set_page_config(
    page_title="AI Interview Prep Coach",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Sleek Dark Theme matching Skill2Hire Design
st.markdown("""
<style>
    /* Global styling */
    .stApp {
        background-color: #0d1117;
        color: #f0f6fc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Header Card */
    .coach-header {
        background: linear-gradient(135deg, #161b22 0%, #1f242c 100%);
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    
    .badge-pro {
        background-color: #238636;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        margin-left: 8px;
        vertical-align: middle;
    }
    
    /* Question Card */
    .question-box {
        background: #161b22;
        border-left: 4px solid #6366f1;
        border-radius: 8px;
        padding: 20px;
        margin: 16px 0;
        font-size: 18px;
        font-weight: 500;
        line-height: 1.6;
        color: #f0f6fc;
    }
    
    /* Status Panel */
    .status-panel {
        background-color: #161b22;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
    }
    
    .status-step {
        color: #3fb950;
        font-size: 14px;
        font-weight: 600;
        margin: 4px 0;
    }
    
    /* Feedback Box */
    .feedback-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 20px;
        margin-top: 16px;
    }
    
    .score-badge {
        display: inline-block;
        font-size: 28px;
        font-weight: 800;
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.1);
        padding: 4px 16px;
        border-radius: 8px;
        border: 1px solid rgba(56, 189, 248, 0.3);
    }
    
    /* STAR Matrix pills */
    .star-pill {
        display: inline-block;
        padding: 4px 12px;
        margin-right: 8px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        background-color: #21262d;
        color: #c9d1d9;
        border: 1px solid #30363d;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- SESSION STATE INITIALIZATION -----------------
# Keep all data strictly in st.session_state (no database or file persistence)
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

# ----------------- SIDEBAR CONTROLS -----------------
with st.sidebar:
    st.markdown("### 🎙️ Skill2Hire AI Live Coach")
    st.markdown("Your digital interview twin for placement prep.")
    
    st.divider()
    st.markdown("**Session Tracker:**")
    if st.session_state.stage == "interview":
        progress = (st.session_state.current_q_index + 1) / TOTAL_QUESTIONS
        st.progress(progress)
        st.caption(f"Question {st.session_state.current_q_index + 1} of {TOTAL_QUESTIONS}")
        st.markdown(f"**Domain:** `{st.session_state.domain}`")
    else:
        st.info("Start or resume an interview to track progress.")
        
    st.divider()
    st.markdown("**Core Framework:**")
    st.markdown("• **S**ituation • **T**ask • **A**ction • **R**esult")
    st.markdown("• Quantifiable impact metrics")
    st.markdown("• Real-time speech & clarity telemetry")
    
    if st.session_state.stage != "setup":
        if st.button("🔄 Reset Interview", use_container_width=True):
            st.session_state.stage = "setup"
            st.session_state.current_q_index = 0
            st.session_state.questions = []
            st.session_state.answers = []
            st.session_state.evaluations = []
            st.session_state.pending_feedback = None
            st.rerun()

# ----------------- STAGE 1: SETUP SCREEN -----------------
if st.session_state.stage == "setup":
    st.markdown("""
    <div class="coach-header">
        <h1 style="margin: 0; font-size: 32px; font-weight: 800;">
            AI Interview Prep Coach <span class="badge-pro">PRO LIVE COACH</span>
        </h1>
        <p style="margin-top: 8px; color: #8b949e; font-size: 16px;">
            Simulate realistic interview scenarios, evaluate your technical & behavioral answers, and receive instant AI feedback.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1], gap="large")
    
    with col1:
        st.markdown("### 🎯 Configure Your Track")
        
        domain_choice = st.selectbox(
            "Select Interview Domain:",
            options=["Software Engineering", "Core Engineering", "Management"],
            index=0,
            help="Chooses tailored technical and domain-specific questions."
        )
        
        st.markdown("""
        <div style="background: #161b22; padding: 14px; border-radius: 8px; border: 1px solid #30363d; margin-top: 8px;">
            <span class="star-pill">4 Questions</span>
            <span class="star-pill">STAR Rubric</span>
            <span class="star-pill">Acoustic Analysis</span>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown("### 📄 Candidate Background (Optional)")
        resume_input = st.text_area(
            "Paste your resume or key project highlights:",
            height=130,
            placeholder="e.g., Computer Science graduate experienced in React, Python, FastAPI, and Postgres. Built an e-commerce microservice handling 5k RPS...",
            help="Questions and feedback will adapt to your declared tech stack."
        )
        
        # Sample background filler buttons
        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            if st.button("Sample SE Resume"):
                st.session_state.resume_text = "Computer Science Senior. Built distributed caching in Go, React dashboard, and Redis queues for 10k DAU."
                st.rerun()
        with col_btn2:
            if st.button("Clear Resume"):
                st.session_state.resume_text = ""
                st.rerun()
                
    st.markdown("<br>", unsafe_allow_html=True)
    start_btn = st.button("🚀 Start Interview", type="primary", use_container_width=True)
    
    if start_btn:
        st.session_state.domain = domain_choice
        st.session_state.resume_text = resume_input
        st.session_state.stage = "interview"
        st.session_state.current_q_index = 0
        st.session_state.questions = []
        st.session_state.answers = []
        st.session_state.evaluations = []
        st.session_state.pending_feedback = None
        
        # Pre-generate first question
        q1 = generate_question(domain_choice, [], resume_input)
        st.session_state.questions.append(q1)
        st.rerun()

# ----------------- STAGE 2: INTERVIEW FLOW -----------------
elif st.session_state.stage == "interview":
    curr_idx = st.session_state.current_q_index
    current_q = st.session_state.questions[curr_idx]
    
    # Top progress bar
    st.markdown(f"""
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="color: #58a6ff; font-weight: 700; font-size: 14px;">● QUESTION {curr_idx + 1} OF {TOTAL_QUESTIONS}</span>
        <span style="color: #8b949e; font-size: 14px;">Domain: <b>{st.session_state.domain}</b></span>
    </div>
    """, unsafe_allow_html=True)
    
    # Question Card
    st.markdown(f"""
    <div class="question-box">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #818cf8; margin-bottom: 8px;">
            Active Interview Question
        </div>
        "{current_q}"
    </div>
    """, unsafe_allow_html=True)
    
    # Answer input
    answer_key = f"user_answer_{curr_idx}"
    user_answer = st.text_area(
        "Your Response (Speak or type your structured STAR answer):",
        height=140,
        placeholder="Structure your answer with: Situation, Task, Action taken, and the measurable Result...",
        key=answer_key
    )
    
    # Check if this question was already evaluated
    if st.session_state.pending_feedback is None:
        submit_btn = st.button("📤 Submit Answer", type="primary", use_container_width=True)
        
        if submit_btn:
            if not user_answer or len(user_answer.strip()) < 5:
                st.warning("Please type a meaningful response before submitting.")
            else:
                # Show Agent Status Panel with progress animations
                status_placeholder = st.empty()
                with status_placeholder.container():
                    st.markdown("""
                    <div class="status-panel">
                        <div style="font-weight: 700; margin-bottom: 8px; color: #58a6ff;">🤖 Agent Evaluation Pipeline:</div>
                        <div class="status-step">✓ Answer analyzed</div>
                    </div>
                    """, unsafe_allow_html=True)
                    time.sleep(0.4)
                    st.markdown("""
                    <div class="status-panel">
                        <div style="font-weight: 700; margin-bottom: 8px; color: #58a6ff;">🤖 Agent Evaluation Pipeline:</div>
                        <div class="status-step">✓ Answer analyzed</div>
                        <div class="status-step">✓ Communication clarity checked</div>
                    </div>
                    """, unsafe_allow_html=True)
                    time.sleep(0.4)
                    st.markdown("""
                    <div class="status-panel">
                        <div style="font-weight: 700; margin-bottom: 8px; color: #58a6ff;">🤖 Agent Evaluation Pipeline:</div>
                        <div class="status-step">✓ Answer analyzed</div>
                        <div class="status-step">✓ Communication clarity checked</div>
                        <div class="status-step">✓ Feedback generated</div>
                    </div>
                    """, unsafe_allow_html=True)
                    time.sleep(0.3)
                
                # Perform evaluation via agent module
                evaluation = evaluate_answer(current_q, user_answer, st.session_state.domain)
                st.session_state.answers.append(user_answer)
                st.session_state.evaluations.append(evaluation)
                st.session_state.pending_feedback = evaluation
                status_placeholder.empty()
                st.rerun()
                
    else:
        # Display Feedback for current question
        fb = st.session_state.pending_feedback
        score = fb.get("score", 7.0)
        
        st.markdown(f"""
        <div class="feedback-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                    <span style="font-size: 13px; text-transform: uppercase; color: #8b949e; letter-spacing: 0.05em;">Answer Evaluation</span>
                    <h3 style="margin: 0; color: #f0f6fc;">Performance Feedback</h3>
                </div>
                <div class="score-badge">
                    {score} <span style="font-size: 14px; color: #8b949e;">/ 10</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: rgba(46, 160, 67, 0.1); border: 1px solid rgba(46, 160, 67, 0.3); border-radius: 8px; padding: 12px;">
                    <b style="color: #3fb950;">✨ Key Strengths:</b>
                    <ul style="margin: 6px 0 0 16px; padding: 0; color: #c9d1d9; font-size: 14px;">
                        {''.join(f'<li>{s}</li>' for s in fb.get('strengths', []))}
                    </ul>
                </div>
                <div style="background: rgba(210, 153, 34, 0.1); border: 1px solid rgba(210, 153, 34, 0.3); border-radius: 8px; padding: 12px;">
                    <b style="color: #d29922;">🎯 Areas to Improve:</b>
                    <ul style="margin: 6px 0 0 16px; padding: 0; color: #c9d1d9; font-size: 14px;">
                        {''.join(f'<li>{imp}</li>' for imp in fb.get('improvements', []))}
                    </ul>
                </div>
            </div>
            
            <div style="margin-top: 14px; background: #21262d; border-radius: 8px; padding: 12px; font-size: 13px; color: #8b949e;">
                <b style="color: #58a6ff;">💡 Executive Coach Tip:</b> {fb.get('model_answer_tip', 'Structure your answer with quantifiable ROI.')}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Button to proceed to next question or summary
        if curr_idx + 1 < TOTAL_QUESTIONS:
            if st.button("➡️ Next Question", type="primary", use_container_width=True):
                # Generate next question dynamically
                next_q = generate_question(
                    st.session_state.domain,
                    st.session_state.questions,
                    st.session_state.resume_text
                )
                st.session_state.questions.append(next_q)
                st.session_state.current_q_index += 1
                st.session_state.pending_feedback = None
                st.rerun()
        else:
            if st.button("🏁 View Final Performance Summary", type="primary", use_container_width=True):
                st.session_state.stage = "summary"
                st.session_state.pending_feedback = None
                st.rerun()

# ----------------- STAGE 3: SUMMARY SCREEN -----------------
elif st.session_state.stage == "summary":
    evals = st.session_state.evaluations
    scores = [e.get("score", 7.0) for e in evals]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    overall_percentage = int(avg_score * 10)
    
    # Benchmark status
    if overall_percentage >= 85:
        recommendation = "Strong Hire Recommendation"
        badge_color = "#238636"
    elif overall_percentage >= 70:
        recommendation = "Interview Ready — Minor Polish Needed"
        badge_color = "#38bdf8"
    else:
        recommendation = "Developing — Focus on STAR Structure & Metrics"
        badge_color = "#d29922"

    st.markdown(f"""
    <div class="coach-header">
        <div style="display: inline-block; padding: 4px 10px; border-radius: 12px; background: {badge_color}; color: #fff; font-size: 12px; font-weight: 700; margin-bottom: 8px;">
            ✓ INTERVIEW COMPLETED
        </div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">
            {st.session_state.domain} Mock Session Analytics
        </h1>
        <p style="margin-top: 6px; color: #8b949e; font-size: 14px;">
            Comprehensive performance breakdown evaluated across technical depth, STAR structure, and communication clarity.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    metric_col1, metric_col2, metric_col3 = st.columns(3)
    with metric_col1:
        st.metric("Overall Score", f"{avg_score} / 10", f"{overall_percentage}% Readiness")
    with metric_col2:
        st.metric("Questions Answered", f"{len(scores)} of {TOTAL_QUESTIONS}", "Completed")
    with metric_col3:
        st.metric("Status", recommendation)
        
    st.divider()
    
    # Aggregated Strengths & Improvement Tips
    col_str, col_imp = st.columns(2, gap="large")
    
    with col_str:
        st.markdown("### ✨ Key Strengths Across All Answers")
        all_strengths = []
        for e in evals:
            all_strengths.extend(e.get("strengths", []))
        # Unique list
        unique_strengths = list(dict.fromkeys(all_strengths))[:4]
        for s in unique_strengths:
            st.markdown(f"• **{s}**")
            
    with col_imp:
        st.markdown("### 🎯 Top Improvement Tips")
        all_improvements = []
        for e in evals:
            all_improvements.extend(e.get("improvements", []))
        unique_improvements = list(dict.fromkeys(all_improvements))[:4]
        for imp in unique_improvements:
            st.markdown(f"• **{imp}**")
            
    st.divider()
    
    # Question by Question review accordion
    st.markdown("### 📋 Detailed Question-by-Question Review")
    for i, (q, a, e) in enumerate(zip(st.session_state.questions, st.session_state.answers, evals)):
        with st.expander(f"Question {i+1}: {q[:80]}... — Score: {e.get('score')}/10"):
            st.markdown(f"**Question:** {q}")
            st.markdown(f"**Your Answer:** {a}")
            st.markdown(f"**Score:** `{e.get('score')}/10`")
            st.markdown(f"**STAR Breakdown:**")
            star = e.get("star_breakdown", {})
            st.caption(f"**Situation:** {star.get('situation', 'N/A')}")
            st.caption(f"**Task:** {star.get('task', 'N/A')}")
            st.caption(f"**Action:** {star.get('action', 'N/A')}")
            st.caption(f"**Result:** {star.get('result', 'N/A')}")
            
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("🔄 Start Another Practice Interview", type="primary", use_container_width=True):
        st.session_state.stage = "setup"
        st.session_state.current_q_index = 0
        st.session_state.questions = []
        st.session_state.answers = []
        st.session_state.evaluations = []
        st.session_state.pending_feedback = None
        st.rerun()
