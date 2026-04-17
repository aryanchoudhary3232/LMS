let createClient = null;

try {
  ({ createClient } = require("redis"));
} catch (error) {
  console.warn(
    "redis package is not installed yet. Redis features will stay disabled until dependencies are installed.",
  );
}

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false" && !!createClient;

let redisClient = null;
let redisReady = false;
let connectPromise = null;

function initClient() {
  if (redisClient || !REDIS_ENABLED || !createClient) return;

  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          return Math.min(retries * 1000, 5000);
        }
        return Math.min(retries * 100, 2000);
      },
    },
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
    console.error("redis error:", error.message || error);
  });
}

async function connectRedis() {
  if (!createClient) {
    console.warn("redis client is unavailable until the redis package is installed");
    return null;
  }

  if (!REDIS_ENABLED) {
    console.warn("redis is disabled via REDIS_ENABLED=false");
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
      console.warn("redis unavailable, continuing without cache:", error.message || error);
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
