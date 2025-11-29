# multimodal_analyzer.py
# Extract candidate claims from any text, analyze images via your vision LLM, transcribe audio via your STT helper.
# Uses: brain_of_doctor.encode_image / analyze_image_with_query and voice_of_patient.transcribe_with_groq. :contentReference[oaicite:3]{index=3}:contentReference[oaicite:4]{index=4}

import os
import re
from typing import List, Dict
import asyncio

from brain_of_doctor import encode_image, analyze_image_with_query   # :contentReference[oaicite:5]{index=5}
from voice_of_patient import transcribe_with_groq                   # :contentReference[oaicite:6]{index=6}

# Broad claim keywords for general fake-news detection
CLAIM_KEYWORDS = [
    "claims", "claim", "reported", "report", "says", "saying", "announced", "announces",
    "confirms", "conflict", "fake", "hoax", "debunk", "false", "misleading", "viral",
    "breaking", "exclusive", "sources say", "leaked", "study", "research", "evidence", "proves"
]

# Add to multimodal_analyzer.py
CRISIS_KEYWORDS = {
    "pandemic": ["outbreak", "virus", "vaccine", "lockdown", "quarantine"],
    "conflict": ["war", "attack", "invasion", "troops", "ceasefire"],
    "climate": ["flood", "wildfire", "hurricane", "drought", "extreme weather"],
    "health": ["hospital", "outbreak", "emergency", "crisis", "shortage"]
}

def detect_crisis_context(text):
    """Identify if claim relates to active crisis events"""
    text_lower = text.lower()
    crisis_context = {}
    
    for crisis_type, keywords in CRISIS_KEYWORDS.items():
        matches = [kw for kw in keywords if kw in text_lower]
        if matches:
            crisis_context[crisis_type] = {
                "confidence": len(matches) / len(keywords),
                "triggers": matches
            }
    
    return crisis_context

def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', (text or "").strip()) if s.strip()]

def extract_claims_from_text(text: str) -> List[str]:
    """Extract claims from text - MORE LENIENT VERSION"""
    claims = []
    
    # Split into sentences
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', (text or "").strip()) if s.strip()]
    
    for sentence in sentences:
        # More lenient: accept shorter sentences and broader patterns
        if len(sentence.split()) >= 3:  # Reduced from 5 to 3
            sentence_lower = sentence.lower()
            
            # Expanded claim keywords
            claim_indicators = [
                "vaccine", "covid", "virus", "death", "cure", "miracle", "secret",
                "government", "cover-up", "conspiracy", "study", "research", 
                "proves", "causes", "linked to", "breakthrough", "discovery",
                "health", "disease", "treatment", "side effect", "risk"
            ]
            
            # Check if sentence contains any claim indicators
            if any(indicator in sentence_lower for indicator in claim_indicators):
                claims.append(sentence)
            # Also accept any sentence that looks like a factual assertion
            elif looks_like_assertion(sentence):
                claims.append(sentence)
    
    return claims

def looks_like_assertion(sentence: str) -> bool:
    """Check if a sentence looks like a factual assertion"""
    sentence_lower = sentence.lower()
    
    # Patterns that indicate assertions
    assertion_patterns = [
        "causes", "leads to", "results in", "proves that", "shows that",
        "evidence that", "found that", "discovered that", "reveals that"
    ]
    
    return any(pattern in sentence_lower for pattern in assertion_patterns)

async def analyze_text_item(item: Dict) -> List[str]:
    text = ((item.get("title") or "") + ". " + (item.get("text") or "")).strip()
    return extract_claims_from_text(text)

async def analyze_image_url(image_url: str) -> List[str]:
    try:
        b64 = encode_image(image_url)  # uses your helper to base64 encode local path or URL. :contentReference[oaicite:7]{index=7}
        prompt = "List any assertive claims, headlines, or textual assertions visible in this image (one per line)."
        resp = analyze_image_with_query(prompt, model="meta-llama/llama-4-scout-17b-16e-instruct", encode_image=b64)
        return extract_claims_from_text(resp)
    except Exception as e:
        print("analyze_image_url error:", e)
        return []

async def analyze_audio_file(filepath: str) -> List[str]:
    try:
        txt = transcribe_with_groq(GROQ_API_KEY=os.getenv("GROQ_API_KEY"), stt_model="whisper-large-v3", audio_filepath=filepath)
        return extract_claims_from_text(txt)
    except Exception as e:
        print("analyze_audio_file error:", e)
        return []
