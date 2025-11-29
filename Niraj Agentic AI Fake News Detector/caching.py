# caching.py
import redis
import json
from functools import wraps

def cache_response(ttl=300):
    def decorator(f):
        @wraps(f)
        async def decorated_function(*args, **kwargs):
            cache_key = f"{f.__name__}:{str(args)}:{str(kwargs)}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = await f(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))
            return result
        return decorated_function
    return decorator