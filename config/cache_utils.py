# kpi/cache_utils.py
from django.core.cache import cache
from django.conf import settings
import hashlib
import json

def generate_cache_key(validated_data):
    """
    Generate a unique cache key based on all query parameters.
    """
    cache_config = getattr(settings, 'AGGREGATION_CACHE_CONFIG', {})
    key_prefix = cache_config.get('KEY_PREFIX', 'aggregation')
    
    # Create a sorted string representation of all parameters
    sorted_params = sorted([
        f"{key}:{str(value)}" 
        for key, value in validated_data.items() 
        if value is not None
    ])
    
    param_string = "|".join(sorted_params)
    cache_key = f"{key_prefix}:{param_string}"
    
    # Use MD5 hash if the key is too long (Redis key length limit is 512MB but shorter is better)
    if len(cache_key) > 200:
        import hashlib
        cache_key = f"{key_prefix}:{hashlib.md5(cache_key.encode()).hexdigest()}"
        
    return cache_key
    
def get_cache_timeout(time_bucket):
    """
    Get cache timeout based on time_bucket parameter.
    """
    cache_config = getattr(settings, 'AGGREGATION_CACHE_CONFIG', {})
    timeouts = cache_config.get('TIMEOUTS', {})
    default_timeout = cache_config.get('DEFAULT_TIMEOUT', 3600)
    
    return timeouts.get(time_bucket, default_timeout)


def invalidate_pattern(pattern):
    """
    Invalidate cache keys matching a pattern.
    Use with caution in production with Redis.
    """
    from django.core.cache import cache
    keys = cache.keys(pattern)
    if keys:
        cache.delete_many(keys)
    return len(keys)

def invalidate_aggregation_cache():
    """
    Invalidate all aggregation cache keys.
    """
    cache_config = getattr(settings, 'AGGREGATION_CACHE_CONFIG', {})
    key_prefix = cache_config.get('KEY_PREFIX', 'aggregation')
    return invalidate_pattern(f"{key_prefix}:*")

def get_cache_info():
    """
    Get cache statistics and information.
    """
    cache_config = getattr(settings, 'AGGREGATION_CACHE_CONFIG', {})
    return {
        'cache_backend': settings.CACHES['default']['BACKEND'],
        'key_prefix': cache_config.get('KEY_PREFIX'),
        'default_timeout': cache_config.get('DEFAULT_TIMEOUT'),
        'timeouts': cache_config.get('TIMEOUTS', {})
    }
