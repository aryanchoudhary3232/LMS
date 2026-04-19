const { performance } = require("node:perf_hooks");
const { MongoClient, ObjectId } = require("mongodb");

const TEST_MONGO_URL =
  process.env.TEST_MONGO_URL ||
  process.env.MONGO_URL_ATLAS ||
  process.env.MONGO_URL;

const describeIfMongo = TEST_MONGO_URL ? describe : describe.skip;

jest.setTimeout(60000);

function findStage(node, stageName) {
  if (!node || typeof node !== "object") return null;

  if (node.stage === stageName) {
    return node;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const nestedStage = findStage(entry, stageName);
        if (nestedStage) return nestedStage;
      }
      continue;
    }

    const nestedStage = findStage(value, stageName);
    if (nestedStage) return nestedStage;
  }

  return null;
}

async function measureAverageQueryTime(collection, filter, iterations = 20) {
  for (let run = 0; run < 3; run += 1) {
    await collection.find(filter).project({ _id: 1 }).toArray();
  }

  let totalDurationMs = 0;

  for (let run = 0; run < iterations; run += 1) {
    const startedAt = performance.now();
    await collection.find(filter).project({ _id: 1 }).toArray();
    totalDurationMs += performance.now() - startedAt;
  }

  return Number((totalDurationMs / iterations).toFixed(3));
}

describeIfMongo("Mongo course index benchmark", () => {
  let client;
  let db;
  let collection;

  beforeAll(async () => {
    client = new MongoClient(TEST_MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db();

    collection = db.collection(`course_index_benchmark_${Date.now()}`);
  });

  afterAll(async () => {
    if (collection) {
      await collection.drop().catch(() => undefined);
    }

    if (client) {
      await client.close();
    }
  });

  test("reports query timing before and after adding the compound course index", async () => {
    const targetTeacherId = new ObjectId();
    const otherTeacherIds = Array.from({ length: 24 }, () => new ObjectId());
    const documents = [];

    for (let index = 0; index < 15000; index += 1) {
      const teacher =
        index < 900 ? targetTeacherId : otherTeacherIds[index % otherTeacherIds.length];
      const isDeleted = index >= 900 && index % 7 === 0;

      documents.push({
        title: `Course ${index}`,
        description: `Generated benchmark course ${index}`,
        category: index % 2 === 0 ? "Development" : "Design",
        teacher,
        isDeleted,
      });
    }

    await collection.insertMany(documents, { ordered: false });

    const filter = { teacher: targetTeacherId, isDeleted: false };

    const withoutIndexExplain = await collection
      .find(filter)
      .project({ _id: 1 })
      .explain("executionStats");
    const withoutIndexAverageMs = await measureAverageQueryTime(collection, filter);

    await collection.createIndex({ teacher: 1, isDeleted: 1 });

    const withIndexExplain = await collection
      .find(filter)
      .project({ _id: 1 })
      .explain("executionStats");
    const withIndexAverageMs = await measureAverageQueryTime(collection, filter);

    const withoutIndexPlan = withoutIndexExplain.queryPlanner.winningPlan;
    const withIndexPlan = withIndexExplain.queryPlanner.winningPlan;

    const withoutIndexDocsExamined =
      withoutIndexExplain.executionStats.totalDocsExamined;
    const withIndexDocsExamined = withIndexExplain.executionStats.totalDocsExamined;
    const improvementMs = Number(
      (withoutIndexAverageMs - withIndexAverageMs).toFixed(3),
    );
    const improvementPercent = Number(
      (
        ((withoutIndexAverageMs - withIndexAverageMs) / withoutIndexAverageMs) *
        100
      ).toFixed(2),
    );

    console.log(
      [
        "[db-index-benchmark]",
        `Without index avg: ${withoutIndexAverageMs} ms`,
        `With index avg: ${withIndexAverageMs} ms`,
        `Improvement: ${improvementMs} ms (${improvementPercent}%)`,
        `Docs examined without index: ${withoutIndexDocsExamined}`,
        `Docs examined with index: ${withIndexDocsExamined}`,
      ].join("\n"),
    );

    expect(findStage(withoutIndexPlan, "COLLSCAN")).toBeTruthy();
    expect(findStage(withIndexPlan, "IXSCAN")).toBeTruthy();
    expect(withIndexDocsExamined).toBeLessThan(withoutIndexDocsExamined);
    expect(withoutIndexAverageMs).toBeGreaterThan(0);
    expect(withIndexAverageMs).toBeGreaterThan(0);
  });
});
