# reporting.py
def generate_crisis_report(timeframe="24h"):
    """Generate comprehensive crisis misinformation report"""
    claims = get_recent_claims(timeframe)
    crisis_claims = [c for c in claims if c.get('crisis_context')]
    
    report = {
        "timeframe": timeframe,
        "total_claims": len(claims),
        "crisis_related": len(crisis_claims),
        "top_crisis_types": Counter([list(c['crisis_context'].keys())[0] 
                                   for c in crisis_claims]),
        "high_risk_claims": [c for c in crisis_claims 
                           if c['impact_score'] > 0.7],
        "recommendations": generate_recommendations(crisis_claims)
    }
    
    return report