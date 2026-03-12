const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Course = require("../models/Course");
const { notFound } = require("../utils/respond");

// ============= TEACHER FUNCTIONS =============

// Create Assignment (Teacher)
async function createAssignment(req, res) {
  try {
    const {
      title,
      description,
      instructions,
      course,
      chapter,
      maxMarks,
      dueDate,
      allowLateSubmission,
      submissionType,
    } = req.body;
    const teacherId = req.user._id; // Fixed: use _id instead of userId

    console.log("Creating assignment with data:", {
      title,
      course,
      teacherId,
      maxMarks,
      dueDate,
    });

    // Validate required fields
    if (!course) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Course ID is required",
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Title and description are required",
      });
    }

    // Verify course belongs to teacher
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      console.log("Course not found:", course);
      return res.status(404).json({
        success: false,
        error: true,
        message: "Course not found",
      });
    }

    console.log("Course found:", {
      courseId: courseDoc._id,
      courseTeacher: courseDoc.teacher,
      requestTeacher: teacherId,
    });

    if (courseDoc.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "You can only create assignments for your own courses",
      });
    }

    // Handle file attachments (if any)
    const attachments = req.files
      ? req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
          filename: file.originalname,
        }))
      : [];

    const assignment = new Assignment({
      title,
      description,
      instructions,
      course,
      chapter,
      teacher: teacherId,
      maxMarks: Number(maxMarks) || 100,
      dueDate: new Date(dueDate),
      attachments,
      allowLateSubmission:
        allowLateSubmission === "true" || allowLateSubmission === true,
      submissionType: submissionType || "both",
      status: "active",
    });

    await assignment.save();

    console.log("Assignment created successfully:", assignment._id);

    return res.status(201).json({
      success: true,
      error: false,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("createAssignment error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Server error while creating assignment",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Get Teacher's Assignments
async function getTeacherAssignments(req, res) {
  try {
    const teacherId = req.user._id;
    const { courseId } = req.query;

    const query = { teacher: teacherId };
    if (courseId) query.course = courseId;

    const assignments = await Assignment.find(query)
      .populate("course", "title")
      .sort({ createdAt: -1 });

    // Get submission counts for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const totalSubmissions = await Submission.countDocuments({
          assignment: assignment._id,
        });
        const gradedSubmissions = await Submission.countDocuments({
          assignment: assignment._id,
          status: "graded",
        });

        return {
          ...assignment.toObject(),
          stats: {
            totalSubmissions,
            gradedSubmissions,
            pendingGrading: totalSubmissions - gradedSubmissions,
          },
        };
      })
    );

    return res.json({
      success: true,
      error: false,
      message: "Assignments retrieved successfully",
      data: assignmentsWithStats,
    });
  } catch (error) {
    console.error("getTeacherAssignments error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while fetching assignments",
    });
  }
}

// Get Assignment Submissions (Teacher)
async function getAssignmentSubmissions(req, res) {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user._id;

    // Verify assignment belongs to teacher
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return notFound(res, "Assignment");
    }
    if (assignment.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Unauthorized access",
      });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student", "name email")
      .sort({ submittedAt: -1 });

    return res.json({
      success: true,
      error: false,
      message: "Submissions retrieved successfully",
      data: {
        assignment,
        submissions,
      },
    });
  } catch (error) {
    console.error("getAssignmentSubmissions error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while fetching submissions",
    });
  }
}

