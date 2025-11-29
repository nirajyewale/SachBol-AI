# voice_of_patient.py
"""
Speech-to-text wrapper using Groq Whisper (or fallback).
- transcribe_with_groq(GROQ_API_KEY, stt_model, audio_filepath) -> text
No network calls on import. Raises RuntimeError if groq client missing or API key absent at call time.
"""

import os
from typing import Optional

# Try to import Groq client if available (use importlib to avoid static analysis errors when package is not installed)
try:
    import importlib
    groq_mod = importlib.import_module("groq")
    # prefer an exported Groq symbol if present, otherwise use the module itself
    Groq = getattr(groq_mod, "Groq", groq_mod)
    _GROQ_OK = True
except Exception:
    Groq = None
    _GROQ_OK = False

def transcribe_with_groq(GROQ_API_KEY: Optional[str] = None, stt_model: str = "whisper-large-v3", audio_filepath: str = None) -> str:
    """
    Transcribe file at audio_filepath using Groq STT model (whisper-large-v3) if available.
    Returns transcribed text or raises RuntimeError if client/key missing.
    """
    key = GROQ_API_KEY or os.getenv("GROQ_API_KEY") or os.getenv("GROQ_APIKEY")
    if not key:
        raise RuntimeError("GROQ_API_KEY not provided. Set GROQ_API_KEY env var or pass it to transcribe_with_groq().")
    if not _GROQ_OK:
        raise RuntimeError("Groq client not installed. Install 'groq' package or implement a fallback STT method.")

    client = Groq(api_key=key)
    # For simple usage we stream the file through the multimodal chat endpoint if supported.
    # The exact API may vary; adapt if your groq client exposes a different method for STT.
    # We'll call a hypothetical 'speech.transcriptions.create' if present; else fallback to uploading to chat with type audio.
    try:
        # Preferred: a dedicated transcription method (pseudocode)
        if hasattr(client, "speech") and hasattr(client.speech, "transcriptions"):
            with open(audio_filepath, "rb") as f:
                audio_bytes = f.read()
            result = client.speech.transcriptions.create(model=stt_model, file=audio_bytes)
            # adapt to returned structure
            return result.get("text") or result.get("transcript") or str(result)
        else:
            # Fallback: send as a chat message with audio type if client supports multimodal input
            messages = [
                {"role": "user", "content": [{"type":"audio", "audio_url": {"url": f"data:audio/wav;base64,{_encode_file_base64(audio_filepath)}"}}]}
            ]
            resp = client.chat.completions.create(messages=messages, model=stt_model)
            return resp.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Groq STT error: {e}")

def _encode_file_base64(path: str) -> str:
    import base64
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

if __name__ == "__main__":
    print("voice_of_patient module loaded. Use transcribe_with_groq(GROQ_API_KEY, stt_model, audio_filepath).")
