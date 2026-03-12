/**
 * Admin Audit Logger Middleware
 *
 * Logs every admin action to a dedicated audit log file for accountability.
 * Captures: who performed the action, what action, on which resource,
 * the request body (sensitive fields redacted), and the response status.
 *
 * The log file is written to /logs/admin-audit.log
 */

const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogPath = path.join(logsDir, "admin-audit.log");

// Fields that should never appear in audit logs
const REDACTED_FIELDS = ["password", "token", "secret", "api_key", "apiKey"];

/**
 * Deep-clone an object and replace sensitive field values with "[REDACTED]".
 */
function redactSensitiveFields(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const cleaned = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (REDACTED_FIELDS.includes(key.toLowerCase())) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      cleaned[key] = redactSensitiveFields(obj[key]);
    } else {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

/**
 * Map HTTP methods + route patterns to human-readable action names.
 */
function describeAction(method, url) {
  const m = method.toUpperCase();

  if (m === "GET" && url.includes("/dashboard")) return "VIEW_DASHBOARD";
  if (m === "GET" && url.includes("/users")) return "VIEW_ALL_USERS";
  if (m === "GET" && url.includes("/courses")) return "VIEW_COURSE";
  if (m === "GET" && url.includes("/teachers")) return "VIEW_TEACHER";
  if (m === "DELETE" && url.includes("/courses")) return "DELETE_COURSE";
  if (m === "DELETE" && url.includes("/teachers")) return "DELETE_TEACHER";
  if (m === "DELETE" && url.includes("/students")) return "DELETE_STUDENT";
  if (m === "PUT" && url.includes("/approve")) return "APPROVE_TEACHER";
  if (m === "PUT" && url.includes("/reject")) return "REJECT_TEACHER";

  return `${m}_${url
    .split("?")[0]
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()}`;
}

/**
 * Express middleware – attaches to admin routes.
 * Captures both the request details and the resulting status code.
 */
function adminAuditLogger(req, res, next) {
  const startTime = Date.now();

  // Capture the original res.json to intercept the response
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const duration = Date.now() - startTime;
    const action = describeAction(req.method, req.originalUrl);

    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      admin: {
        id: req.user?._id || "unknown",
        name: req.user?.name || "unknown",
        email: req.user?.email || "unknown",
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        body: redactSensitiveFields(req.body),
        ip: req.ip || req.connection.remoteAddress,
      },
      response: {
        statusCode: res.statusCode,
        success: body?.success ?? null,
        message: body?.message || null,
      },
      duration: `${duration}ms`,
    };

    // Write to audit log file (append)
    const logLine = JSON.stringify(logEntry) + "\n";
    fs.appendFile(auditLogPath, logLine, (err) => {
      if (err) console.error("Failed to write admin audit log:", err);
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== "production") {
      const icon = res.statusCode < 400 ? "🛡️" : "🚨";
      console.log(
        `${icon} ADMIN AUDIT [${action}] by ${logEntry.admin.email} → ${res.statusCode} (${duration}ms)`,
      );
    }

    // Call the original res.json
    return originalJson(body);
  };

  next();
}

module.exports = { adminAuditLogger };
