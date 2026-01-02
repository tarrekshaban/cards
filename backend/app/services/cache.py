"""Simple in-memory cache for catalog data."""

from typing import Any, Dict, Optional, TypeVar, Generic
from datetime import datetime, timedelta

T = TypeVar("T")

class CacheEntry(Generic[T]):
    def __init__(self, data: T, ttl_seconds: int = 300):
        self.data = data
        self.expires_at = datetime.now() + timedelta(seconds=ttl_seconds)

    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at

class MemoryCache:
    def __init__(self):
        self._cache: Dict[str, CacheEntry] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            return None
        
        if entry.is_expired:
            del self._cache[key]
            return None
            
        return entry.data

    def set(self, key: str, data: Any, ttl_seconds: int = 300):
        self._cache[key] = CacheEntry(data, ttl_seconds)

    def invalidate(self, key_prefix: str):
        """Invalidate all keys starting with the prefix."""
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(key_prefix)]
        for k in keys_to_delete:
            del self._cache[k]

    def clear(self):
        self._cache.clear()

# Global cache instance
catalog_cache = MemoryCache()
