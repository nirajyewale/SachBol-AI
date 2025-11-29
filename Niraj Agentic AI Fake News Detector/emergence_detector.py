# emergence_detector.py
import time
from collections import defaultdict, deque
from difflib import SequenceMatcher

WINDOW_SECONDS = 3600      # 1 hour rolling window
MIN_SIMILARITY = 0.75

# store recent claims: (timestamp, canonical_claim)
recent_claims = deque()

def canonicalize(text: str) -> str:
    """Normalize text for clustering/comparison."""
    return "".join(ch.lower() if ch.isalnum() or ch.isspace() else " " for ch in text).strip()

def similar(a: str, b: str) -> float:
    """Compute similarity ratio between two strings."""
    return SequenceMatcher(None, a, b).ratio()

def add_claim_observation(canonical_text: str):
    """Add a claim observation to rolling window."""
    now = time.time()
    recent_claims.append((now, canonical_text))

    # trim old entries
    cutoff = now - WINDOW_SECONDS
    while recent_claims and recent_claims[0][0] < cutoff:
        recent_claims.popleft()

def detect_emerging(min_count: int = 4, min_velocity: float = 0.6):
    """Detect emerging misinformation trends based on frequency and change over time."""
    now = time.time()
    half_window = WINDOW_SECONDS / 2

    recent_counts = defaultdict(int)
    previous_counts = defaultdict(int)

    for ts, claim in recent_claims:
        if ts >= now - half_window:
            recent_counts[claim] += 1
        else:
            previous_counts[claim] += 1

    emerging = []
    for claim, count_new in recent_counts.items():
        count_old = previous_counts.get(claim, 0)
        velocity = (count_new - count_old) / max(1, count_old) if count_old > 0 else count_new

        if count_new >= min_count or velocity >= min_velocity:
            emerging.append({
                "canonical": claim,
                "count": count_new,
                "velocity": velocity
            })

    return emerging

def cluster_claims(claim_list, sim_threshold: float = MIN_SIMILARITY):
    """Group similar claims together."""
    clusters = []
    for claim in claim_list:
        placed = False
        for group in clusters:
            if any(similar(claim, member) >= sim_threshold for member in group):
                group.append(claim)
                placed = True
                break
        if not placed:
            clusters.append([claim])
    return clusters
