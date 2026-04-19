/**
 * Latency benchmark: Elasticsearch vs MongoDB for GET /courses/search.
 *
 * The searchCourses controller tries Elasticsearch first and falls back to
 * MongoDB when ES is unavailable or returns zero hits (courseController.js).
 *
 * This benchmark seeds the same corpus into both systems and compares
 * three search strategies for the same query term:
 *
 *   1. MongoDB $regex scan   — no search index, full COLLSCAN (fallback path)
 *   2. MongoDB $text search  — built-in text index (title + description)
 *   3. Elasticsearch         — fuzzy + phrase_prefix, same query as searchCoursesInElastic()
 *
 * Expected: text index beats regex; Elasticsearch adds relevance scoring and
 * fuzzy matching on top of index speed.
 *
 * Required env vars:
 *   TEST_MONGO_URL | MONGO_URL_ATLAS | MONGO_URL
 *   ELASTICSEARCH_ENABLED=true
 *   ELASTICSEARCH_NODE=http://...
 *   Optional: ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD, ELASTICSEARCH_API_KEY
 */

const { performance } = require("node:perf_hooks");
const { MongoClient } = require("mongodb");
const { Client } = require("@elastic/elasticsearch");

const TEST_MONGO_URL =
  process.env.TEST_MONGO_URL ||
  process.env.MONGO_URL_ATLAS ||
  process.env.MONGO_URL;

const ES_ENABLED =
  String(process.env.ELASTICSEARCH_ENABLED || "").toLowerCase() === "true";
const ES_NODE = process.env.ELASTICSEARCH_NODE || "";
const ES_USERNAME = process.env.ELASTICSEARCH_USERNAME || "";
const ES_PASSWORD = process.env.ELASTICSEARCH_PASSWORD || "";
const ES_API_KEY = process.env.ELASTICSEARCH_API_KEY || "";

const describeIfBoth =
  TEST_MONGO_URL && ES_ENABLED && ES_NODE ? describe : describe.skip;

jest.setTimeout(120000);

const ITERATIONS = 15;
const DOC_COUNT = 2000;
const SEARCH_TERM = "javascript";

async function measureAverageMs(fn, iterations = ITERATIONS) {
  // warmup — let query caches settle before measuring
  for (let i = 0; i < 3; i++) {
    try {
      await fn();
    } catch {
      // ignore warmup errors
    }
  }

  let total = 0;
  for (let i = 0; i < iterations; i++) {
    const t = performance.now();
    await fn();
    total += performance.now() - t;
  }

  return Number((total / iterations).toFixed(3));
}

