const { getRedisClient, isRedisReady } = require("../config/redis");
const { recordRateLimitEvent } = require("../config/metrics");

const fallbackBuckets = new Map();

function getFallbackRate({ key, windowSeconds }) {
  const now = Date.now();
  const existing = fallbackBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextBucket = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    fallbackBuckets.set(key, nextBucket);
    return nextBucket;
  }

  existing.count += 1;
  fallbackBuckets.set(key, existing);
  return existing;
}

function createRateLimiter(options = {}) {
  const {
    keyPrefix = "rl:global",
    windowSeconds = 60,
    max = 60,
    keyGenerator,
    message = "Too many requests, please try again later.",
  } = options;

  return async function rateLimitMiddleware(req, res, next) {
    const rawIdentity =
      typeof keyGenerator === "function"
        ? keyGenerator(req)
        : req.ip || req.socket?.remoteAddress || "unknown";

    const identity = String(rawIdentity || "unknown").toLowerCase();
    const redisKey = `${keyPrefix}:${identity}`;

    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          const count = await client.incr(redisKey);
          if (count === 1) {
            await client.expire(redisKey, windowSeconds);
          }

          const ttl = await client.ttl(redisKey);

          res.set("X-RateLimit-Limit", String(max));
          res.set("X-RateLimit-Remaining", String(Math.max(max - count, 0)));
          res.set("X-RateLimit-Reset", String(Math.max(ttl, 0)));

          if (count > max) {
            recordRateLimitEvent({
              keyPrefix,
              backend: "redis",
              outcome: "rejected",
              remaining: 0,
            });
            return res.status(429).json({
              success: false,
              error: true,
              message,
            });
          }

          recordRateLimitEvent({
            keyPrefix,
            backend: "redis",
            outcome: "allowed",
            remaining: Math.max(max - count, 0),
          });

          return next();
        }
      }

      const fallback = getFallbackRate({ key: redisKey, windowSeconds });
      const ttlSeconds = Math.ceil((fallback.resetAt - Date.now()) / 1000);

      res.set("X-RateLimit-Limit", String(max));
      res.set(
        "X-RateLimit-Remaining",
        String(Math.max(max - fallback.count, 0)),
      );
      res.set("X-RateLimit-Reset", String(Math.max(ttlSeconds, 0)));

      if (fallback.count > max) {
        recordRateLimitEvent({
          keyPrefix,
          backend: "memory",
          outcome: "rejected",
          remaining: 0,
        });
        return res.status(429).json({
          success: false,
          error: true,
          message,
        });
      }

      recordRateLimitEvent({
        keyPrefix,
        backend: "memory",
        outcome: "allowed",
        remaining: Math.max(max - fallback.count, 0),
      });

      return next();
    } catch (error) {
      recordRateLimitEvent({
        keyPrefix,
        backend: "unknown",
        outcome: "error",
      });
      console.error("rate limiter error:", error.message || error);
      return next();
    }
  };
}

module.exports = {
  createRateLimiter,
};
