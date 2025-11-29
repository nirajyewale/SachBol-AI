# publisher.py - ENHANCED
from datetime import datetime
from storage import upsert_claim, add_evidence
from emergence_detector import canonicalize, add_claim_observation, detect_emerging

# SocketIO instance (initialized in app.py)
socketio = None

def init_socketio(sio):
    global socketio
    socketio = sio

async def publish_with_audiences(verification, origin=None):
    claim = verification.get("claim", "")
    canonical = canonicalize(claim)
     
    # Add to emergence detection
    add_claim_observation(canonical)
    
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "claim": claim,
        "score": verification.get("score", 0.0),
        "severity": verification.get("severity", "Uncertain"),
        "emerging": any(e["canonical"]==canonical for e in detect_emerging())
    }

    # Send via WebSocket instead of queue
    if socketio:
        socketio.emit('new_verification', payload)
    
    # For human review (high risk)
    if verification.get("score", 0) <= -0.5:
        if socketio:
            socketio.emit('human_review', payload)
    
    return payload