const crypto = require("crypto");
const Otp = require("../models/Otp");
const { getRedisClient, isRedisReady } = require("../config/redis");

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 600);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp || "")).digest("hex");
}

function emailHash(email) {
  return crypto
    .createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");
}

function getOtpKey(email) {
  return `otp:password-reset:${emailHash(email)}`;
}

function getAttemptKey(email) {
  return `otp:attempts:${emailHash(email)}`;
}

async function setPasswordResetOtp(email, otp) {
  const normalizedEmail = normalizeEmail(email);
  const otpHash = hashOtp(otp);

  if (isRedisReady()) {
    const client = getRedisClient();

    if (client) {
      const otpKey = getOtpKey(normalizedEmail);
      const attemptKey = getAttemptKey(normalizedEmail);

      await client.set(otpKey, otpHash, { EX: OTP_TTL_SECONDS });
      await client.del(attemptKey);

      return { storage: "redis" };
    }
  }

  await Otp.deleteMany({ email: normalizedEmail });
  await Otp.create({ email: normalizedEmail, otp: String(otp) });
  return { storage: "mongo" };
}

async function consumePasswordResetOtp(email, otp) {
  const normalizedEmail = normalizeEmail(email);

  if (isRedisReady()) {
    const client = getRedisClient();

    if (client) {
      const otpKey = getOtpKey(normalizedEmail);
      const attemptKey = getAttemptKey(normalizedEmail);

      const existingAttempts = Number((await client.get(attemptKey)) || 0);
      if (existingAttempts >= OTP_MAX_ATTEMPTS) {
        return { ok: false, reason: "too_many_attempts" };
      }

      const savedHash = await client.get(otpKey);
      if (!savedHash) {
        return { ok: false, reason: "invalid_or_expired" };
      }

      const incomingHash = hashOtp(otp);
      if (incomingHash !== savedHash) {
        const nextAttempts = await client.incr(attemptKey);
        if (nextAttempts === 1) {
          await client.expire(attemptKey, OTP_TTL_SECONDS);
        }

        if (nextAttempts >= OTP_MAX_ATTEMPTS) {
          return { ok: false, reason: "too_many_attempts" };
        }

        return { ok: false, reason: "invalid_or_expired" };
      }

      await client.del(otpKey);
      await client.del(attemptKey);
      return { ok: true, reason: "verified" };
    }
  }

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    otp: String(otp),
  });

  if (!otpRecord) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  await Otp.deleteMany({ email: normalizedEmail });
  return { ok: true, reason: "verified" };
}

module.exports = {
  normalizeEmail,
  setPasswordResetOtp,
  consumePasswordResetOtp,
};