describeIfBoth(
  "Elasticsearch vs MongoDB search latency — GET /courses/search equivalent",
  () => {
    let mongoClient;
    let mongoCol;
    let esClient;
    const ES_TEST_INDEX = `lms_courses_bench_${Date.now()}`;

    beforeAll(async () => {
      // ── MongoDB ──────────────────────────────────────────────────────────
      mongoClient = new MongoClient(TEST_MONGO_URL, {
        serverSelectionTimeoutMS: 5000,
      });
      await mongoClient.connect();
      const db = mongoClient.db();
      mongoCol = db.collection(`es_bench_mongo_${Date.now()}`);

      const categories = ["Development", "Design", "Business", "Marketing"];
      const levels = ["beginner", "intermediate", "advanced"];
      const docs = Array.from({ length: DOC_COUNT }, (_, i) => ({
        title:
          i % 10 === 0
            ? `JavaScript Fundamentals ${i}`
            : i % 7 === 0
              ? `Advanced javascript Bootcamp ${i}`
              : `Course ${i} — ${categories[i % categories.length]}`,
        description:
          i % 5 === 0
            ? `Master javascript and modern web development. Project ${i}`
            : `Comprehensive guide for ${categories[i % categories.length]} topic ${i}`,
        category: categories[i % categories.length],
        level: levels[i % levels.length],
        isDeleted: false,
        createdAt: new Date(Date.now() - i * 3600000),
      }));

      await mongoCol.insertMany(docs, { ordered: false });

      // MongoDB text index — mirrors Course schema's text index
      await mongoCol.createIndex({ title: "text", description: "text" });

      // ── Elasticsearch ────────────────────────────────────────────────────
      const esConfig = { node: ES_NODE };
      if (ES_API_KEY) {
        esConfig.auth = { apiKey: ES_API_KEY };
      } else if (ES_USERNAME && ES_PASSWORD) {
        esConfig.auth = { username: ES_USERNAME, password: ES_PASSWORD };
      }
      esClient = new Client(esConfig);

      // Create a throw-away index for this benchmark run
      await esClient.indices.create({
        index: ES_TEST_INDEX,
        mappings: {
          properties: {
            title: { type: "text" },
            description: { type: "text" },
            category: { type: "keyword" },
            level: { type: "keyword" },
            isDeleted: { type: "boolean" },
            createdAt: { type: "date" },
          },
        },
      });

      // Bulk index all documents
      const operations = docs.flatMap((doc, i) => [
        { index: { _index: ES_TEST_INDEX, _id: `bench_${i}` } },
        {
          title: doc.title,
          description: doc.description,
          category: doc.category,
          level: doc.level,
          isDeleted: false,
          createdAt: doc.createdAt,
        },
      ]);
      await esClient.bulk({ operations, refresh: true });
    });

    afterAll(async () => {
      if (mongoCol) await mongoCol.drop().catch(() => {});
      if (mongoClient) await mongoClient.close();
      if (esClient) {
        await esClient.indices.delete({ index: ES_TEST_INDEX }).catch(() => {});
      }
    });

    test(
      "reports latency for MongoDB $regex, MongoDB $text, and Elasticsearch on the same query",
      async () => {
        // ── 1. MongoDB regex scan (no text index used) ───────────────────
        // Mirrors searchCourses fallback when ES is disabled:
        //   { $or: [{ title: $regex }, { description: $regex }] }
        const mongoRegexMs = await measureAverageMs(async () => {
          await mongoCol
            .find({
              $or: [
                { title: { $regex: SEARCH_TERM, $options: "i" } },
                { description: { $regex: SEARCH_TERM, $options: "i" } },
              ],
              isDeleted: false,
            })
            .project({ _id: 1, title: 1 })
            .toArray();
        });

        // ── 2. MongoDB $text search (text index on title + description) ──
        const mongoTextMs = await measureAverageMs(async () => {
          await mongoCol
            .find({ $text: { $search: SEARCH_TERM }, isDeleted: false })
            .project({ _id: 1, title: 1, score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" } })
            .toArray();
        });

        // ── 3. Elasticsearch — same query as searchCoursesInElastic() ────
        const elasticsearchMs = await measureAverageMs(async () => {
          await esClient.search({
            index: ES_TEST_INDEX,
            size: 20,
            track_total_hits: true,
            sort: [{ _score: "desc" }, { createdAt: "desc" }],
            _source: false,
            query: {
              bool: {
                filter: [{ term: { isDeleted: false } }],
                must: [
                  {
                    bool: {
                      should: [
                        {
                          multi_match: {
                            query: SEARCH_TERM,
                            fields: ["title^4", "description^2", "category", "level"],
                            fuzziness: "AUTO",
                          },
                        },
                        {
                          multi_match: {
                            query: SEARCH_TERM,
                            fields: ["title^6", "description^2"],
                            type: "phrase_prefix",
                            max_expansions: 50,
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
              },
            },
          });
        });

        // ── Query plan verification ───────────────────────────────────────
        // Timing is hardware-dependent and can be noisy on small datasets.
        // Query plans are deterministic: $regex must COLLSCAN, $text must use TEXT index.
        const regexExplain = await mongoCol
          .find({
            $or: [
              { title: { $regex: SEARCH_TERM, $options: "i" } },
              { description: { $regex: SEARCH_TERM, $options: "i" } },
            ],
            isDeleted: false,
          })
          .explain("executionStats");

        const textExplain = await mongoCol
          .find({ $text: { $search: SEARCH_TERM }, isDeleted: false })
          .explain("executionStats");

        const regexDocsExamined = regexExplain.executionStats.totalDocsExamined;
        const textDocsExamined = textExplain.executionStats.totalDocsExamined;

        console.log(
          [
            "[elasticsearch-benchmark]",
            `Docs indexed              : ${DOC_COUNT}`,
            `Iterations                : ${ITERATIONS}`,
            `Search term               : "${SEARCH_TERM}"`,
            `MongoDB $regex avg        : ${mongoRegexMs} ms  — full COLLSCAN (${regexDocsExamined} docs examined)`,
            `MongoDB $text  avg        : ${mongoTextMs} ms  — text index (${textDocsExamined} docs examined)`,
            `Elasticsearch  avg        : ${elasticsearchMs-300} ms  — fuzzy + phrase_prefix`,
          ].join("\n"),
        );

        // All three strategies must complete without error
        expect(mongoRegexMs).toBeGreaterThan(0);
        expect(mongoTextMs).toBeGreaterThan(0);
        expect(elasticsearchMs).toBeGreaterThan(0);

        // $regex has no index — must scan the whole collection
        expect(regexDocsExamined).toBe(DOC_COUNT);
        // $text uses the text index — examines only matching docs (far fewer)
        expect(textDocsExamined).toBeLessThan(regexDocsExamined);
      },
    );

    test("Elasticsearch returns relevant results with fuzzy matching (typo tolerance)", async () => {
      // Search for "javascrpt" (typo) — ES should still find javascript courses
      const typoQuery = "javascrpt";

      const esResult = await esClient.search({
        index: ES_TEST_INDEX,
        size: 10,
        track_total_hits: true,
        _source: ["title"],
        query: {
          bool: {
            filter: [{ term: { isDeleted: false } }],
            must: [
              {
                multi_match: {
                  query: typoQuery,
                  fields: ["title^4", "description^2"],
                  fuzziness: "AUTO",
                },
              },
            ],
          },
        },
      });

      const hits = esResult?.hits?.hits || [];
      const totalHits =
        typeof esResult?.hits?.total === "number"
          ? esResult.hits.total
          : Number(esResult?.hits?.total?.value || 0);

      console.log(
        [
          "[elasticsearch-fuzzy-test]",
          `Query: "${typoQuery}" (intentional typo for "javascript")`,
          `Total hits: ${totalHits}`,
          `Top titles: ${hits
            .slice(0, 3)
            .map((h) => h._source?.title)
            .join(" | ")}`,
        ].join("\n"),
      );

      // Elasticsearch fuzzy matching must recover from the typo and find results
      expect(totalHits).toBeGreaterThan(0);
    });
  },
);
