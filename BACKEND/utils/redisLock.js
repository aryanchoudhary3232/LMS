const crypto = require("crypto");
const { getRedisClient, isRedisReady } = require("../config/redis");

async function acquireLock(lockName, ttlMs = 5000) {
  if (!lockName) {
    return { acquired: false, lockKey: null, token: null, bypassed: false };
  }

  if (!isRedisReady()) {
    return { acquired: true, lockKey: null, token: null, bypassed: true };
  }

  const client = getRedisClient();
  if (!client) {
    return { acquired: true, lockKey: null, token: null, bypassed: true };
  }

  const lockKey = `lock:${lockName}`;
  const token = crypto.randomUUID();

  const result = await client.set(lockKey, token, {
    PX: ttlMs,
    NX: true,
  });

  return {
    acquired: result === "OK",
    lockKey,
    token,
    bypassed: false,
  };
}

async function releaseLock(lock) {
  if (!lock || lock.bypassed || !lock.lockKey || !lock.token) {
    return false;
  }

  if (!isRedisReady()) return false;

  const client = getRedisClient();
  if (!client) return false;

  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  const result = await client.eval(script, {
    keys: [lock.lockKey],
    arguments: [lock.token],
  });

  return result === 1;
}

module.exports = {
  acquireLock,
  releaseLock,
};
