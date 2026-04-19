/**
 * Latency benchmark: Redis cache HIT vs cache MISS on the GET /courses equivalent.
 *
 * The GET /courses route uses the cacheResponse middleware (responseCache.js).
 * A cache MISS means Express falls through to the controller, which runs a
 * MongoDB find + JSON.stringify before storing the result in Redis.
 * A cache HIT means only a Redis GET + JSON.parse — no DB round-trip.
 *
 * This test replicates that exact pattern against real MongoDB and Redis
 * instances so the timing difference is observable in CI output.
 *
 * Required env vars (at least one Mongo URL + Redis URL):
 *   TEST_MONGO_URL | MONGO_URL_ATLAS | MONGO_URL
 *   TEST_REDIS_URL | REDIS_URL
 */

const { performance } = require("node:perf_hooks");
const { MongoClient } = require("mongodb");

let createClient;
try {
  ({ createClient } = require("redis"));
} catch {
  // redis package missing — tests will be skipped
}

const TEST_MONGO_URL =
  process.env.TEST_MONGO_URL ||
  process.env.MONGO_URL_ATLAS ||
  process.env.MONGO_URL;

const TEST_REDIS_URL = process.env.TEST_REDIS_URL || process.env.REDIS_URL;

const describeIfBoth =
  TEST_MONGO_URL && TEST_REDIS_URL && createClient ? describe : describe.skip;

jest.setTimeout(60000);

const ITERATIONS = 30;
const DOC_COUNT = 5000;

async function measureAverageMs(fn, iterations = ITERATIONS) {
  // warmup — discard first 3 runs to let MongoDB and Redis warm their caches
  for (let i = 0; i < 3; i++) {
    await fn();
  }

  let total = 0;
  for (let i = 0; i < iterations; i++) {
    const t = performance.now();
    await fn();
    total += performance.now() - t;
  }

  return Number((total / iterations).toFixed(3));
}

describeIfBoth("Redis cache latency benchmark — GET /courses (cache miss vs hit)", () => {
  let mongoClient;
  let mongoCollection;
  let redisClient;
  const CACHE_KEY = `bench:courses:public:${Date.now()}`;

  beforeAll(async () => {
    // ── MongoDB setup ──────────────────────────────────────────────────────
    mongoClient = new MongoClient(TEST_MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    const db = mongoClient.db();
    mongoCollection = db.collection(`redis_bench_courses_${Date.now()}`);

    const categories = ["Development", "Design", "Business", "Marketing", "DevOps"];
    const docs = Array.from({ length: DOC_COUNT }, (_, i) => ({
      title: `Course ${i}`,
      description: `Description for course ${i} covering ${categories[i % categories.length]}`,
      category: categories[i % categories.length],
      price: (i % 50) * 10,
      isDeleted: false,
      createdAt: new Date(Date.now() - i * 3600000),
    }));
    await mongoCollection.insertMany(docs, { ordered: false });

    // ── Redis setup ────────────────────────────────────────────────────────
    redisClient = createClient({ url: TEST_REDIS_URL });
    await redisClient.connect();
  });

  afterAll(async () => {
    if (mongoCollection) await mongoCollection.drop().catch(() => {});
    if (mongoClient) await mongoClient.close();
    if (redisClient) {
      await redisClient.del(CACHE_KEY).catch(() => {});
      await redisClient.quit().catch(() => {});
    }
  });

  test(
    "cache HIT (Redis) is faster than cache MISS (MongoDB full scan) for GET /courses",
    async () => {
      // ── WITHOUT cache — mirrors a cold-cache request ──────────────────
      // Every iteration queries MongoDB and serialises the result,
      // exactly what the controller does on a cache miss.
      const withoutCacheMs = await measureAverageMs(async () => {
        const courses = await mongoCollection
          .find({ isDeleted: false })
          .project({ title: 1, category: 1, price: 1, createdAt: 1 })
          .toArray();
        JSON.stringify({ status: 200, body: { success: true, data: courses } });
      });

      // ── Prime the cache — one real query, stored in Redis ─────────────
      // This mirrors what responseCache.js does after the first request.
      const primed = await mongoCollection
        .find({ isDeleted: false })
        .project({ title: 1, category: 1, price: 1, createdAt: 1 })
        .toArray();
      const cachedPayload = JSON.stringify({
        status: 200,
        body: { success: true, data: primed },
      });
      await redisClient.set(CACHE_KEY, cachedPayload, { EX: 300 });

      // ── WITH cache — mirrors a warm-cache request ─────────────────────
      // Every iteration reads from Redis and deserialises,
      // exactly what the cacheResponse middleware does on a cache HIT.
      const withCacheMs = await measureAverageMs(async () => {
        const raw = await redisClient.get(CACHE_KEY);
        JSON.parse(raw);
      });

      const improvementMs = Number((withoutCacheMs - withCacheMs).toFixed(3));
      const improvementPct = Number(
        (((withoutCacheMs - withCacheMs) / withoutCacheMs) * 100).toFixed(2),
      );

      console.log(
        [
          "[redis-cache-benchmark]",
          `Docs in collection  : ${DOC_COUNT}`,
          `Iterations          : ${ITERATIONS}`,
          `Without Redis (MISS): ${withoutCacheMs} ms avg  — MongoDB find + JSON.stringify`,
          `With    Redis (HIT) : ${withCacheMs} ms avg  — Redis GET + JSON.parse`,
          `Improvement         : ${improvementMs} ms  (${improvementPct}%)`,
        ].join("\n"),
      );

      // Redis path must complete without error
      expect(withCacheMs).toBeGreaterThan(0);
      // MongoDB path must complete without error
      expect(withoutCacheMs).toBeGreaterThan(0);
      // Cache HIT must be faster than a cold DB round-trip
      expect(withCacheMs).toBeLessThan(withoutCacheMs);
    },
  );
});
