# cultural_context.py
CULTURAL_SENSITIVE_TOPICS = {
    "religious_symbols", "ethnic_groups", "historical_events", 
    "political_figures", "cultural_practices"
}

def add_cultural_context(claim, location_data=None):
    """Add cultural sensitivity analysis"""
    claim_lower = claim.lower()
    sensitive_topics = [topic for topic in CULTURAL_SENSITIVE_TOPICS 
                       if topic in claim_lower]
    
    return {
        "sensitive_topics": sensitive_topics,
        "requires_cultural_review": len(sensitive_topics) > 0,
        "region_specific": location_data is not None
    }