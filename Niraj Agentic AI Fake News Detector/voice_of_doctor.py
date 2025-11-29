# voice_of_doctor.py
"""
Safe ElevenLabs TTS wrapper.
- text_to_speech_with_elevenlabs(text, filename, voice=None) -> filepath or None
No network calls on import. Raises ValueError if API key missing when called.
Works with multiple client versions by attempting a few common interfaces.
"""

import os
from typing import Optional

# Try to import elevenlabs client functions (best-effort)
try:
    # new official client or community clients may differ
    # import dynamically to avoid static import-time errors in editors/linters
    import importlib
    spec = importlib.util.find_spec("elevenlabs")
    if spec is not None:
        module = importlib.import_module("elevenlabs")
        # common names; some clients expose helpers at package level
        generate = getattr(module, "generate", None)
        save = getattr(module, "save", None)
        voices = getattr(module, "voices", None)
        # ApiError may be in elevenlabs.core.api_error
        try:
            api_err_module = importlib.import_module("elevenlabs.core.api_error")
            ApiError = getattr(api_err_module, "ApiError", Exception)
        except Exception:
            ApiError = Exception
        _ELEVEN_OK = True
    else:
        generate = None
        save = None
        voices = None
        ApiError = Exception
        _ELEVEN_OK = False
except Exception:
    generate = None
    save = None
    voices = None
    ApiError = Exception
    _ELEVEN_OK = False

def _get_elevenlabs_key() -> Optional[str]:
    return os.getenv("ELEVENLABS_API_KEY") or os.getenv("ELEVEN_LABS_API_KEY") or os.getenv("XI_API_KEY")

def text_to_speech_with_elevenlabs(text: str, filename: str = "tts_output.mp3", voice: Optional[str] = None) -> Optional[str]:
    """
    Convert text -> speech via ElevenLabs.
    Returns the output filepath on success, else None.
    Raises ValueError if no API key is present.
    """
    api_key = _get_elevenlabs_key()
    if not api_key:
        raise ValueError("ElevenLabs API key missing. Set ELEVENLABS_API_KEY in environment or .env")

    # ensure client sees the key (some clients read env var)
    os.environ["ELEVENLABS_API_KEY"] = api_key
    if not _ELEVEN_OK:
        print("ElevenLabs client library not available. Install 'elevenlabs' package or adapt this function.")
        return None

    try:
        # Try common usage patterns:
        if voice:
            audio = generate(text=text, voice=voice)
        else:
            audio = generate(text=text)
        # save helper may accept different inputs depending on client
        try:
            save(audio, filename)
        except Exception:
            # fallback: audio may be bytes
            try:
                with open(filename, "wb") as f:
                    f.write(audio)
            except Exception as e:
                print("Failed to save TTS audio:", e)
                return None
        return filename
    except ApiError as e:
        # Give more friendly error message (e.g., 401)
        body = getattr(e, "body", None)
        print(f"ElevenLabs API error: {body or str(e)}")
        return None
    except Exception as e:
        print("ElevenLabs TTS generation error:", e)
        return None

if __name__ == "__main__":
    print("voice_of_doctor module loaded. Call text_to_speech_with_elevenlabs(text, filename).")

