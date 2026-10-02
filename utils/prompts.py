"""
Prompt engineering and system prompt management for the AI-Powered Smart Chatbot.
Week 4 Generative AI Internship Project.
"""

from typing import List, Dict, Any

# Primary system prompt defining chatbot personality, behavioral rules, and multi-turn context retention
DEFAULT_SYSTEM_PROMPT = """You are an intelligent, articulate, and context-aware AI Assistant.

CORE BEHAVIORAL INSTRUCTIONS:
1. Multi-Turn Context Retention:
   - Always analyze previous messages in the conversation history.
   - When a user asks follow-up questions referencing prior responses (e.g., "what are its types?", "explain the second type with an example", "compare the first and third"), resolve references accurately based on what was previously output.
   - Maintain conversational continuity without requiring the user to re-state prior questions.

2. Structure & Clarity:
   - Provide clear, well-structured answers using Markdown.
   - Use headings, bulleted lists, and bold emphasis to highlight key points.
   - When code or technical terms are discussed, use formatted code blocks with language identifiers.

3. Tone & Demeanor:
   - Professional, courteous, helpful, and educational.
   - Direct and concise: avoid unnecessary filler or verbose disclaimers.

4. Boundaries:
   - If a question is ambiguous or lacks context, politely ask for clarification while offering your best initial interpretation.
   - Do not hallucinate facts. If uncertain, clearly indicate limitations.
"""

PERSONA_PROMPTS = {
    "General Assistant": DEFAULT_SYSTEM_PROMPT,
    "Python & ML Tutor": DEFAULT_SYSTEM_PROMPT + "\n\nADDITIONAL INSTRUCTION: You are also an expert Python and Machine Learning educator. Break down complex mathematical and algorithmic concepts into clear, beginner-friendly explanations with practical Python examples.",
    "Concise & Direct": DEFAULT_SYSTEM_PROMPT + "\n\nADDITIONAL INSTRUCTION: Keep responses extremely concise, structured with minimal bullet points, and directly to the point. No conversational fluff.",
    "Creative Explainer": DEFAULT_SYSTEM_PROMPT + "\n\nADDITIONAL INSTRUCTION: Use vivid real-world analogies, metaphors, and intuitive visual descriptions to explain abstract technical concepts.",
}


def get_system_prompt(persona_name: str = "General Assistant", custom_instruction: str = "") -> str:
    """Retrieve system prompt based on persona and optional user-specified custom instructions."""
    base_prompt = PERSONA_PROMPTS.get(persona_name, DEFAULT_SYSTEM_PROMPT)
    if custom_instruction and custom_instruction.strip():
        return f"{base_prompt}\n\nCUSTOM USER GUIDELINE:\n{custom_instruction.strip()}"
    return base_prompt


def format_history_for_gemini(
    history: List[Dict[str, Any]],
    current_user_message: str,
    max_history_turns: int = 10,
) -> List[Dict[str, Any]]:
    """
    Format Streamlit session history into Gemini-compatible contents format:
    [{'role': 'user' | 'model', 'parts': [{'text': ...}]}]
    
    Includes up to `max_history_turns` turns to ensure multi-turn context
    remains within token budgets while preserving conversational flow.
    """
    contents = []

    # Window history to the latest turns (each turn = 1 user + 1 assistant)
    relevant_history = history[-(max_history_turns * 2):] if max_history_turns > 0 else history

    for msg in relevant_history:
        role = "user" if msg.get("role") == "user" else "model"
        text = msg.get("content", "").strip()
        if text:
            contents.append({
                "role": role,
                "parts": [{"text": text}]
            })

    # Append current incoming user message
    if current_user_message and current_user_message.strip():
        contents.append({
            "role": "user",
            "parts": [{"text": current_user_message.strip()}]
        })

    return contents
