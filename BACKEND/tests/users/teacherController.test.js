jest.mock("../../models/Course", () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/Teacher", () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../models/Student", () => ({}));
jest.mock("../../models/Order", () => ({}));

jest.mock("../../utils/respond", () => ({
  notFound: jest.fn((res, entity) =>
    res.status(404).json({ success: false, error: true, message: `${entity} not found` }),
  ),
}));

const Course = require("../../models/Course");
const Teacher = require("../../models/Teacher");
const { notFound } = require("../../utils/respond");
const {
  getTeachers,
  updateCourse,
  uploadQualification,
  getQualificationStatus,
} = require("../../controller/teacherController");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("teacherController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeachers", () => {
    test("returns id and name for all teachers", async () => {
      const teachers = [{ _id: "t1", name: "Ada" }];
      Teacher.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(teachers),
      });

      const res = createRes();
      await getTeachers({}, res);

      expect(Teacher.find).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        message: "Teachers retrieved successfully",
        data: teachers,
        success: true,
        error: false,
      });
    });
  });

  describe("updateCourse", () => {
    test("returns 404 when course does not exist", async () => {
      Course.findById.mockResolvedValue(null);

      const req = {
        params: { courseId: "course-1" },
        user: { _id: "teacher-1" },
        body: {},
      };
      const res = createRes();

      await updateCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Course not found" }),
      );
    });

    test("returns 403 when teacher tries to edit another teacher's course", async () => {
      Course.findById.mockResolvedValue({
        teacher: { toString: () => "teacher-2" },
      });

      const req = {
        params: { courseId: "course-1" },
        user: { _id: "teacher-1" },
        body: {},
      };
      const res = createRes();

      await updateCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You are not authorized to edit this course",
        }),
      );
    });

    test("updates scalar fields and chapter topic videos", async () => {
      Course.findById.mockResolvedValue({
        teacher: { toString: () => "teacher-1" },
      });
      Course.findByIdAndUpdate.mockResolvedValue({ _id: "course-1", title: "Updated" });

      const req = {
        params: { courseId: "course-1" },
        user: { _id: "teacher-1" },
        body: {
          title: "Updated",
          chapters: JSON.stringify([
            {
              _id: "ch1",
              title: "Chapter 1",
              topics: [
                {
                  _id: "tp1",
                  title: "Topic 1",
                  video: "old-video.mp4",
                  quiz: [{ question: "q1" }],
                },
              ],
            },
          ]),
        },
        files: [
          {
            fieldname: "chapters[0][topics][0][video]",
            path: "new-topic-video.mp4",
          },
        ],
      };
      const res = createRes();

      await updateCourse(req, res);

      expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
        "course-1",
        expect.objectContaining({
          title: "Updated",
          chapters: [
            {
              _id: "ch1",
              title: "Chapter 1",
              topics: [
                {
                  _id: "tp1",
                  title: "Topic 1",
                  video: "new-topic-video.mp4",
                  quiz: [{ question: "q1" }],
                },
              ],
            },
          ],
        }),
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Course updated successfully",
          success: true,
        }),
      );
    });

    test("returns 500 when update throws", async () => {
      Course.findById.mockResolvedValue({
        teacher: { toString: () => "teacher-1" },
      });

      const req = {
        params: { courseId: "course-1" },
        user: { _id: "teacher-1" },
        body: { chapters: "not-json" },
      };
      const res = createRes();

      await updateCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: true,
        }),
      );
    });
  });

  describe("uploadQualification", () => {
    test("rejects when file is missing", async () => {
      const req = {
        user: { _id: "teacher-1", role: "Teacher" },
        body: {},
      };
      const res = createRes();

      await uploadQualification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No qualification file uploaded" }),
      );
    });

    test("rejects non-teacher role", async () => {
      const req = {
        user: { _id: "admin-1", role: "Admin" },
        file: { path: "x" },
        body: {},
      };
      const res = createRes();

      await uploadQualification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Only teachers can upload qualification" }),
      );
    });

    test("returns not found when teacher record is absent", async () => {
      Teacher.findByIdAndUpdate.mockResolvedValue(null);

      const req = {
        user: { _id: "teacher-1", role: "Teacher" },
        file: {
          path: "https://cdn/doc.pdf",
          filename: "qualification/abc",
          mimetype: "application/pdf",
          size: 1024,
          originalname: "mydoc.pdf",
        },
        body: {},
      };
      const res = createRes();

      await uploadQualification(req, res);

      expect(notFound).toHaveBeenCalledWith(res, "Teacher");
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("uploads qualification and stores parsed metadata", async () => {
      const teacherDoc = {
        verificationStatus: "Pending",
        qualificationDoc: { publicId: "qualification/abc" },
        qualificationDetails: { degree: "BSc" },
      };
      Teacher.findByIdAndUpdate.mockResolvedValue(teacherDoc);

      const req = {
        user: { _id: "teacher-1", role: "Teacher" },
        file: {
          path: "https://cdn/doc.pdf",
          filename: "qualification/abc",
          mimetype: "application/pdf",
          size: 2048,
          originalname: "degree-proof.pdf",
        },
        body: {
          degree: "  BSc  ",
          institution: "  ABC University  ",
          specialization: "  CS  ",
          experienceYears: "8",
          bio: "  Experienced teacher  ",
        },
      };
      const res = createRes();

      await uploadQualification(req, res);

      expect(Teacher.findByIdAndUpdate).toHaveBeenCalledWith(
        "teacher-1",
        expect.objectContaining({
          qualificationDoc: expect.objectContaining({
            url: "https://cdn/doc.pdf",
            publicId: "qualification/abc",
            format: "pdf",
            bytes: 2048,
          }),
          qualificationDetails: {
            degree: "BSc",
            institution: "ABC University",
            specialization: "CS",
            experienceYears: 8,
            bio: "Experienced teacher",
          },
          verificationStatus: "Pending",
        }),
        { new: true, select: "-password" },
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Qualification uploaded. Awaiting admin verification.",
        }),
      );
    });
  });

  describe("getQualificationStatus", () => {
    test("rejects non-teacher users", async () => {
      const req = { user: { _id: "u1", role: "Student" } };
      const res = createRes();

      await getQualificationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Only teachers can access this resource" }),
      );
    });

    test("returns not found when teacher does not exist", async () => {
      Teacher.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = { user: { _id: "t1", role: "Teacher" } };
      const res = createRes();

      await getQualificationStatus(req, res);

      expect(notFound).toHaveBeenCalledWith(res, "Teacher");
    });

    test("returns qualification status payload", async () => {
      const teacher = { verificationStatus: "Verified" };
      Teacher.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(teacher),
      });

      const req = { user: { _id: "t1", role: "Teacher" } };
      const res = createRes();

      await getQualificationStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        error: false,
        message: "Verification status retrieved",
        data: teacher,
      });
    });
  });
});
