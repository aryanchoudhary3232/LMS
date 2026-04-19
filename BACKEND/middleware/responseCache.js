const crypto = require("crypto");
const { getRedisClient, isRedisReady } = require("../config/redis");
const { recordCacheEvent } = require("../config/metrics");

const DEFAULT_CACHE_TTL = Number(process.env.CACHE_DEFAULT_TTL || 120);

const cacheTags = {
  coursesPublic: "courses:public",
  statsPublic: "stats:public",
  teachersPublic: "teachers:public",
  adminDashboard: "admin:dashboard",
  adminUsers: "admin:users",
  adminCourses: "admin:courses",
  adminDeletedUsers: "admin:deleted:users",
  superadminOverview: "superadmin:overview",
  superadminRevenue: "superadmin:revenue",
  superadminCourses: "superadmin:courses",
  superadminUsers: "superadmin:users",
  superadminAnalytics: "superadmin:analytics",
  student: (userId) => `student:${String(userId || "anonymous")}`,
  teacher: (userId) => `teacher:${String(userId || "anonymous")}`,
  cart: (userId) => `cart:${String(userId || "anonymous")}`,
  course: (courseId) => `course:${String(courseId || "unknown")}`,
};

function hash(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function normalizeTags(tags) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return [...new Set(list.filter(Boolean).map((tag) => String(tag)))];
}

function defaultKeyBuilder(req, namespace, varyByUser) {
  const role = req.user?.role || "public";
  const userId = req.user?._id || req.user?.id || "anonymous";
  const userPart = varyByUser ? `:${role}:${userId}` : "";
  return `${namespace}:${req.method}:${req.originalUrl}${userPart}`;
}

async function tagCacheKey({ key, tags, ttlSeconds }) {
  if (!isRedisReady() || !tags?.length) return;

  const client = getRedisClient();
  if (!client) return;

  const tagTtl = Math.max(ttlSeconds * 3, 3600);
  const multi = client.multi();

  tags.forEach((tag) => {
    const tagKey = `cache:tag:${tag}`;
    multi.sAdd(tagKey, key);
    multi.expire(tagKey, tagTtl);
  });

  try {
    await multi.exec();
    recordCacheEvent({
      namespace: "tagged",
      operation: "tag",
      result: "success",
    });
  } catch (error) {
    recordCacheEvent({
      namespace: "tagged",
      operation: "tag",
      result: "error",
    });
    console.error("cache tag update failed:", error.message || error);
  }
}

async function invalidateCacheByTags(tags = []) {
  const normalizedTags = normalizeTags(tags);
  if (!normalizedTags.length || !isRedisReady()) return 0;

  const client = getRedisClient();
  if (!client) return 0;

  let deletedCount = 0;

  for (const tag of normalizedTags) {
    const tagKey = `cache:tag:${tag}`;
    const start = process.hrtime.bigint();

    try {
      const keys = await client.sMembers(tagKey);
      if (keys.length) {
        deletedCount += await client.del(keys);
      }
      await client.del(tagKey);

      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      recordCacheEvent({
        namespace: "tagged",
        operation: "invalidate",
        result: "success",
        durationMs,
      });
    } catch (error) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      recordCacheEvent({
        namespace: "tagged",
        operation: "invalidate",
        result: "error",
        durationMs,
      });
      console.error(`failed to invalidate tag ${tag}:`, error.message || error);
    }
  }

  return deletedCount;
}

function cacheResponse(options = {}) {
  const {
    ttlSeconds = DEFAULT_CACHE_TTL,
    namespace = "http",
    varyByUser = false,
    keyBuilder,
    tags = [],
  } = options;

  return async function cacheResponseMiddleware(req, res, next) {
    if (req.method !== "GET") return next();
    if (!isRedisReady()) return next();

    const client = getRedisClient();
    if (!client) return next();

    const rawKey =
      typeof keyBuilder === "function"
        ? keyBuilder(req)
        : defaultKeyBuilder(req, namespace, varyByUser);

    const cacheKey = `cache:${namespace}:${hash(rawKey)}`;

    try {
      const readStart = process.hrtime.bigint();
      const cachedPayload = await client.get(cacheKey);
      const readDurationMs = Number(process.hrtime.bigint() - readStart) / 1_000_000;

      if (cachedPayload) {
        const parsed = JSON.parse(cachedPayload);
        res.set("X-Cache", "HIT");
        recordCacheEvent({
          namespace,
          operation: "lookup",
          result: "hit",
          durationMs: readDurationMs,
        });
        return res.status(parsed.status || 200).json(parsed.body);
      }

      recordCacheEvent({
        namespace,
        operation: "lookup",
        result: "miss",
        durationMs: readDurationMs,
      });
    } catch (error) {
      recordCacheEvent({
        namespace,
        operation: "lookup",
        result: "error",
      });
      console.error("cache read failed:", error.message || error);
    }

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      const statusCode = res.statusCode || 200;
      const result = originalJson(body);

      if (statusCode < 400) {
        const resolvedTags = normalizeTags(
          typeof tags === "function" ? tags(req, body) : tags,
        );

        Promise.resolve()
          .then(async () => {
            const writeStart = process.hrtime.bigint();
            await client.set(
              cacheKey,
              JSON.stringify({ status: statusCode, body }),
              { EX: ttlSeconds },
            );

            if (resolvedTags.length) {
              await tagCacheKey({
                key: cacheKey,
                tags: resolvedTags,
                ttlSeconds,
              });
            }

            const writeDurationMs =
              Number(process.hrtime.bigint() - writeStart) / 1_000_000;
            recordCacheEvent({
              namespace,
              operation: "write",
              result: "success",
              durationMs: writeDurationMs,
            });
          })
          .catch((error) => {
            recordCacheEvent({
              namespace,
              operation: "write",
              result: "error",
            });
            console.error("cache write failed:", error.message || error);
          });
      }

      return result;
    };

    res.set("X-Cache", "MISS");
    return next();
  };
}

function invalidateTagsOnSuccess(tags = []) {
  return function invalidateTagsOnSuccessMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      const statusCode = res.statusCode || 200;

      if (statusCode < 400) {
        const resolvedTags = normalizeTags(
          typeof tags === "function" ? tags(req, body) : tags,
        );

        if (resolvedTags.length) {
          // Await invalidation before sending response to prevent stale cache reads
          await invalidateCacheByTags(resolvedTags).catch((error) => {
            console.error("cache invalidation failed:", error.message || error);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

module.exports = {
  cacheResponse,
  cacheTags,
  invalidateCacheByTags,
  invalidateTagsOnSuccess,
};
