# AI-Powered Smart Chatbot using LLM APIs
**Week 4 Generative AI Internship Project**

A complete, production-grade conversational AI chatbot built with **Python**, **Streamlit**, and **Gemini LLM APIs**, featuring multi-turn context retention, prompt engineering, session state management, and animated modern UI.

---

## 🏗️ Architecture

```text
User Input
    ↓
Streamlit Chat UI (with Animations & Avatars)
    ↓
Session State / Conversation History Manager
    ↓
Prompt Builder (System Instructions + Turn Windowing)
    ↓
LLM API Service (Google GenAI / Gemini 3.8 Flash)
    ↓
AI Response Stream / Generator
    ↓
Update Conversation History & Metrics (Tokens, Turns)
    ↓
Render Response to User
```

> **Important**: This is a pure LLM API conversational system. As per Week 4 requirements, no RAG, vector databases, or external document indexing are used. Context is preserved purely through multi-turn conversational history management.

---

## 📁 Project Structure

```text
AI-Smart-Chatbot/
├── app.py                 # Streamlit chat interface with session state & controls
├── requirements.txt       # Python dependencies (streamlit, google-genai, python-dotenv)
├── .env.example           # Environment template for API keys
├── .gitignore             # Git ignore file for secrets and cache
├── README.md              # Project documentation and internship report
├── services/
│   └── llm_service.py     # LLM API abstraction, payload construction, and error handling
├── utils/
│   └── prompts.py         # System prompt definitions, personas, and history formatting
├── tests/
│   └── test_multi_turn.py # Automated multi-turn context verification script
└── assets/                # Styling and visual resources
```

---

## 🚀 Key Features

1. **Multi-Turn Context Retention**:
   - Preserves previous conversational exchanges in session state.
   - Accurately resolves reference-based follow-up queries (e.g. *"What are its types?"* -> *"Explain the second type with an example"*).
2. **Prompt Engineering**:
   - Explicit system prompts instructing the model to retain context and format responses clearly in Markdown.
   - Multiple selectable personas: *General Assistant*, *Python & ML Tutor*, *Concise & Direct*, *Creative Explainer*.
   - Support for custom user instructions layered over base personas.
3. **Session & State Management**:
   - Uses `st.session_state` to store message histories, timestamps, tokens, and active session IDs.
   - Dedicated **Clear Chat** and **New Conversation** actions.
4. **Resilient Error Handling**:
   - Clear diagnostic feedback for missing API keys, rate limits (`429`), network timeouts, and content safety blocks.
   - Prevents empty or invalid input submissions.
5. **Session Metrics & Export**:
   - Real-time turn count and token estimation.
   - 1-click JSON export for chat transcripts.

---

## ⚙️ Installation & Running

### 1. Prerequisites
- Python 3.10+
- A Google Gemini API Key

### 2. Setup Environment
```bash
# Clone or navigate to the directory
cd AI-Smart-Chatbot

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt
```

### 3. Configure API Key
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Edit `.env` and set your key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
LLM_MODEL="gemini-3.8-flash"
```

### 4. Run Application
```bash
streamlit run app.py
```
Open `http://localhost:8501` in your browser.

---

## 🧪 Verification & Multi-Turn Test

Run the automated multi-turn verification script:
```bash
python3 tests/test_multi_turn.py
```
This tests:
1. **Turn 1**: *"What is machine learning?"*
2. **Turn 2**: *"What are its types?"*
3. **Turn 3**: *"Explain the second type with an example."*
And verifies that Turn 3 accurately identifies and explains the second type from Turn 2.
