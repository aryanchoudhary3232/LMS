const { Client } = require("@elastic/elasticsearch");

const ELASTICSEARCH_ENABLED =
  String(process.env.ELASTICSEARCH_ENABLED || "").toLowerCase() === "true";
const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || "";
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME || "";
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD || "";
const ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY || "";
const COURSE_INDEX = process.env.ELASTICSEARCH_INDEX_COURSES || "lms_courses";

let clientInstance = null;
let elasticsearchReady = false;

// ─── Analytics helpers ────────────────────────────────────────────────────────

function logAnalytics(event, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(
    `[ES Analytics] [${timestamp}] ${event}`,
    JSON.stringify(details, null, 2)
  );
}

function logError(context, error) {
  const timestamp = new Date().toISOString();
  const statusCode = error?.meta?.statusCode ?? error?.statusCode ?? null;
  const meta = error?.meta?.body?.error ?? null;

  console.error(`[ES Error] [${timestamp}] ${context}`, {
    message: error?.message || String(error),
    ...(statusCode && { statusCode }),
    ...(meta && { elasticError: meta }),
  });
}

// ─── Client setup ─────────────────────────────────────────────────────────────

function isElasticsearchConfigured() {
  return ELASTICSEARCH_ENABLED && Boolean(ELASTICSEARCH_NODE);
}

function getElasticsearchClient() {
  if (!isElasticsearchConfigured()) return null;
  if (clientInstance) return clientInstance;

  const clientConfig = {
    node: ELASTICSEARCH_NODE,
  };

  if (ELASTICSEARCH_API_KEY) {
    clientConfig.auth = { apiKey: ELASTICSEARCH_API_KEY };
  } else if (ELASTICSEARCH_USERNAME && ELASTICSEARCH_PASSWORD) {
    clientConfig.auth = {
      username: ELASTICSEARCH_USERNAME,
      password: ELASTICSEARCH_PASSWORD,
    };
  }

  clientInstance = new Client(clientConfig);
  return clientInstance;
}

function getCourseSearchIndexName() {
  return COURSE_INDEX;
}

