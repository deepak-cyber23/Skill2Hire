"""
AI Interview Prep Coach - Agent Module
Contains decoupled core logic for question generation and answer evaluation.
Supports LangChain Groq (via init_chat_model) with resilient fallback for offline/prototype execution.
"""

import os
import json
import re
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Attempt to initialize LangChain model if langchain is available and key is present
def get_chat_model():
    """
    Initializes and returns the LangChain chat model.
    Uses langchain.chat_models.init_chat_model with groq if GROQ_API_KEY is present.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return None
    
    try:
        from langchain.chat_models import init_chat_model
        # Initialize Llama-3 model on Groq via LangChain standard interface
        model = init_chat_model("llama-3.3-70b-versatile", model_provider="groq", api_key=groq_api_key, temperature=0.7)
        return model
    except Exception as e:
        # Fallback if specific init_chat_model version differs
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key=groq_api_key, temperature=0.7)
        except Exception:
            return None


def generate_question(domain: str, previous_questions: List[str], resume_text: str = "") -> str:
    """
    Generates a personalized interview question based on domain, previous questions, and resume.
    
    Args:
        domain: One of 'Software Engineering', 'Core Engineering', 'Management'
        previous_questions: List of questions already asked in this session
        resume_text: Optional candidate resume or background text
        
    Returns:
        A relevant interview question string (mix of technical and behavioral)
    """
    model = get_chat_model()
    q_num = len(previous_questions) + 1
    
    # Alternate between technical, situational, and behavioral questions
    q_type = "technical" if q_num % 2 == 1 else "behavioral / HR-style STAR"
    
    if model:
        try:
            system_prompt = (
                f"You are a senior hiring lead conducting an interview in the {domain} domain.\n"
                f"Generate question #{q_num} of 5. It should be a {q_type} question.\n"
                f"Candidate Resume / Background:\n{resume_text if resume_text else 'Standard candidate profile.'}\n"
                f"Previous questions asked:\n" + "\n".join(f"- {q}" for q in previous_questions) + "\n"
                "Provide ONLY the question text without any conversational preamble."
            )
            response = model.invoke(system_prompt)
            content = getattr(response, "content", str(response)).strip()
            if content:
                # Remove quotes if wrapped
                return content.strip('"\'')
        except Exception as e:
            # Fall through to domain-specific question bank
            pass

    # Built-in adaptive curated question bank for reliable prototype testing
    question_banks: Dict[str, List[str]] = {
        "Software Engineering": [
            "Tell me about a complex system architecture you designed or contributed to, and the primary trade-offs you made.",
            "Describe a time when you experienced a critical production outage or bug. How did you diagnose the root cause and handle communication?",
            "How do you approach database optimization when query latency begins degrading under 10x traffic spikes?",
            "Can you explain the difference between microservices and monoliths in terms of developer velocity, consistency, and operational complexity?",
            "Tell me about a time you had a fundamental disagreement with an engineering lead or product manager regarding technical debt versus new features."
        ],
        "Core Engineering": [
            "Walk me through an engineering project where you had to balance strict physical constraints, safety tolerances, and cost limits.",
            "Describe a situation where a prototype or physical component failed stress testing. How did you iterate on the root cause?",
            "How do you ensure adherence to industry compliance standards (e.g., ISO, ASTM, ASME) throughout your design and testing lifecycle?",
            "Tell me about a time you had to collaborate with cross-functional supply chain or manufacturing teams to solve an unexpected bottleneck.",
            "How do you document engineering calculations and simulations so that other engineers can audit and reproduce your conclusions?"
        ],
        "Management": [
            "How do you prioritize competing strategic objectives when multiple key stakeholders demand immediate delivery?",
            "Tell me about a time you had to deliver tough performance feedback or manage an underperforming team member.",
            "Describe a product or operational initiative where the initial launch failed to meet target KPIs. What pivot did you execute?",
            "How do you align engineering velocity with bottom-line business ROI and customer satisfaction metrics?",
            "Give me an example of how you build trust and psychological safety within a newly formed or geographically distributed team."
        ]
    }
    
    domain_bank = question_banks.get(domain, question_banks["Software Engineering"])
    
    # Filter out already asked questions
    remaining = [q for q in domain_bank if q not in previous_questions]
    if remaining:
        return remaining[0]
    
    return f"In your experience within {domain}, what is the single most valuable lesson you have learned from a project setback?"


def evaluate_answer(question: str, answer: str, domain: str) -> Dict[str, Any]:
    """
    Evaluates candidate answer against the question and domain.
    
    Args:
        question: The interview question asked
        answer: The candidate's response
        domain: Interview domain
        
    Returns:
        dict with keys:
            - score: float (1-10)
            - strengths: List[str]
            - improvements: List[str]
            - star_breakdown: Dict[str, str]
            - model_answer_tip: str
    """
    cleaned_answer = answer.strip()
    word_count = len(cleaned_answer.split())
    
    # Try LLM evaluation if available
    model = get_chat_model()
    if model and word_count >= 5:
        try:
            eval_prompt = (
                f"You are an expert interview evaluator for the {domain} domain.\n"
                f"Question: {question}\n"
                f"Candidate Answer: {answer}\n\n"
                "Evaluate this answer rigorously. Return valid JSON only with the following exact keys:\n"
                "{\n"
                '  "score": <float between 1.0 and 10.0>,\n'
                '  "strengths": ["<strength 1>", "<strength 2>"],\n'
                '  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],\n'
                '  "star_breakdown": {"situation": "<summary>", "task": "<summary>", "action": "<summary>", "result": "<summary>"},\n'
                '  "model_answer_tip": "<one concise sentence advice to make this answer top 5%>"\n'
                "}"
            )
            response = model.invoke(eval_prompt)
            raw = getattr(response, "content", str(response))
            # Extract JSON block
            json_match = re.search(r"\{.*\}", raw, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                return {
                    "score": round(float(data.get("score", 7.5)), 1),
                    "strengths": data.get("strengths", ["Clear explanation of key concepts"]),
                    "improvements": data.get("improvements", ["Quantify metrics and business impact"]),
                    "star_breakdown": data.get("star_breakdown", {
                        "situation": "Context set",
                        "task": "Objective identified",
                        "action": "Steps detailed",
                        "result": "Outcome stated"
                    }),
                    "model_answer_tip": data.get("model_answer_tip", "Lead with the outcome, then outline your technical decisions.")
                }
        except Exception:
            pass

    # Heuristic analysis engine when offline or no API key
    if word_count < 10:
        return {
            "score": 3.5,
            "strengths": ["Direct response to the prompt"],
            "improvements": [
                "Answer is too brief; elaborate with a concrete real-world example",
                "Apply the STAR framework (Situation, Task, Action, Result) to provide structure"
            ],
            "star_breakdown": {
                "situation": "Minimal context provided",
                "task": "Task unstated",
                "action": "Action briefly mentioned",
                "result": "No metrics or outcome shared"
            },
            "model_answer_tip": "Expand your response to 150-250 words with specific technical choices and tangible results."
        }
    
    # Assess keywords and STAR cues
    has_metrics = bool(re.search(r"\d+%|\$\d+|\d+x|\d+ months|\d+ days|\d+ engineers", cleaned_answer, re.I))
    has_action = any(w in cleaned_answer.lower() for w in ["implemented", "designed", "architected", "refactored", "led", "solved", "built", "managed"])
    has_result = any(w in cleaned_answer.lower() for w in ["result", "reduced", "increased", "improved", "saved", "impact", "delivered", "outcome"])
    
    base_score = 6.5
    if word_count >= 50:
        base_score += 1.0
    if has_metrics:
        base_score += 1.2
    if has_action:
        base_score += 0.8
    if has_result:
        base_score += 0.7
    
    final_score = min(9.5, max(4.0, round(base_score, 1)))
    
    strengths = []
    if has_action:
        strengths.append("Clearly articulated proactive personal contributions and technical decisions.")
    else:
        strengths.append("Directly addressed the core theme of the question.")
    
    if word_count >= 60:
        strengths.append("Good narrative depth and willingness to unpack technical complexity.")
    else:
        strengths.append("Concise framing without unnecessary jargon.")

    if has_metrics:
        strengths.append("Effective use of quantifiable figures to prove real-world impact.")
        
    improvements = []
    if not has_metrics:
        improvements.append("Quantify business and engineering outcomes (e.g., latency reduction, cost savings, timeline).")
    if not has_result:
        improvements.append("Strengthen the 'Result' phase: conclude with how your solution benefited users or the company.")
    if word_count < 45:
        improvements.append("Include edge cases or constraints you encountered and how you mitigated them.")
        
    if not improvements:
        improvements.append("Connect your technical decisions to higher-level organizational strategy.")

    return {
        "score": final_score,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "star_breakdown": {
            "situation": "Contextual background provided in the opening statements.",
            "task": "Core challenge and responsibilities addressed.",
            "action": "Execution steps outlined." if has_action else "Could clarify specific personal actions versus team efforts.",
            "result": "Quantifiable outcome highlighted." if has_metrics else "Opportunity to add concrete ROI metrics or percentages."
        },
        "model_answer_tip": "Anchor your answer with the STAR framework: 20% Situation/Task, 50% Action, and 30% Measurable Result."
    }
