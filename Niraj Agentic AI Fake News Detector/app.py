# app.py - ENHANCED WITH HYBRID VERIFICATION
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import asyncio
import threading
import json
from datetime import datetime
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize socketio in publisher
try:
    from publisher import init_socketio
    init_socketio(socketio)
except ImportError:
    print("Publisher module not available")

# Global state
latest_updates = []
emerging_trends = []

# Enhanced sample data
SAMPLE_CLAIMS = [
    {'id': 1, 'text': 'Vaccines contain microchips', 'category': 'Health', 'status': 'false', 'date': '2023-11-15', 'confidence': 95},
    {'id': 2, 'text': 'Climate change is a hoax', 'category': 'Science', 'status': 'false', 'date': '2023-11-14', 'confidence': 88},
    {'id': 3, 'text': 'New study shows exercise benefits', 'category': 'Health', 'status': 'verified', 'date': '2023-11-13', 'confidence': 92},
    {'id': 4, 'text': '5G towers cause COVID-19', 'category': 'Technology', 'status': 'false', 'date': '2023-11-12', 'confidence': 78},
    {'id': 5, 'text': 'Government stimulus checks', 'category': 'Finance', 'status': 'verified', 'date': '2023-11-11', 'confidence': 85},
]

SAMPLE_INSIGHTS = [
    {'title': 'Health Misinformation Spike', 'content': '45% increase in false health claims', 'time': '1 hour ago', 'trend': 45, 'impact': 'High'},
    {'title': 'New Conspiracy Pattern', 'content': 'Emerging pattern in political misinformation', 'time': '3 hours ago', 'trend': 32, 'impact': 'Medium'},
]

# ===== ALL ROUTES (Keep existing routes) =====
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/human-review')
def human_review():
    return render_template('human_review.html')

@app.route('/analysis')
def analysis():
    return render_template('analysis.html')

# ... [Keep all your existing routes] ...

