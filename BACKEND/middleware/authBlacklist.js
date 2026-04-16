const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getRedisClient, isRedisReady } = require("../config/redis");

const DEFAULT_BLACKLIST_TTL_SECONDS = Number(
  process.env.JWT_BLACKLIST_TTL_SECONDS || 24 * 60 * 60,
);

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function buildBlacklistKey(token, decodedPayload) {
  if (decodedPayload?.jti) {
    return `auth:blacklist:jti:${decodedPayload.jti}`;
  }

  return `auth:blacklist:token:${hashToken(token)}`;
}

function resolveTtlSeconds(decodedPayload) {
  if (decodedPayload?.exp) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return Math.max(decodedPayload.exp - nowSeconds, 1);
  }

  return DEFAULT_BLACKLIST_TTL_SECONDS;
}

async function blacklistToken(token, decodedPayload) {
  if (!token || !isRedisReady()) return false;

  const client = getRedisClient();
  if (!client) return false;

  const decoded = decodedPayload || jwt.decode(token) || null;
  const key = buildBlacklistKey(token, decoded);
  const ttlSeconds = resolveTtlSeconds(decoded);

  await client.set(key, "1", { EX: ttlSeconds });
  return true;
}

async function isTokenBlacklisted(token, decodedPayload) {
  if (!token || !isRedisReady()) return false;

  const client = getRedisClient();
  if (!client) return false;

  const decoded = decodedPayload || jwt.decode(token) || null;
  const key = buildBlacklistKey(token, decoded);

  const exists = await client.exists(key);
  return exists === 1;
}

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};
