# image_ocr.py
"""
OCR + simple text classification from images.
Uses pytesseract (local Tesseract) if available. Falls back to heuristic if not.
Classification labels: Claim / News / Opinion / Satire / Uncertain
"""

import os
import re
from typing import Tuple

# Try to import pytesseract + PIL
try:
    import pytesseract
    from PIL import Image
    _PYTESS_OK = True
except Exception:
    pytesseract = None
    Image = None
    _PYTESS_OK = False

# Simple heuristics
_CLAIM_KEYWORDS = {"cause","causes","leads to","linked to","prevent","cure","cures","proven","study shows","studies show"}
_NEWS_KEYWORDS = {"reported","reports","breaking","announced","confirmed","statement","press release","update"}
_OPINION_KEYWORDS = {"i think","in my opinion","we should","we must","i believe","opinion","imo"}
_SATIRE_KEYWORDS = {"satire","parody","not real","joke","fake news"}

def _clean_text(t: str) -> str:
    return re.sub(r'\s+', ' ', (t or "").strip())

def ocr_with_pytesseract(image_path: str) -> str:
    if not _PYTESS_OK:
        raise RuntimeError("pytesseract or PIL not available")
    img = Image.open(image_path)
    text = pytesseract.image_to_string(img)
    return _clean_text(text)

def extract_text_from_image(path_or_url: str) -> Tuple[str, str]:
    """
    Returns (text, method) where method is 'pytesseract' or 'none'.
    If path_or_url is URL, downloads image to memory then passes to pytesseract if available.
    """
    if _PYTESS_OK:
        try:
            # If url-like, download first
            if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
                import httpx, io
                r = httpx.get(path_or_url, timeout=20)
                r.raise_for_status()
                img = Image.open(io.BytesIO(r.content))
                text = pytesseract.image_to_string(img)
                return _clean_text(text), "pytesseract"
            else:
                return ocr_with_pytesseract(path_or_url), "pytesseract"
        except Exception as e:
            return "", "none"
    return "", "none"

def classify_text_info(text: str) -> Tuple[str, dict]:
    """
    Heuristic classifier. Returns (label, details).
    """
    t = (text or "").lower()
    if not t.strip():
        return "Uncertain", {"reason":"no_text"}

    scores = {"Claim":0, "News":0, "Opinion":0, "Satire":0}
    for k in _CLAIM_KEYWORDS:
        if k in t:
            scores["Claim"] += 2
    for k in _NEWS_KEYWORDS:
        if k in t:
            scores["News"] += 1
    for k in _OPINION_KEYWORDS:
        if k in t:
            scores["Opinion"] += 2
    for k in _SATIRE_KEYWORDS:
        if k in t:
            scores["Satire"] += 3

    top = max(scores, key=lambda k: scores[k])
    if scores[top] == 0:
        return "Uncertain", {"scores":scores}
    return top, {"scores":scores}
