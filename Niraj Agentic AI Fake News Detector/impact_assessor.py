# impact_assessor.py
def assess_misinformation_impact(claim, reach_estimate, crisis_context):
    """Calculate potential harm score of misinformation"""
    base_risk = 0.5 if crisis_context else 0.2
    reach_factor = min(reach_estimate / 100000, 1.0)  # Normalize reach
    veracity_risk = 1.0 if claim["score"] < -0.7 else 0.5
    
    impact_score = (base_risk + reach_factor + veracity_risk) / 3
    
    return {
        "impact_score": impact_score,
        "risk_level": "high" if impact_score > 0.7 else "medium" if impact_score > 0.4 else "low",
        "factors": {
            "crisis_relevance": bool(crisis_context),
            "estimated_reach": reach_estimate,
            "veracity_confidence": abs(claim["score"])
        }
    }