const express = require("express");
require("dotenv").config(); // Load environment variables FIRST
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const { createHandler } = require("graphql-http/lib/use/express");
const { errorHandler, notFound, performanceMonitor } = require("./middleware");
const { connectRedis, closeRedis, isRedisReady } = require("./config/redis");
const {
  metricsMiddleware,
  metricsEndpoint,
  registerEndpointCatalog,
} = require("./config/metrics");
const openApiSpec = require("./docs/openapi");
const {
  schema: graphQLSchema,
  root: graphQLRoot,
  createGraphQLContext,
} = require("./graphql/schema");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const superadminRoutes = require("./routes/superadminRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const contactRoutes = require("./routes/contactRoutes");
const cartRoutes = require("./routes/cartRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const statsRoutes = require("./routes/statsRoutes");
const telemetryRoutes = require("./routes/telemetryRoutes");
const {
  initializeElasticsearch,
  isElasticsearchConfigured,
} = require("./utils/courseSearchIndex");

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URL = process.env.MONGO_URL_ATLAS;

function normalizeEndpointPath(pathValue) {
  const raw = String(pathValue || "/").trim() || "/";
  const collapsed = raw.replace(/\/+/g, "/");

  if (collapsed === "/") return "/";

  let normalized = collapsed;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function joinEndpointPath(basePath, routePath) {
  const base = normalizeEndpointPath(basePath || "/");
  const route = normalizeEndpointPath(routePath || "/");

  if (route === "/") return base;
  if (base === "/") return route;

  return normalizeEndpointPath(`${base}${route}`);
}

function collectRouterEndpoints(basePath, router) {
  if (!router || !Array.isArray(router.stack)) {
    return [];
  }

  const endpoints = [];

  for (const layer of router.stack) {
    if (!layer.route) continue;

    const methods = Object.entries(layer.route.methods || {})
      .filter(([, enabled]) => Boolean(enabled))
      .map(([method]) => method.toUpperCase());

    const routePaths = Array.isArray(layer.route.path)
      ? layer.route.path
      : [layer.route.path];

    for (const routePath of routePaths) {
      if (typeof routePath !== "string") continue;

      const route = joinEndpointPath(basePath, routePath);
      for (const method of methods) {
        endpoints.push({ method, route });
      }
    }
  }

  return endpoints;
}

// Logging middleware
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

const requestLogToStdout = process.env.REQUEST_LOG_STDOUT === "true";
const requestLogStream = {
  write: (message) => {
    accessLogStream.write(message);
    if (requestLogToStdout) {
      process.stdout.write(message);
    }
  },
};

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: requestLogStream,
  }),
);

// Performance monitoring
app.use(performanceMonitor);
app.use(metricsMiddleware);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const publicDir = path.join(__dirname, "../FRONTEND/public");
if (fs.existsSync(publicDir)) {
  app.use("/public", express.static(publicDir));
}

app.all(
  "/graphql",
  createHandler({
    schema: graphQLSchema,
    rootValue: graphQLRoot,
    context: (req) => createGraphQLContext(req),
  }),
);

if (!MONGO_URL) {
  console.error(
    "Missing Mongo connection string. Set MONGO_URL or MONGO_URL_ATLAS.",
  );
  process.exit(1);
}

connectRedis().catch((error) => {
  console.warn("redis initialization failed:", error?.message || error);
});

mongoose
  .connect(MONGO_URL)
  .then(async () => {
    console.log("mongodb connected successfully");

    if (!isElasticsearchConfigured()) {
      console.log(
        "Elasticsearch disabled or not configured. Using MongoDB search fallback.",
      );
      return;
    }

    const elasticReady = await initializeElasticsearch();
    if (elasticReady) {
      console.log("Elasticsearch connected successfully");
    } else {
      console.log(
        "Elasticsearch is unavailable. Using MongoDB search fallback.",
      );
    }
  })
  .catch((err) => {
    console.log("err in mongodb connection:", err);
    process.exit(1);
  });

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);

// contact form
app.use("/contact", contactRoutes);

// cart routes
app.use("/cart", cartRoutes);

//teacher routes
app.use("/teacher", teacherRoutes);

// student routes
app.use("/student", studentRoutes);

// admin routes
app.use("/admin", adminRoutes);

// superadmin routes
app.use("/superadmin", superadminRoutes);

// assignment routes
app.use("/assignments", assignmentRoutes);

// flashcard routes
app.use("/api/flashcards", flashcardRoutes);

// stats routes
app.use("/stats", statsRoutes);

// frontend telemetry ingestion routes
app.use("/telemetry", telemetryRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to server v1");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    redis: isRedisReady() ? "up" : "degraded",
  });
});

app.get("/openapi.json", (req, res) => {
  res.status(200).json(openApiSpec);
});

app.get("/metrics", metricsEndpoint);

app.use("/api-docs", swaggerUi.serve);

app.get("/api-docs", (req, res, next) => {
  const swaggerHandler = swaggerUi.setup(null, {
    swaggerOptions: {
      url: "/openapi.json",
    },
    customSiteTitle: "LMS SuperAdmin API Docs",
  });

  return swaggerHandler(req, res, next);
});

app.get("/api-docs/", (req, res) => {
  return res.redirect("/api-docs");
});

const mountedRouters = [
  { basePath: "/auth", router: authRoutes },
  { basePath: "/courses", router: courseRoutes },
  { basePath: "/contact", router: contactRoutes },
  { basePath: "/cart", router: cartRoutes },
  { basePath: "/teacher", router: teacherRoutes },
  { basePath: "/student", router: studentRoutes },
  { basePath: "/admin", router: adminRoutes },
  { basePath: "/superadmin", router: superadminRoutes },
  { basePath: "/assignments", router: assignmentRoutes },
  { basePath: "/api/flashcards", router: flashcardRoutes },
  { basePath: "/stats", router: statsRoutes },
  { basePath: "/telemetry", router: telemetryRoutes },
];

const endpointCatalogSeed = [
  { method: "GET", route: "/uploads/*" },
  { method: "GET", route: "/public/*" },
  { method: "ALL", route: "/graphql" },
  { method: "GET", route: "/" },
  { method: "GET", route: "/health" },
  { method: "GET", route: "/openapi.json" },
  { method: "GET", route: "/metrics" },
  { method: "GET", route: "/api-docs" },
  { method: "GET", route: "/api-docs/" },
];

for (const { basePath, router } of mountedRouters) {
  endpointCatalogSeed.push(...collectRouterEndpoints(basePath, router));
}

const registeredEndpointCount = registerEndpointCatalog(endpointCatalogSeed);
console.log(`registered ${registeredEndpointCount} endpoint catalog metrics`);

// Error handling middlewares (must be last)
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`backend server is running on port ${PORT}....`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down backend...`);

  server.close(async () => {
    await closeRedis();
    await mongoose.connection.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT").catch(() => process.exit(1));
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch(() => process.exit(1));
});
