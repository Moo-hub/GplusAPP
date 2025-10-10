# Changelog — testability and Redis handling

## 2025-10-10

- Make security middleware lazy-load Redis client via `get_redis_client()` to avoid import-time network calls and make tests hermetic.
- Add `app/core/redis_client.InMemoryRedis` fallback used during tests or when Redis is unavailable.
- Move test-only endpoints into a dedicated `_test_helpers.py` router and include it only when `ENVIRONMENT == 'test'`.
- Defensive serialization and test-friendly changes to make cached API responses stable under test doubles.

## Next steps

- Add unit tests for RateLimiter behavior (done/optional) and document ENVIRONMENT-driven behaviors in README.
- Consider adding a stricter test-mode that asserts Redis is used via dependency injection for specific integration tests.
