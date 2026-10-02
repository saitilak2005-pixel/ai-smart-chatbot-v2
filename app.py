"""
AI-Powered Smart Chatbot using LLM APIs
Production Multi-Turn Conversational Engine.

A complete multi-turn conversational AI chatbot built with Python, Streamlit, and LLM APIs.
Features:
- Multi-turn context retention
- Streamlit session state management
- Prompt engineering with system instructions & customizable personas
- Error handling for API limits, network, and missing keys
- Clear chat & New conversation controls
- Token estimation & conversation metrics
- Chat export functionality
"""

import os
import json
import random
from datetime import datetime
import streamlit as st

# Curated pool of prompts for random selection on new chats
PROMPT_POOL = [
    "What is machine learning?",
    "What are the primary types of machine learning?",
    "Explain gradient descent using a hiker descending foggy mountains analogy.",
    "How do neural networks learn from weights and biases?",
    "Write a Python function for binary search with comments.",
    "What is the difference between supervised and unsupervised learning?",
    "How does transformer self-attention work in simple words?",
    "Write a Python script demonstrating memoization with an LRU cache.",
    "What is overfitting in machine learning and how do you prevent it?",
    "Explain backpropagation step by step without dense calculus.",
    "What is reinforcement learning and how is it used in robotics?",
    "Explain the bias-variance tradeoff with a dartboard analogy.",
    "How do Large Language Models predict the next token?",
    "Write a Python generator function to stream large datasets efficiently.",
    "What is transfer learning and why does it save computational power?",
    "Explain convolution in CNNs using an image filter flashlight analogy.",
    "What is the difference between shallow copy and deep copy in Python?",
    "How does semantic search differ from keyword matching search?",
]

# Import project modules
from services.llm_service import LLMService
from utils.prompts import (
    DEFAULT_SYSTEM_PROMPT,
    PERSONA_PROMPTS,
    get_system_prompt,
)

