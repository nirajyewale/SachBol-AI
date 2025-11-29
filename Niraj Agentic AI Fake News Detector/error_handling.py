# error_handling.py
class MisinformationDetectionError(Exception):
    pass

class SourceUnavailableError(MisinformationDetectionError):
    pass

async def robust_verification(claim):
    """Verification with comprehensive error handling"""
    try:
        return await verify_claim(claim)
    except httpx.RequestError as e:
        logger.error(f"Network error verifying claim: {e}")
        return {
            "claim": claim,
            "score": 0.0,
            "severity": "Uncertain",
            "error": "Source temporarily unavailable"
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise MisinformationDetectionError(f"Verification failed: {str(e)}")