# ===== ENHANCED API ENDPOINTS =====

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    """Enhanced analysis with hybrid verification"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        text = data.get('text', '').strip()
        print(f"🔍 Analyzing: '{text}'")
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Use hybrid verification
        verification = hybrid_verify_claim(text)
        
        return jsonify({
            'claims': [text],
            'verification': verification
        })
        
    except Exception as e:
        print(f"❌ Error in /api/analyze: {e}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

def hybrid_verify_claim(claim):
    """Hybrid verification combining multiple approaches"""
    print(f"🔄 Starting hybrid verification for: {claim}")
    
    # 1. Check known facts first (fastest)
    known_result = check_known_facts(claim)
    if known_result is not None:
        print("✅ Known fact match")
        return build_verification_result(known_result, "KNOWN_FACT", 0.95)
    
    # 2. Check external APIs
    try:
        api_result = asyncio.run(external_factcheck_apis(claim))
        if api_result and api_result.get('score') != 0:
            print("✅ External API result")
            return api_result
    except Exception as e:
        print(f"⚠️ External API failed: {e}")
    
    # 3. Use enhanced pattern analysis
    print("🔍 Using enhanced pattern analysis")
    return enhanced_pattern_analysis(claim)

# ===== KNOWLEDGE BASE =====

def check_known_facts(claim):
    """Check against known facts database"""
    claim_lower = claim.lower().strip()
    
    # Geography facts
    geography_facts = {
        "delhi is capital of india": True,
        "new delhi is capital of india": True,
        "mumbai is capital of india": False,
        "tokyo is capital of japan": True,
        "beijing is capital of china": True,
        "washington dc is capital of usa": True,
        "london is capital of uk": True,
        "paris is capital of france": True,
    }
    
    # Political facts
    political_facts = {
        "narendra modi is prime minister of india": True,
        "prime minister of india is narendra modi": True,
        "president of india is": True,
        "joe biden is president of usa": True,
    }
    
    # Scientific facts
    scientific_facts = {
        "earth is round": True,
        "earth is flat": False,
        "water boils at 100 degrees celsius": True,
        "gravity exists": True,
        "vaccines are effective": True,
        "climate change is real": True,
    }
    
    # Known misinformation
    known_falsehoods = {
        "vaccines cause autism": False,
        "covid is a hoax": False,
        "5g causes coronavirus": False,
        "moon landing was fake": False,
        "holocaust didn't happen": False,
        "chemtrails are real": False,
    }
    
    # Check all knowledge bases
    all_facts = {**geography_facts, **political_facts, **scientific_facts, **known_falsehoods}
    
    for fact, truth_value in all_facts.items():
        if fact in claim_lower:
            return truth_value
    
    return None  # Unknown fact

# ===== EXTERNAL API INTEGRATION =====

async def external_factcheck_apis(claim):
    """Integrate multiple external fact-checking APIs"""
    results = []
    
    try:
        # 1. Google Fact Check API
        from verifier import google_factcheck_search
        google_results = await google_factcheck_search(claim, max_results=3)
        if google_results:
            google_score = analyze_google_results(google_results)
            results.append(('google', google_score))
            print(f"🔍 Google Fact Check: {google_score}")
    
    except Exception as e:
        print(f"⚠️ Google API error: {e}")
    
    try:
        # 2. News API cross-verification
        from verifier import _search_newsdata
        news_results = await _search_newsdata(claim, max_results=5)
        if news_results:
            news_score = analyze_news_coverage(news_results)
            results.append(('news', news_score))
            print(f"📰 News verification: {news_score}")
    
    except Exception as e:
        print(f"⚠️ News API error: {e}")
    
    # Combine results
    if results:
        final_score = combine_api_scores(results)
        return build_verification_result(final_score > 0, "EXTERNAL_APIS", 0.85)
    
    return None

def analyze_google_results(google_results):
    """Analyze Google Fact Check API results"""
    if not google_results:
        return 0.0
    
    score = 0.0
    for result in google_results:
        claim_review = result.get('claimReview', [])
        for review in claim_review:
            text = f"{review.get('text', '')} {review.get('title', '')}".lower()
            if any(word in text for word in ['false', 'incorrect', 'misleading', 'debunked']):
                score -= 0.8
            elif any(word in text for word in ['true', 'correct', 'accurate']):
                score += 0.8
    
    return score / len(google_results) if google_results else 0.0

def analyze_news_coverage(news_results):
    """Analyze news coverage for credibility"""
    if not news_results:
        return 0.0
    
    credible_sources = ['reuters', 'associated press', 'bbc', 'cnn', 'the new york times']
    questionable_sources = ['infowars', 'natural news', 'before its news']
    
    score = 0.0
    for article in news_results:
        source = article.get('source_id', '').lower()
        if any(credible in source for credible in credible_sources):
            score += 0.3
        elif any(questionable in source for questionable in questionable_sources):
            score -= 0.3
    
    return max(-1.0, min(1.0, score))

def combine_api_scores(api_results):
    """Combine scores from multiple APIs"""
    total_score = 0.0
    weight_sum = 0.0
    
    weights = {'google': 0.6, 'news': 0.4}
    
    for api_name, score in api_results:
        weight = weights.get(api_name, 0.3)
        total_score += score * weight
        weight_sum += weight
    
    return total_score / weight_sum if weight_sum > 0 else 0.0

# ===== ENHANCED PATTERN ANALYSIS =====

def enhanced_pattern_analysis(claim):
    """Advanced pattern analysis when APIs fail"""
    claim_lower = claim.lower()
    score = 0.0
    
    # First, check for basic factual statements that should be TRUE
    basic_truths = {
        "mumbai is in india": 0.9,
        "india is a country": 0.9,
        "delhi is capital of india": 0.9,
        "new delhi is capital of india": 0.9,
        "earth is round": 0.9,
        "water boils at 100 degrees": 0.8,
        "gravity exists": 0.9,
        "vaccines are effective": 0.8,
        "climate change is real": 0.8,
    }
    
    # Check basic truths first
    for truth, truth_score in basic_truths.items():
        if truth in claim_lower:
            return build_verification_result(truth_score, "BASIC_FACT", 0.9)
    
    # Credibility indicators
    credible_patterns = {
        "study shows": 0.7, "research indicates": 0.8, "according to study": 0.7,
        "scientists found": 0.6, "evidence shows": 0.8, "data indicates": 0.7,
        "official report": 0.6, "medical journal": 0.7, "clinical trial": 0.8,
        "peer-reviewed": 0.9, "scientific consensus": 0.8,
        "university of": 0.5, "research institute": 0.6,
        "government announces": 0.4, "official statement": 0.4,
    }
    
    # Misinformation indicators
    false_patterns = {
        "miracle cure": -0.9, "secret they don't want you to know": -0.8,
        "government cover-up": -0.7, "big pharma": -0.6, 
        "mainstream media lying": -0.7, "100% effective": -0.8,
        "instant cure": -0.9, "hidden truth": -0.7,
        "conspiracy": -0.5, "they're hiding": -0.6,
        "breakthrough doctors hate": -0.8, "lose weight fast": -0.6,
        "cure they don't want you to know": -0.8,
    }
    
    # Crisis misinformation (extra penalty) - ONLY apply when combined with false patterns
    crisis_terms = ["death", "kills", "dead", "died", "dangerous", "emergency", "outbreak"]
    crisis_count = sum(1 for term in crisis_terms if term in claim_lower)
    
    # Calculate scores
    for pattern, weight in credible_patterns.items():
        if pattern in claim_lower:
            score += weight
    
    for pattern, weight in false_patterns.items():
        if pattern in claim_lower:
            score += weight
    
    # Extra penalty for crisis misinformation ONLY if already suspicious
    if crisis_count > 0 and score < -0.3:
        score -= (crisis_count * 0.1)
    
    # Normalize score
    score = max(-1.0, min(1.0, score))
    
    return build_verification_result(score, "PATTERN_ANALYSIS", 0.75)


def build_verification_result(score, method, confidence):
    """Build standardized verification result"""
    # Handle boolean inputs
    if isinstance(score, bool):
        score = 0.8 if score else -0.8
    
    # Ensure score is within bounds
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
        'claim': '',
        'score': round(score, 2),
        'severity': severity,
        'confidence': round(confidence, 2),
        'verification_method': method,
        'analysis': get_analysis_explanation(score, method)
    }

def get_analysis_explanation(score, method):
    """Provide analysis explanation"""
    explanations = {
        "KNOWN_FACT": "Verified against known factual database",
        "BASIC_FACT": "Verified as basic factual information",
        "EXTERNAL_APIS": "Cross-verified with external fact-checking services", 
        "PATTERN_ANALYSIS": "Analyzed using credibility and misinformation patterns"
    }
    
    base_explanation = explanations.get(method, "Analyzed using multiple verification methods")
    
    if score >= 0.7:
        return f"{base_explanation} - Shows strong credibility indicators"
    elif score >= 0.4:
        return f"{base_explanation} - Appears credible"
    elif score >= 0.1:
        return f"{base_explanation} - Some credibility indicators present"
    elif score >= -0.1:
        return f"{base_explanation} - Neutral or insufficient information"
    elif score >= -0.4:
        return f"{base_explanation} - Shows suspicious patterns"
    elif score >= -0.7:
        return f"{base_explanation} - Matches known misinformation patterns"
    else:
        return f"{base_explanation} - Strong indicators of misinformation"

# ===== KEEP EXISTING ENDPOINTS =====

@app.route('/api/updates')
def get_updates():
    return jsonify({'updates': latest_updates[-10:]})  # Only recent updates

@app.route('/api/trends')
def get_trends():
    # Mock trends data
    trends = [
        {'topic': 'Health Misinformation', 'mentions': 45, 'falseClaims': 38},
        {'topic': 'Political Conspiracies', 'mentions': 32, 'falseClaims': 28},
        {'topic': 'Financial Scams', 'mentions': 21, 'falseClaims': 18},
        {'topic': 'Technology Fears', 'mentions': 18, 'falseClaims': 15},
        {'topic': 'Entertainment Rumors', 'mentions': 12, 'falseClaims': 10}
    ]
    return jsonify({'trends': trends})

@app.route('/api/claims')
def get_claims():
    try:
        # Get filter parameters from request
        category_filter = request.args.get('category', 'all')
        status_filter = request.args.get('status', 'all')
        time_period = request.args.get('time_period', 'all')
        
        print(f"API Request - Category: {category_filter}, Status: {status_filter}, Time: {time_period}")
        
        # Filter claims based on parameters
        filtered_claims = SAMPLE_CLAIMS.copy()
        
        # Apply category filter
        if category_filter != 'all':
            filtered_claims = [claim for claim in filtered_claims if claim['category'].lower() == category_filter.lower()]
        
        # Apply status filter
        if status_filter != 'all':
            filtered_claims = [claim for claim in filtered_claims if claim['status'] == status_filter]
        
        # Apply time period filter (simplified)
        if time_period != 'all':
            # In a real implementation, you would filter by actual dates
            # For demo, we'll just return a subset based on the time period
            if time_period == '7d':
                filtered_claims = filtered_claims[:3]  # Simulate recent claims
            elif time_period == '30d':
                filtered_claims = filtered_claims[:6]  # Simulate last month claims
            elif time_period == '90d':
                filtered_claims = filtered_claims  # All claims (simulated)
        
        print(f"API Response: {len(filtered_claims)} claims")
        return jsonify({'claims': filtered_claims})
    
    except Exception as e:
        print(f"Error in /api/claims: {e}")
        return jsonify({'error': str(e), 'claims': []}), 500

@app.route('/api/claims/detailed')
def get_detailed_claims():
    """Get detailed claims data for the detailed view"""
    category_filter = request.args.get('category', 'all')
    status_filter = request.args.get('status', 'all')
    time_period = request.args.get('time_period', '30d')
    
    # Start with all claims
    filtered_claims = SAMPLE_CLAIMS.copy()
    
    # Apply filters
    if category_filter != 'all':
        filtered_claims = [claim for claim in filtered_claims if claim['category'].lower() == category_filter.lower()]
    
    if status_filter != 'all':
        filtered_claims = [claim for claim in filtered_claims if claim['status'] == status_filter]
    
    # Add additional details for the detailed view
    detailed_claims = []
    for claim in filtered_claims:
        detailed_claim = claim.copy()
        # Add additional fields for detailed view
        detailed_claim.update({
            'source': get_source_for_claim(claim['id']),
            'reach_estimate': get_reach_estimate(claim['id']),
            'verification_time': get_verification_time(claim['id']),
            'similar_claims': get_similar_claims(claim['id']),
            'impact_score': get_impact_score(claim['id'])
        })
        detailed_claims.append(detailed_claim)
    
    return jsonify({'claims': detailed_claims})

@app.route('/api/insights')
def get_insights():
    # Get filter parameters
    time_period = request.args.get('time_period', '30d')
    
    # Filter insights based on time period (simplified)
    if time_period == '7d':
        filtered_insights = SAMPLE_INSIGHTS[:2]  # Recent insights
    elif time_period == '30d':
        filtered_insights = SAMPLE_INSIGHTS[:3]  # Last month insights
    elif time_period == '90d':
        filtered_insights = SAMPLE_INSIGHTS  # All insights
    else:
        filtered_insights = SAMPLE_INSIGHTS
    
    return jsonify({'insights': filtered_insights})

@app.route('/api/insights/all')
def get_all_insights():
    """Get all insights for the insights view"""
    time_period = request.args.get('time_period', 'all')
    
    # In a real app, this would fetch from database
    # For demo, we'll expand our sample insights
    all_insights = [
        {'id': 1, 'title': 'Health Misinformation Spike', 'content': '45% increase in false health claims related to new medical treatments', 'time': '1 hour ago', 'trend': 45, 'impact': 'High', 'category': 'Health', 'confidence': 92},
        {'id': 2, 'title': 'New Conspiracy Pattern', 'content': 'Emerging pattern in political misinformation targeting election integrity', 'time': '3 hours ago', 'trend': 32, 'impact': 'Medium', 'category': 'Politics', 'confidence': 85},
        {'id': 3, 'title': 'Financial Scams Alert', 'content': 'Increase in fake investment opportunities and cryptocurrency scams', 'time': '5 hours ago', 'trend': 28, 'impact': 'High', 'category': 'Finance', 'confidence': 88},
        {'id': 4, 'title': 'Technology Fears Rising', 'content': 'Misinformation about AI and new technologies causing public concern', 'time': '1 day ago', 'trend': 35, 'impact': 'Medium', 'category': 'Technology', 'confidence': 79},
        {'id': 5, 'title': 'Entertainment Rumors', 'content': 'False celebrity stories and fabricated entertainment news spreading rapidly', 'time': '2 days ago', 'trend': 22, 'impact': 'Low', 'category': 'Entertainment', 'confidence': 76},
        {'id': 6, 'title': 'Science Misinformation', 'content': 'Misinterpreted scientific studies leading to false conclusions', 'time': '3 days ago', 'trend': 18, 'impact': 'Medium', 'category': 'Science', 'confidence': 81}
    ]
    
    return jsonify({'insights': all_insights})

@app.route('/api/sources/analysis')
def get_sources_analysis():
    """Get detailed sources analysis"""
    time_period = request.args.get('time_period', '30d')
    
    sources_data = {
        'social_media': {
            'total_claims': 1250,
            'false_claims': 890,
            'verified_claims': 360,
            'platforms': [
                {'name': 'Twitter', 'claims': 450, 'false_rate': 72},
                {'name': 'Facebook', 'claims': 380, 'false_rate': 68},
                {'name': 'Instagram', 'claims': 220, 'false_rate': 65},
                {'name': 'TikTok', 'claims': 200, 'false_rate': 75}
            ]
        },
        'news_sites': {
            'total_claims': 800,
            'false_claims': 120,
            'verified_claims': 680,
            'categories': [
                {'name': 'Mainstream News', 'claims': 600, 'false_rate': 8},
                {'name': 'Alternative News', 'claims': 200, 'false_rate': 52}
            ]
        },
        'blogs': {
            'total_claims': 350,
            'false_claims': 210,
            'verified_claims': 140,
            'types': [
                {'name': 'Personal Blogs', 'claims': 200, 'false_rate': 65},
                {'name': 'Corporate Blogs', 'claims': 150, 'false_rate': 55}
            ]
        }
    }
    
    return jsonify(sources_data)

# Add to app.py after existing routes
@app.route('/api/crisis-alerts')
def get_crisis_alerts():
    """Get active crisis misinformation alerts"""
    crisis_alerts = [
        {
            'id': 1,
            'claim': 'New COVID variant has 50% mortality rate and vaccine resistance',
            'crisis_type': 'health',
            'severity': 'high',
            'reach': 50000,
            'first_detected': '2 hours ago',
            'trend': 'rising',
            'recommended_action': 'Issue WHO-approved correction'
        },
        {
            'id': 2, 
            'claim': 'Government hiding true death toll from natural disaster',
            'crisis_type': 'disaster',
            'severity': 'medium',
            'reach': 25000,
            'first_detected': '4 hours ago',
            'trend': 'stable',
            'recommended_action': 'Coordinate with official channels'
        }
    ]
    return jsonify({'alerts': crisis_alerts})

@app.route('/api/crisis-stats')
def get_crisis_stats():
    """Get crisis-specific statistics"""
    return jsonify({
        'active_crises': 3,
        'crisis_claims_today': 47,
        'high_risk_alerts': 8,
        'response_time_minutes': 28
    })

@app.route('/api/export')
def export_data():
    # Get filter parameters
    category_filter = request.args.get('category', 'all')
    status_filter = request.args.get('status', 'all')
    time_period = request.args.get('time_period', '30d')
    
    # Filter data for export (using same logic as get_claims)
    filtered_claims = SAMPLE_CLAIMS.copy()
    
    if category_filter != 'all':
        filtered_claims = [claim for claim in filtered_claims if claim['category'].lower() == category_filter.lower()]
    
    if status_filter != 'all':
        filtered_claims = [claim for claim in filtered_claims if claim['status'] == status_filter]
    
    # Prepare export data
    export_data = {
        'exported_at': datetime.utcnow().isoformat(),
        'filters_applied': {
            'category': category_filter,
            'status': status_filter,
            'time_period': time_period
        },
        'total_claims': len(filtered_claims),
        'claims': filtered_claims
    }
    
    return jsonify(export_data)

# Helper functions for detailed data
def get_source_for_claim(claim_id):
    sources = ['Twitter', 'Facebook', 'News Site', 'Blog', 'Forum']
    return sources[claim_id % len(sources)]

def get_reach_estimate(claim_id):
    return (claim_id * 1000) + 5000

def get_verification_time(claim_id):
    times = ['2 minutes', '15 minutes', '1 hour', '3 hours', '6 hours']
    return times[claim_id % len(times)]

def get_similar_claims(claim_id):
    return max(1, claim_id % 5)

def get_impact_score(claim_id):
    return min(100, 30 + (claim_id * 10))

# Background agent thread
def start_agent():
    try:
        from simple_agent import run_simple_agent
        asyncio.run(run_simple_agent())
    except Exception as e:
        print(f"Agent error: {e}")

if __name__ == '__main__':
    # Start agent in background
    try:
        agent_thread = threading.Thread(target=start_agent, daemon=True)
        agent_thread.start()
    except Exception as e:
        print(f"Could not start agent: {e}")
    
    socketio.run(app, debug=True, port=5000)