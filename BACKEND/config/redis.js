let createClient = null;

try {
  ({ createClient } = require("redis"));
} catch (error) {
  console.warn(
    "redis package is not installed yet. Redis features will stay disabled until dependencies are installed.",
  );
}

const NODE_ENV = String(process.env.NODE_ENV || "development").toLowerCase();
const DEFAULT_REDIS_URL =
  NODE_ENV === "production" ? "" : "redis://127.0.0.1:6379";

const REDIS_URL = String(process.env.REDIS_URL || DEFAULT_REDIS_URL).trim();
const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false" && !!createClient;
const REDIS_TLS_ENABLED =
  String(process.env.REDIS_TLS_ENABLED || "").toLowerCase() === "true" ||
  REDIS_URL.startsWith("rediss://");
const REDIS_TLS_REJECT_UNAUTHORIZED =
  String(process.env.REDIS_TLS_REJECT_UNAUTHORIZED || "true").toLowerCase() !==
  "false";
const REDIS_CONNECT_TIMEOUT_MS = Number(
  process.env.REDIS_CONNECT_TIMEOUT_MS || 10000,
);
const REDIS_MAX_RETRIES = Number(
  process.env.REDIS_MAX_RETRIES || (NODE_ENV === "production" ? 5 : 50),
);
const REDIS_ERROR_LOG_THROTTLE_MS = Number(
  process.env.REDIS_ERROR_LOG_THROTTLE_MS || 30000,
);

let redisClient = null;
let redisReady = false;
let connectPromise = null;
let lastRedisErrorLogAt = 0;

function logRedisError(error) {
  const now = Date.now();
  const throttleMs = Number.isFinite(REDIS_ERROR_LOG_THROTTLE_MS)
    ? REDIS_ERROR_LOG_THROTTLE_MS
    : 30000;

  if (now - lastRedisErrorLogAt >= throttleMs) {
    console.error("redis error:", error?.message || error);
    lastRedisErrorLogAt = now;
  }
}

if (REDIS_ENABLED && !REDIS_URL) {
  console.warn(
    "redis is enabled but REDIS_URL is empty. Set REDIS_URL to a managed Redis endpoint for production.",
  );
}

if (
  REDIS_ENABLED &&
  NODE_ENV === "production" &&
  /^redis:\/\/localhost/i.test(REDIS_URL)
) {
  console.warn(
    "redis is configured with localhost in production. Replace REDIS_URL with a managed Redis endpoint.",
  );
}

function initClient() {
  if (redisClient || !REDIS_ENABLED || !createClient || !REDIS_URL) return;

  const socketConfig = {
    connectTimeout: Number.isFinite(REDIS_CONNECT_TIMEOUT_MS)
      ? REDIS_CONNECT_TIMEOUT_MS
      : 10000,
    reconnectStrategy: (retries) => {
      const maxRetries = Number.isFinite(REDIS_MAX_RETRIES)
        ? REDIS_MAX_RETRIES
        : NODE_ENV === "production"
          ? 5
          : 50;

      if (maxRetries >= 0 && retries >= maxRetries) {
        return new Error(`redis reconnect retry limit reached (${maxRetries})`);
      }

      if (retries > 10) {
        return Math.min(retries * 1000, 5000);
      }
      return Math.min(retries * 100, 2000);
    },
  };

  if (REDIS_TLS_ENABLED) {
    socketConfig.tls = true;
    socketConfig.rejectUnauthorized = REDIS_TLS_REJECT_UNAUTHORIZED;
  }

  redisClient = createClient({
    url: REDIS_URL,
    socket: socketConfig,
  });

  redisClient.on("ready", () => {
    redisReady = true;
    console.log("redis connected successfully");
  });

  redisClient.on("end", () => {
    redisReady = false;
    console.warn("redis connection closed");
  });

  redisClient.on("error", (error) => {
    redisReady = false;
    logRedisError(error);
  });
}

async function connectRedis() {
  if (!createClient) {
    console.warn(
      "redis client is unavailable until the redis package is installed",
    );
    return null;
  }

  if (!REDIS_ENABLED) {
    console.warn("redis is disabled via REDIS_ENABLED=false");
    return null;
  }

  if (!REDIS_URL) {
    console.warn(
      "redis is enabled but REDIS_URL is missing. Continuing without redis-backed cache.",
    );
    return null;
  }

  initClient();

  if (!redisClient) return null;
  if (redisReady) return redisClient;
  if (connectPromise) return connectPromise;

  connectPromise = redisClient
    .connect()
    .then(() => redisClient)
    .catch((error) => {
      redisReady = false;
      console.warn(
        "redis unavailable, continuing without cache:",
        error.message || error,
      );
      return null;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

function getRedisClient() {
  return redisReady ? redisClient : null;
}

function isRedisReady() {
  return REDIS_ENABLED && redisReady;
}

async function closeRedis() {
  if (!redisClient) return;

  try {
    await redisClient.quit();
  } catch (error) {
    // Best effort close; app shutdown should continue.
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisReady,
  closeRedis,
};
