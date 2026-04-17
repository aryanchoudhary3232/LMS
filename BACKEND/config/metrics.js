const client = require("prom-client");

const register = new client.Registry();

register.setDefaultLabels({
  service: "lms-backend",
});

client.collectDefaultMetrics({
  register,
  prefix: "lms_backend_",
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "lms_http_request_duration_seconds",
  help: "HTTP request duration in seconds grouped by method, route, and status class",
  labelNames: ["method", "route", "status_class"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: "lms_http_requests_total",
  help: "Total HTTP requests grouped by method, route, and status class",
  labelNames: ["method", "route", "status_class"],
  registers: [register],
});

const httpInflightRequests = new client.Gauge({
  name: "lms_http_inflight_requests",
  help: "Number of in-flight HTTP requests",
  registers: [register],
});

const slowRequestsTotal = new client.Counter({
  name: "lms_slow_requests_total",
  help: "Number of backend slow requests over threshold",
  labelNames: ["method", "route", "status_class"],
  registers: [register],
});

const cacheEventsTotal = new client.Counter({
  name: "lms_cache_events_total",
  help: "Redis cache events grouped by namespace, operation, and result",
  labelNames: ["namespace", "operation", "result"],
  registers: [register],
});

const cacheOperationDurationSeconds = new client.Histogram({
  name: "lms_cache_operation_duration_seconds",
  help: "Redis cache operation duration in seconds",
  labelNames: ["namespace", "operation", "result"],
  buckets: [0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

const rateLimiterEventsTotal = new client.Counter({
  name: "lms_rate_limiter_events_total",
  help: "Rate limiter decisions grouped by limiter key prefix, backend mode and outcome",
  labelNames: ["key_prefix", "backend", "outcome"],
  registers: [register],
});

const rateLimiterRemainingGauge = new client.Gauge({
  name: "lms_rate_limiter_remaining",
  help: "Most recent remaining token estimate grouped by key prefix and backend",
  labelNames: ["key_prefix", "backend"],
  registers: [register],
});

const frontendEventsTotal = new client.Counter({
  name: "lms_frontend_events_total",
  help: "Frontend telemetry events grouped by type and result",
  labelNames: ["type", "result"],
  registers: [register],
});

const frontendWebVitalMs = new client.Histogram({
  name: "lms_frontend_web_vital_ms",
  help: "Frontend web vital metrics measured in milliseconds",
  labelNames: ["metric_name", "route"],
  buckets: [1, 10, 50, 100, 300, 500, 800, 1200, 2500, 4000, 8000],
  registers: [register],
});

const frontendClsValue = new client.Histogram({
  name: "lms_frontend_cls_value",
  help: "Frontend CLS values",
  labelNames: ["route"],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.15, 0.25, 0.35, 0.5, 1],
  registers: [register],
});

const frontendApiLatencySeconds = new client.Histogram({
  name: "lms_frontend_api_latency_seconds",
  help: "Frontend-observed API latency in seconds",
  labelNames: ["method", "endpoint", "status_class"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1, 2, 5, 10],
  registers: [register],
});

const frontendRouteTransitionSeconds = new client.Histogram({
  name: "lms_frontend_route_transition_seconds",
  help: "Frontend route transition duration in seconds",
  labelNames: ["route"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1, 2, 4, 8],
  registers: [register],
});

const frontendJsErrorsTotal = new client.Counter({
  name: "lms_frontend_js_errors_total",
  help: "Frontend JavaScript errors by category and route",
  labelNames: ["category", "route"],
  registers: [register],
});

function statusClass(statusCode) {
  const status = Number(statusCode) || 0;

  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  if (status >= 200) return "2xx";
  if (status >= 100) return "1xx";
  return "unknown";
}

function normalizePath(pathValue) {
  if (!pathValue || typeof pathValue !== "string") return "unknown";

  const [pathWithoutQuery] = pathValue.split("?");

  const normalized = pathWithoutQuery
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "/:objectId")
    .replace(
      /\/[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(?=\/|$)/gi,
      "/:uuid",
    );

  return normalized || "/";
}

function resolveRouteLabel(req) {
  const routedPath = req.route?.path;
  const base = req.baseUrl || "";

  if (routedPath) {
    return normalizePath(`${base}${routedPath}`);
  }

  return normalizePath(req.path || req.originalUrl || "unknown");
}

function toSeconds(durationMs) {
  const numericValue = Number(durationMs);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return undefined;
  }

  return numericValue / 1000;
}

function metricsMiddleware(req, res, next) {
  if (req.path === "/metrics") {
    return next();
  }

  httpInflightRequests.inc();
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const labels = {
      method: req.method,
      route: resolveRouteLabel(req),
      status_class: statusClass(res.statusCode),
    };

    httpRequestsTotal.inc(labels);

    const durationSeconds = toSeconds(durationMs);
    if (durationSeconds !== undefined) {
      httpRequestDurationSeconds.observe(labels, durationSeconds);
    }

    httpInflightRequests.dec();
  });

  next();
}

