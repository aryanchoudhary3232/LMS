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

async function ensureCourseSearchIndex(client) {
  const existsResponse = await client.indices.exists({ index: COURSE_INDEX });
  const exists =
    typeof existsResponse === "boolean"
      ? existsResponse
      : Boolean(existsResponse?.body);

  if (exists) return;

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
}

async function initializeElasticsearch() {
  const client = getElasticsearchClient();

  if (!client) {
    elasticsearchReady = false;
    return false;
  }

  try {
    await client.ping();
    await ensureCourseSearchIndex(client);
    elasticsearchReady = true;
    return true;
  } catch (error) {
    elasticsearchReady = false;
    console.error("Elasticsearch init failed:", error?.message || error);
    return false;
  }
}

function isElasticsearchReady() {
  return elasticsearchReady;
}

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

async function upsertCourseInSearchIndex(course) {
  if (!isElasticsearchReady()) {
    const initialized = await initializeElasticsearch();
    if (!initialized) return false;
  }
  if (!course?._id) return false;

  const client = getElasticsearchClient();
  const document = normalizeCourseDocument(course);
  if (!client || !document) return false;

  try {
    await client.index({
      index: COURSE_INDEX,
      id: course._id.toString(),
      document,
      refresh: false,
    });
    return true;
  } catch (error) {
    console.error("Elasticsearch upsert failed:", error?.message || error);
    return false;
  }
}

async function removeCourseFromSearchIndex(courseId) {
  if (!courseId) return false;
  if (!isElasticsearchReady()) {
    const initialized = await initializeElasticsearch();
    if (!initialized) return false;
  }

  const client = getElasticsearchClient();
  if (!client) return false;

  try {
    await client.delete({
      index: COURSE_INDEX,
      id: courseId.toString(),
      refresh: false,
    });
    return true;
  } catch (error) {
    const statusCode = error?.meta?.statusCode;
    if (statusCode === 404) return true;
    console.error("Elasticsearch delete failed:", error?.message || error);
    return false;
  }
}

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

    const hits = response?.hits?.hits || [];
    const totalHitsRaw = response?.hits?.total;
    const total =
      typeof totalHitsRaw === "number"
        ? totalHitsRaw
        : Number(totalHitsRaw?.value || 0);

    return {
      ids: hits.map((item) => item._id),
      total,
      page: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    console.error("Elasticsearch search failed:", error?.message || error);
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
  normalizeCourseDocument,
  escapeForPhrasePrefix,
};
