# backend/app/core/cache.py
import redis
from app.core.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    db=settings.REDIS_DB,
    decode_responses=True
)

def get_cache(key: str):
    return redis_client.get(key)

def set_cache(key: str, value: str, expire: int = 3600):
    return redis_client.set(key, value, ex=expire)