async function metricsEndpoint(req, res) {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to render metrics",
      error: error?.message || String(error),
    });
  }
}

function recordSlowRequest({ method, route, statusCode, durationMs }) {
  const slowRequestThresholdMs = Number(process.env.SLOW_REQUEST_THRESHOLD_MS || 1000);
  if (Number(durationMs) < slowRequestThresholdMs) return;

  slowRequestsTotal.inc({
    method: method || "UNKNOWN",
    route: normalizePath(route),
    status_class: statusClass(statusCode),
  });
}

function recordCacheEvent({ namespace, operation, result, durationMs }) {
  const labels = {
    namespace: String(namespace || "default"),
    operation: String(operation || "unknown"),
    result: String(result || "unknown"),
  };

  cacheEventsTotal.inc(labels);

  const durationSeconds = toSeconds(durationMs);
  if (durationSeconds !== undefined) {
    cacheOperationDurationSeconds.observe(labels, durationSeconds);
  }
}

function recordRateLimitEvent({ keyPrefix, backend, outcome, remaining }) {
  const labels = {
    key_prefix: String(keyPrefix || "rl:global"),
    backend: String(backend || "unknown"),
    outcome: String(outcome || "unknown"),
  };

  rateLimiterEventsTotal.inc(labels);

  if (Number.isFinite(Number(remaining))) {
    rateLimiterRemainingGauge.set(
      {
        key_prefix: labels.key_prefix,
        backend: labels.backend,
      },
      Number(remaining),
    );
  }
}

function recordFrontendMetrics(metricsBatch = []) {
  if (!Array.isArray(metricsBatch)) {
    frontendEventsTotal.inc({ type: "invalid_payload", result: "rejected" });
    return { accepted: 0, rejected: 1 };
  }

  let accepted = 0;
  let rejected = 0;

  for (const metric of metricsBatch) {
    if (!metric || typeof metric !== "object") {
      rejected += 1;
      frontendEventsTotal.inc({ type: "invalid_metric", result: "rejected" });
      continue;
    }

    const type = String(metric.type || "unknown");

    try {
      if (type === "web_vital") {
        const vitalName = String(metric.name || "unknown").toUpperCase();
        const route = normalizePath(metric.route || "/");
        const value = Number(metric.value);

        if (!Number.isFinite(value)) {
          throw new Error("invalid web vital value");
        }

        if (vitalName === "CLS") {
          frontendClsValue.observe({ route }, value);
        } else {
          frontendWebVitalMs.observe({ metric_name: vitalName, route }, value);
        }

        frontendEventsTotal.inc({ type, result: "accepted" });
        accepted += 1;
        continue;
      }

      if (type === "api_latency") {
        const durationSeconds = toSeconds(metric.durationMs);

        if (durationSeconds === undefined) {
          throw new Error("invalid api duration");
        }

        frontendApiLatencySeconds.observe(
          {
            method: String(metric.method || "GET").toUpperCase(),
            endpoint: normalizePath(metric.endpoint || "unknown"),
            status_class: statusClass(metric.status),
          },
          durationSeconds,
        );

        frontendEventsTotal.inc({ type, result: "accepted" });
        accepted += 1;
        continue;
      }

      if (type === "route_transition") {
        const durationSeconds = toSeconds(metric.durationMs);

        if (durationSeconds === undefined) {
          throw new Error("invalid route duration");
        }

        frontendRouteTransitionSeconds.observe(
          { route: normalizePath(metric.route || "/") },
          durationSeconds,
        );

        frontendEventsTotal.inc({ type, result: "accepted" });
        accepted += 1;
        continue;
      }

      if (type === "js_error") {
        frontendJsErrorsTotal.inc({
          category: String(metric.category || "runtime"),
          route: normalizePath(metric.route || "/"),
        });

        frontendEventsTotal.inc({ type, result: "accepted" });
        accepted += 1;
        continue;
      }

      frontendEventsTotal.inc({ type: "unknown", result: "ignored" });
      rejected += 1;
    } catch (error) {
      frontendEventsTotal.inc({ type, result: "rejected" });
      rejected += 1;
    }
  }

  return {
    accepted,
    rejected,
  };
}

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  recordSlowRequest,
  recordCacheEvent,
  recordRateLimitEvent,
  recordFrontendMetrics,
};
