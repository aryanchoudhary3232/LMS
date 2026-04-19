jest.mock("../../models/Student", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/Teacher", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/Admin", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/Course", () => ({
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/Order", () => ({}));

const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Admin = require("../../models/Admin");
const Course = require("../../models/Course");
const {
  restoreCourse,
  getAllUsers,
  getDeletedUsers,
  restoreUser,
} = require("../../controller/superadminController");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("superadminController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("restoreCourse", () => {
    test("returns 404 if course is missing", async () => {
      Course.findByIdAndUpdate.mockResolvedValue(null);

      const req = { params: { courseId: "c1" } };
      const res = createRes();

      await restoreCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Course not found",
      });
    });

    test("restores deleted course", async () => {
      const restored = { _id: "c1", isDeleted: false, deletedAt: null };
      Course.findByIdAndUpdate.mockResolvedValue(restored);

      const req = { params: { courseId: "c1" } };
      const res = createRes();

      await restoreCourse(req, res);

      expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
        "c1",
        { isDeleted: false, deletedAt: null },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Course restored successfully",
        data: restored,
      });
    });
  });

  describe("getAllUsers", () => {
    test("returns user lists with aggregate stats", async () => {
      const students = [{ _id: "s1" }, { _id: "s2" }];
      const teachers = [{ _id: "t1" }];
      const admins = [{ _id: "a1" }, { _id: "a2" }, { _id: "a3" }];

      Student.find.mockReturnValue({ select: jest.fn().mockResolvedValue(students) });
      Teacher.find.mockReturnValue({ select: jest.fn().mockResolvedValue(teachers) });
      Admin.find.mockReturnValue({ select: jest.fn().mockResolvedValue(admins) });

      Student.countDocuments.mockResolvedValue(1);
      Teacher.countDocuments.mockResolvedValue(2);
      Admin.countDocuments.mockResolvedValue(3);

      const req = { query: {} };
      const res = createRes();

      await getAllUsers(req, res);

      expect(Student.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
      expect(Teacher.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
      expect(Admin.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            stats: {
              totalUsers: 6,
              students: 2,
              teachers: 1,
              admins: 3,
              deletedStudents: 1,
              deletedTeachers: 2,
              deletedAdmins: 3,
            },
            students,
            teachers,
            admins,
          }),
        }),
      );
    });

    test("uses includeDeleted=true to remove active-only filter", async () => {
      Student.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      Teacher.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      Admin.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

      Student.countDocuments.mockResolvedValue(0);
      Teacher.countDocuments.mockResolvedValue(0);
      Admin.countDocuments.mockResolvedValue(0);

      const req = { query: { includeDeleted: "true" } };
      const res = createRes();

      await getAllUsers(req, res);

      expect(Student.find).toHaveBeenCalledWith({});
      expect(Teacher.find).toHaveBeenCalledWith({});
      expect(Admin.find).toHaveBeenCalledWith({});
    });
  });

  describe("getDeletedUsers", () => {
    test("returns deleted students, teachers and admins", async () => {
      const deletedStudents = [{ _id: "s-del" }];
      const deletedTeachers = [{ _id: "t-del" }, { _id: "t-del-2" }];
      const deletedAdmins = [{ _id: "a-del" }];

      Student.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(deletedStudents),
        }),
      });
      Teacher.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(deletedTeachers),
        }),
      });
      Admin.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(deletedAdmins),
        }),
      });

      const res = createRes();
      await getDeletedUsers({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Deleted users fetched successfully",
        data: {
          students: deletedStudents,
          teachers: deletedTeachers,
          admins: deletedAdmins,
          totalDeleted: 4,
        },
      });
    });
  });

  describe("restoreUser", () => {
    test("validates user type", async () => {
      const req = {
        params: { userId: "u1" },
        body: { userType: "Guest" },
      };
      const res = createRes();

      await restoreUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid user type. Must be Student, Teacher, or Admin",
      });
    });

    test("returns 404 if user is not found", async () => {
      Student.findById.mockResolvedValue(null);

      const req = {
        params: { userId: "s1" },
        body: { userType: "Student" },
      };
      const res = createRes();

      await restoreUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Student not found",
      });
    });

    test("restores student and strips password from response", async () => {
      Student.findById.mockResolvedValue({ _id: "s1" });
      const restoredStudent = { _id: "s1", isDeleted: false };
      Student.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(restoredStudent),
      });

      const req = {
        params: { userId: "s1" },
        body: { userType: "Student" },
      };
      const res = createRes();

      await restoreUser(req, res);

      expect(Student.findByIdAndUpdate).toHaveBeenCalledWith(
        "s1",
        { isDeleted: false, deletedAt: null },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Student restored successfully",
        data: restoredStudent,
      });
    });
  });
});
