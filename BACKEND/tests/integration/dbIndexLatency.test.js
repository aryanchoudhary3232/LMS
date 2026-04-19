/**
 * Latency benchmarks: MongoDB index impact on API-equivalent queries.
 *
 * Three scenarios mirror real routes in this LMS:
 *
 *   1. GET /student/my-courses
 *      Query: students whose enrolledCourses.course matches a given courseId
 *      Index: { "enrolledCourses.course": 1, isDeleted: 1 }
 *
 *   2. GET /assignments?course=X&status=active  (teacher/assignment listing)
 *      Query: assignments filtered by course + status, sorted by dueDate
 *      Index: { course: 1, status: 1, dueDate: 1 }
 *
 *   3. GET /admin/orders?userId=X  (admin order history)
 *      Query: orders by userId sorted by createdAt desc
 *      Index: { userId: 1, createdAt: -1 }
 *
 * Each scenario:
 *   - Inserts ~12 000 documents into a throw-away collection
 *   - Measures average query time WITHOUT the target index (COLLSCAN)
 *   - Creates the index, then measures again (IXSCAN)
 *   - Asserts IXSCAN and fewer docs examined
 *
 * Required env var (at least one):
 *   TEST_MONGO_URL | MONGO_URL_ATLAS | MONGO_URL
 */

const { performance } = require("node:perf_hooks");
const { MongoClient, ObjectId } = require("mongodb");

const TEST_MONGO_URL =
  process.env.TEST_MONGO_URL ||
  process.env.MONGO_URL_ATLAS ||
  process.env.MONGO_URL;

const describeIfMongo = TEST_MONGO_URL ? describe : describe.skip;

jest.setTimeout(120000);

const ITERATIONS = 20;
const DOC_COUNT = 12000;

// ── helpers ────────────────────────────────────────────────────────────────

function findStage(node, stageName) {
  if (!node || typeof node !== "object") return null;
  if (node.stage === stageName) return node;

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = findStage(entry, stageName);
        if (found) return found;
      }
    } else {
      const found = findStage(value, stageName);
      if (found) return found;
    }
  }

  return null;
}

async function measureAverageQueryTime(queryFn, iterations = ITERATIONS) {
  // warmup
  for (let i = 0; i < 3; i++) await queryFn();

  let total = 0;
  for (let i = 0; i < iterations; i++) {
    const t = performance.now();
    await queryFn();
    total += performance.now() - t;
  }

  return Number((total / iterations).toFixed(3));
}

// ── shared mongo client ────────────────────────────────────────────────────

