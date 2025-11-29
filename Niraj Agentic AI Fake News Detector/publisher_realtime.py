# publisher_realtime.py - Storage-free version
from datetime import datetime
from emergence_detector import canonicalize, add_claim_observation, detect_emerging

socketio = None

def init_socketio(sio):
    global socketio
    socketio = sio

async def publish_realtime_only(verification, origin=None):
    claim = verification.get("claim", "")
    canonical = canonicalize(claim)
    
    # ✅ In-memory trend tracking only
    add_claim_observation(canonical)
    
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "claim": claim,
        "score": verification.get("score", 0.0),
        "severity": verification.get("severity", "Uncertain"),
        "emerging": any(e["canonical"]==canonical for e in detect_emerging()),
        "origin": origin
    }

    # ✅ Real-time WebSocket broadcasting
    if socketio:
        socketio.emit('new_verification', payload)
    
    # ✅ High-risk alerts
    if verification.get("score", 0) <= -0.5:
        if socketio:
            socketio.emit('human_review', payload)
    
    # ✅ Crisis alerts
    crisis_context = detect_crisis_context(claim) if 'detect_crisis_context' in globals() else None
    if crisis_context:
        if socketio:
            socketio.emit('crisis_alert', {
                **payload,
                'crisis_context': crisis_context
            })
    
    return payload