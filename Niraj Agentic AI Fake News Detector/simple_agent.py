# simple_agent.py - ENHANCED
import os
import asyncio
import time
from datetime import datetime

CHECK_INTERVAL = int(os.getenv("AGENT_CHECK_INTERVAL", "30"))

# Enhanced sample items with varied content
SAMPLE_NEWS_ITEMS = [
    {
        "title": "Breakthrough: New study shows amazing results",
        "text": "Researchers claim revolutionary discovery that could change everything we know about health and wellness.",
        "source": "sample",
        "url": "#",
        "published": datetime.utcnow().isoformat()
    },
    {
        "title": "Government announces new policy on climate change",
        "text": "Official statement about upcoming environmental regulations that will affect industries nationwide.",
        "source": "sample", 
        "url": "#",
        "published": datetime.utcnow().isoformat()
    },
    {
        "title": "Miracle cure found for rare disease", 
        "text": "Doctors amazed by new treatment that promises 100% effectiveness with no side effects.",
        "source": "sample",
        "url": "#", 
        "published": datetime.utcnow().isoformat()
    }
]

async def enhanced_analyze_text(text):
    """Enhanced text analysis with better claim detection"""
    claims = []
    sentences = text.split('.')
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence or len(sentence.split()) < 3:
            continue
            
        sentence_lower = sentence.lower()
        
        # Expanded claim detection
        claim_indicators = [
            'claim', 'proves', 'breakthrough', 'miracle', 'secret', 'cure',
            'study shows', 'research found', 'evidence suggests', 'discovery',
            'government', 'official', 'announces', 'declares', 'reveals',
            'scientists', 'doctors', 'experts', 'according to'
        ]
        
        # Check for claim indicators
        if any(indicator in sentence_lower for indicator in claim_indicators):
            claims.append(sentence)
        # Also accept statements that look like factual assertions
        elif looks_like_factual_assertion(sentence):
            claims.append(sentence)
            
    return claims

def looks_like_factual_assertion(sentence):
    """Check if sentence looks like a factual assertion"""
    sentence_lower = sentence.lower()
    
    factual_patterns = [
        ' is ', ' are ', ' was ', ' were ', ' has ', ' have ',
        ' causes ', ' leads to ', ' results in ', ' proves ',
        ' according to ', ' research shows ', ' studies indicate '
    ]
    
    return any(pattern in sentence_lower for pattern in factual_patterns)

async def enhanced_verify_claim(claim):
    """Enhanced verification with better scoring"""
    claim_lower = claim.lower()
    
    # More sophisticated scoring
    score = 0.0
    
    # Positive patterns (credible)
    positive_patterns = {
        "study shows": 0.7, "research indicates": 0.8, "according to study": 0.7,
        "scientists found": 0.6, "evidence shows": 0.8, "data indicates": 0.7,
        "official report": 0.6, "medical journal": 0.7, "clinical trial": 0.8,
        "peer-reviewed": 0.9, "scientific consensus": 0.8,
    }
    
    # Negative patterns (misinformation)  
    negative_patterns = {
        "miracle cure": -0.9, "secret they don't want you to know": -0.8,
        "100% effective": -0.8, "instant results": -0.7,
        "government cover-up": -0.7, "big pharma": -0.6,
        "mainstream media lying": -0.7, "conspiracy": -0.5,
        "breakthrough doctors hate": -0.8, "hidden truth": -0.7,
    }
    
    # Calculate scores
    for pattern, weight in positive_patterns.items():
        if pattern in claim_lower:
            score += weight
    
    for pattern, weight in negative_patterns.items():
        if pattern in claim_lower:
            score += weight
    
    # Crisis detection
    crisis_terms = ['death', 'kills', 'dead', 'emergency', 'outbreak', 'pandemic']
    crisis_count = sum(1 for term in crisis_terms if term in claim_lower)
    if crisis_count > 0 and score < 0:
        score -= (crisis_count * 0.1)  # Extra penalty for crisis misinfo
    
    # Normalize score
    score = max(-1.0, min(1.0, score))
    
    # Enhanced severity determination
    if score >= 0.7:
        severity = "HIGHLY CREDIBLE"
    elif score >= 0.4:
        severity = "CREDIBLE"
    elif score >= 0.1:
        severity = "PLAUSIBLE" 
    elif score >= -0.1:
        severity = "NEUTRAL"
    elif score >= -0.4:
        severity = "SUSPICIOUS"
    elif score >= -0.7:
        severity = "LIKELY FALSE"
    else:
        severity = "VERY LIKELY FALSE"
    
    return {
        "claim": claim,
        "score": round(score, 2),
        "severity": severity,
        "factchecks": [],
        "cross_hits": []
    }

async def cycle_once():
    """Enhanced processing cycle"""
    print(f"\n🔄 Cycle started at {time.strftime('%H:%M:%S')}")
    
    items = SAMPLE_NEWS_ITEMS
    print(f"📰 Processing {len(items)} sample articles")
    
    for item in items:
        title = item.get('title', 'No title')
        text = item.get('text', '')
        
        print(f"\n📄 Processing: {title}")
        
        combined_text = f"{title}. {text}"
        claims = await enhanced_analyze_text(combined_text)
        
        if claims:
            print(f"   Found {len(claims)} claims")
            for claim in claims[:2]:  # Process max 2 claims
                verification = await enhanced_verify_claim(claim)
                await simple_publish(verification)
        else:
            print("   No claims detected")
    
    print(f"✅ Cycle completed at {time.strftime('%H:%M:%S')}")

async def simple_publish(verification):
    """Enhanced publishing with better formatting"""
    print(f"🔍 CLAIM: {verification['claim'][:80]}...")
    print(f"   📊 Score: {verification['score']:.2f} | Severity: {verification['severity']}")
    
    # Add to latest updates
    from app import latest_updates
    latest_updates.append({
        'title': f'Analysis: {verification["severity"]}',
        'content': verification['claim'][:100] + '...',
        'status': 'false' if verification['score'] < -0.3 else 'verified',
        'time': 'Just now'
    })
    
    # Keep only recent updates
    if len(latest_updates) > 10:
        latest_updates.pop(0)

async def run_simple_agent():
    """Run the enhanced agent"""
    print("🤖 Starting Enhanced Fake News Detection Agent")
    print("   Features: Hybrid verification + Multiple APIs + Pattern analysis")
    print("   Press Ctrl+C to stop\n")
    
    cycle_count = 0
    while True:
        try:
            await cycle_once()
            cycle_count += 1
            print(f"\n♻️ Completed {cycle_count} cycles. Waiting {CHECK_INTERVAL} seconds...")
            await asyncio.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print(f"\n🛑 Agent stopped after {cycle_count} cycles")
            break
        except Exception as e:
            print(f"❌ Error in cycle: {e}")
            await asyncio.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    asyncio.run(run_simple_agent())