function escapeForPhrasePrefix(value) {
  return String(value || "").replace(/[\\+\-=&|><!(){}\[\]^"~*?:/]/g, " ");
}

// ─── Index initialization ─────────────────────────────────────────────────────

async function ensureCourseSearchIndex(client) {
  let existsResponse;
  try {
    existsResponse = await client.indices.exists({ index: COURSE_INDEX });
  } catch (error) {
    logError("ensureCourseSearchIndex → checking index existence", error);
    throw error;
  }

  const exists =
    typeof existsResponse === "boolean"
      ? existsResponse
      : Boolean(existsResponse?.body);

  if (exists) {
    logAnalytics("INDEX_ALREADY_EXISTS", { index: COURSE_INDEX });
    return;
  }

  try {
    await client.indices.create({
      index: COURSE_INDEX,
      mappings: {
        properties: {
          title: { type: "text" },
          description: { type: "text" },
          category: { type: "keyword" },
          level: { type: "keyword" },
          teacherId: { type: "keyword" },
          price: { type: "float" },
          isDeleted: { type: "boolean" },
          createdAt: { type: "date" },
          updatedAt: { type: "date" },
        },
      },
    });
    logAnalytics("INDEX_CREATED", { index: COURSE_INDEX });
  } catch (error) {
    logError("ensureCourseSearchIndex → creating index", error);
    throw error;
  }
}

async function initializeElasticsearch() {
  const client = getElasticsearchClient();

  if (!client) {
    elasticsearchReady = false;
    console.warn(
      "[ES] Elasticsearch is disabled or not configured. Skipping initialization."
    );
    return false;
  }

  try {
    await client.ping();
    logAnalytics("PING_SUCCESS", { node: ELASTICSEARCH_NODE });

    await ensureCourseSearchIndex(client);
    elasticsearchReady = true;

    logAnalytics("INIT_SUCCESS", { index: COURSE_INDEX });
    return true;
  } catch (error) {
    elasticsearchReady = false;
    logError("initializeElasticsearch", error);

    if (error?.message?.includes("ECONNREFUSED")) {
      console.error(
        `[ES] Connection refused. Is Elasticsearch running at ${ELASTICSEARCH_NODE}?`
      );
    } else if (error?.meta?.statusCode === 401) {
      console.error(
        "[ES] Authentication failed. Check ELASTICSEARCH_API_KEY or username/password."
      );
    } else if (error?.meta?.statusCode === 403) {
      console.error(
        "[ES] Authorization error. The configured credentials lack required permissions."
      );
    }

    return false;
  }
}

function isElasticsearchReady() {
  return elasticsearchReady;
}

// ─── Document normalization ───────────────────────────────────────────────────

function normalizeCourseDocument(course) {
  if (!course) return null;

  return {
    title: String(course.title || ""),
    description: String(course.description || ""),
    category: String(course.category || ""),
    level: String(course.level || ""),
    teacherId: course.teacher ? course.teacher.toString() : "",
    price: Number(course.price) || 0,
    isDeleted: Boolean(course.isDeleted),
    createdAt: course.createdAt || new Date(),
    updatedAt: course.updatedAt || new Date(),
  };
}

// ─── Index writes ─────────────────────────────────────────────────────────────

async function upsertCourseInSearchIndex(course) {
  if (!isElasticsearchReady()) {
    const initialized = await initializeElasticsearch();
    if (!initialized) return false;
  }

  if (!course?._id) {
    console.warn("[ES] upsertCourseInSearchIndex called with missing course._id. Skipping.");
    return false;
  }

  const client = getElasticsearchClient();
  const document = normalizeCourseDocument(course);

  if (!client || !document) {
    console.warn("[ES] upsertCourseInSearchIndex: client or document unavailable. Skipping.");
    return false;
  }

  const courseId = course._id.toString();

  try {
    await client.index({
      index: COURSE_INDEX,
      id: courseId,
      document,
      refresh: false,
    });

    logAnalytics("UPSERT_SUCCESS", {
      courseId,
      title: document.title,
      category: document.category,
      level: document.level,
    });

    return true;
  } catch (error) {
    logError(`upsertCourseInSearchIndex → courseId=${courseId}`, error);

    if (error?.meta?.statusCode === 400) {
      console.error(
        "[ES] Bad request during upsert. The document may not match the index mapping."
      );
    }

    return false;
  }
}

async function removeCourseFromSearchIndex(courseId) {
  if (!courseId) {
    console.warn("[ES] removeCourseFromSearchIndex called with empty courseId. Skipping.");
    return false;
  }

  if (!isElasticsearchReady()) {
    const initialized = await initializeElasticsearch();
    if (!initialized) return false;
  }

  const client = getElasticsearchClient();
  if (!client) return false;

  const id = courseId.toString();

  try {
    await client.delete({
      index: COURSE_INDEX,
      id,
      refresh: false,
    });

    logAnalytics("DELETE_SUCCESS", { courseId: id });
    return true;
  } catch (error) {
    const statusCode = error?.meta?.statusCode;

    if (statusCode === 404) {
      logAnalytics("DELETE_NOT_FOUND", {
        courseId: id,
        note: "Document was already absent from index",
      });
      return true;
    }

    logError(`removeCourseFromSearchIndex → courseId=${id}`, error);
    return false;
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchCoursesInElastic({
  query,
  category,
  level,
  page = 1,
  limit = 20,
}) {
  if (!isElasticsearchReady()) {
    const initialized = await initializeElasticsearch();
    if (!initialized) return null;
  }

  const client = getElasticsearchClient();
  if (!client) return null;

  const cleanQuery = String(query || "").trim();
  const cleanCategory = String(category || "").trim();
  const cleanLevel = String(level || "").trim();
  const isShortQuery = cleanQuery.length > 0 && cleanQuery.length < 3;

  const safePage =
    Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number.isFinite(Number(limit))
    ? Math.min(Math.max(Number(limit), 1), 50)
    : 20;

  const from = (safePage - 1) * safeLimit;

  const filterClauses = [{ term: { isDeleted: false } }];
  if (cleanCategory) filterClauses.push({ term: { category: cleanCategory } });
  if (cleanLevel) filterClauses.push({ term: { level: cleanLevel } });

  const mustClauses = [];
  if (cleanQuery) {
    const safeQuery = escapeForPhrasePrefix(cleanQuery);
    const fuzzyFields = isShortQuery
      ? ["title^8"]
      : ["title^4", "description^2", "category", "level"];
    const prefixFields = isShortQuery
      ? ["title^10"]
      : ["title^6", "description^2"];

    mustClauses.push({
      bool: {
        should: [
          {
            multi_match: {
              query: cleanQuery,
              fields: fuzzyFields,
              fuzziness: "AUTO",
            },
          },
          {
            multi_match: {
              query: safeQuery,
              fields: prefixFields,
              type: "phrase_prefix",
              max_expansions: 50,
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  }

  const searchStartTime = Date.now();

  try {
    const response = await client.search({
      index: COURSE_INDEX,
      from,
      size: safeLimit,
      track_total_hits: true,
      sort: cleanQuery
        ? [{ _score: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      _source: false,
      query: {
        bool: {
          filter: filterClauses,
          must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
        },
      },
    });

    const durationMs = Date.now() - searchStartTime;
    const hits = response?.hits?.hits || [];
    const totalHitsRaw = response?.hits?.total;
    const total =
      typeof totalHitsRaw === "number"
        ? totalHitsRaw
        : Number(totalHitsRaw?.value || 0);

    logAnalytics("SEARCH_COMPLETED", {
      query: cleanQuery || "(none)",
      category: cleanCategory || "(none)",
      level: cleanLevel || "(none)",
      page: safePage,
      limit: safeLimit,
      totalHits: total,
      returnedHits: hits.length,
      durationMs,
      usedFuzzy: Boolean(cleanQuery),
      isShortQuery,
    });

    return {
      ids: hits.map((item) => item._id),
      total,
      page: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    const durationMs = Date.now() - searchStartTime;
    logError("searchCoursesInElastic", error);

    logAnalytics("SEARCH_FAILED", {
      query: cleanQuery || "(none)",
      category: cleanCategory || "(none)",
      level: cleanLevel || "(none)",
      durationMs,
    });

    if (error?.meta?.statusCode === 400) {
      console.error(
        "[ES] Malformed search query. Check query syntax or field mappings."
      );
    } else if (error?.meta?.statusCode === 404) {
      console.error(
        `[ES] Index '${COURSE_INDEX}' not found during search. Index may need to be recreated.`
      );
    }

    return null;
  }
}

module.exports = {
  getElasticsearchClient,
  getCourseSearchIndexName,
  initializeElasticsearch,
  isElasticsearchConfigured,
  isElasticsearchReady,
  upsertCourseInSearchIndex,
  removeCourseFromSearchIndex,
  searchCoursesInElastic,
};