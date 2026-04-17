import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const BACKEND_BASE_URL =
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");
const TELEMETRY_ENDPOINT = `${BACKEND_BASE_URL}/telemetry/rum`;

const SAMPLE_RATE = Math.min(
  Math.max(Number(import.meta.env.VITE_TELEMETRY_SAMPLE_RATE || 1), 0),
  1,
);
const MAX_BATCH_SIZE = Number(import.meta.env.VITE_TELEMETRY_BATCH_SIZE || 20);
const FLUSH_INTERVAL_MS = Number(
  import.meta.env.VITE_TELEMETRY_FLUSH_MS || 15000,
);

let isInitialized = false;
let flushTimer = null;
const queue = [];

function shouldCapture() {
  return Math.random() <= SAMPLE_RATE;
}

function normalizeRoute(route) {
  if (!route || typeof route !== "string") return "/";

  return route
    .split("?")[0]
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "/:objectId")
    .replace(
      /\/[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(?=\/|$)/gi,
      "/:uuid",
    );
}

function scheduleFlush() {
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushTelemetryQueue();
  }, FLUSH_INTERVAL_MS);
}

function enqueue(metric) {
  if (!shouldCapture()) return;

  queue.push({
    ...metric,
    route: normalizeRoute(metric.route || window.location.pathname),
    timestamp: new Date().toISOString(),
  });

  if (queue.length >= MAX_BATCH_SIZE) {
    flushTelemetryQueue();
    return;
  }

  scheduleFlush();
}

async function postBatch(batch) {
  if (!batch.length) return;

  const payload = JSON.stringify({ metrics: batch });

  if (navigator.sendBeacon && payload.length < 64000) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
    return;
  }

  await fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  });
}

export async function flushTelemetryQueue() {
  if (!queue.length) return;

  const batch = queue.splice(0, MAX_BATCH_SIZE);

  try {
    await postBatch(batch);
  } catch (error) {
    // If delivery fails, requeue the batch to avoid data loss.
    queue.unshift(...batch);
  }
}

export function trackWebVital(metric) {
  enqueue({
    type: "web_vital",
    name: metric?.name || "unknown",
    value: Number(metric?.value || 0),
    delta: Number(metric?.delta || 0),
    id: metric?.id,
  });
}

export function trackApiLatency({ endpoint, method, status, durationMs }) {
  enqueue({
    type: "api_latency",
    endpoint: endpoint || "unknown",
    method: String(method || "get").toUpperCase(),
    status: Number(status || 0),
    durationMs: Number(durationMs || 0),
  });
}

export function trackRouteTransition({ route, durationMs }) {
  enqueue({
    type: "route_transition",
    route: normalizeRoute(route),
    durationMs: Number(durationMs || 0),
  });
}

function trackJsError({ category, message }) {
  enqueue({
    type: "js_error",
    category,
    message: String(message || "unknown error").slice(0, 300),
  });
}

function initGlobalErrorHooks() {
  window.addEventListener("error", (event) => {
    trackJsError({
      category: "runtime",
      message: event?.message,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    trackJsError({
      category: "unhandledrejection",
      message: event?.reason?.message || event?.reason,
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushTelemetryQueue();
    }
  });

  window.addEventListener("beforeunload", () => {
    flushTelemetryQueue();
  });
}

export function initWebVitalsTelemetry() {
  if (isInitialized) return;
  isInitialized = true;

  onCLS(trackWebVital);
  onFCP(trackWebVital);
  onINP(trackWebVital);
  onLCP(trackWebVital);
  onTTFB(trackWebVital);

  initGlobalErrorHooks();
}