# ---------------------------------------------------------
# Streamlit Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="AI-Powered Smart Chatbot",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------
# Custom Styling
# ---------------------------------------------------------
st.markdown("""
<style>
    /* Global subtle tweaks */
    .stApp {
        background-color: #0b0f19;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Header hero styling */
    .hero-header {
        padding: 1.2rem 1.5rem;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(71, 85, 105, 0.4);
        border-radius: 12px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .hero-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .hero-subtitle {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-top: 0.25rem;
    }
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-connected {
        background-color: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-warning {
        background-color: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }

    /* Metric cards */
    .metric-box {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(71, 85, 105, 0.3);
        border-radius: 8px;
        padding: 0.75rem;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .metric-val {
        font-size: 1.25rem;
        font-weight: 700;
        color: #38bdf8;
    }
    .metric-lbl {
        font-size: 0.7rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Suggestion pill */
    .stButton>button.suggestion-btn {
        width: 100%;
        text-align: left;
        border-radius: 8px;
        font-size: 0.82rem;
        background-color: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(71, 85, 105, 0.4);
        color: #cbd5e1;
        transition: all 0.2s ease;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Session State Initialization
# ---------------------------------------------------------
if "messages" not in st.session_state:
    st.session_state.messages = []

if "conversation_id" not in st.session_state:
    st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")

if "total_tokens" not in st.session_state:
    st.session_state.total_tokens = 0

if "pending_prompt" not in st.session_state:
    st.session_state.pending_prompt = None

if "starter_prompts" not in st.session_state:
    st.session_state.starter_prompts = random.sample(PROMPT_POOL, 3)

if "all_sessions" not in st.session_state:
    st.session_state.all_sessions = {}

# Save current session into all_sessions if it has messages
if st.session_state.messages:
    first_query = st.session_state.messages[0].get("content", "Chat")[:35]
    st.session_state.all_sessions[st.session_state.conversation_id] = {
        "title": first_query,
        "messages": list(st.session_state.messages),
        "timestamp": datetime.now().strftime("%H:%M"),
    }

# Initialize LLM Service
llm_service = LLMService()

# ---------------------------------------------------------
# Sidebar: Old Chats + Settings
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### 🤖 Smart Chatbot")

    # Primary Action: New Chat
    if st.button("➕ New Chat", use_container_width=True, type="primary"):
        st.session_state.messages = []
        st.session_state.total_tokens = 0
        st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        st.session_state.starter_prompts = random.sample(PROMPT_POOL, 3)
        st.rerun()

    # Previous Chats Section
    st.markdown("#### 💬 Previous Chats")
    if not st.session_state.all_sessions:
        st.caption("No previous chats yet. Start chatting!")
    else:
        for sess_id, s_data in list(st.session_state.all_sessions.items())[::-1]:
            is_active = sess_id == st.session_state.conversation_id
            btn_label = f"{'▶ ' if is_active else ''}{s_data['title']} ({len(s_data['messages'])})"
            col_s1, col_s2 = st.columns([5, 1])
            with col_s1:
                if st.button(btn_label, key=f"load_{sess_id}", use_container_width=True, disabled=is_active):
                    st.session_state.conversation_id = sess_id
                    st.session_state.messages = list(s_data["messages"])
                    st.rerun()
            with col_s2:
                if st.button("🗑️", key=f"del_{sess_id}", help="Delete chat"):
                    del st.session_state.all_sessions[sess_id]
                    if is_active:
                        st.session_state.messages = []
                        st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.rerun()

    st.markdown("---")

    # Settings Option (Expander)
    with st.expander("⚙️ Settings & Configuration", expanded=False):
        st.markdown("##### 🧠 Model & Personality")
        default_model = os.getenv("LLM_MODEL", LLMService.DEFAULT_MODEL)
        model_options = LLMService.SUPPORTED_MODELS
        selected_model = st.selectbox(
            "Select LLM Model:",
            options=model_options,
            index=model_options.index(default_model) if default_model in model_options else 0,
            help="Choose the model powering the chatbot responses."
        )

        selected_persona = st.selectbox(
            "Chatbot Persona:",
            options=list(PERSONA_PROMPTS.keys()),
            index=0,
            help="System prompt preset that directs the demeanor."
        )

        temperature = st.slider(
            "Temperature (Creativity):",
            min_value=0.0,
            max_value=1.0,
            value=0.7,
            step=0.05,
            help="Lower is deterministic; higher is creative."
        )

        max_history_turns = st.slider(
            "Context Window (Turns):",
            min_value=2,
            max_value=20,
            value=10,
            step=1,
            help="Recent turns preserved in conversational context."
        )

        custom_instructions = st.text_area(
            "Custom Instruction:",
            value="",
            placeholder="e.g. Always conclude with 1 actionable takeaway...",
            help="Add extra rules on top of the persona."
        )

    st.markdown("---")
    # Clear and Export Controls
    col_c1, col_c2 = st.columns(2)
    with col_c1:
        if st.button("🧹 Clear", use_container_width=True, help="Clear active conversation"):
            st.session_state.messages = []
            st.session_state.total_tokens = 0
            st.rerun()
    with col_c2:
        if st.button("🗑️ Clear All", use_container_width=True, help="Clear all stored chats"):
            st.session_state.all_sessions = {}
            st.session_state.messages = []
            st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            st.rerun()

    # Export chat history
    if st.session_state.messages:
        chat_export_json = json.dumps({
            "conversation_id": st.session_state.conversation_id,
            "export_time": datetime.now().isoformat(),
            "messages": st.session_state.messages,
        }, indent=2)

        st.download_button(
            label="📥 Export Chat (JSON)",
            data=chat_export_json,
            file_name=f"chat_{st.session_state.conversation_id}.json",
            mime="application/json",
            use_container_width=True,
        )

    st.markdown("---")
    st.markdown("### 🎯 Multi-Turn Internship Test")
    st.caption("Click in order to verify context retention:")

    test_queries = [
        "What is machine learning?",
        "What are its types?",
        "Explain the second type with an example."
    ]

    for i, q in enumerate(test_queries, 1):
        if st.button(f"Step {i}: {q}", key=f"test_btn_{i}", use_container_width=True):
            st.session_state.pending_prompt = q
            st.rerun()

    st.markdown("---")
    st.markdown(
        "<div style='font-size: 0.72rem; color: #64748b; text-align: center;'>"
        "Pure LLM API Architecture (No RAG)"
        "</div>",
        unsafe_allow_html=True
    )

# ---------------------------------------------------------
# Main Chat Area
# ---------------------------------------------------------

# Top Hero Bar
api_is_ready = llm_service.is_configured()
status_html = (
    '<span class="status-badge badge-connected">● API Ready</span>'
    if api_is_ready else
    '<span class="status-badge badge-warning">▲ Key Required</span>'
)

st.markdown(f"""
<div class="hero-header">
    <div>
        <h1 class="hero-title">🤖 AI-Powered Smart Chatbot</h1>
        <div class="hero-subtitle">Multi-Turn Conversational Assistant with Context Retention & LLM API Integration</div>
    </div>
    <div>
        {status_html}
    </div>
</div>
""", unsafe_allow_html=True)

# API Key missing notice
if not api_is_ready:
    st.warning(
        "🔑 **Setup Required**: `GEMINI_API_KEY` is not found in your environment or `.env` file.\n\n"
        "Copy `.env.example` to `.env` and provide your API key. The chatbot will automatically detect it.",
        icon="⚠️"
    )

# Display starter welcome card if empty
if not st.session_state.messages:
    with st.container():
        st.markdown("""
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px dashed rgba(71, 85, 105, 0.5); border-radius: 12px; padding: 2rem; text-align: center; margin: 1rem 0;">
            <h3 style="color: #f1f5f9; margin-bottom: 0.5rem;">👋 Welcome to your Smart AI Chatbot!</h3>
            <p style="color: #94a3b8; font-size: 0.95rem; max-width: 600px; margin: 0 auto 1.5rem auto;">
                Ask anything or try a multi-turn conversation. The assistant remembers prior messages, resolves references naturally, and maintains conversational context.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        col_head, col_shuf = st.columns([4, 1])
        with col_head:
            st.markdown("##### 💡 Suggested Questions to Try:")
        with col_shuf:
            if st.button("🎲 Shuffle", key="shuffle_btn", use_container_width=True):
                st.session_state.starter_prompts = random.sample(PROMPT_POOL, 3)
                st.rerun()

        cols = st.columns(3)
        for idx, prompt_text in enumerate(st.session_state.starter_prompts):
            with cols[idx]:
                if st.button(f"💬 {prompt_text}", key=f"starter_btn_{idx}", use_container_width=True):
                    st.session_state.pending_prompt = prompt_text
                    st.rerun()

# ---------------------------------------------------------
# Render Existing Conversation History
# ---------------------------------------------------------
for msg in st.session_state.messages:
    role = msg.get("role")
    content = msg.get("content", "")
    avatar = "🧑‍💻" if role == "user" else "🤖"
    
    with st.chat_message(role, avatar=avatar):
        st.markdown(content)
        if "timestamp" in msg:
            st.caption(f"_{msg['timestamp']}_")

# ---------------------------------------------------------
# Handle Input (Chat Input or Pending Prompt from Buttons)
# ---------------------------------------------------------
user_input = st.chat_input("Type your message here... (e.g., 'What is machine learning?')")

# Check if a suggestion button was pressed
if st.session_state.pending_prompt:
    user_input = st.session_state.pending_prompt
    st.session_state.pending_prompt = None

if user_input:
    # 1. Validation: check non-empty input
    clean_prompt = user_input.strip()
    if not clean_prompt:
        st.warning("Please enter a valid, non-empty message.")
    else:
        timestamp_str = datetime.now().strftime("%H:%M:%S")

        # 2. Append User message to session state
        st.session_state.messages.append({
            "role": "user",
            "content": clean_prompt,
            "timestamp": timestamp_str
        })
        st.session_state.total_tokens += LLMService.estimate_tokens(clean_prompt)

        # 3. Render user message immediately
        with st.chat_message("user", avatar="🧑‍💻"):
            st.markdown(clean_prompt)
            st.caption(f"_{timestamp_str}_")

        # 4. Generate AI response with loading feedback
        with st.chat_message("assistant", avatar="🤖"):
            with st.spinner("🤖 Thinking and referencing context..."):
                # Compile system prompt
                effective_system_prompt = get_system_prompt(
                    persona_name=selected_persona,
                    custom_instruction=custom_instructions
                )

                # Prior history excluding the message we just added
                prior_history = st.session_state.messages[:-1]

                # Call LLM Service
                result = llm_service.generate_response(
                    history=prior_history,
                    user_message=clean_prompt,
                    system_prompt=effective_system_prompt,
                    model_name=selected_model,
                    temperature=temperature,
                    max_history_turns=max_history_turns,
                )

            ai_text = result["response"]
            ai_timestamp = datetime.now().strftime("%H:%M:%S")

            if result["success"]:
                st.markdown(ai_text)
                st.caption(f"_{ai_timestamp} • {result['model']}_")
                
                # Append assistant reply to session state
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": ai_text,
                    "timestamp": ai_timestamp,
                    "model": result["model"]
                })
                st.session_state.total_tokens += LLMService.estimate_tokens(ai_text)
            else:
                # Handle error output gracefully
                st.error(ai_text)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": ai_text,
                    "timestamp": ai_timestamp,
                    "error": True
                })
