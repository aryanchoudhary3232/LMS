const mongoose = require("mongoose");

/**
 * Param Sanitizer Middleware
 *
 * Validates that common route parameters (courseId, teacherId, studentId, etc.)
 * are valid MongoDB ObjectIds before the request reaches the controller.
 * This prevents CastError crashes and potential NoSQL injection via malformed IDs.
 */

// Parameter names that must be valid MongoDB ObjectIds
const OBJECT_ID_PARAMS = [
  "id",
  "courseId",
  "teacherId",
  "studentId",
  "assignmentId",
  "submissionId",
  "flashcardId",
];

/**
 * Auto-sanitizer — scans ALL route params and validates any that match known ID param names.
 * Usage: router.use(paramSanitizer)  OR  router.get('/:courseId', paramSanitizer, controller)
 */
function paramSanitizer(req, res, next) {
  for (const [key, value] of Object.entries(req.params)) { 
    if (OBJECT_ID_PARAMS.includes(key)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key}: "${value}" is not a valid ID format`,
        });
      }
    }
  }
  next();
}

/**
 * Factory version — validates only the specified param names.
 * Usage: router.get('/:courseId', validateParams('courseId'), controller)
 *
 * @param  {...string} paramNames - The route param names to validate
 * @returns {Function} Express middleware
 */
function validateParams(...paramNames) {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value !== undefined && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${paramName}: "${value}" is not a valid ID format`,
        });
      }
    }
    next();
  };
}

module.exports = { paramSanitizer, validateParams };
