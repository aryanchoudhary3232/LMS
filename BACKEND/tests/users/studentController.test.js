jest.mock("../../models/Student", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/QuizSubmission", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/Course", () => ({
  findById: jest.fn(),
}));

jest.mock("../../utils/redisLock", () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
}));

const Student = require("../../models/Student");
const QuizSubmission = require("../../models/QuizSubmission");
const Course = require("../../models/Course");
const { acquireLock, releaseLock } = require("../../utils/redisLock");
const {
  enrollInCourse,
  getCourseById,
  getStreakStats,
  studentProgress,
} = require("../../controller/studentController");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("studentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    releaseLock.mockResolvedValue(undefined);
  });

  describe("enrollInCourse", () => {
    test("returns 409 when enrollment lock is not acquired", async () => {
      acquireLock.mockResolvedValue({ acquired: false, key: "k1" });

      const req = { params: { courseId: "c1" }, user: { _id: "s1" } };
      const res = createRes();

      await enrollInCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Enrollment is already in progress. Please retry in a moment.",
        }),
      );
      expect(releaseLock).toHaveBeenCalledWith({ acquired: false, key: "k1" });
    });

    test("returns 404 when course does not exist", async () => {
      acquireLock.mockResolvedValue({ acquired: true, key: "k2" });
      Course.findById.mockResolvedValue(null);

      const req = { params: { courseId: "c1" }, user: { _id: "s1" } };
      const res = createRes();

      await enrollInCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Course not found" }),
      );
      expect(releaseLock).toHaveBeenCalledWith({ acquired: true, key: "k2" });
    });

    test("returns already enrolled response without saving", async () => {
      acquireLock.mockResolvedValue({ acquired: true, key: "k3" });
      Course.findById.mockResolvedValue({
        students: ["s1"],
        save: jest.fn(),
      });

      const req = { params: { courseId: "c1" }, user: { _id: "s1" } };
      const res = createRes();

      await enrollInCourse(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "You are already enrolled in this course",
        success: false,
        error: true,
      });
    });

    test("enrolls student successfully", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const course = { students: [], save };

      acquireLock.mockResolvedValue({ acquired: true, key: "k4" });
      Course.findById.mockResolvedValue(course);

      const req = { params: { courseId: "c1" }, user: { _id: "s1" } };
      const res = createRes();

      await enrollInCourse(req, res);

      expect(course.students).toContain("s1");
      expect(save).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully enrolled in course",
        success: true,
        error: false,
      });
      expect(releaseLock).toHaveBeenCalledWith({ acquired: true, key: "k4" });
    });
  });

  describe("getCourseById", () => {
    test("returns 404 when requested course is missing", async () => {
      Course.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { courseId: "c404" } };
      const res = createRes();

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Course not found" }),
      );
    });

    test("returns course with rating summary", async () => {
      const course = {
        ratings: [{ rating: 5 }, { rating: 4 }, { rating: 4 }],
        toObject: () => ({ _id: "c1", title: "Node.js" }),
      };
      Course.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(course),
      });

      const req = { params: { courseId: "c1" } };
      const res = createRes();

      await getCourseById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Course retrieved successfully",
          success: true,
          data: expect.objectContaining({
            rating: { average: 4.3, count: 3 },
          }),
        }),
      );
    });
  });

  describe("getStreakStats", () => {
    test("calculates quiz days and active days from multiple sources", async () => {
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          streak: 4,
          bestStreak: 8,
          lastActiveDateStreak: new Date("2026-04-16T10:00:00.000Z"),
          studentProgress: [
            { date: new Date("2026-04-14T10:00:00.000Z") },
            { date: new Date("2026-04-16T12:00:00.000Z") },
          ],
        }),
      });
      QuizSubmission.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { submittedAt: new Date("2026-04-14T08:00:00.000Z") },
          { submittedAt: new Date("2026-04-14T20:00:00.000Z") },
          { submittedAt: new Date("2026-04-15T09:00:00.000Z") },
        ]),
      });

      const req = { user: { _id: "s1" } };
      const res = createRes();

      await getStreakStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          currentStreak: 4,
          bestStreak: 8,
          lastActiveDate: new Date("2026-04-16T10:00:00.000Z"),
          quizDays: 2,
          activeDays: 3,
        },
      });
    });

    test("returns 500 when streak query fails", async () => {
      Student.findById.mockImplementation(() => {
        throw new Error("db fail");
      });

      const req = { user: { _id: "s1" } };
      const res = createRes();

      await getStreakStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Could not fetch streak stats",
      });
    });
  });

  describe("studentProgress", () => {
    test("rejects invalid minute payload", async () => {
      const req = { body: { minutes: "abc" }, query: {}, user: { _id: "s1" } };
      const res = createRes();

      await studentProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid minutes value" }),
      );
    });

    test("requires authenticated user", async () => {
      const req = { body: { minutes: 20 }, query: {} };
      const res = createRes();

      await studentProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Authentication required" }),
      );
    });

    test("returns 404 when student does not exist", async () => {
      Student.findById.mockResolvedValue(null);

      const req = { body: { minutes: 25 }, query: {}, user: { _id: "s1" } };
      const res = createRes();

      await studentProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Student not found" }),
      );
    });

    test("increments existing progress entry for today", async () => {
      const today = new Date();
      const student = {
        name: "Alice",
        studentProgress: [{ date: today, minutes: 30 }],
        save: jest.fn().mockResolvedValue(undefined),
      };
      Student.findById.mockResolvedValue(student);

      const req = { body: { minutes: 20 }, query: {}, user: { _id: "s1" } };
      const res = createRes();

      await studentProgress(req, res);

      expect(student.studentProgress[0].minutes).toBe(50);
      expect(student.save).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Learning progress saved successfully",
          success: true,
          data: expect.objectContaining({ totalMinutesToday: 50 }),
        }),
      );
    });
  });
});
