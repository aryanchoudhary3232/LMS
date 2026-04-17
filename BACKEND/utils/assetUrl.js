function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
}

function deriveBaseUrl(req) {
  const configuredBaseUrl = normalizeBaseUrl(process.env.API_BASE_URL);
  if (configuredBaseUrl) return configuredBaseUrl;

  if (!req) return "";

  const forwardedProtoRaw = req.headers?.["x-forwarded-proto"];
  const forwardedProto = Array.isArray(forwardedProtoRaw)
    ? forwardedProtoRaw[0]
    : String(forwardedProtoRaw || "")
        .split(",")[0]
        .trim();

  const protocol = forwardedProto || req.protocol || "https";
  const host =
    typeof req.get === "function" ? req.get("host") : req.headers?.host;

  if (!host) return "";
  return `${protocol}://${host}`;
}

function normalizePublicAssetUrl(rawUrl, req) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;

  const baseUrl = deriveBaseUrl(req);
  if (!baseUrl) return rawUrl;

  if (/^https?:\/\/localhost(?::\d+)?\/public\//i.test(rawUrl)) {
    return rawUrl.replace(/^https?:\/\/localhost(?::\d+)?/i, baseUrl);
  }

  if (rawUrl.startsWith("/public/")) {
    return `${baseUrl}${rawUrl}`;
  }

  if (rawUrl.startsWith("public/")) {
    return `${baseUrl}/${rawUrl}`;
  }

  return rawUrl;
}

module.exports = {
  normalizePublicAssetUrl,
};
