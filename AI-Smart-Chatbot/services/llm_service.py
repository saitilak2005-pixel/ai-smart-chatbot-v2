"""
LLM Service module for the AI-Powered Smart Chatbot.
Week 4 Generative AI Internship Project.

Handles:
- Loading API credentials from environment variables (.env)
- Structuring multi-turn conversations
- Communicating with LLM APIs (Gemini models)
- Automatic fallback on high demand spikes (503 / resource exhaustion)
- Robust error handling (missing key, quota limits, timeouts, invalid payloads)
"""

import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

# Load environment variables from .env if python-dotenv is present
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

from utils.prompts import DEFAULT_SYSTEM_PROMPT, format_history_for_gemini


class LLMService:
    """Service to interact with the LLM API maintaining context and error handling."""

    # Default model: gemini-flash-lite-latest for ultra-fast, high-availability response
    DEFAULT_MODEL = "gemini-flash-lite-latest"
    SUPPORTED_MODELS = [
        "gemini-flash-lite-latest",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite-preview",
    ]
    FALLBACK_MODELS = [
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-latest",
    ]

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize LLMService.
        Picks API key from parameter or environment variables GEMINI_API_KEY / LLM_API_KEY.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY")
        self.model = model or os.getenv("LLM_MODEL") or self.DEFAULT_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def is_configured(self) -> bool:
        """Check if API key is present and not a dummy placeholder."""
        return bool(self.api_key and self.api_key.strip() and self.api_key != "MY_GEMINI_API_KEY")

    def test_connection(self) -> Tuple[bool, str]:
        """Test API connection with a minimal prompt."""
        if not self.is_configured():
            return False, "API key is not configured. Please set GEMINI_API_KEY in your .env file or environment."

        try:
            url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key.strip()}"
            payload = {
                "contents": [{"role": "user", "parts": [{"text": "Say 'OK'"}]}]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json", "User-Agent": "AI-Smart-Chatbot/1.0"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    return True, "Connection successful! LLM API is operational."
                return False, f"Unexpected response code: {response.status}"
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="ignore")
            try:
                err_json = json.loads(error_body)
                msg = err_json.get("error", {}).get("message", str(e))
            except Exception:
                msg = error_body or str(e)
            return False, f"API HTTP Error ({e.code}): {msg}"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"

    def _call_model_api(
        self,
        model_name: str,
        formatted_contents: List[Dict[str, Any]],
        system_prompt: Optional[str],
        temperature: float
    ) -> Dict[str, Any]:
        """Internal worker to execute generateContent against a given model."""
        request_body = {
            "contents": formatted_contents,
            "generationConfig": {
                "temperature": max(0.0, min(temperature, 1.0)),
                "topP": 0.95,
                "topK": 40,
            }
        }

        if system_prompt and system_prompt.strip():
            request_body["systemInstruction"] = {
                "parts": [{"text": system_prompt.strip()}]
            }

        url = f"{self.base_url}/models/{model_name}:generateContent?key={self.api_key.strip()}"

        req = urllib.request.Request(
            url,
            data=json.dumps(request_body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "AI-Smart-Chatbot/1.0"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_text = resp.read().decode("utf-8")
            resp_data = json.loads(resp_text)

            candidates = resp_data.get("candidates", [])
            if not candidates:
                prompt_feedback = resp_data.get("promptFeedback", {})
                block_reason = prompt_feedback.get("blockReason", "Safety filters triggered")
                return {
                    "success": False,
                    "response": f"⚠️ The model could not generate a response: {block_reason}.",
                    "model": model_name,
                    "error": block_reason
                }

            first_candidate = candidates[0]
            content = first_candidate.get("content", {})
            parts = content.get("parts", [])

            if not parts:
                finish_reason = first_candidate.get("finishReason", "UNKNOWN")
                return {
                    "success": False,
                    "response": f"⚠️ Empty response received from model (Finish reason: {finish_reason}).",
                    "model": model_name,
                    "error": finish_reason
                }

            reply_text = "".join(p.get("text", "") for p in parts)
            return {
                "success": True,
                "response": reply_text.strip(),
                "model": model_name,
                "error": None
            }

    def generate_response(
        self,
        history: List[Dict[str, Any]],
        user_message: str,
        system_prompt: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.7,
        max_history_turns: int = 10,
    ) -> Dict[str, Any]:
        """
        Generate contextual AI response using conversation history and user input.
        Includes automatic fallback to high-availability Gemini models if primary model is busy.
        """
        if not user_message or not user_message.strip():
            return {
                "success": False,
                "response": "Please enter a valid message.",
                "model": self.model,
                "error": "Empty user message"
            }

        if not self.is_configured():
            return {
                "success": False,
                "response": (
                    "⚠️ **API Key Missing**: The `GEMINI_API_KEY` is not set.\n\n"
                    "To enable the chatbot:\n"
                    "1. Copy `.env.example` to `.env`\n"
                    "2. Add your Gemini API key: `GEMINI_API_KEY=your_key_here`\n"
                    "3. Restart the Streamlit application."
                ),
                "model": self.model,
                "error": "Missing GEMINI_API_KEY in environment"
            }

        primary_model = model_name or self.model
        sys_prompt = system_prompt if system_prompt is not None else DEFAULT_SYSTEM_PROMPT

        formatted_contents = format_history_for_gemini(
            history=history,
            current_user_message=user_message,
            max_history_turns=max_history_turns
        )

        # Candidates to try: primary model first, followed by fallbacks if 503 high demand
        candidate_models = [primary_model]
        for fb in self.FALLBACK_MODELS:
            if fb not in candidate_models:
                candidate_models.append(fb)

        last_error = None
        for current_model in candidate_models:
            try:
                result = self._call_model_api(
                    model_name=current_model,
                    formatted_contents=formatted_contents,
                    system_prompt=sys_prompt,
                    temperature=temperature
                )
                return result
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="ignore")
                error_msg = f"HTTP Error {e.code}"
                try:
                    err_json = json.loads(error_body)
                    error_msg = err_json.get("error", {}).get("message", error_body)
                except Exception:
                    if error_body:
                        error_msg = error_body

                last_error = (e.code, error_msg)

                # If model is experiencing temporary high demand or 503, try next candidate
                if e.code in (503, 429) or "high demand" in error_msg.lower():
                    continue

                # For hard errors like invalid key (400 / 401), stop immediately
                friendly_msg = f"⚠️ **API Error ({e.code})**: {error_msg}"
                if e.code == 400 and "API_KEY_INVALID" in error_msg:
                    friendly_msg = "⚠️ **Invalid API Key**: Please check that your `GEMINI_API_KEY` in `.env` is valid."

                return {
                    "success": False,
                    "response": friendly_msg,
                    "model": current_model,
                    "error": error_msg
                }
            except urllib.error.URLError as e:
                return {
                    "success": False,
                    "response": f"⚠️ **Network Error**: Unable to reach LLM API. ({str(e.reason)})",
                    "model": current_model,
                    "error": str(e.reason)
                }
            except Exception as e:
                return {
                    "success": False,
                    "response": f"⚠️ **Unexpected Error**: {str(e)}",
                    "model": current_model,
                    "error": str(e)
                }

        # If all candidates exhausted
        code, msg = last_error if last_error else (503, "All models currently experiencing high demand")
        return {
            "success": False,
            "response": f"⚠️ **Service Busy ({code})**: {msg}. Please retry in a few seconds.",
            "model": primary_model,
            "error": msg
        }

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Rough estimation of token count (~4 characters per token)."""
        if not text:
            return 0
        return max(1, len(text) // 4)