// Grade Submission (Teacher)
async function gradeSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;
    const teacherId = req.user._id;

    const submission = await Submission.findById(submissionId).populate(
      "assignment"
    );

    if (!submission) {
      return notFound(res, "Submission");
    }

    // Verify teacher owns the assignment
    if (submission.assignment.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Unauthorized access",
      });
    }

    // Validate marks
    if (marks > submission.assignment.maxMarks) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Marks cannot exceed maximum marks (${submission.assignment.maxMarks})`,
      });
    }

    submission.grade = {
      marks: Number(marks),
      feedback: feedback || "",
      gradedAt: new Date(),
      gradedBy: teacherId,
    };
    submission.status = "graded";

    await submission.save();

    return res.json({
      success: true,
      error: false,
      message: "Submission graded successfully",
      data: submission,
    });
  } catch (error) {
    console.error("gradeSubmission error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while grading submission",
    });
  }
}

// Update Assignment (Teacher)
async function updateAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user._id;
    const updates = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return notFound(res, "Assignment");
    }
    if (assignment.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Unauthorized access",
      });
    }

    Object.assign(assignment, updates);
    await assignment.save();

    return res.json({
      success: true,
      error: false,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("updateAssignment error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while updating assignment",
    });
  }
}

// Delete Assignment (Teacher)
async function deleteAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return notFound(res, "Assignment");
    }
    if (assignment.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Unauthorized access",
      });
    }

    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignment: assignmentId });

    // Delete the assignment
    await Assignment.findByIdAndDelete(assignmentId);

    return res.json({
      success: true,
      error: false,
      message: "Assignment and all submissions deleted successfully",
    });
  } catch (error) {
    console.error("deleteAssignment error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while deleting assignment",
    });
  }
}

// ============= STUDENT FUNCTIONS =============

/**
 * Helper: Get enrolled course IDs and enrollment dates for a student
 * @param {string} studentId - The ID of the student
 * @returns {Promise<{enrolledCourseIds: string[], enrollmentMap: Map<string, Date>}>}
 */
async function getStudentEnrollmentData(studentId) {
  const Student = require("../models/Student");
  const student = await Student.findById(studentId).select("enrolledCourses");

  if (!student) {
    throw new Error("Student profile not found");
  }

  const enrollmentMap = new Map();
  const enrolledCourseIds = [];

  for (const enrollment of student.enrolledCourses || []) {
    const courseId = enrollment.course
      ? enrollment.course.toString()
      : enrollment.toString();

    if (!courseId) continue;

    enrolledCourseIds.push(courseId);
    if (enrollment.enrolledAt) {
      enrollmentMap.set(courseId, new Date(enrollment.enrolledAt));
    }
  }

  return { enrolledCourseIds, enrollmentMap };
}

/**
 * Helper: Compute student-specific due date based on enrollment time.
 * Students enrolled after assignment creation get the same deadline window
 * (dueDate - createdAt) from their enrollment date.
 * @param {Object} assignment - Assignment document
 * @param {Date | undefined} enrolledAt - Student enrollment date for assignment course
 * @returns {Date}
 */
function getEffectiveDueDate(assignment, enrolledAt) {
  const assignmentDueDate = new Date(assignment.dueDate);
  const assignmentCreatedAt = new Date(assignment.createdAt);

  if (
    !enrolledAt ||
    Number.isNaN(assignmentDueDate.getTime()) ||
    Number.isNaN(assignmentCreatedAt.getTime())
  ) {
    return assignmentDueDate;
  }

  const deadlineWindowMs =
    assignmentDueDate.getTime() - assignmentCreatedAt.getTime();

  if (deadlineWindowMs <= 0) {
    return assignmentDueDate;
  }

  const effectiveStartDate =
    enrolledAt > assignmentCreatedAt ? enrolledAt : assignmentCreatedAt;

  return new Date(effectiveStartDate.getTime() + deadlineWindowMs);
}

/**
 * Helper: Build assignment query
 * Constructs the MongoDB query object for fetching assignments.
 * @param {string[]} enrolledCourseIds - List of course IDs the student is enrolled in
 * @param {string} [filterCourseId] - Optional specific course ID to filter by
 * @returns {Object} - MongoDB query object
 */
function buildAssignmentQuery(enrolledCourseIds, filterCourseId) {
  const query = {
    course: { $in: enrolledCourseIds },
    status: "active",
  };

  if (filterCourseId) {
    query.course = filterCourseId;
  }
  return query;
}

/**
 * Helper: Enrich assignment with submission status
 * Checks if the student has submitted the assignment and calculates status.
 * @param {Object} assignment - The assignment document
 * @param {string} studentId - The ID of the student
 * @returns {Promise<Object>} - Assignment object with submissionStatus
 */
async function enrichAssignmentWithStatus(assignment, studentId, enrolledAt) {
  const submission = await Submission.findOne({
    assignment: assignment._id,
    student: studentId,
  });

  const effectiveDueDate = getEffectiveDueDate(assignment, enrolledAt);
  const now = new Date();
  const isOverdue = now > effectiveDueDate && !submission;

  return {
    ...assignment.toObject(),
    originalDueDate: assignment.dueDate,
    dueDate: effectiveDueDate,
    submissionStatus: {
      submitted: !!submission,
      isOverdue,
      effectiveDueDate,
      grade: submission?.grade || null,
      submittedAt: submission?.submittedAt || null,
    },
  };
}

/**
 * Get Student's Assignments
 * Fetches assignments for courses the student is enrolled in, with filtering options.
 */
async function getStudentAssignments(req, res) {
  try {
    const studentId = req.user._id;
    const { courseId, status } = req.query;

    // 1. Get enrolled courses
    let enrollmentData;
    try {
      enrollmentData = await getStudentEnrollmentData(studentId);
    } catch (err) {
      console.error("Error fetching student profile:", err.message);
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found. Please ensure you are logged in as a student.",
      });
    }

    const { enrolledCourseIds, enrollmentMap } = enrollmentData;

    if (enrolledCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No enrolled courses found",
      });
    }

    // 2. Build Query and Fetch Assignments
    const query = buildAssignmentQuery(enrolledCourseIds, courseId);

    const assignments = await Assignment.find(query)
      .populate("course", "title")
      .populate("teacher", "name")
      .sort({ dueDate: 1 });

    // 3. Enrich with Submission Status
    const assignmentsWithStatus = await Promise.all(
      assignments.map((assignment) => {
        const assignmentCourseId = assignment.course?._id
          ? assignment.course._id.toString()
          : assignment.course.toString();
        const enrolledAt = enrollmentMap.get(assignmentCourseId);
        return enrichAssignmentWithStatus(assignment, studentId, enrolledAt);
      })
    );

    assignmentsWithStatus.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // 4. Filter Results based on status query param
    let filteredAssignments = assignmentsWithStatus;
    if (status === "pending") {
      filteredAssignments = assignmentsWithStatus.filter(
        (a) => !a.submissionStatus.submitted
      );
    } else if (status === "submitted") {
      filteredAssignments = assignmentsWithStatus.filter(
        (a) => a.submissionStatus.submitted
      );
    } else if (status === "graded") {
      filteredAssignments = assignmentsWithStatus.filter(
        (a) => a.submissionStatus.grade?.marks !== null
      );
    }

    return res.json({
      success: true,
      error: false,
      message: "Assignments retrieved successfully",
      data: filteredAssignments,
    });
  } catch (error) {
    console.error("getStudentAssignments error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while fetching assignments",
    });
  }
}

// Submit Assignment (Student)
async function submitAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const { textContent } = req.body;
    const studentId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return notFound(res, "Assignment");
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "You have already submitted this assignment",
      });
    }

    // Check deadline
    let enrollmentData;
    try {
      enrollmentData = await getStudentEnrollmentData(studentId);
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Student profile not found",
      });
    }

    const enrolledAt = enrollmentData.enrollmentMap.get(
      assignment.course.toString()
    );
    const effectiveDueDate = getEffectiveDueDate(assignment, enrolledAt);

    const now = new Date();
    const isLate = now > effectiveDueDate;
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        error: true,
        message:
          "Assignment deadline has passed and late submissions are not allowed",
      });
    }

    // Handle file attachments
    const attachments = req.files
      ? req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
          filename: file.originalname,
        }))
      : [];

    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
      course: assignment.course,
      textContent: textContent || "",
      attachments,
      isLate,
      status: "submitted",
    });

    await submission.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    console.error("submitAssignment error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while submitting assignment",
    });
  }
}

// Get Student's Submission
async function getStudentSubmission(req, res) {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    })
      .populate("assignment")
      .populate("grade.gradedBy", "name");

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "No submission found",
      });
    }

    return res.json({
      success: true,
      error: false,
      message: "Submission retrieved successfully",
      data: submission,
    });
  } catch (error) {
    console.error("getStudentSubmission error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while fetching submission",
    });
  }
}

module.exports = {
  // Teacher functions
  createAssignment,
  getTeacherAssignments,
  getAssignmentSubmissions,
  gradeSubmission,
  updateAssignment,
  deleteAssignment,

  // Student functions
  getStudentAssignments,
  submitAssignment,
  getStudentSubmission,
};
