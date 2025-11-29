# verifier.py - ENHANCED
import os
import httpx
from typing import List, Dict, Any
import asyncio

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
FACTCHECK_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

async def _search_newsdata(query: str, max_results: int = 5) -> List[Dict]:
    """Enhanced news search with better error handling"""
    key = os.getenv("NEWSDATA_API_KEY", "")
    if not key:
        print("⚠️ NewsData API key not found")
        return []
    
    try:
        params = {"apikey": key, "q": query, "language": "en", "page": 1}
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get("https://newsdata.io/api/1/news", params=params)
            if r.status_code != 200:
                print(f"⚠️ NewsData API error: {r.status_code}")
                return []
            js = r.json()
            return js.get("results", [])[:max_results]
    except Exception as e:
        print(f"⚠️ NewsData search error: {e}")
        return []

async def google_factcheck_search(query: str, max_results: int = 5) -> List[Dict]:
    """Enhanced Google Fact Check with better error handling"""
    if not GOOGLE_API_KEY:
        print("⚠️ Google Fact Check API key not found")
        return []
    
    try:
        params = {"query": query, "key": GOOGLE_API_KEY, "pageSize": max_results}
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(FACTCHECK_URL, params=params)
            if r.status_code != 200:
                print(f"⚠️ Google Fact Check API error: {r.status_code}")
                return []
            return r.json().get("claims", [])
    except Exception as e:
        print(f"⚠️ Google Fact Check error: {e}")
        return []

def _heuristic_score(factchecks: List[Dict], cross_hits: List[Dict]) -> float:
    """Enhanced scoring logic"""
    score = 0.0
    
    # Analyze fact checks
    if factchecks:
        for f in factchecks:
            reviews = f.get("claimReview", [])
            text = " ".join([str(r.get("text","")) + " " + str(r.get("title","")) for r in reviews]).lower()
            
            # More nuanced scoring
            if any(w in text for w in ["false", "incorrect", "debunked", "misleading", "untrue"]):
                score -= 0.9
            elif any(w in text for w in ["true", "correct", "accurate", "verified"]):
                score += 0.9
            elif any(w in text for w in ["partially false", "mixed", "unproven"]):
                score -= 0.3
            else:
                score -= 0.4  # Default negative for fact-checked claims
    
    # Analyze news coverage
    if cross_hits:
        credible_count = len([h for h in cross_hits if is_credible_source(h)])
        total_count = len(cross_hits)
        
        if total_count > 0:
            credibility_ratio = credible_count / total_count
            # Viral true claims get positive, viral false claims get more negative
            if score < -0.5:  # Likely false going viral
                score -= 0.3 * credibility_ratio
            else:  # Possibly true going viral
                score += 0.3 * credibility_ratio
    
    return max(-1.0, min(1.0, score))

def is_credible_source(article: Dict) -> bool:
    """Check if article source is credible"""
    credible_sources = [
        'reuters', 'associated press', 'bbc', 'cnn', 'the new york times',
        'the washington post', 'the guardian', 'npr', 'abc news', 'cbs news'
    ]
    
    source = article.get('source_id', '').lower()
    return any(credible in source for credible in credible_sources)

async def verify_claim(claim: str) -> Dict[str, Any]:
    """Enhanced verification with better error handling"""
    try:
        factchecks = await google_factcheck_search(claim, max_results=5)
        cross_hits = await _search_newsdata(claim, max_results=5)
        score = _heuristic_score(factchecks, cross_hits)
        
        # Enhanced severity determination
        if score < -0.6:
            severity = "VERY LIKELY FALSE"
        elif score < -0.3:
            severity = "LIKELY FALSE"
        elif score < 0.1:
            severity = "UNCERTAIN"
        elif score < 0.4:
            severity = "PLAUSIBLE"
        elif score < 0.7:
            severity = "LIKELY TRUE"
        else:
            severity = "VERY LIKELY TRUE"
            
        return {
            "claim": claim, 
            "score": score, 
            "severity": severity, 
            "factchecks": factchecks, 
            "cross_hits": cross_hits,
            "sources_checked": len(factchecks) + len(cross_hits)
        }
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return {
            "claim": claim,
            "score": 0.0,
            "severity": "ERROR",
            "error": str(e),
            "factchecks": [],
            "cross_hits": []
        }