# brain_of_doctor.py
# brain_of_doctor.py
"""
Lightweight vision helpers using local OCR (Tesseract) when possible.
Provides:
- encode_image(path_or_url) -> base64 (helper used elsewhere)
- analyze_image_with_query(prompt, encode_image_b64) -> fallback to OCR-extracted text + heuristic
No external LLMs by default (keeps it free).
"""
import os
import base64
import httpx
from typing import Optional

def _read_file_bytes(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()

def _fetch_url_bytes(url: str, timeout: int = 30) -> bytes:
    with httpx.Client(timeout=timeout) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.content

def encode_image(path_or_url: str) -> str:
    """Return base64 of image bytes (no data: prefix). Accepts local path or http(s) URL."""
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        data = _fetch_url_bytes(path_or_url)
    else:
        data = _read_file_bytes(path_or_url)
    return base64.b64encode(data).decode("utf-8")

# analyze_image_with_query: default behavior is to return OCR text (if available) or a short note.
def analyze_image_with_query(prompt: str, encode_image: str = None, image_path: str = None) -> str:
    """
    Lightweight 'analysis' for images:
    - If image_path provided, tries OCR via image_ocr.extract_text_from_image.
    - If encode_image provided but no tesseract available, returns a short placeholder.
    This function purposefully avoids paid LLM calls; it's a free fallback.
    """
    try:
        # import local OCR utility (uses pytesseract if installed)
        from image_ocr import extract_text_from_image
    except Exception:
        extract_text_from_image = None

    if image_path and extract_text_from_image:
        text, method = extract_text_from_image(image_path)
        return text or ""
    # If only encode_image provided, we can't easily run OCR here — return prompt as fallback note.
    return ""
