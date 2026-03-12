// Custom validation middlewares for student routes
const Student = require("../models/Student");
const Course = require("../models/Course");

/**
 * Validates that the authenticated user is a student and the resource belongs to them.
 * Prevents students from accessing other students' data.
 * 
 * Usage: router.get('/profile/:studentId', verify, validateResourceOwnership, controller)
 * 
 * Checks:
 * - req.params.studentId matches req.user._id (if studentId param exists)
 * - req.body.studentId matches req.user._id (if studentId in body exists)
 */
function validateResourceOwnership(req, res, next) {
    try {
        const authenticatedUserId = req.user._id;

        // Check for studentId in params
        if (req.params.studentId && req.params.studentId !== authenticatedUserId.toString()) {
            return res.status(403).json({
                message: "Access denied. You can only access your own data.",
                success: false,
                error: true,
            });
        }

        // Check for studentId in body
        if (req.body.studentId && req.body.studentId !== authenticatedUserId.toString()) {
            return res.status(403).json({
                message: "Access denied. You can only modify your own data.",
                success: false,
                error: true,
            });
        }

        next();
    } catch (error) {
        console.error("Error in validateResourceOwnership middleware:", error);
        return res.status(500).json({
            message: "Server error during resource validation",
            success: false,
            error: true,
        });
    }
}

/**
 * Validates that the student is enrolled in the specified course.
 * Extracts courseId from req.params.courseId or req.body.courseId
 * 
 * Usage: router.post('/quiz_submit', verify, validateEnrollment, controller)
 * 
 * Checks:
 * - Student exists
 * - Course exists
 * - Student is enrolled in the course
 */
async function validateEnrollment(req, res, next) {
    try {
        const studentId = req.user._id;
        const courseId = req.params.courseId || req.body.courseId;

        // If no courseId provided, skip validation (some routes may not need it)
        if (!courseId) {
            return next();
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course not found",
                success: false,
                error: true,
            });
        }

        // Check if student exists and is enrolled in the course
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
                error: true,
            });
        }

        // Check enrollment in student's enrolledCourses array
        const isEnrolled = student.enrolledCourses.some(
            (enrollment) => enrollment.course && enrollment.course.toString() === courseId.toString()
        );

        // Also check if student is in course's students array (legacy check)
        const isInCourseStudents = course.students && course.students.some(
            (id) => id.toString() === studentId.toString()
        );

        if (!isEnrolled && !isInCourseStudents) {
            return res.status(403).json({
                message: "Access denied. You are not enrolled in this course.",
                success: false,
                error: true,
            });
        }

        // Attach course to request for use in controller (avoids duplicate DB call)
        req.course = course;
        req.student = student;

        next();
    } catch (error) {
        console.error("Error in validateEnrollment middleware:", error);
        return res.status(500).json({
            message: "Server error during enrollment validation",
            success: false,
            error: true,
        });
    }
}

/**
 * Validates that the user has the "Student" role.
 * Should be used after the verify middleware.
 * 
 * Usage: router.get('/dashboard', verify, verifyStudent, controller)
 */
function verifyStudent(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Access denied, no user in request",
                success: false,
                error: true,
            });
        }

        if (req.user.role !== "Student") {
            return res.status(403).json({
                message: "Only students can access this resource",
                success: false,
                error: true,
            });
        }

        next();
    } catch (error) {
        console.error("Error in verifyStudent middleware:", error);
        return res.status(500).json({
            message: "Server error",
            success: false,
            error: true,
        });
    }
}

module.exports = {
    validateResourceOwnership,
    validateEnrollment,
    verifyStudent,
};
