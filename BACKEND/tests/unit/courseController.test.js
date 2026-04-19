jest.mock("../../models/Course");
jest.mock("../../utils/courseSearchIndex", () => ({
  searchCoursesInElastic: jest.fn().mockResolvedValue(null),
}));
jest.mock("../../utils/assetUrl", () => ({
  normalizePublicAssetUrl: jest.fn((url) => url || ""),
}));

const Course = require("../../models/Course");
const { getAllCourses, searchCourses, rateCourse } = require("../../controller/courseController");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function createReq(overrides = {}) {
  return { query: {}, params: {}, body: {}, user: null, ...overrides };
}

beforeEach(() => jest.clearAllMocks());

// ── getAllCourses ──────────────────────────────────────────────────────────

describe("getAllCourses", () => {
  test("returns 200 with mapped courses on success", async () => {
    const fakeCourses = [
      { _id: "1", title: "Node.js", ratings: [{ rating: 4 }, { rating: 5 }], image: null },
      { _id: "2", title: "React", ratings: [], image: null },
    ];

    Course.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeCourses),
    });

    const req = createReq();
    const res = createRes();

    await getAllCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    // rating average computed correctly
    expect(body.data[0].rating.average).toBe(4.5);
    expect(body.data[1].rating.count).toBe(0);
  });

  test("returns 500 when Course.find throws", async () => {
    Course.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error("db error")),
    });

    const res = createRes();
    await getAllCourses(createReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });
});

// ── rateCourse ────────────────────────────────────────────────────────────

describe("rateCourse", () => {
  test("returns 401 when user is not authenticated", async () => {
    const res = createRes();
    await rateCourse(createReq({ params: { courseId: "c1" }, body: { rating: 4 } }), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 400 for rating below 1", async () => {
    const res = createRes();
    await rateCourse(
      createReq({ params: { courseId: "c1" }, body: { rating: 0 }, user: { _id: "u1" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/1 and 5/);
  });

  test("returns 400 for rating above 5", async () => {
    const res = createRes();
    await rateCourse(
      createReq({ params: { courseId: "c1" }, body: { rating: 6 }, user: { _id: "u1" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 404 when course does not exist", async () => {
    Course.findById.mockResolvedValue(null);

    const res = createRes();
    await rateCourse(
      createReq({ params: { courseId: "c1" }, body: { rating: 3 }, user: { _id: "u1" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 when student is not enrolled", async () => {
    Course.findById.mockResolvedValue({ students: [], ratings: [], save: jest.fn() });

    const res = createRes();
    await rateCourse(
      createReq({ params: { courseId: "c1" }, body: { rating: 3 }, user: { _id: "u1" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("saves new rating and returns updated average for enrolled student", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const mockCourse = {
      _id: "c1",
      students: [{ toString: () => userId }],
      ratings: [],
      save: jest.fn().mockResolvedValue(true),
    };
    Course.findById.mockResolvedValue(mockCourse);

    const res = createRes();
    await rateCourse(
      createReq({ params: { courseId: "c1" }, body: { rating: 5, review: "Great!" }, user: { _id: userId } }),
      res,
    );

    expect(mockCourse.save).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.average).toBe(5);
    expect(body.data.count).toBe(1);
  });

  test("updates existing rating when student rates again", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const mockCourse = {
      _id: "c1",
      students: [{ toString: () => userId }],
      ratings: [{ student: { toString: () => userId }, rating: 3 }],
      save: jest.fn().mockResolvedValue(true),
    };
    Course.findById.mockResolvedValue(mockCourse);

    const res = createRes();
    await rateCourse(
      createReq({ params: { courseId: "c1" }, body: { rating: 5 }, user: { _id: userId } }),
      res,
    );

    expect(mockCourse.ratings[0].rating).toBe(5);
    expect(mockCourse.save).toHaveBeenCalled();
  });
});

// ── searchCourses (MongoDB fallback path) ─────────────────────────────────

describe("searchCourses — MongoDB fallback (Elasticsearch disabled)", () => {
  test("returns matching courses for a text query via MongoDB", async () => {
    const fakeCourses = [{ _id: "1", title: "JavaScript Basics", ratings: [], image: null }];

    Course.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeCourses),
    });
    Course.countDocuments.mockResolvedValue(1);

    const res = createRes();
    await searchCourses(createReq({ query: { query: "javascript" } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  test("returns 200 with empty data when no courses match", async () => {
    Course.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Course.countDocuments.mockResolvedValue(0);

    const res = createRes();
    await searchCourses(createReq({ query: { query: "zzznomatch" } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data).toHaveLength(0);
  });
});