describeIfMongo("MongoDB index latency benchmarks", () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(TEST_MONGO_URL, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db();
  });

  afterAll(async () => {
    if (client) await client.close();
  });

  // ── Scenario 1: Student enrolled courses ────────────────────────────────
  describe("GET /student/my-courses — enrolledCourses.course index", () => {
    let col;
    let targetCourseId;

    beforeAll(async () => {
      col = db.collection(`bench_student_${Date.now()}`);
      targetCourseId = new ObjectId();

      const docs = Array.from({ length: DOC_COUNT }, (_, i) => ({
        email: `student${i}@test.com`,
        isDeleted: false,
        enrolledCourses:
          i < 500
            ? [{ course: targetCourseId, enrolledAt: new Date() }]
            : [{ course: new ObjectId(), enrolledAt: new Date() }],
        createdAt: new Date(Date.now() - i * 60000),
      }));

      await col.insertMany(docs, { ordered: false });
    });

    afterAll(async () => {
      await col.drop().catch(() => {});
    });

    test("index on { enrolledCourses.course, isDeleted } reduces docs examined and switches COLLSCAN → IXSCAN", async () => {
      const filter = { "enrolledCourses.course": targetCourseId, isDeleted: false };
      const queryFn = () =>
        col
          .find(filter)
          .project({ _id: 1, email: 1 })
          .toArray();

      const withoutExplain = await col
        .find(filter)
        .project({ _id: 1 })
        .explain("executionStats");
      const withoutMs = await measureAverageQueryTime(queryFn);

      await col.createIndex({ "enrolledCourses.course": 1, isDeleted: 1 });

      const withExplain = await col
        .find(filter)
        .project({ _id: 1 })
        .explain("executionStats");
      const withMs = await measureAverageQueryTime(queryFn);

      const improvementPct = Number(
        (((withoutMs - withMs) / withoutMs) * 100).toFixed(2),
      );

      console.log(
        [
          "[db-index-benchmark:student-enrolled-courses]",
          `Docs in collection         : ${DOC_COUNT}`,
          `Iterations                 : ${ITERATIONS}`,
          `Without index avg          : ${withoutMs} ms`,
          `With    index avg          : ${withMs} ms`,
          `Improvement                : ${improvementPct}%`,
          `Docs examined without index: ${withoutExplain.executionStats.totalDocsExamined}`,
          `Docs examined with    index: ${withExplain.executionStats.totalDocsExamined}`,
        ].join("\n"),
      );

      expect(findStage(withoutExplain.queryPlanner.winningPlan, "COLLSCAN")).toBeTruthy();
      expect(findStage(withExplain.queryPlanner.winningPlan, "IXSCAN")).toBeTruthy();
      expect(withExplain.executionStats.totalDocsExamined).toBeLessThan(
        withoutExplain.executionStats.totalDocsExamined,
      );
    });
  });

  // ── Scenario 2: Assignment query by course + status + dueDate ─────────
  describe("GET /assignments?course=X&status=active — compound assignment index", () => {
    let col;
    let targetCourseId;

    beforeAll(async () => {
      col = db.collection(`bench_assignment_${Date.now()}`);
      targetCourseId = new ObjectId();
      const statuses = ["pending", "active", "closed"];

      const docs = Array.from({ length: DOC_COUNT }, (_, i) => ({
        title: `Assignment ${i}`,
        course: i < 600 ? targetCourseId : new ObjectId(),
        status: statuses[i % statuses.length],
        dueDate: new Date(Date.now() + (i % 30) * 86400000),
        isDeleted: false,
      }));

      await col.insertMany(docs, { ordered: false });
    });

    afterAll(async () => {
      await col.drop().catch(() => {});
    });

    test("compound index { course, status, dueDate } reduces docs examined and enables IXSCAN", async () => {
      const filter = { course: targetCourseId, status: "active" };
      const queryFn = () =>
        col
          .find(filter)
          .sort({ dueDate: 1 })
          .project({ _id: 1, title: 1, dueDate: 1 })
          .toArray();

      const withoutExplain = await col
        .find(filter)
        .sort({ dueDate: 1 })
        .project({ _id: 1 })
        .explain("executionStats");
      const withoutMs = await measureAverageQueryTime(queryFn);

      await col.createIndex({ course: 1, status: 1, dueDate: 1 });

      const withExplain = await col
        .find(filter)
        .sort({ dueDate: 1 })
        .project({ _id: 1 })
        .explain("executionStats");
      const withMs = await measureAverageQueryTime(queryFn);

      const improvementPct = Number(
        (((withoutMs - withMs) / withoutMs) * 100).toFixed(2),
      );

      console.log(
        [
          "[db-index-benchmark:assignment-course-status-duedate]",
          `Docs in collection         : ${DOC_COUNT}`,
          `Iterations                 : ${ITERATIONS}`,
          `Without index avg          : ${withoutMs} ms`,
          `With    index avg          : ${withMs} ms`,
          `Improvement                : ${improvementPct}%`,
          `Docs examined without index: ${withoutExplain.executionStats.totalDocsExamined}`,
          `Docs examined with    index: ${withExplain.executionStats.totalDocsExamined}`,
        ].join("\n"),
      );

      expect(findStage(withExplain.queryPlanner.winningPlan, "IXSCAN")).toBeTruthy();
      expect(withExplain.executionStats.totalDocsExamined).toBeLessThan(
        withoutExplain.executionStats.totalDocsExamined,
      );
    });
  });

  // ── Scenario 3: Order history by userId ──────────────────────────────
  describe("GET /admin/orders?userId=X — order userId+createdAt index", () => {
    let col;
    let targetUserId;

    beforeAll(async () => {
      col = db.collection(`bench_order_${Date.now()}`);
      targetUserId = new ObjectId();

      const docs = Array.from({ length: DOC_COUNT }, (_, i) => ({
        userId: i < 400 ? targetUserId : new ObjectId(),
        courseId: new ObjectId(),
        status: i % 3 === 0 ? "completed" : "pending",
        amount: (i % 100) * 99,
        createdAt: new Date(Date.now() - i * 3600000),
      }));

      await col.insertMany(docs, { ordered: false });
    });

    afterAll(async () => {
      await col.drop().catch(() => {});
    });

    test("index { userId, createdAt: -1 } reduces docs examined and enables IXSCAN", async () => {
      const filter = { userId: targetUserId };
      const queryFn = () =>
        col
          .find(filter)
          .sort({ createdAt: -1 })
          .project({ _id: 1, amount: 1, status: 1, createdAt: 1 })
          .toArray();

      const withoutExplain = await col
        .find(filter)
        .sort({ createdAt: -1 })
        .project({ _id: 1 })
        .explain("executionStats");
      const withoutMs = await measureAverageQueryTime(queryFn);

      await col.createIndex({ userId: 1, createdAt: -1 });

      const withExplain = await col
        .find(filter)
        .sort({ createdAt: -1 })
        .project({ _id: 1 })
        .explain("executionStats");
      const withMs = await measureAverageQueryTime(queryFn);

      const improvementPct = Number(
        (((withoutMs - withMs) / withoutMs) * 100).toFixed(2),
      );

      console.log(
        [
          "[db-index-benchmark:order-userId-createdAt]",
          `Docs in collection         : ${DOC_COUNT}`,
          `Iterations                 : ${ITERATIONS}`,
          `Without index avg          : ${withoutMs} ms`,
          `With    index avg          : ${withMs} ms`,
          `Improvement                : ${improvementPct}%`,
          `Docs examined without index: ${withoutExplain.executionStats.totalDocsExamined}`,
          `Docs examined with    index: ${withExplain.executionStats.totalDocsExamined}`,
        ].join("\n"),
      );

      expect(findStage(withExplain.queryPlanner.winningPlan, "IXSCAN")).toBeTruthy();
      expect(withExplain.executionStats.totalDocsExamined).toBeLessThan(
        withoutExplain.executionStats.totalDocsExamined,
      );
    });
  });
});
