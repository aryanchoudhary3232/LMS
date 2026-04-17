// Centralized middleware exports
const { verify, verifyAdmin, verifyTeacher, verifySuperAdmin } = require("./verify");
const { upload, cloudinary } = require("./upload");
const { errorHandler, notFound } = require("./errorHandler");
const {
  requestLogger,
  errorOnlyLogger,
  performanceMonitor,
  rateLimitLogger,
} = require("./logger");
const {
  validateEnrollment,
  validateResourceOwnership,
  verifyStudent,
} = require("./studentValidation");
const { adminAuditLogger } = require("./adminAuditLogger");
const { paramSanitizer, validateParams } = require("./paramSanitizer");
const { validate, schemas } = require("./inputValidator");
const { validateFiles, fileConfigs } = require("./fileUploadValidator");
const {
  cacheResponse,
  cacheTags,
  invalidateCacheByTags,
  invalidateTagsOnSuccess,
} = require("./responseCache");
const { createRateLimiter } = require("./rateLimiter");

module.exports = {
  // Authentication middlewares
  verify,
  verifyAdmin,
  verifySuperAdmin,
  verifyTeacher,
  verifyStudent,

  // File upload middleware
  upload,
  cloudinary,

  // Error handling middlewares
  errorHandler,
  notFound,

  // Logging middlewares
  requestLogger,
  errorOnlyLogger,
  performanceMonitor,
  rateLimitLogger,

  // Student validation middlewares
  validateEnrollment,
  validateResourceOwnership,

  // Admin audit middleware
  adminAuditLogger,

  // Param sanitizer middlewares
  paramSanitizer,
  validateParams,

  // Input validation middlewares
  validate,
  schemas,

  // File upload validation middlewares
  validateFiles,
  fileConfigs,

  // Redis-backed cache middlewares
  cacheResponse,
  cacheTags,
  invalidateCacheByTags,
  invalidateTagsOnSuccess,

  // Redis-backed rate limiter
  createRateLimiter,
};
