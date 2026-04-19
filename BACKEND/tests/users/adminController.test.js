jest.mock("../../models/Student", () => ({
  countDocuments: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../models/Teacher", () => ({
  countDocuments: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../models/Course", () => ({
  countDocuments: jest.fn(),
  findById: jest.fn(),
  updateMany: jest.fn(),
}));

const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Course = require("../../models/Course");
const {
  getDashboardData,
  deleteCourse,
  deleteTeacher,
  approveTeacher,
  rejectTeacher,
} = require("../../controller/adminController");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("adminController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardData", () => {
    test("returns dashboard counts", async () => {
      Student.countDocuments.mockResolvedValue(12);
      Teacher.countDocuments.mockResolvedValue(5);
      Course.countDocuments.mockResolvedValue(9);

      const res = createRes();
      await getDashboardData({}, res);

      expect(Student.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
      expect(Teacher.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
      expect(Course.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
          studentCount: 12,
          teacherCount: 5,
          courseCount: 9,
        },
      });
    });

    test("handles dashboard query failure", async () => {
      Student.countDocuments.mockRejectedValue(new Error("db error"));

      const res = createRes();
      await getDashboardData({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while fetching dashboard data",
      });
    });
  });

  describe("deleteCourse", () => {
    test("returns 404 when course does not exist", async () => {
      Course.findById.mockResolvedValue(null);

      const req = { params: { id: "course-1" } };
      const res = createRes();

      await deleteCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Course not found",
      });
    });

    test("soft deletes an existing course", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const course = { isDeleted: false, deletedAt: null, save };
      Course.findById.mockResolvedValue(course);

      const req = { params: { id: "course-1" } };
      const res = createRes();

      await deleteCourse(req, res);

      expect(course.isDeleted).toBe(true);
      expect(course.deletedAt).toBeInstanceOf(Date);
      expect(save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Course deleted successfully",
      });
    });

    test("returns 500 on delete errors", async () => {
      Course.findById.mockRejectedValue(new Error("explode"));

      const req = { params: { id: "course-1" } };
      const res = createRes();

      await deleteCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while deleting course",
      });
    });
  });

  describe("deleteTeacher", () => {
    test("returns 404 when teacher is not found", async () => {
      Teacher.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { teacherId: "teacher-1" } };
      const res = createRes();

      await deleteTeacher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Teacher not found",
      });
    });

    test("deletes teacher and marks their courses as deleted", async () => {
      const teacher = {
        courses: [{ _id: "c1" }, { _id: "c2" }],
        isDeleted: false,
        deletedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
      };

      Teacher.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(teacher),
      });
      Course.updateMany.mockResolvedValue({ acknowledged: true });

      const req = { params: { teacherId: "teacher-1" } };
      const res = createRes();

      await deleteTeacher(req, res);

      expect(Course.updateMany).toHaveBeenCalledWith(
        { teacher: "teacher-1" },
        expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) }),
      );
      expect(teacher.isDeleted).toBe(true);
      expect(teacher.deletedAt).toBeInstanceOf(Date);
      expect(teacher.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Teacher and their courses deleted successfully",
        data: { deletedCoursesCount: 2 },
      });
    });

    test("deletes teacher even when they have no courses", async () => {
      const teacher = {
        courses: [],
        save: jest.fn().mockResolvedValue(undefined),
      };

      Teacher.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(teacher),
      });

      const req = { params: { teacherId: "teacher-1" } };
      const res = createRes();

      await deleteTeacher(req, res);

      expect(Course.updateMany).not.toHaveBeenCalled();
      expect(teacher.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("approveTeacher", () => {
    test("returns 404 for unknown teacher", async () => {
      Teacher.findById.mockResolvedValue(null);

      const req = { params: { teacherId: "t1" }, body: {} };
      const res = createRes();

      await approveTeacher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Teacher not found",
      });
    });

    test("approves teacher with explicit notes", async () => {
      const teacher = { save: jest.fn().mockResolvedValue(undefined) };
      Teacher.findById.mockResolvedValue(teacher);

      const req = {
        params: { teacherId: "t1" },
        body: { notes: "All docs verified" },
      };
      const res = createRes();

      await approveTeacher(req, res);

      expect(teacher.verificationStatus).toBe("Verified");
      expect(teacher.verificationNotes).toBe("All docs verified");
      expect(teacher.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("rejectTeacher", () => {
    test("uses default rejection note when notes are omitted", async () => {
      const teacher = { save: jest.fn().mockResolvedValue(undefined) };
      Teacher.findById.mockResolvedValue(teacher);

      const req = { params: { teacherId: "t1" }, body: {} };
      const res = createRes();

      await rejectTeacher(req, res);

      expect(teacher.verificationStatus).toBe("Rejected");
      expect(teacher.verificationNotes).toContain("rejected");
      expect(teacher.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Teacher verification rejected",
        }),
      );
    });

    test("handles reject errors", async () => {
      Teacher.findById.mockRejectedValue(new Error("db down"));

      const req = { params: { teacherId: "t1" }, body: {} };
      const res = createRes();

      await rejectTeacher(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while rejecting teacher",
      });
    });
  });
});
